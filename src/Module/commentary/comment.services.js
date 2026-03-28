import { eq, desc } from "drizzle-orm";
import { db } from "../../db/connection.js";
import { commentary } from "../../db/models/schema.js";

/**
 * Service to create a new commentary entry.
 */
export async function createCommentaryService(data) {
  const [entry] = await db
    .insert(commentary)
    .values({
      ...data,
      matchId: data.matchId,
      minute: data.minutes, 
    })
    .returning();

  return entry;
}

/**
 * Service to fetch commentary for a specific match.
 */
export async function getCommentaryService(matchId, query) {
  const MAX_LIMIT = 100;
  const limit = Math.min(query.limit ?? 100, MAX_LIMIT);

  return await db
    .select()
    .from(commentary)
    .where(eq(commentary.matchId, matchId))
    .orderBy(desc(commentary.createdAt))
    .limit(limit);
}
