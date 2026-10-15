// HttpExceptionFilter and AllExceptionsFilter have no injectable dependencies.
// They only use NestJS Logger (static) and the async-local-storage provider.
// No mocks needed for the filters themselves.
