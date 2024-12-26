import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import { connect } from "@/utils/mongodb";

export async function GET() {
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
    memories.map(
      ({ name, pIdolId, params, pItemIds, skillCardIds, customizations }) => ({
        userId,
        name,
        pIdolId,
        params,
        pItemIds,
        skillCardIds,
        customizations,
      })
    )
  );

  return Response.json({ ids: insertedIds });
}
