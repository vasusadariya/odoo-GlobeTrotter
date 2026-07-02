// app/api/generate-and-view/[tripId]/route.js
import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Trip from "@/models/Trip";
import { GoogleGenAI, Type } from "@google/genai";

export async function POST(req, { params }) {
  try {
    await connectDB();

    const { tripId } = params;
    const { extraPrompt } = await req.json();

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API in environment variables" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // AI prompt with both trip details and user-provided input
    const prompt = `
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
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              type: {
                type: Type.STRING,
                enum: [
                  "destination",
                  "accommodation",
                  "transport",
                  "activity",
                  "meal",
                  "other",
                ],
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
          },
        },
      },
    });

    const itinerary = JSON.parse(response.text);

    // Save generated itinerary to DB
    trip.itinerary = itinerary;
    await trip.save();

    // Redirect to the itinerary view page
    return NextResponse.json({ redirectUrl: `/trips/${tripId}/itinerary/view` });

  } catch (error) {
    console.error("Error generating itinerary:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
