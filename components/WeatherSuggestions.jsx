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

  return (
    <div className="mt-6 space-y-6">
      {data.days.map((day, idx) => (
        <div
          key={idx}
          className="border rounded-xl p-5 shadow-sm bg-white"
        >
          <h3 className="text-lg font-semibold text-gray-800">
            {day.date} — {day.location}
          </h3>
          <p className="text-sm text-gray-500">
            Weather: {day.weather.condition}, {day.weather.temp}°C, Humidity {day.weather.humidity}%, Rain Chance {day.weather.rainChance}%
          </p>

          {/* Packing List */}
          <div className="mt-3">
            <h4 className="font-medium text-gray-700">Packing List</h4>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {day.packingList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Conflicts */}
          {day.conflicts.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-gray-700">Potential Conflicts</h4>
              <ul className="list-disc list-inside text-sm text-red-600">
                {day.conflicts.map((conflict, i) => (
                  <li key={i}>{conflict}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternatives */}
          {day.alternatives.length > 0 && (
            <div className="mt-3">
              <h4 className="font-medium text-gray-700">Suggested Alternatives</h4>
              <ul className="list-disc list-inside text-sm text-green-600">
                {day.alternatives.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
