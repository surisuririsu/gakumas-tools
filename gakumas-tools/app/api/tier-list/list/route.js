import { connect } from "@/utils/mongodb";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("entityType");
  const page = parseInt(searchParams.get("page")) || 1;
  const limit = Math.min(parseInt(searchParams.get("limit")) || 20, 50);

  try {
    const { db } = await connect();
    
    // Build filter
    const filter = { isPublic: true };
    if (entityType && ["pIdol", "skillCard", "pItem"].includes(entityType)) {
      filter.entityType = entityType;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get tier lists and total count
    const [tierLists, total] = await Promise.all([
      db.collection("tierLists")
        .find(filter, {
          projection: {
            _id: 1,
            userId: 1,
            userName: 1,
            title: 1,
            description: 1,
            entityType: 1,
            createdAt: 1,
            // Include tier count summary
            tiers: 1
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      db.collection("tierLists").countDocuments(filter)
    ]);

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

    return Response.json({ 
      tierLists: tierListsWithSummary, 
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error("Error fetching tier list:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}