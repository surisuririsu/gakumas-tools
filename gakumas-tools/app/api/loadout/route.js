import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { authOptions } from "@/utils/auth";
import { connect } from "@/utils/mongodb";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const {
    name,
    stageId,
    customStage,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
    customizationGroups,
  } = await request.json();

  const { db } = await connect();
  const result = await db.collection("loadouts").insertOne({
    name,
    stageId,
    customStage,
    supportBonus,
    params,
    pItemIds,
    skillCardIdGroups,
    customizationGroups,
    userId,
    createdAt: new Date(),
  });

  return Response.json({ id: result.insertedId });
}

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const { db } = await connect();
  const loadouts = await db
    .collection("loadouts")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();

  return Response.json(loadouts);
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { ids } = await request.json();

  const { db } = await connect();
  await db.collection("loadouts").deleteMany({
    _id: { $in: ids.map((id) => new ObjectId(id)) },
    userId,
  });

  return new Response(null, { status: 204 });
}
