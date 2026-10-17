import { connect } from "@/utils/mongodb";
import { validateComparison } from "@/utils/rehearsalComparison";

const MAX_BODY_BYTES = 100_000;
const COLLECTION = "rehearsalComparisons";

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
  const { comparison, error } = validateComparison(await readBody(request));
  if (error) return new Response(error, { status: 400 });

  const { _id, ...fields } = comparison;
  const now = new Date();
  const { db } = await connect();
  await db.collection(COLLECTION).updateOne(
    { _id },
    {
      $set: {
        ...fields,
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
