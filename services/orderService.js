// Подключаем соединение с базой данных
const db = require("../db/db");
// Подключаем класс для создания пользовательских ошибок
const AppError = require("../utils/appError");

// Сервис получения заказов с возможностью фильтрации и постраничным выводом
exports.getAll = ({ page = 1, limit = 10, status = null, pvzId = null }) => {
    // Рассчитываем сдвиг для пагинации
    const offset = (page - 1) * limit;
    // Формируем основной запрос с объединением таблиц для подстановки информации о клиенте и ПВЗ
    let query = `
    SELECT o.id, o.customerId, o.totalPrice, o.status, o.pvzId, o.createdAt,
    c.name AS customerName, p.address AS pvzAddress, p.city AS pvzCity
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    JOIN pvz p ON o.pvzId = p.id
    `;
    const params = []; // Набор параметров для подстановки в запрос
    
    // Список условий фильтрации
    const conditions = [];
    if (status) {
        conditions.push("o.status = ?");
        params.push(status);
    }
    if (pvzId) {
        conditions.push("o.pvzId = ?");
        params.push(pvzId);
    }
    
    // Добавляем секцию WHERE при наличии условий
    if (conditions.length > 0) {
        query += " WHERE " + conditions.join(" AND ");
    }
    
    // Добавляем сортировку по дате и ограничение выборки
    query += " ORDER BY o.createdAt DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);
    
    // Выполняем подготовленный запрос и возвращаем результат
    return db.prepare(query).all(...params);
};

// Сервис поиска заказа по идентификатору с включением списка товаров
exports.getById = (id) => {
  // Извлекаем основную информацию о заказе с данными клиента и ПВЗ
  const order = db
    .prepare(
        `
    SELECT o.*, c.name AS customerName, p.address AS pvzAddress, p.city AS pvzCity
    FROM orders o
    JOIN customers c ON o.customerId = c.id
    JOIN pvz p ON o.pvzId = p.id
    WHERE o.id = ?
    `,
    )
    .get(id);

  if (!order) return null; 

  // Загружаем все товарные позиции, относящиеся к данному заказу
  const items = db
    .prepare(
        `
    SELECT productName, quantity, price
    FROM order_items
    WHERE orderId = ?
    `,
    )
    .all(id);

  // Возвращаем заказ с прикрепленным перечнем товаров
  return { ...order, items };
};

/**
 * JSDoc: описание структуры данных для создания нового заказа
 * @param {Object} data
 * @param {number} data.customerId - идентификатор покупателя
 * @param {number} data.pvzId - идентификатор пункта выдачи
 * @param {string} data.status - состояние заказа
 * @param {Array} data.items - список товаров в заказе
 */

// Сервис добавления нового заказа в систему
exports.create = (data) => {
  const { customerId, pvzId, status = "new", items = [] } = data;

  // Проверяем, что заказ содержит хотя бы одну позицию
  if (!items.length) {
    throw new AppError("Заказ должен содержать хотя бы один товар", 400);
  }
  
  // Убеждаемся, что указанный клиент существует
  const customerExists = db
    .prepare("SELECT 1 FROM customers WHERE id = ?")
    .get(customerId);
  if (!customerExists) throw new AppError("Клиент не найден", 404);
  
  // Проверяем наличие пункта выдачи в базе
  const pvzExists = db.prepare("SELECT 1 FROM pvz WHERE id = ?").get(pvzId);
  if (!pvzExists) throw new AppError("ПВЗ не найден", 404);

  // Подсчитываем итоговую стоимость заказа на основе товаров
  const totalPrice = items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  ).toFixed(2);

  // Используем транзакцию для атомарного выполнения операций
  return db.transaction(() => {
    // 1. Вставляем запись о заказе
    const orderStmt = db.prepare(`
    INSERT INTO orders (customerId, totalPrice, status, pvzId)
    VALUES (?, ?, ?, ?)
    `);
    const orderInfo = orderStmt.run(customerId, totalPrice, status, pvzId);
    const orderId = db.prepare("SELECT last_insert_rowid()").get()["last_insert_rowid()"];

    // 2. Добавляем все товары в связанную таблицу order_items
    const itemStmt = db.prepare(`
    INSERT INTO order_items (orderId, productName, quantity, price)
    VALUES (?, ?, ?, ?)
    `);
    
    // Перебираем каждый товар и создаем запись с привязкой к заказу
    items.forEach((item) => {
        itemStmt.run(orderId, item.productName, item.quantity, item.price);
    });

    // Получаем полную информацию о созданном заказе вместе с товарами
    return exports.getById(orderId);
  })(); 
};

// Сервис изменения данных заказа
exports.update = (id, data) => {
  const { status, pvzId } = data;

  const updates = []; // Динамические части SET-выражения
  const params = [];  // Значения для подстановки

  // Добавляем статус, если он передан для обновления
  if (status) {
    updates.push("status = ?");
    params.push(status);
  }
  // Добавляем ПВЗ, если он указан для изменения
  if (pvzId) {
    updates.push("pvzId = ?");
    params.push(pvzId);
  }

  // Если ничего не передано для обновления - отклоняем запрос
  if (!updates.length) {
    throw new AppError("Не указаны поля для обновления", 400);
  }

  params.push(id); // Добавляем идентификатор в конец параметров

  // Строим запрос обновления с динамическим набором полей
  const stmt = db.prepare(`
    UPDATE orders
    SET ${updates.join(", ")}
    WHERE id = ?
  `);

  const info = stmt.run(...params); 

  // Если ни одна запись не затронута - заказ с таким ID отсутствует
  if (info.changes === 0) {
    throw new AppError("Заказ не найден", 404);
  }

  // Возвращаем актуальную информацию о заказе после обновления
  return exports.getById(id);
};

// Сервис удаления заказа из системы
exports.delete = (id) => {

  // Проверяем существование заказа и извлекаем его текущий статус
  const order = db.prepare("SELECT status FROM orders WHERE id = ?").get(id);
  if (!order) throw new AppError("Заказ не найден", 404);

  // Разрешаем удаление только для заказов в определенных статусах
  if (!["new", "canceled"].includes(order.status)) {
    throw new AppError(
      'Можно удалять только заказы с статусом "new" или "canceled"',
      409, 
    );
  }

  // Выполняем удаление заказа
  db.prepare("DELETE FROM orders WHERE id = ?").run(id);
};

// Сервис сбора аналитической информации по заказам
exports.getStats = () => {
  // Распределение заказов по статусам
  const ordersByStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM orders
    GROUP BY status
  `).all().reduce((acc, row) => ({ ...acc, [row.status]: row.count }), {});

  // Общее количество оформленных заказов
  const totalOrders = db.prepare("SELECT COUNT(*) as count FROM orders").get().count;
  
  // Суммарная выручка по всем заказам
  const totalRevenue = db.prepare("SELECT SUM(totalPrice) as sum FROM orders").get().sum || 0;

  // Статистика по пунктам выдачи (количество заказов и выручка)
  const ordersByPvz = db.prepare(`
    SELECT p.id as pvzId, p.city, p.address, COUNT(o.id) as orderCount, SUM(o.totalPrice) as revenue
    FROM pvz p
    LEFT JOIN orders o ON p.id = o.pvzId
    GROUP BY p.id
  `).all();

  // Количество покупателей, совершивших хотя бы одну покупку
  const clientsWithOrders = db.prepare("SELECT COUNT(DISTINCT customerId) as count FROM orders").get().count;

  // Возвращаем собранные статистические данные
  return { ordersByStatus, totalOrders, totalRevenue, ordersByPvz, clientsWithOrders };
};
