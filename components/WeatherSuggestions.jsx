"use client";

import { useEffect, useState } from "react";

export default function WeatherSuggestions({ tripId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tripId) return;
    async function fetchSuggestions() {
      try {
        const res = await fetch(`/api/trips/${tripId}/weather-suggestions`);
        if (!res.ok) throw new Error("Failed to fetch weather suggestions");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSuggestions();
  }, [tripId]);

  if (loading) return <p className="text-gray-500">Loading weather-based suggestions...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!data || !data.days || data.days.length === 0) return <p>No suggestions available.</p>;

  // Safety check to ensure data structure is valid
  const safeDays = Array.isArray(data.days) ? data.days : [];

  return (
    <div className="mt-6 space-y-6">
      {safeDays.map((day, idx) => {
        // Safety checks for day object
        if (!day || typeof day !== 'object') return null;
        
        const safePackingList = Array.isArray(day.packingList) ? day.packingList : [];
        const safeConflicts = Array.isArray(day.conflicts) ? day.conflicts : [];
        const safeAlternatives = Array.isArray(day.alternatives) ? day.alternatives : [];
        
        return (
          <div
            key={idx}
            className="border rounded-xl p-5 shadow-sm bg-white"
          >
            <h3 className="text-lg font-semibold text-gray-800">
              {day.date || 'Unknown Date'} — {day.location || 'Unknown Location'}
            </h3>
            {day.weather && (
              <p className="text-sm text-gray-500">
                Weather: {day.weather.condition || 'Unknown'}, {day.weather.temp || 'N/A'}°C, Humidity {day.weather.humidity || 'N/A'}%, Rain Chance {day.weather.rainChance || 'N/A'}%
              </p>
            )}

            {/* Packing List */}
            {safePackingList.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-gray-700">Packing List</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {safePackingList.map((item, i) => (
                    <li key={i}>
                      {typeof item === 'string' ? item : JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Conflicts */}
            {safeConflicts.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-gray-700">Potential Conflicts</h4>
                <ul className="list-disc list-inside text-sm text-red-600">
                  {safeConflicts.map((conflict, i) => (
                    <li key={i}>
                      {typeof conflict === 'string' ? conflict : JSON.stringify(conflict)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Alternatives */}
            {safeAlternatives.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-gray-700">Suggested Alternatives</h4>
                <ul className="list-disc list-inside text-sm text-green-600">
                  {safeAlternatives.map((alt, i) => (
                    <li key={i}>
                      {typeof alt === 'object' && alt.name && alt.reason 
                        ? `${alt.name} — ${alt.reason}`
                        : typeof alt === 'string' 
                          ? alt 
                          : JSON.stringify(alt)
                      }
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
