// app/api/generate/route.js
import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { randomUUID } from "crypto";

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing GEMINI_API in environment variables" },
        { status: 500 }
      );
    }

    const { prompt } = await req.json();
    if (!prompt) {
      return NextResponse.json({ error: "Missing trip prompt" }, { status: 400 });
    }

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

    const itinerary = JSON.parse(response.text);
    return NextResponse.json({ itinerary });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
