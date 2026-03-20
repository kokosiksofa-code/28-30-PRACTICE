// Подключаем библиотеку express для создания маршрутов
const express = require("express");
// Создаем роутер для объединения эндпоинтов, относящихся к заказам
const router = express.Router();

// Подключаем контроллер с логикой обработки запросов по заказам
const orderController = require("../controllers/orderController");
// Подключаем middleware для проверки аутентификации
const auth = require("../middleware/auth");

// Подключаем наборы правил валидации для работы с заказами
const {
    createOrder,
    updateOrder,
    getAllOrdersQuery,
} = require("../validators/order");

// GET-запрос для получения списка заказов с возможностью фильтрации. Доступ открыт
router.get("/", ...getAllOrdersQuery, orderController.getAllOrders);
// GET-запрос для получения информации о конкретном заказе по ID. Открытый доступ
router.get("/:id", orderController.getOrderById);
// POST-запрос для добавления нового заказа
router.post("/", auth, ...createOrder, orderController.createOrder);
// PUT-запрос для изменения существующего заказа
router.put("/:id", auth, ...updateOrder, orderController.updateOrder);
// DELETE-запрос для удаления заказа из системы
router.delete(
    "/:id",
    auth,
    orderController.deleteOrder
);

// Экспортируем настроенный роутер для основного файла приложения
module.exports = router;
