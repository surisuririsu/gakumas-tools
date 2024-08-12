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

  const { ids } = await request.json();

  const { db } = await connect();
  const { deletedIds } = await db
    .collection("memories")
    .deleteMany({ userId, _id: { $in: ids.map((id) => new ObjectId(id)) } });

  return Response.json({ ids: deletedIds });
}
