// Shared Google Places "details" lookup, used by lib/cityGuide.js
// (server-side City enrichment). Returns null when the API key is missing
// or the lookup fails - callers must treat a place with no real data as
// "details unavailable" rather than fabricating a placeholder result.
export async function getPlaceDetails(placeId) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=place_id,name,formatted_address,geometry,photos,rating,price_level,opening_hours,formatted_phone_number,website,reviews,types&key=${apiKey}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch from Google Places API");
    }

    const data = await response.json();

    if (data.status !== "OK") {
      throw new Error(`Google Places API error: ${data.status}`);
    }

    const place = data.result;
    return {
      id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      types: place.types,
      geometry: place.geometry,
      photos: place.photos
        ? place.photos.slice(0, 5).map((photo) => ({
            photo_reference: photo.photo_reference,
            url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photo.photo_reference}&key=${apiKey}`,
            width: 800,
            height: 600,
          }))
        : [],
      rating: place.rating,
      price_level: place.price_level,
      opening_hours: place.opening_hours,
      formatted_phone_number: place.formatted_phone_number,
      website: place.website,
      reviews: place.reviews ? place.reviews.slice(0, 5) : [],
    };
  } catch (error) {
    console.error("Place details error:", error);
    return null;
  }
}
