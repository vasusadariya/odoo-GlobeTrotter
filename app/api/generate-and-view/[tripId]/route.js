// app/api/generate-and-view/[tripId]/route.js
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import connectDB from "../../../../lib/mongodb";
import Trip from "@/models/Trip";
import User from "@/models/User";
import { GoogleGenAI, Type } from "@google/genai";

const ITINERARY_ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    type: {
      type: Type.STRING,
      enum: ["destination", "accommodation", "transport", "activity", "meal", "other"],
    },
    startDate: { type: Type.STRING },
    endDate: { type: Type.STRING },
    budget: { type: Type.NUMBER },
    location: { type: Type.STRING },
    coordinates: {
      type: Type.OBJECT,
      properties: {
        lat: { type: Type.NUMBER },
        lng: { type: Type.NUMBER },
      },
    },
    notes: { type: Type.STRING },
  },
};

export async function POST(req, props) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findOne({
      $or: [{ googleId: session.user.id }, { email: session.user.email }],
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { tripId } = params;
    const { extraPrompt, targetIds } = await req.json();

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const isOwner = trip.owner.toString() === user._id.toString();
    const isCollaborator = trip.travelers.some(
      (t) => t.user.toString() === user._id.toString() && t.role === "collaborator",
    );
    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: "You don't have permission to generate this itinerary" }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API in environment variables" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const isScoped = Array.isArray(targetIds) && targetIds.length > 0;
    const targetItems = isScoped
      ? (trip.itinerary || []).filter((item) => targetIds.includes(item.id))
      : [];

    if (isScoped && targetItems.length === 0) {
      return NextResponse.json({ error: "None of the given targetIds match this trip's itinerary" }, { status: 400 });
    }

    const prompt = isScoped
      ? `
        Regenerate ONLY the following itinerary items for this trip, keeping their original "id" values unchanged.
        Trip context:
          Description: ${trip.description || "N/A"}
          Start Date: ${trip.startDate}
          End Date: ${trip.endDate}
          Destinations: ${trip.destinations.map(d => d.name).join(", ")}
          Budget Limit: ${trip.budgetLimit || "N/A"} ${trip.currency}
        Items to regenerate (id, title, date):
        ${targetItems.map(item => `- id: ${item.id}, currently "${item.title}" on ${item.startDate}`).join("\n")}
        ${extraPrompt ? `Additional instructions: ${extraPrompt}` : ""}
        Return exactly ${targetItems.length} item(s), one for each id listed above, reusing those exact id values.
        Use realistic coordinates, budgets, and descriptions.
      `
      : `
      Create a detailed itinerary for this trip:
      Description: ${trip.description || "N/A"}
      Start Date: ${trip.startDate}
      End Date: ${trip.endDate}
      Destinations: ${trip.destinations.map(d => d.name).join(", ")}
      Budget Limit: ${trip.budgetLimit || "N/A"} ${trip.currency}
      ${extraPrompt ? `Additional instructions: ${extraPrompt}` : ""}
      Use realistic coordinates, budgets, and descriptions for each item.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: ITINERARY_ITEM_SCHEMA,
        },
      },
    });

    const generated = JSON.parse(response.text);

    if (isScoped) {
      const generatedById = new Map(generated.map((item) => [item.id, item]));
      trip.itinerary = (trip.itinerary || []).map((item) =>
        targetIds.includes(item.id) ? (generatedById.get(item.id) || item) : item,
      );
      await trip.save();

      return NextResponse.json({ itinerary: trip.itinerary });
    }

    // Full-replace behavior, unchanged from before targetIds existed.
    trip.itinerary = generated;
    await trip.save();

    return NextResponse.json({ redirectUrl: `/trips/${tripId}/itinerary/view` });

  } catch (error) {
    console.error("Error generating itinerary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
