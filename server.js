// Подключаем express — фреймворк для построения веб-сервера
const express = require("express");

// Подключаем cors — промежуточный слой для обработки кросс-доменных запросов
const cors = require("cors");

// Подключаем swagger-ui-express — инструмент для визуализации Swagger-документации
const swaggerUi = require("swagger-ui-express");

// Подключаем подготовленную спецификацию Swagger из файла swagger.js
const specs = require("./swagger");

// Подключаем файл с настройками приложения
const config = require("./config");

// Подключаем маршруты для работы с клиентами
const customerRouter = require("./routes/customers");

// Подключаем маршруты для работы с заказами
const orderRouter = require("./routes/orders");

// Подключаем маршруты для работы с пунктами выдачи заказов (ПВЗ)
const pvzRouter = require("./routes/pvz");

// Подключаем маршруты для получения статистических данных
const statsRouter = require("./routes/stats");

// Инициализируем главный объект приложения
const app = express();

// Регистрируем middleware для поддержки CORS (междоменные запросы)
app.use(cors());
// Добавляем middleware для автоматического разбора JSON в теле запроса
app.use(express.json());

// Создаём собственный middleware для регистрации всех поступающих запросов
app.use((req, res, next) => {
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// Настраиваем точку доступа к интерактивной документации API
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(specs, {
      explorer: true,
      swaggerOptions: {
         persistAuthorization: true,
    },
    customSiteTitle: "Магазин техники API Docs",
    }),
);

// Обработчик для главной страницы
app.get("/", (req, res) => {
    res.json({
    message: "Добро пожаловать в API магазина техники!",
    docs: "/api-docs — интерактивная документация",
    });
});

// Привязываем маршруты к соответствующим базовым URL
app.use("/api/customers", customerRouter);
app.use("/api/orders", orderRouter);
app.use("/api/pvz", pvzRouter);
app.use("/api/stats", statsRouter);

// Глобальный обработчик ошибок (ловит ошибки, переданные через next)
app.use((err, req, res, next) => {
    console.error("Ошибка:", err.message);
    console.error(err.stack);
    const status = typeof err.status === 'number' ? err.status : 500;
    res.status(status).json({
      error: err.message || "Внутренняя ошибка сервера",
    });
});

// Подключаем функцию для сбора результатов проверки данных
const { validationResult } = require ("express-validator");

// Middleware для обработки ошибок валидации
app.use((req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            message: "Ошибка валидации",
            errors: errors.array(),
        });
    }
    next();
});

// Устанавливаем порт из конфигурации либо значение по умолчанию
const PORT = config.PORT || 3000;
// Запускаем сервер и начинаем прослушивание порта
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Документация доступна: http://localhost:${PORT}/api-docs`);
});

// Подключаем контроллер клиентов для проверки его работоспособности
const customerController = require("./controllers/customerController");

// Выводим в консоль результат проверки загрузки метода getAllCustomers
console.log(
    "CustomerController загружен:",
   !!customerController.getAllCustomers,
);
