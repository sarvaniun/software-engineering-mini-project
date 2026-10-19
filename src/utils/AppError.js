// Throw this anywhere: the central error handler in app.js turns it into
// { status: "error", errorCode, message } with the right HTTP status (SAD 4.4).
class AppError extends Error {
  constructor(status, errorCode, message) {
    super(message);
    this.status = status;
    this.errorCode = errorCode;
  }
}

module.exports = AppError;
