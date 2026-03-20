// Подключаем библиотеку express для работы с маршрутами
const express = require("express");
// Создаем роутер для объединения эндпоинтов по работе со статистикой
const router = express.Router();

// Подключаем контроллер заказов (данные для статистики формируются на основе заказов)
const controller = require("../controllers/orderController");
// Подключаем middleware для проверки аутентификации
const auth = require("../middleware/auth");

// GET-запрос для получения сводной статистической информации по заказам
router.get("/", auth, controller.getStats);

// Экспортируем настроенный роутер для использования в главном файле приложения
module.exports = router;
