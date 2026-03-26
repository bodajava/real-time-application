import { Router } from 'express'
import { asyncHandler } from '../../utils/asyncHandler.js'
import { successResponse } from '../../common/utils/index.js'
import * as matchService from './matches.services.js'

const MatchesRouter = Router()

MatchesRouter.post('/', asyncHandler(async (req, res, next) => {
    const match = await matchService.createMatchService(req);
    
    return successResponse({ 
        res, 
        message: "Match created successfully!", 
        data: match, 
        statusCode: 201 
    })
}))
MatchesRouter.get('/', asyncHandler(async (req, res, next) => {
    const matchesList = await matchService.getMatchesService(req );
    
    return successResponse({ 
        res, 
        message: "Matches fetched successfully!", 
        data: matchesList, 
        statusCode: 200 
    })
}))

export default MatchesRouter