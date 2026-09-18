"use client";

import { useMemo, useState } from "react";
import type { PhotographerRecord } from "@/lib/photographers";

export default function PhotographerIndex({
  photographers: initialPhotographers,
}: {
  photographers: PhotographerRecord[];
}) {
  const [photographers, setPhotographers] = useState(initialPhotographers);
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("All");
  const [style, setStyle] = useState("All");
  const [savedOnly, setSavedOnly] = useState(false);

  const locations = useMemo(() => {
    const items = photographers
      .map((p) => p.city || p.country)
      .filter((item): item is string => Boolean(item));

    return ["All", ...Array.from(new Set(items)).sort()];
  }, [photographers]);

  const styles = useMemo(
    () => ["All", ...Array.from(new Set(photographers.flatMap((p) => p.tags))).sort()],
    [photographers]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();

    return photographers.filter((p) => {
      const matchesQuery =
        !q ||
        [
          p.name,
          p.location,
          p.instagramHandle || "",
          p.description || "",
          ...p.tags,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesLocation =
        location === "All" || p.city === location || p.country === location;

      const matchesStyle = style === "All" || p.tags.includes(style);
      const matchesSaved = !savedOnly || p.saved;

      return matchesQuery && matchesLocation && matchesStyle && matchesSaved;
    });
  }, [photographers, query, location, style, savedOnly]);

  async function toggleSaved(id: string, next: boolean) {
    setPhotographers((current) =>
      current.map((p) => (p.id === id ? { ...p, saved: next } : p))
    );

    if (id.startsWith("seed-")) return;

    const response = await fetch("/api/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, saved: next }),
    });

    if (!response.ok) {
      setPhotographers((current) =>
        current.map((p) => (p.id === id ? { ...p, saved: !next } : p))
      );
    }
  }

  return (
    <>
      <div className="feedHead">
        <div>
          <p className="eyebrow">Discover</p>
          <h2>{savedOnly ? "Saved photographers" : "Photographers"}</h2>
        </div>
        <p className="count">{visible.length} shown · {photographers.length} indexed</p>
      </div>

      <div className="filterBar">
        <label>
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="name, handle, city or style"
          />
        </label>

        <label>
          <span>Location</span>
          <select value={location} onChange={(event) => setLocation(event.target.value)}>
            {locations.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label>
          <span>Style</span>
          <select value={style} onChange={(event) => setStyle(event.target.value)}>
            {styles.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <button
          className={savedOnly ? "savedToggle active" : "savedToggle"}
          type="button"
          onClick={() => setSavedOnly((current) => !current)}
        >
          {savedOnly ? "Show all" : "Saved only"}
        </button>
      </div>

      <div className="profileGrid">
        {visible.map((photographer, index) => (
          <article className="profileCard" key={photographer.id}>
            <div className="profileTop">
              <span className="profileNumber">{String(index + 1).padStart(2, "0")}</span>
              <span className="profileLocation">{photographer.location}</span>
            </div>

            <h3>{photographer.name}</h3>

            {photographer.instagramHandle && (
              <p className="handle">{photographer.instagramHandle}</p>
            )}

            <p className="profileDescription">{photographer.description}</p>

            <div className="tags">
              {photographer.tags.map((tag) => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>

            <div className="profileLinks">
              <div>
                {photographer.instagramUrl && (
                  <a href={photographer.instagramUrl} target="_blank" rel="noreferrer">
                    Instagram ↗
                  </a>
                )}
                {photographer.websiteUrl && (
                  <a href={photographer.websiteUrl} target="_blank" rel="noreferrer">
                    Website ↗
                  </a>
                )}
                <a href={photographer.sourceUrl} target="_blank" rel="noreferrer">
                  Source ↗
                </a>
              </div>

              <button
                type="button"
                onClick={() => toggleSaved(photographer.id, !photographer.saved)}
              >
                {photographer.saved ? "Saved ✓" : "Save"}
              </button>
            </div>
          </article>
        ))}
      </div>

      {visible.length === 0 && (
        <p className="emptyState">No photographers match those filters.</p>
      )}
    </>
  );
}
