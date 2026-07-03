// Guarantees every itinerary item has a unique, non-empty `id` before it's
// persisted to Trip.itinerary. AI-generated ids (from Gemini) aren't
// guaranteed unique or even present, and colliding ids break React's
// list rendering (duplicate keys) and any code that looks items up by id.
export function ensureUniqueItineraryIds(items) {
  const seen = new Set();
  return items.map((item, index) => {
    const hasUsableId = item.id && !seen.has(item.id);
    const id = hasUsableId ? item.id : `item-${Date.now()}-${index}`;
    seen.add(id);
    return { ...item, id };
  });
}
