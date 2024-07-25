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
  const memories =
    (await db.collection("memories").find({ userId }).toArray()) || [];

  return Response.json({ memories });
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { memories } = await request.json();

  const { db } = await connect();
  const { insertedIds } = await db.collection("memories").insertMany(
    memories.map(({ name, pIdolId, params, pItemIds, skillCardIds }) => ({
      userId,
      name,
      pIdolId,
      params,
      pItemIds,
      skillCardIds,
    }))
  );

  return Response.json({ ids: insertedIds });
}
