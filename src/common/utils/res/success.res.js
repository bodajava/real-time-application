export const successResponse = ({ res, message = "success", statusCode = 200, data = null }) => {
    return res.status(statusCode).json({ message, data, statusCode })
}
