import { getServerSession } from "next-auth/next";
import { authOptions } from "@/utils/auth";
import { connect } from "@/utils/mongodb";
import { ObjectId } from "mongodb";

// Helper function to validate entity IDs exist in the game data
function validateEntityIds(entityType, tierData) {
  // For now, we'll skip complex validation since it would require loading game data server-side
  // In practice, client-side validation should prevent invalid data from being submitted
  // We could add this validation later if needed
  return true;
}

// Helper function to validate tier list data
function validateTierListData(data) {
  const { title, entityType, tiers } = data;
  
  if (!title || title.trim().length === 0 || title.length > 100) {
    return { valid: false, error: "Title must be between 1-100 characters" };
  }
  
  if (!["pIdol", "skillCard", "pItem"].includes(entityType)) {
    return { valid: false, error: "Invalid entity type" };
  }
  
  if (!tiers || typeof tiers !== "object") {
    return { valid: false, error: "Invalid tiers data" };
  }
  
  const validTiers = ["S", "A", "B", "C", "D", "F"];
  for (const tier of validTiers) {
    if (!Array.isArray(tiers[tier])) {
      return { valid: false, error: `Tier ${tier} must be an array` };
    }
  }
  
  return { valid: true };
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;
  const userName = session.user.name;

  try {
    const data = await request.json();
    const { title, description, entityType, filters, tiers, isPublic } = data;

    // Validate the data
    const validation = validateTierListData(data);
    if (!validation.valid) {
      return Response.json({ error: validation.error }, { status: 400 });
    }

    const { db } = await connect();
    
    const tierListData = {
      userId,
      userName,
      title: title.trim(),
      description: (description || "").trim(),
      entityType,
      filters: filters || {},
      tiers,
      isPublic: isPublic !== false, // Default to true
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection("tierLists").insertOne(tierListData);
    
    return Response.json({ id: result.insertedId.toString() });
  } catch (error) {
    console.error("Error creating tier list:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return Response.json({ error: "Missing tier list ID" }, { status: 400 });
  }

  try {
    if (!ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid tier list ID" }, { status: 400 });
    }

    const { db } = await connect();
    const tierList = await db.collection("tierLists").findOne({ 
      _id: new ObjectId(id) 
    });

    if (!tierList) {
      return Response.json({ error: "Tier list not found" }, { status: 404 });
    }

    // Check if user can access this tier list
    if (!tierList.isPublic) {
      const session = await getServerSession(authOptions);
      if (!session || session.user.id !== tierList.userId) {
        return Response.json({ error: "Access denied" }, { status: 403 });
      }
    }

    return Response.json({ tierList });
  } catch (error) {
    console.error("Error fetching tier list:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  try {
    const data = await request.json();
    const { id, title, description, tiers, isPublic } = data;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid tier list ID" }, { status: 400 });
    }

    const { db } = await connect();
    
    // Check if user owns this tier list
    const existingTierList = await db.collection("tierLists").findOne({
      _id: new ObjectId(id),
      userId
    });

    if (!existingTierList) {
      return Response.json({ error: "Tier list not found or access denied" }, { status: 404 });
    }

    // Prepare update data
    const updateData = {
      updatedAt: new Date(),
    };

    if (title !== undefined) {
      if (!title || title.trim().length === 0 || title.length > 100) {
        return Response.json({ error: "Title must be between 1-100 characters" }, { status: 400 });
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = (description || "").trim();
    }

    if (tiers !== undefined) {
      // Validate tiers structure
      const validTiers = ["S", "A", "B", "C", "D", "F"];
      for (const tier of validTiers) {
        if (!Array.isArray(tiers[tier])) {
          return Response.json({ error: `Tier ${tier} must be an array` }, { status: 400 });
        }
      }
      updateData.tiers = tiers;
    }

    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }

    await db.collection("tierLists").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return Response.json({ ok: true });
  } catch (error) {
    console.error("Error updating tier list:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: "Invalid IDs array" }, { status: 400 });
    }

    const objectIds = ids.filter(id => ObjectId.isValid(id)).map(id => new ObjectId(id));
    if (objectIds.length === 0) {
      return Response.json({ error: "No valid IDs provided" }, { status: 400 });
    }

    const { db } = await connect();
    
    // Only allow deletion of user's own tier lists
    const result = await db.collection("tierLists").deleteMany({
      _id: { $in: objectIds },
      userId
    });

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting tier lists:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}