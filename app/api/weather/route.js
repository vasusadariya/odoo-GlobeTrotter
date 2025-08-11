import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_MAPS_API_KEY is missing in environment variables" },
        { status: 500 }
      );
    }

    // Random coordinates for demo
    const lat = 22.3039
    const lng = 70.8022

    const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`Google Weather API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();

    return NextResponse.json({
      coordinates: { lat, lng },
      weather: data,
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
