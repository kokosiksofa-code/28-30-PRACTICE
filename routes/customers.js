// Подключаем библиотеку express для работы с маршрутами
const express = require("express");
// Инициализируем роутер для объединения эндпоинтов по работе с клиентами
const router = express.Router();

// Подключаем контроллер с бизнес-логикой обработки запросов
const customerController = require("../controllers/customerController");

// Подключаем middleware для проверки подлинности (защита от неавторизованного доступа)
const auth = require("../middleware/auth");

// Подключаем правила проверки данных для создания и изменения клиентов
const { createCustomer, updateCustomer } = require("../validators/customer");

// GET-запрос на получение всех клиентов. Доступен без аутентификации
router.get("/", customerController.getAllCustomers);

// GET-запрос для поиска клиента по идентификатору. Открытый доступ
router.get("/:id", customerController.getCustomerById);

// POST-запрос на добавление нового клиента
router.post("/", auth, ...createCustomer, customerController.createCustomer);

// PUT-запрос для изменения данных существующего клиента
router.put("/:id", auth, ...updateCustomer, customerController.updateCustomer);

// DELETE-запрос на удаление клиента из системы
router.delete(
    "/:id",
    auth,
    customerController.deleteCustomer
);

// Экспортируем настроенный роутер для использования в приложении
module.exports = router;
