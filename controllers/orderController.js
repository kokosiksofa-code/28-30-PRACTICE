// Подключаем сервис для управления заказами
const orderService = require("../services/orderService");
// Подключаем класс для обработки пользовательских ошибок
const AppError = require("../utils/appError");

// Контроллер для вывода всех заказов (с фильтрацией по статусу и ПВЗ + пагинация)
exports.getAllOrders = async (req, res, next) => {
  try {
     // Получаем настройки фильтрации из параметров запроса
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);
    const status = req.query.status || null;
    const pvzId = req.query.pvzId ? parseInt(req.query.pvzId) : null;

     // Запрашиваем список заказов через сервис с указанными параметрами
    const orders = await orderService.getAll({ page, limit, status, pvzId });

    // Отправляем ответ со статусом 200 и списком заказов
    res.status(200).json(orders);
  } catch (err) {
    next(err);
  }
};

// Контроллер для поиска заказа по его идентификатору
exports.getOrderById = async (req, res, next) => {
  try {
    // Извлекаем ID заказа из параметров маршрута
    const { id } = req.params;
    // Обращаемся к сервису за конкретным заказом
    const order = await orderService.getById(id);

     // Если заказ не существует в базе
    if (!order) throw new AppError("Заказ не найден", 404);

    // Возвращаем информацию о заказе
    res.status(200).json(order);
  } catch (err) {
    next(err);
  }
};

// Контроллер для добавления нового заказа в систему
exports.createOrder = async (req, res, next) => {
  try {
    // Передаем данные из тела запроса в сервис для создания записи
    const order = await orderService.create(req.body);
    // Отдаём созданный заказ с кодом 201 (успешно создано)
    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
};

// Контроллер для изменения заказа (например, статус или пункт выдачи)
exports.updateOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await orderService.update(id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// Контроллер для удаления заказа из системы
exports.deleteOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        await orderService.delete(id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
};

// Контроллер для получения сводной статистики по заказам
exports.getStats = async (req, res, next) => {
    try {
        const stats = await orderService.getStats();
        res.status(200).json(stats);
    } catch (err) {
        next(err);
    }
};

// Экспортируем все функции контроллера
module.exports = exports;
