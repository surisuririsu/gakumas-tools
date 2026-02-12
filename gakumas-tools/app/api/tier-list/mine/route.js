import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import { connect } from "@/utils/mongodb";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { db } = await connect();
    
    const tierLists = await db.collection("tierLists")
      .find(
        { userId },
        {
          projection: {
            _id: 1,
            title: 1,
            description: 1,
            entityType: 1,
            isPublic: 1,
            createdAt: 1,
            updatedAt: 1,
            tiers: 1
          }
        }
      )
      .sort({ createdAt: -1 })
      .toArray();

    // Add tier count summaries
    const tierListsWithSummary = tierLists.map(tierList => {
      const tierSummary = {};
      let totalEntities = 0;
      
      for (const [tier, entities] of Object.entries(tierList.tiers)) {
        tierSummary[tier] = entities.length;
        totalEntities += entities.length;
      }
      
      return {
        ...tierList,
        _id: tierList._id.toString(),
        tierSummary,
        totalEntities
      };
    });

    return Response.json({ tierLists: tierListsWithSummary });
  } catch (error) {
    console.error("Error fetching user's tier lists:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}