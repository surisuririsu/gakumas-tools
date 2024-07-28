import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { connect } from "@/utils/mongodb";
import { authOptions } from "@/utils/auth";

export async function PUT(request, { params: routeParams }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const id = new ObjectId(routeParams.id);
  const { name, pIdolId, params, pItemIds, skillCardIds } =
    await request.json();
  const { db } = await connect();
  const { updatedId } = await db
    .collection("memories")
    .updateOne(
      { _id: id, userId },
      { $set: { userId, name, pIdolId, params, pItemIds, skillCardIds } }
    );

  return Response.json({ id: updatedId });
}
