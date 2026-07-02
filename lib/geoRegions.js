// Lightweight country -> continent lookup used to auto-tag City.region on
// upsert, so the homepage's continent filter has real data to match against.
// Not exhaustive - covers common trip-creation destinations; unmatched
// countries simply get no region tag (filter just won't include them).
const COUNTRY_TO_REGION = {
  "France": "Europe", "Italy": "Europe", "Spain": "Europe", "Germany": "Europe",
  "United Kingdom": "Europe", "UK": "Europe", "Portugal": "Europe", "Greece": "Europe",
  "Netherlands": "Europe", "Switzerland": "Europe", "Austria": "Europe", "Ireland": "Europe",
  "Iceland": "Europe", "Norway": "Europe", "Sweden": "Europe", "Denmark": "Europe",

  "Japan": "Asia", "China": "Asia", "India": "Asia", "Thailand": "Asia",
  "Vietnam": "Asia", "Indonesia": "Asia", "Singapore": "Asia", "South Korea": "Asia",
  "Malaysia": "Asia", "Philippines": "Asia", "United Arab Emirates": "Asia", "UAE": "Asia",

  "USA": "North America", "United States": "North America", "Canada": "North America",
  "Mexico": "North America",

  "Brazil": "South America", "Argentina": "South America", "Peru": "South America",
  "Chile": "South America", "Colombia": "South America",

  "Egypt": "Africa", "Morocco": "Africa", "South Africa": "Africa", "Kenya": "Africa",
  "Tanzania": "Africa",

  "Australia": "Oceania", "New Zealand": "Oceania", "Fiji": "Oceania",
};

export function regionForCountry(country) {
  if (!country) return null;
  return COUNTRY_TO_REGION[country.trim()] || null;
}
