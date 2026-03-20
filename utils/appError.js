// Определяем собственный класс для ошибок приложения, расширяющий стандартный класс Error
class AppError extends Error {
    // Конструктор инициализирует экземпляр ошибки с текстом и кодом ответа
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        // Классифицируем ошибку: 'fail' для проблем на стороне клиента (4xx), 'error' для серверных проблем (5xx)
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        // Помечаем ошибку как "предвиденную" — это позволяет отличать контролируемые ошибки от системных сбоев
        this.isOperational = true;

        // Захватываем трассировку стека, исключая из неё сам конструктор для чистоты отладки
        Error.captureStackTrace(this, this.constructor);
    }
}
// Делаем класс доступным для подключения в других модулях проекта
module.exports = AppError;
