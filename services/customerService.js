// Подключаем соединение с базой данных для выполнения запросов
const db = require("../db/db");
// Подключаем конструктор пользовательских ошибок для единообразной обработки
const AppError = require("../utils/appError");

/**
 * JSDoc комментарий - описание функции и параметров
 * @param {Object} options - входные параметры
 * @param {number} options.page - текущая страница пагинации
 * @param {number} options.limit - размер страницы (макс. записей)
 * @param {string|null} options.email - фильтрация по электронной почте
 * @returns {Array} - список клиентов, соответствующих условиям
 */

// Сервис получения всех клиентов с учетом пагинации и фильтра
exports.getAll = ({ page = 1, limit = 10, email = null }) => {
  // Рассчитываем сдвиг для постраничного вывода
    const offset = (page - 1) * limit;

    // Основной SQL-запрос с выбором необходимых полей
    let query = `
    SELECT id, name, email, phone, registeredAt
    FROM customers
`;
// Массив для подстановки значений в запрос
    const params = [];

    // При наличии email добавляем условие отбора
    if (email) {
        query += " WHERE email = ?";
        params.push(email.trim());
    }

    // Упорядочиваем по дате и ограничиваем выборку
    query += " ORDER BY registeredAt DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    // Компилируем и выполняем подготовленный запрос
    const stmt = db.prepare(query);
    return stmt.all(...params);
};

/**
 * @param {number|string} id - уникальный идентификатор клиента
 * @returns {Object|null} - данные клиента либо null
 */

// Сервис поиска клиента по его идентификатору
exports.getById = (id) => {
  // Запрос на получение информации о конкретном клиенте
  const stmt = db.prepare(`
    SELECT id, name, email, phone, registeredAt
    FROM customers
    WHERE id = ?
  `);
  return stmt.get(id);
};

/**
 * @param {Object} data - информация для нового клиента
 * @param {string} data.name - полное имя
 * @param {string} data.email - электронная почта
 * @param {string} data.phone - контактный телефон
 * @returns {Object} - созданная запись с присвоенным ID
 * @throws {AppError} если email уже зарегистрирован
 */

// Сервис добавления нового клиента в систему
exports.create = (data) => {
  const { name, email, phone } = data;

  // Проверка на дубликат по электронной почте
  const existing = db
    .prepare("SELECT id FROM customers WHERE email = ?")
    .get(email);
  if (existing) {
    throw new AppError("Клиент с таким email уже существует", 400);
  }

  // Добавление записи в таблицу customers
  const insertStmt = db.prepare("INSERT INTO customers (name, email, phone) VALUES (?, ?, ?)");
  const info = insertStmt.run(name, email, phone);

  // Извлечение полной информации о созданном клиенте
  const newCustomer = db
    .prepare(
        `
      SELECT id, name, email, phone, registeredAt
      FROM customers
      WHERE id = ?
    `,
    )
    .get(info.lastInsertRowid);

  return newCustomer;
};

/**
 * @param {number} id - идентификатор изменяемого клиента
 * @param {Object} data - обновляемые поля
 */

// Сервис обновления данных существующего клиента
exports.update = (id, data) => {
  const { name, email, phone } = data;

  // Собираем части SQL-запроса динамически
  const updates = [];
  const params = [];

  // Добавляем поля, которые требуется изменить
  if (name) {
    updates.push("name = ?");
    params.push(name);
  }
  if (email) {
    const existing = db
      .prepare("SELECT id FROM customers WHERE email = ? AND id != ?")
      .get(email, id);
    if (existing) {
      throw new AppError("Клиент с таким email уже существует", 400);
    }
    updates.push("email = ?");
    params.push(email);
  }
  if (phone) {
    updates.push("phone = ?");
    params.push(phone);
  }

  // Если не указано ни одного поля - ошибка
if (!updates.length) {
    throw new AppError("Не указаны поля для обновления", 400);
}

// Добавляем ID в параметры для условия WHERE
params.push(id);

// Формируем и выполняем запрос на обновление
const stmt = db.prepare(`
    UPDATE customers
    SET ${updates.join(", ")}
    WHERE id = ?
`);

const info = stmt.run(...params);

// Если запись не была изменена - клиент не найден
if (info.changes === 0) {
    throw new AppError("Клиент не найден", 404);
}

 // Возвращаем актуальные данные после обновления
return exports.getById(id);
};

/**
 * @param {number} id - идентификатор удаляемого клиента
 */

// Сервис удаления клиента из базы данных
exports.delete = (id) => {
  // Проверка существования клиента
  const customer = db.prepare("SELECT id FROM customers WHERE id = ?").get(id);
  if (!customer) {
    throw new AppError("Клиент не найден", 404);
  }

  // Проверка наличия связанных заказов
  const hasOrders = db
  .prepare("SELECT 1 FROM orders WHERE customerId = ?")
    .get(id);
  if (hasOrders) {
    throw new AppError(
      "Невозможно удалить клиента с активными заказами",
      409,
    );
  }

  // Выполнение удаления при отсутствии препятствий
  db.prepare("DELETE FROM customers WHERE id = ?").run(id);
};
