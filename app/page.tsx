import PhotographerIndex from "@/components/PhotographerIndex";
import { getPhotographers } from "@/lib/photographers";

export const dynamic = "force-dynamic";

export default async function Home() {
  const photographers = await getPhotographers();

  return (
    <main className="shell">
      <header className="header">
        <a className="wordmark" href="/">LOWKEYVANDALS</a>
        <nav className="nav" aria-label="Main navigation">
          <a href="#discover">Discover</a>
          <a href="#about">About</a>
        </nav>
      </header>

      <section className="intro">
        <p className="eyebrow">Photographer discovery</p>
        <h1>Interesting photographers, quietly collected.</h1>
        <p className="sub">
          A daily index for Sarah: street, urban, film, candid, documentary,
          editorial, nightlife and subculture photography — with direct links
          to the people behind the work.
        </p>
      </section>

      <section id="discover">
        <PhotographerIndex photographers={photographers} />
      </section>

      <section className="about" id="about">
        <p className="eyebrow">About</p>
        <p>
          LOWKEYVANDALS collects public photographer profiles from portfolio
          sites, directories and photography communities. Instagram is treated
          as a destination link rather than scraped as a private data source.
        </p>
      </section>

      <footer>LOWKEYVANDALS — quiet photographer discovery.</footer>
    </main>
  );
}
