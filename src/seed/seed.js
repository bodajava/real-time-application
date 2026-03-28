import "dotenv/config";
import fs from "fs/promises";
import { db } from "../db/connection.js";
import { matches, commentary } from "../db/models/schema.js";
import { eq, sql } from "drizzle-orm";

const DELAY_MS = Number.parseInt(process.env.DELAY_MS || "50", 10);
const DEFAULT_MATCH_DURATION_MINUTES = 120;

const DATA_FILE = new URL("../data/data.json", import.meta.url);

async function readJsonFile(fileUrl) {
    const raw = await fs.readFile(fileUrl, "utf8");
    return JSON.parse(raw);
}

async function loadSeedData() {
    const parsed = await readJsonFile(DATA_FILE);
    if (Array.isArray(parsed)) return { feed: parsed, matches: [] };
    if (Array.isArray(parsed.commentary)) return { feed: parsed.commentary, matches: parsed.matches ?? [] };
    if (Array.isArray(parsed.feed)) return { feed: parsed.feed, matches: parsed.matches ?? [] };
    throw new Error("Seed data format invalid.");
}

function parseDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function buildMatchTimes(seedMatch) {
    const now = new Date();
    const durationMs = DEFAULT_MATCH_DURATION_MINUTES * 60 * 1000;
    let start = parseDate(seedMatch.startTime) || new Date(now.getTime() - 5 * 60 * 1000);
    let end = parseDate(seedMatch.endTime) || new Date(start.getTime() + durationMs);
    return { startTime: start, endTime: end };
}

async function seed() {
    console.log("🌱 Starting Database Seed...");

    // 1. Clear existing data
    console.log("🧹 Clearing old data...");
    await db.delete(commentary);
    await db.delete(matches);

    // 2. Load data
    const { feed, matches: seedMatches } = await loadSeedData();
    const matchMap = new Map(); // seedId -> dbRecord

    // 3. Insert Matches
    console.log(`🏟️  Inserting ${seedMatches.length} matches...`);
    for (const sm of seedMatches) {
        const { startTime, endTime } = buildMatchTimes(sm);
        const [inserted] = await db.insert(matches).values({
            sport: sm.sport,
            homeTeam: sm.homeTeam,
            awayTeam: sm.awayTeam,
            startTime,
            endTime,
            homeScore: sm.homeScore ?? 0,
            awayScore: sm.awayScore ?? 0,
            status: 'live' 
        }).returning();
        
        if (sm.id) matchMap.set(sm.id, inserted);
        console.log(`✅ Created Match: ${inserted.homeTeam} vs ${inserted.awayTeam} (ID: ${inserted.id})`);
    }

    // 4. Insert Commentary
    console.log(`📣 Inserting ${feed.length} commentary entries...`);
    for (const entry of feed) {
        const targetMatch = matchMap.get(entry.matchId);
        if (!targetMatch) continue;

        await db.insert(commentary).values({
            matchId: targetMatch.id,
            minute: entry.minute ?? entry.minutes ?? 0,
            sequence: entry.sequence,
            period: entry.period || "1st Half",
            eventType: entry.eventType || "update",
            actor: entry.actor,
            team: entry.team,
            message: entry.message,
            metadata: entry.metadata || {},
            tags: entry.tags || []
        });

        if (DELAY_MS > 0) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    console.log("✨ Seeding completed successfully!");
    process.exit(0);
}

seed().catch((err) => {
    console.error("❌ Seed error:", err);
    process.exit(1);
});