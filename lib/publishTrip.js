const ALLOWED_TAGS = [
  "solo travel", "family", "culture", "adventure", "budget",
  "luxury", "nature", "food", "photography", "village", "city", "beach",
];

function escapeHtml(value) {
  if (value == null) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(date) {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Builds a { title, content, coverImage, tags } CommunityPost payload from an
// existing Trip document. content is HTML (matches how CommunityPost.content
// is already authored via the Quill editor and rendered elsewhere), but every
// interpolated trip-supplied text field is escaped first.
export function buildCommunityPostFromTrip(trip) {
  const title = trip.name || `Trip to ${trip.destinations?.[0]?.name || "somewhere new"}`;

  const coverImage =
    trip.coverImage || trip.destinations?.[0]?.image || "/hero-travel.jpg";

  const destinationsHtml = (trip.destinations || [])
    .map((dest) => `<li>${escapeHtml(dest.name)}${dest.country ? `, ${escapeHtml(dest.country)}` : ""}</li>`)
    .join("");

  const itineraryHtml = (trip.itinerary || [])
    .map((item, index) => `
      <div>
        <h3>Day ${index + 1}: ${escapeHtml(item.title)}</h3>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        ${item.location ? `<p><em>${escapeHtml(item.location)}</em></p>` : ""}
      </div>
    `)
    .join("");

  const totalBudget = trip.totalBudget
    ? Object.values(trip.totalBudget).reduce((sum, amount) => sum + (amount || 0), 0)
    : 0;

  const content = `
    <p>${escapeHtml(trip.description || "")}</p>
    <p><strong>${formatDate(trip.startDate)} &ndash; ${formatDate(trip.endDate)}</strong></p>
    ${destinationsHtml ? `<h2>Destinations</h2><ul>${destinationsHtml}</ul>` : ""}
    ${itineraryHtml ? `<h2>Itinerary</h2>${itineraryHtml}` : ""}
    ${totalBudget > 0 ? `<h2>Budget</h2><p>${escapeHtml(trip.currency || "USD")} ${totalBudget.toFixed(2)}</p>` : ""}
  `.trim();

  const matchedTags = (trip.tags || [])
    .map((t) => t.toLowerCase())
    .filter((t) => ALLOWED_TAGS.includes(t));

  const tags = matchedTags.length > 0 ? matchedTags : ["culture"];

  return { title, content, coverImage, tags };
}
