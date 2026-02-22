import { describe, expect, it } from "bun:test";
import { computeDocsViewport, resolveInitialDocSelection } from "../src/docs/viewer";

describe("docs viewer helpers", () => {
  it("resolves requested slug or falls back to first", () => {
    const nav = [
      { sectionTitle: "Core", title: "Start", href: "/docs/start", slug: "start" },
      { sectionTitle: "Core", title: "Install", href: "/docs/install", slug: "install" },
    ];

    expect(resolveInitialDocSelection(nav, "install")).toEqual({ index: 1 });
    expect(resolveInitialDocSelection(nav, "missing")).toEqual({
      index: 0,
      unknownSlug: "missing",
    });
  });

  it("clamps viewport scroll to maximum body range", () => {
    const viewport = computeDocsViewport(
      {
        title: "Deep page",
        intro: "Intro",
        sections: [
          {
            title: "Long section",
            content: [{ type: "text", content: "alpha ".repeat(500) }],
          },
        ],
      },
      "deep-page",
      Number.MAX_SAFE_INTEGER,
      12,
      40,
    );

    expect(viewport.maxScroll).toBeGreaterThan(0);
    expect(viewport.scrollOffset).toBe(viewport.maxScroll);
    expect(viewport.startLine).toBeLessThanOrEqual(viewport.endLine);
    expect(viewport.endLine).toBeLessThanOrEqual(viewport.totalLines);
    expect(viewport.bodyLines.length).toBeLessThanOrEqual(viewport.visibleRows);
  });
});
