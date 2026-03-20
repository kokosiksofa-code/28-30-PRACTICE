// Подключаем функции body, param и query из библиотеки express-validator для проверки различных частей запроса
const { body, param, query } = require("express-validator");
// Подключаем настройки приложения (перечень разрешенных статусов заказов)
const config = require("../config");

// Набор правил проверки для добавления нового заказа (POST /api/orders)
const createOrder = [
  // Проверка поля customerId (идентификатор покупателя)
  body("customerId")
    .isInt({ min: 1 })
    .withMessage("customerId должен быть положительным целым числом"),

     // Проверка поля pvzId (идентификатор пункта выдачи)
body("pvzId")
    .isInt({ min: 1 })
    .withMessage("pvzId должен быть положительным целым числом"),

    // Проверка поля status (необязательное поле, может проставляться автоматически)
body("status")
    .optional()
    .isIn(config.ORDER_STATUSES)
    .withMessage(
        `Статус должен быть одним из: ${config.ORDER_STATUSES.join(", ")}`,
    ),

     // Проверка поля items (перечень товаров в заказе)
body("items")
    .isArray({ min: 1 })
    .withMessage("items должен быть непустым массивом"),

    // Проверка названия товара для каждой позиции в заказе
body("items.*.productName")
    .trim()
    .notEmpty()
    .withMessage("Название товара обязательно"),

    // Проверка количества для каждой позиции в заказе
body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Количество должно быть ≥ 1"),

    // Проверка цены для каждой позиции в заказе
body("items.*.price").isFloat({ min: 0 }).withMessage("Цена должна быть ≥ 0"),
];

// Набор правил проверки для изменения существующего заказа
const updateOrder = [
  // Проверка поля status (необязательное — можно менять только статус)
  body("status")
    .optional()
    .isIn(config.ORDER_STATUSES)
    .withMessage(
      `Статус должен быть одним из: ${config.ORDER_STATUSES.join(", ")}`,
    ),

    // Проверка поля pvzId (необязательное — можно изменить пункт выдачи)
body("pvzId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("pvzId должен быть положительным целым числом"),

    // Проверка идентификатора заказа из адресной строки (обязательный параметр)
param("id")
    .isInt({ min: 1 })
    .withMessage("ID заказа должен быть положительным целым числом"),
];

// Набор правил проверки параметров запроса при получении списка заказов
const getAllOrdersQuery = [
  // Проверка параметра page (номер страницы для пагинации)
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page должен быть ≥ 1"),

    // Проверка параметра limit (количество элементов на странице)
  query("limit")
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage("limit должен быть от 1 до 20"),

    // Проверка параметра status (отбор по статусу заказа)
  query("status").optional().isIn(config.ORDER_STATUSES),

  // Проверка параметра pvzId (отбор по пункту выдачи)
  query("pvzId").optional().isInt({ min: 1 }),
];

// Экспортируем подготовленные наборы правил для использования в маршрутах
module.exports = {
  createOrder,
  updateOrder,
  getAllOrdersQuery,
};