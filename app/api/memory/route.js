import { getServerSession } from "next-auth/next";
import { connect } from "@/utils/mongodb";
import { authOptions } from "@/utils/auth";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const { name, pIdolId, params, pItemIds, skillCardIds } =
    await request.json();

  const { db } = await connect();
  const { insertedId } = await db
    .collection("memories")
    .insertOne({ userId, name, pIdolId, params, pItemIds, skillCardIds });

  return Response.json({ id: insertedId });
}
