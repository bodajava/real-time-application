export const globalErrorHandler = (error, req, res, next) => {
    const status = error.cause?.statusCode ?? error.statusCode ?? 500
    return res.status(status).json({
        error_message:
            status == 500 ? `something went wrong` : error.message ?? 'something went wrong',
        stack: process.env.NODE_ENV == "development" ? error.stack : undefined
    })
}

export const BadRequestError = ({ message = "Bad Request", extra } = {}) =>
    errorExecution({ message, statusCode: 400, extra });

export const UnauthorizedError = ({ message = "Unauthorized", extra } = {}) =>
    errorExecution({ message, statusCode: 401, extra });

export const ForbiddenError = ({ message = "Forbidden", extra } = {}) =>
    errorExecution({ message, statusCode: 403, extra });

export const ConflictError = ({ message = "Conflict", extra } = {}) =>
    errorExecution({ message, statusCode: 409, extra });

export const NotFoundError = ({ message = "Not Found", extra } = {}) =>
    errorExecution({ message, statusCode: 404, extra });

export const UnprocessableEntityError = ({ message = "Unprocessable Entity", extra } = {}) =>
    errorExecution({ message, statusCode: 422, extra });

// 5xx Server Errors
export const InternalServerError = ({ message = "Internal Server Error", extra } = {}) =>
    errorExecution({ message, statusCode: 500, extra });

export const NotImplementedError = ({ message = "Not Implemented", extra } = {}) =>
    errorExecution({ message, statusCode: 501, extra });

export const BadGatewayError = ({ message = "Bad Gateway", extra } = {}) =>
    errorExecution({ message, statusCode: 502, extra });

export const ServiceUnavailableError = ({ message = "Service Unavailable", extra } = {}) =>
    errorExecution({ message, statusCode: 503, extra });

export const GatewayTimeoutError = ({ message = "Gateway Timeout", extra } = {}) =>
    errorExecution({ message, statusCode: 504, extra });