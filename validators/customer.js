// Подключаем функции body и param из библиотеки express-validator для проверки входящих данных
const { body, param } = require("express-validator");

// Подключаем настройки приложения (параметры проверки полей)
const config = require("../config");

// Набор правил проверки для добавления нового клиента
const createCustomer = [
  // Проверка поля "name" (ФИО клиента)
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Имя обязательно")
    .isLength({ min: config.MIN_NAME_LENGTH, max: config.MAX_NAME_LENGTH })
    .withMessage(
      `Имя должно быть от ${config.MIN_NAME_LENGTH} до ${config.MAX_NAME_LENGTH} символов`
    ),
    // Проверка поля "email" (адрес электронной почты)
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email обязателен")
    .isEmail()
    .withMessage("Некорректный формат email")
    .normalizeEmail(),
    // Проверка поля "phone" (контактный телефон)
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("Телефон обязателен")
    .matches(config.DEFAULT_PHONE_REGEX)
    .withMessage("Телефон должен быть в формате +7(XXX)XXX-XX-XX"),
  body("password")
];

// Набор правил проверки для изменения данных существующего клиента
const updateCustomer = [
  // Проверка поля "name" (заполняется при наличии в запросе)
  body("name")
    .optional()
    .trim()
    .isLength({ min: config.MIN_NAME_LENGTH, max: config.MAX_NAME_LENGTH })
    .withMessage(
      `Имя должно быть от ${config.MIN_NAME_LENGTH} до ${config.MAX_NAME_LENGTH} символов`
    ),
    // Проверка поля "email" (заполняется при наличии в запросе)
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Некорректный формат email")
    .normalizeEmail(),
    // Проверка поля "phone" (заполняется при наличии в запросе)
  body("phone")
    .optional()
    .trim()
    .matches(config.DEFAULT_PHONE_REGEX)
    .withMessage("Телефон должен быть в формате +7(XXX)XXX-XX-XX"),
    // Проверка идентификатора клиента в адресной строке (обязательный параметр)
    param("id")
    .isInt({ min: 1 })
    .withMessage("ID должен быть положительным целым числом"),
];

// Предоставляем наборы правил валидации для маршрутов приложения
module.exports = {
  createCustomer,
  updateCustomer
};