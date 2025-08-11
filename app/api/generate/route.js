// app/api/generate/route.js
import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API in environment variables" },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        Based on the following trip request, create a detailed trip itinerary.
        Trip request: 4-day trip to Rome visiting the Colosseum, Vatican City, and enjoying Italian food. Budget $1000.
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
            propertyOrdering: [
              "id",
              "title",
              "description",
              "type",
              "startDate",
              "endDate",
              "budget",
              "location",
              "coordinates",
              "notes",
            ],
          },
        },
      },
    });

    // Since schema is enforced, no code fences or extra text will be in response
    const itinerary = JSON.parse(response.text);

    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
