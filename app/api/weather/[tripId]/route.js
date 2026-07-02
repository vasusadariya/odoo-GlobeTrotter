import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  try {
    const { tripId } = params;

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_MAPS_API_KEY is missing in environment variables" },
        { status: 500 }
      );
    }

    // Absolute URL to call your own API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const cookieHeader = request.headers.get("cookie") || "";
    const resTrips = await fetch(`${baseUrl}/api/trips/${tripId}/destinations`, {
      method: "GET",
      headers: { cookie: cookieHeader },
      cache: "no-store",
    });

    if (!resTrips.ok) {
      const errData = await resTrips.json();
      console.error("Error fetching coordinates:", errData.error);
      return NextResponse.json({ error: errData.error }, { status: resTrips.status });
    }

    const tripsData = await resTrips.json();
    const firstDestination = tripsData.coordinates[0];
    if (!firstDestination) {
      return NextResponse.json({ error: "No destinations found" }, { status: 404 });
    }

    const { lat, lng } = firstDestination.coordinates;

    // Call Google Weather API with retrieved coordinates
    const url = `https://weather.googleapis.com/v1/currentConditions:lookup?key=${apiKey}&location.latitude=${lat}&location.longitude=${lng}`;
    const resWeather = await fetch(url, { cache: "no-store" });

    if (!resWeather.ok) {
      throw new Error(`Google Weather API error: ${resWeather.status} ${resWeather.statusText}`);
    }

    const weatherData = await resWeather.json();

    // Condensed version for Gemini
    const simplifiedWeather = {
      location: { lat, lng },
      timeZone: weatherData.timeZone?.id || null,
      isDaytime: weatherData.isDaytime ?? null,
      condition: weatherData.weatherCondition?.description?.text || null,
      conditionType: weatherData.weatherCondition?.type || null,
      temperatureC: weatherData.temperature?.degrees ?? null,
      feelsLikeC: weatherData.feelsLikeTemperature?.degrees ?? null,
      humidityPercent: weatherData.relativeHumidity ?? null,
      wind: {
        direction: weatherData.wind?.direction?.cardinal || null,
        speed: weatherData.wind?.speed?.value ?? null,
        unit: weatherData.wind?.speed?.unit || null,
      },
      rainChancePercent: weatherData.precipitation?.probability?.percent ?? null,
      cloudCoverPercent: weatherData.cloudCover ?? null,
    };

    return NextResponse.json({
      coordinates: { lat, lng },
      simplified: simplifiedWeather
    });
  } catch (error) {
    console.error("Weather API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
