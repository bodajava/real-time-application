export const globalErrorHandler = (error, req, res, next) => {
    const status = error.cause?.statusCode ?? error.statusCode ?? 500
    return res.status(status).json({
        error_message:
            status == 500 ? `something went wrong` : error.message ?? 'something went wrong',
        stack: process.env.NODE_ENV == "development" ? error.stack : undefined
    })
}

export const errorExecution = ({ message = "something went wrong", statusCode = 500, stack = undefined, extra = undefined } = {}) => {
    return Error(message, { cause: { statusCode, stack, extra } })
}

export const ConflictError = ({ message = "something went wrong", extra = undefined } = {}) => {
    return errorExecution({ message, statusCode: 409, extra })
}

export const notFound = ({ message = "something went wrong", extra = undefined } = {}) => {
    return errorExecution({ message, statusCode: 404, extra })
}