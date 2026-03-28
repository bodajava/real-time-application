import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { successResponse, BadRequestError } from "../../common/utils/index.js";
import { matchIdParamSchema } from "../../validation/matches.js";
import { createCommentarySchema, listCommentaryQuerySchema } from "../../validation/commentary.js";
import * as commentaryService from "./comment.services.js";

const RouterCommentary = Router({ mergeParams: true });

/**
 * GET /matches/:id/commentary
 */
RouterCommentary.get("/", asyncHandler(async (req, res, next) => {
    const paramParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
        throw BadRequestError({ message: "Invalid match ID" });
    }

    const queryParsed = listCommentaryQuerySchema.safeParse(req.query);
    if (!queryParsed.success) {
        throw BadRequestError({ message: "Invalid query parameters" });
    }

    const result = await commentaryService.getCommentaryService(
        paramParsed.data.id,
        queryParsed.data
    );

    return successResponse({
        res,
        message: "Commentary fetched successfully!",
        data: result,
        statusCode: 200
    });
}));

/**
 * POST /matches/:id/commentary
 */
RouterCommentary.post("/", asyncHandler(async (req, res, next) => {
    const paramParsed = matchIdParamSchema.safeParse(req.params);
    if (!paramParsed.success) {
        throw BadRequestError({ message: "Invalid match ID" });
    }

    const bodyParsed = createCommentarySchema.safeParse({
        ...req.body,
        matchId: paramParsed.data.id
    });

    if (!bodyParsed.success) {
        console.error("Validation Error:", bodyParsed.error.format());
        throw BadRequestError({ message: "Invalid commentary data" });
    }

    const result = await commentaryService.createCommentaryService(bodyParsed.data);

    // ✅ FIX: تأكد إن الفنكشن موجودة + تحويل matchId لـ string
    if (req.app.locals.broadcastCommentary) {
        req.app.locals.broadcastCommentary(String(result.matchId), result);
    } else {
        console.warn("⚠️ broadcastCommentary is not defined");
    }

    return successResponse({
        res,
        message: "Commentary added successfully!",
        data: result,
        statusCode: 201
    });
}));

export default RouterCommentary;