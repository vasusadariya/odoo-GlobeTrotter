import connectDB from "./mongodb";
import City from "../models/City";
import { getPlaceDetails } from "./places";
import { regionForCountry } from "./geoRegions";

// Upserts a City guide entry whenever a real destination is attached to a
// trip, and bumps popularityRank so recommendations/browsing reflect actual
// usage. Fire-and-forget from callers - never throws, since this is a
// side-effect of the primary trip-mutation request, not the main action.
export async function upsertCityFromDestination({ name, country, coordinates, placeId }) {
  if (!name || !country) {
    return null;
  }

  try {
    await connectDB();

    // Note: popularityRank is intentionally NOT in setOnInsert - it's
    // handled by $inc below. MongoDB rejects $setOnInsert and $inc
    // targeting the same field in one update ("conflict" error); $inc
    // against a missing field on insert already correctly initializes it.
    const setOnInsert = {
      costIndex: 5,
      region: regionForCountry(country),
    };

    const set = {};
    if (placeId) set.placeId = placeId;
    if (coordinates?.lat != null && coordinates?.lng != null) {
      set.coordinates = { latitude: coordinates.lat, longitude: coordinates.lng };
    }

    const city = await City.findOneAndUpdate(
      { name, country },
      { $setOnInsert: setOnInsert, $set: set, $inc: { popularityRank: 1 } },
      { upsert: true, new: true },
    );

    // Backfill images on first sight of a placeId-bearing destination only.
    if (placeId && (!city.images || city.images.length === 0)) {
      const details = await getPlaceDetails(placeId);
      if (details?.photos?.length) {
        city.images = details.photos.slice(0, 5).map((photo) => ({ url: photo.url }));
        if (!city.description && details.formatted_address) {
          city.description = details.formatted_address;
        }
        await city.save();
      }
    }

    return city;
  } catch (error) {
    console.error("upsertCityFromDestination failed:", error);
    return null;
  }
}
