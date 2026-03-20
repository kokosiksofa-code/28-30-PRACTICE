// Подключаем сервис для управления клиентами
const customerService = require("../services/customerService");
// Подключаем класс для обработки пользовательских ошибок
const AppError = require("../utils/appError");

// Контроллер для вывода всех клиентов (с поддержкой пагинации и фильтров)
exports.getAllCustomers = async (req, res, next) => {
    try {
      // Извлекаем настройки из параметров запроса
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 10, 20);
        const email = req.query.email ? req.query.email.trim() : null;

        // Запрашиваем данные через сервис
        const customers = await customerService.getAll({
            page,
            limit,
            email
        });

        // Отправляем ответ со статусом 200 и списком клиентов
        res.status(200).json(customers);
    } catch (err) {
        next(err);
    }
};

// Контроллер для поиска клиента по его ID
exports.getCustomerById = async (req, res, next) => {
    try {
        // Достаём ID из адресной строки
        const { id } = req.params;

          // Обращаемся к сервису за конкретным клиентом
        const customer = await customerService.getById(id);

          // Если клиент отсутствует в базе
        if (!customer) {
            throw new AppError("Клиент не найден", 404);
        }

        // Возвращаем информацию о клиенте
        res.status(200).json(customer);
    } catch (err) {
        next(err);
    }
};

// Контроллер для добавления нового клиента
exports.createCustomer = async (req, res, next) => {
  try {
    // Отправляем данные из запроса в сервис на обработку
    const newCustomer = await customerService.create(req.body);
    // Отдаём созданную запись с кодом 201 (успешно создано)
    res.status(201).json(newCustomer);
  } catch (err) {
    next(err);
  }
};

// Контроллер для изменения информации о клиенте
exports.updateCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await customerService.update(id, req.body);
    res.status(200).json(updated);
  } catch (err) {
    next(err);
  }
};

// Контроллер для удаления клиента из системы
exports.deleteCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    await customerService.delete(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Экспортируем все функции контроллера
module.exports = exports;
