import { createHash } from "node:crypto";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import { connect } from "@/utils/mongodb";
import { validateComparison } from "@/utils/rehearsalComparison";

const MAX_BODY_BYTES = 100_000;
const COLLECTION = "rehearsalComparisons";
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const MAX_TRACKED_CLIENTS = 10_000;

const recentPuts = (global.rehearsalComparisonPuts ??= new Map());

function pseudonym(value) {
  return createHash("sha256")
    .update(`${process.env.NEXTAUTH_SECRET || ""}:${value}`)
    .digest("hex")
    .slice(0, 16);
}

function clientIp(request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown"
  );
}

function rateLimited(key) {
  const now = Date.now();
  if (recentPuts.size > MAX_TRACKED_CLIENTS) recentPuts.clear();
  const times = (recentPuts.get(key) || []).filter(
    (t) => now - t < RATE_WINDOW_MS,
  );
  const limited = times.length >= RATE_LIMIT;
  if (!limited) times.push(now);
  recentPuts.set(key, times);
  return limited;
}

async function readBody(request) {
  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function PUT(request) {
  const ipHash = pseudonym(`ip:${clientIp(request)}`);
  if (rateLimited(ipHash)) {
    return new Response("Too many comparisons", { status: 429 });
  }

  const { comparison, error } = validateComparison(await readBody(request));
  if (error) return new Response(error, { status: 400 });

  const session = await getServerSession(authOptions);
  const { _id, ...fields } = comparison;
  const now = new Date();
  const { db } = await connect();
  await db.collection(COLLECTION).updateOne(
    { _id },
    {
      $set: {
        ...fields,
        ipHash,
        userHash: session ? pseudonym(`user:${session.user.id}`) : null,
        commit: process.env.RENDER_GIT_COMMIT || null,
        updatedAt: now,
      },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true },
  );
  return new Response(null, { status: 204 });
}

export async function DELETE(request) {
  const { id } = (await readBody(request)) || {};
  if (typeof id != "string") return new Response("Missing id", { status: 400 });

  const { db } = await connect();
  await db.collection(COLLECTION).deleteOne({ _id: id });
  return new Response(null, { status: 204 });
}
