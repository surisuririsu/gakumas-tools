import { getServerSession } from "next-auth/next";
import { ObjectId } from "mongodb";
import { authOptions } from "@/utils/auth";
import { connect } from "@/utils/mongodb";

export async function PUT(request, { params: routeParams }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  const id = new ObjectId(await routeParams.id);
  const { name, pIdolId, params, pItemIds, skillCardIds, customizations } =
    await request.json();

  const { db } = await connect();
  const { updatedId } = await db.collection("memories").updateOne(
    { _id: id, userId },
    {
      $set: {
        userId,
        name,
        pIdolId,
        params,
        pItemIds,
        skillCardIds,
        customizations,
      },
    }
  );

  return Response.json({ id: updatedId });
}
