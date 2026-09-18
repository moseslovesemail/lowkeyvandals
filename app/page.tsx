const photographers = [
  {
    name: "New photographer",
    location: "Aotearoa",
    tags: ["street", "documentary", "urban"],
    description: "Discovery feed ready for the first live sources.",
    instagram: null,
    status: "awaiting discovery"
  },
  {
    name: "New photographer",
    location: "Australia",
    tags: ["film", "nightlife", "portrait"],
    description: "Profiles will be added from public portfolio and directory sources.",
    instagram: null,
    status: "awaiting discovery"
  },
  {
    name: "New photographer",
    location: "International",
    tags: ["editorial", "subculture", "candid"],
    description: "Saved profiles, filters and daily discovery are the next data layer.",
    instagram: null,
    status: "awaiting discovery"
  }
];

export default function Home() {
  return (
    <main className="shell">
      <header className="header">
        <a className="wordmark" href="/">LOWKEYVANDALS</a>
        <nav className="nav" aria-label="Main navigation">
          <a href="#discover">Discover</a>
          <a href="#saved">Saved</a>
          <a href="#all">All</a>
        </nav>
      </header>

      <section className="intro">
        <p className="eyebrow">Photographer discovery</p>
        <h1>Interesting photographers, quietly collected.</h1>
        <p className="sub">
          A simple daily index of street, urban, candid, documentary, film,
          nightlife and subculture photography.
        </p>
      </section>

      <section id="discover">
        <div className="sectionTitle">
          <div>
            <p className="eyebrow">Discover</p>
            <h2>New today</h2>
          </div>
          <p className="count">Discovery engine ready</p>
        </div>

        <div className="toolbar" aria-label="Filters">
          <button type="button">Location</button>
          <button type="button">Style</button>
          <button type="button">Newest</button>
        </div>

        <div className="grid">
          {photographers.map((photographer, index) => (
            <article className="card" key={index}>
              <div className="imagePlaceholder" aria-hidden="true">
                <span>{String(index + 1).padStart(2, "0")}</span>
              </div>

              <div className="cardBody">
                <div className="meta">
                  <span>{photographer.location}</span>
                  <span>{photographer.status}</span>
                </div>

                <h3>{photographer.name}</h3>
                <p className="description">{photographer.description}</p>

                <div className="tags">
                  {photographer.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>

                <div className="actions">
                  <button type="button" disabled>Instagram</button>
                  <button type="button">Save</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer>
        LOWKEYVANDALS — photographer discovery index
      </footer>
    </main>
  );
}
