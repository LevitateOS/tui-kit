import { describe, expect, it } from "bun:test";
import { resolveTwoPaneGeometry } from "../../src/patterns/two-pane";

describe("two pane geometry", () => {
	it("keeps docs legible at half-screen dimensions", () => {
		const geometry = resolveTwoPaneGeometry({
			columns: 80,
			rows: 24,
			requestedSidebarWidth: 28,
			headerHeight: 2,
			footerHeight: 2,
			hasFooter: true,
		});

		expect(geometry.frameColumns).toBe(80);
		expect(geometry.sidebarOuterWidth).toBe(28);
		expect(geometry.contentOuterWidth).toBe(52);
		expect(geometry.sidebarTextColumns).toBeGreaterThanOrEqual(20);
		expect(geometry.contentTextColumns).toBeGreaterThanOrEqual(40);
		expect(geometry.contentTextRows).toBe(18);
	});

	it("caps oversized sidebar requests to preserve content width", () => {
		const geometry = resolveTwoPaneGeometry({
			columns: 90,
			rows: 28,
			requestedSidebarWidth: 60,
			headerHeight: 2,
			footerHeight: 2,
			hasFooter: true,
		});

		expect(geometry.sidebarOuterWidth).toBeLessThanOrEqual(Math.floor(90 * 0.4));
		expect(geometry.contentOuterWidth).toBeGreaterThanOrEqual(42);
	});
});
