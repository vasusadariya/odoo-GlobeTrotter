// Shared Google Places "details" lookup, used by app/api/places/details/route.js
// (client-facing) and lib/cityGuide.js (server-side City enrichment).
export async function getPlaceDetails(placeId) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return getMockPlaceDetails(placeId);
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
    return getMockPlaceDetails(placeId);
  }
}

function getMockPlaceDetails(placeId) {
  const mockDetails = {
    paris_france: {
      id: "paris_france",
      name: "Paris",
      formatted_address: "Paris, France",
      types: ["locality", "political"],
      geometry: {
        location: { lat: 48.8566, lng: 2.3522 },
      },
      photos: [
        {
          photo_reference: "mock_paris_1",
          url: "/placeholder.svg?height=600&width=800&text=Paris+Eiffel+Tower",
          width: 800,
          height: 600,
        },
      ],
      rating: 4.5,
      price_level: 3,
      opening_hours: {
        open_now: true,
        weekday_text: ["Monday: Open 24 hours", "Tuesday: Open 24 hours"],
      },
      formatted_phone_number: "+33 1 42 97 48 16",
      website: "https://www.paris.fr",
      reviews: [
        {
          author_name: "John Doe",
          rating: 5,
          text: "Beautiful city with amazing architecture!",
          time: 1640995200,
        },
      ],
    },
  };

  return (
    mockDetails[placeId] || {
      id: placeId,
      name: "Unknown Place",
      formatted_address: "Unknown Location",
      types: ["establishment"],
      geometry: { location: { lat: 0, lng: 0 } },
      photos: [],
      rating: 0,
    }
  );
}
