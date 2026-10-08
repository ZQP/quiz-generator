import { invoke } from "@tauri-apps/api/core";
import { isTauriApp } from "./updaterService";

export interface ScrapedWebContent {
  url: string;
  title: string;
  text: string;
  wordCount: number;
}

/**
 * Parses raw HTML into clean, readable text suitable as knowledge reference for Gemini.
 * Strips away navigation, headers, footers, scripts, and styling.
 */
export function extractCleanArticleText(htmlString: string): { title: string; text: string } {
  if (typeof DOMParser !== "undefined") {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");

    // Determine Title
    const title =
      doc.querySelector("h1")?.textContent?.trim() ||
      doc.title?.trim() ||
      "ZQP-Webartikel";

    // Elements to remove
    const unwantedSelectors = [
      "script",
      "style",
      "nav",
      "header",
      "footer",
      "aside",
      "iframe",
      "noscript",
      ".menu",
      ".navigation",
      ".sidebar",
      ".cookie",
      ".banner",
      ".social",
      ".breadcrumb",
    ];

    unwantedSelectors.forEach((sel) => {
      doc.querySelectorAll(sel).forEach((el) => el.remove());
    });

    // Try finding primary content container
    const contentContainer =
      doc.querySelector("article") ||
      doc.querySelector("main") ||
      doc.querySelector(".entry-content") ||
      doc.querySelector(".post-content") ||
      doc.querySelector(".content") ||
      doc.body;

    if (!contentContainer) {
      return { title, text: "" };
    }

    // Extract structured text (Headings and Paragraphs)
    const blocks: string[] = [];
    const elements = contentContainer.querySelectorAll("h1, h2, h3, h4, p, li, blockquote");

    elements.forEach((el) => {
      const text = el.textContent?.trim();
      if (!text || text.length < 3) return;

      const tagName = el.tagName.toLowerCase();
      if (tagName.startsWith("h")) {
        blocks.push(`\n### ${text}\n`);
      } else if (tagName === "li") {
        blocks.push(`• ${text}`);
      } else {
        blocks.push(text);
      }
    });

    const fullText = blocks.length > 0 ? blocks.join("\n") : contentContainer.textContent || "";
    const cleanedText = fullText.replace(/\n{3,}/g, "\n\n").trim();

    return { title, text: cleanedText };
  }

  // Fallback for Node/test environment without DOMParser
  const titleMatch =
    htmlString.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ||
    htmlString.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "ZQP-Webartikel";

  const stripped = htmlString
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { title, text: stripped };
}

/**
 * Fetches content from a URL either via native Tauri command (bypassing CORS)
 * or via browser fetch in web environment.
 */
export async function fetchWebContentFromUrl(rawUrl: string): Promise<ScrapedWebContent> {
  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  let htmlContent = "";

  if (isTauriApp()) {
    try {
      htmlContent = await invoke<string>("fetch_web_content", { url });
    } catch (err: any) {
      throw new Error(`Fehler beim Laden der Webseite (${url}): ${err?.message || err}`);
    }
  } else {
    // Browser fallback
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Webseite antwortete mit Fehler: HTTP ${res.status}`);
    }
    htmlContent = await res.text();
  }

  const { title, text } = extractCleanArticleText(htmlContent);

  if (!text || text.length < 50) {
    throw new Error(
      "Die angegebene Seite enthält keinen verwertbaren Text oder blockiert das Auslesen."
    );
  }

  const words = text.split(/\s+/).filter(Boolean).length;

  return {
    url,
    title,
    text,
    wordCount: words,
  };
}
