// Подключаем библиотеку express для работы с маршрутами
const express = require("express");
// Создаем роутер для группировки эндпоинтов, связанных с пунктами выдачи заказов (ПВЗ)
const router = express.Router();
// Подключаем соединение с базой данных для выполнения запросов
const db = require("../db/db");

// GET-запрос для получения перечня всех пунктов выдачи. Доступен без авторизации
router.get("/", (req, res, next) => {
    try {
        const pvz = db.prepare("SELECT * FROM pvz ORDER BY city, address").all();
        res.json(pvz);
    } catch (err) {
        next(err);
    }
});

// Экспортируем настроенный роутер для основного приложения
module.exports = router;
