import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { successResponse } from '../../common/utils/index.js'
import * as userService from './user.services.js'

const userRouter = Router()

userRouter.get('/profile/:id', asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.params.id);
    return successResponse({ res, data: user, statusCode: 201 })
}))

export default userRouter