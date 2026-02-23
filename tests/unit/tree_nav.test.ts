import { describe, expect, it } from "bun:test";
import { buildTreeNavRows } from "../../src/components/navigation/tree-nav";

describe("tree nav", () => {
	it("builds grouped rows with active item highlight marker", () => {
		const rows = buildTreeNavRows(
			[
				{ key: "a", section: "Getting Started", label: "Install" },
				{ key: "b", section: "Getting Started", label: "Bootloader" },
				{ key: "c", section: "Tools", label: "recstrap" },
			],
			{
				selectedIndex: 1,
				maxWidth: 40,
				mode: "all-sections",
			},
		);

		expect(rows.some((row) => row.kind === "section" && row.text.includes("Getting Started"))).toBe(
			true,
		);
		expect(
			rows.some((row) => row.kind === "item" && row.active && row.text.includes("Bootloader")),
		).toBe(true);
		expect(rows.some((row) => row.kind === "section" && row.text.includes("Tools"))).toBe(true);
	});

	it("collapses non-active sections in focus mode", () => {
		const rows = buildTreeNavRows(
			[
				{ key: "a", section: "Getting Started", label: "Install" },
				{ key: "b", section: "Tools", label: "recstrap" },
				{ key: "c", section: "Tools", label: "recchroot" },
			],
			{
				selectedIndex: 1,
				mode: "focus-section",
				currentSection: "Tools",
				maxWidth: 40,
			},
		);

		expect(rows.some((row) => row.kind === "section" && row.collapsed)).toBe(true);
		expect(rows.some((row) => row.kind === "item" && row.text.includes("Install"))).toBe(false);
		expect(rows.some((row) => row.kind === "item" && row.text.includes("recstrap"))).toBe(true);
	});
});
