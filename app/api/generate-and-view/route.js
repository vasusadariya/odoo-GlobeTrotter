import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { randomUUID } from "crypto";

// Simulated DB store (replace with your DB logic)
const fakeDB = new Map();

export async function GET(req) {
  try {
    const apiKey = process.env.GEMINI_API;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API in environment variables" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const prompt = searchParams.get("prompt");
    if (!prompt) {
      return NextResponse.json(
        { error: "Please provide a prompt using ?prompt=..." },
        { status: 400 }
      );
    }

    const tripId = randomUUID(); // create a new trip ID

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Based on the following trip request, create a detailed trip itinerary.
        Trip request: ${prompt}
        Use realistic dates, budgets, and coordinates.
      `,
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

    // Store trip + itinerary in fake DB
    fakeDB.set(tripId, {
      trip: { id: tripId, name: "Generated Trip from AI" },
      itinerary,
    });

    // Redirect to itinerary view page
    return NextResponse.redirect(
      `${req.nextUrl.origin}/trips/${tripId}/itinerary/view`
    );
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// This simulates the existing GET itinerary endpoint
export async function POST(req) {
  const { tripId } = await req.json();
  const tripData = fakeDB.get(tripId);
  if (!tripData) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }
  return NextResponse.json(tripData);
}
