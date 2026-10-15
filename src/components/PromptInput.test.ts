import { describe, it, expect } from "vitest";
import { ZQP_TEMPLATES } from "./PromptInput";
import { StationType } from "../types";

describe("PromptInput ZQP Templates & Synchronization Settings", () => {
  it("provides exactly 6 ZQP inspiration templates for a balanced 2x3 grid", () => {
    expect(ZQP_TEMPLATES).toHaveLength(6);
  });

  it("ensures all 6 templates offer distinct, unique station counts", () => {
    const counts = ZQP_TEMPLATES.map((t) => t.count);
    const uniqueCounts = new Set(counts);

    // All 6 counts must be distinct
    expect(uniqueCounts.size).toBe(6);
    expect(counts).toEqual([5, 4, 3, 6, 2, 7]);
  });

  it("ensures the first template matches initial default app settings", () => {
    const first = ZQP_TEMPLATES[0];

    expect(first.title).toBe("Sturzprävention in der Häuslichkeit");
    expect(first.badge).toBe("Sturzschutz");
    expect(first.count).toBe(5);
    expect(first.audience).toBe("angehoerige");
    expect(first.topic).toContain("Sturzprävention");
    expect(first.mechanics).toEqual(["matching", "ordering", "myth_fact", "bucket_sort", "comparison"]);
  });

  it("verifies every template has valid fields and valid station mechanics", () => {
    const validMechanicTypes: StationType[] = [
      "matching",
      "ordering",
      "comparison",
      "single_choice",
      "myth_fact",
      "bucket_sort",
      "dilemma",
      "checklist",
      "fill_in_the_blank",
      "branching_scenario",
    ];

    ZQP_TEMPLATES.forEach((tpl) => {
      expect(tpl.title.trim().length).toBeGreaterThan(0);
      expect(tpl.badge.trim().length).toBeGreaterThan(0);
      expect(tpl.topic.trim().length).toBeGreaterThan(10);
      expect(["angehoerige", "fachkraefte", "senioren", "allgemein"]).toContain(tpl.audience);
      expect(tpl.count).toBeGreaterThanOrEqual(1);
      expect(tpl.count).toBeLessThanOrEqual(10);
      expect(tpl.mechanics.length).toBeGreaterThan(0);

      tpl.mechanics.forEach((m) => {
        expect(validMechanicTypes).toContain(m);
      });
    });
  });
});
