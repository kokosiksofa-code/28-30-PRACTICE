// Подключаем файл конфигурации с данными администратора
const config = require("../config");
// Подключаем конструктор для пользовательских ошибок с кодами ответа
const AppError = require("../utils/appError");

// Промежуточный обработчик для проверки базовой аутентификации
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Basic")) {
        return next(new AppError("Требуется авторизация (Basic Auth)", 401));
    }

    // Получаем зашифрованную часть заголовка после "Basic "
    const base64Credentials = authHeader.split(" ")[1];
     // Преобразуем данные из формата Base64 в читаемую строку
    const credentials = Buffer.from(base64Credentials, "base64").toString(
        "ascii",
    );
     // Разбиваем строку на логин и пароль
    const [username, password] = credentials.split(":");
    // Проверяем соответствие логина и пароля сохраненным в конфигурации
    if (
        username === config.ADMIN_CREDENTIALS.username &&
        password === config.ADMIN_CREDENTIALS.password
    ) {
        next();
    } else {
       // При несовпадении отправляем клиенту ошибку доступа
        return next(new AppError("Неверные учетные данные", 401));
    }
};

// Делаем промежуточный обработчик доступным для других модулей
module.exports = authMiddleware;