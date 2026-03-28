import { desc } from 'drizzle-orm';
import { db } from '../../db/connection.js';
import { matches } from '../../db/models/schema.js';
// ⚠️ Fixed: Returned to createMatchSchema because listMatchesQuerySchema does not contain startTime or endTime, it only contains 'limit'
import { createMatchSchema, listMatchesQuerySchema, MATCH_STATUS } from '../../validation/matches.js';

class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
    }
}
const BadRequestError = ({ message }) => { throw new CustomError(message, 400); };

// I have combined ALL the logic into this single function for you exactly as requested.
export async function createMatchService(req) {
    // We must use createMatchSchema so that it validates the match data (sport, homeTeam, startTime, etc.)
    const parsed = createMatchSchema.safeParse(req.body);

    // ✅ Error check first, as requested
    if (!parsed.success) BadRequestError({ message: "invalid payload" });

    // ✅ Your exact variables and destructuring
    const { data: { startTime, endTime, homeScore, awayScore } } = parsed;

    // Calculate match status inside the same function directly
    let initialStatus = MATCH_STATUS.SCHEDULED;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
        if (now >= end) {
            initialStatus = MATCH_STATUS.FINISHED;
        } else if (now >= start) {
            initialStatus = MATCH_STATUS.LIVE;
        }
    }

    // ✅ Your exact insert structure with event and returning()
    const [event] = await db.insert(matches).values({
        ...parsed.data,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        homeScore: homeScore ?? 0,
        awayScore: awayScore ?? 0,
        status: initialStatus
    }).returning();

    if (req.app.locals.broadcastMatchCreated) {
        req.app.locals.broadcastMatchCreated(event);
    }

    return event;
}

export async function getMatchesService(req) {
    const MAX_LIMIT = 100;
    
    // Parse req.query (GET payload) instead of req.body
    const parsed = listMatchesQuerySchema.safeParse(req.query);
    
    if (!parsed.success) BadRequestError({ message: "invalid query payload" });

    // Use the parsed limit, set default, and cap at MAX_LIMIT
    const limit = Math.min(parsed.data.limit ?? 50, MAX_LIMIT);

    // Fetch data using the proper drizzle orderBy syntax
    const data = await db.select()
        .from(matches)
        .orderBy(desc(matches.createdAt))
        .limit(limit);

    return data;
}

// wscat -c ws://localhost:3000/ws