import { describe, it, expect } from "vitest";
import { extractCleanArticleText } from "./webScraperService";

describe("webScraperService", () => {
  it("extracts clean title and content while stripping navigation and scripts", () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
        <head><title>ZQP Ratgeber Sturzprävention</title></head>
        <body>
          <header><nav>Menüpunkt 1</nav></header>
          <script>console.log("tracking");</script>
          <main>
            <h1>Sicherheit im Badezimmer</h1>
            <p>Nasse Fliesen sind die häufigste Sturzursache im Bad.</p>
            <h2>Empfohlene Maßnahmen</h2>
            <ul>
              <li>Feste Haltegriffe montieren</li>
              <li>Antirutschmatten nutzen</li>
            </ul>
          </main>
          <footer>Impressum und Kontakt</footer>
        </body>
      </html>
    `;

    const { title, text } = extractCleanArticleText(sampleHtml);
    expect(title).toBe("Sicherheit im Badezimmer");
    expect(text).toContain("Nasse Fliesen sind die häufigste Sturzursache im Bad.");
    expect(text).toContain("Feste Haltegriffe montieren");
    expect(text).not.toContain("Menüpunkt 1");
    expect(text).not.toContain("Impressum und Kontakt");
    expect(text).not.toContain("tracking");
  });
});
