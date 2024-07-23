import { getServerSession } from "next-auth/next";
import { connect } from "@/utils/mongodb";
import { authOptions } from "@/utils/auth";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { db } = await connect();
  const { showProduceRankCalculator, showMemoryEditor, showDex } =
    (await db.collection("workspaces").findOne({ userId })) || {};

  return Response.json({
    showProduceRankCalculator,
    showMemoryEditor,
    showDex,
  });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { showProduceRankCalculator, showMemoryEditor, showDex } =
    await request.json();

  const { db } = await connect();
  const { insertedId } = db
    .collection("workspaces")
    .updateOne(
      { userId },
      { $set: { showProduceRankCalculator, showMemoryEditor, showDex } },
      { upsert: true }
    );

  return Response.json({ id: insertedId });
}
