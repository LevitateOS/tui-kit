import { Box, Text } from "ink";
import { clampNumber, padRight, toNonNegativeInt, truncateBoundedLine } from "../../utils";
import { useTuiColors, useTuiTheme } from "../../app/app-provider";
import { resolveIntentColor, type ColorIntent } from "../../theme";

export type TreeNavMode = "focus-section" | "all-sections";

export type TreeNavItem = {
	key: string;
	section: string;
	label: string;
};

export type TreeNavRow = {
	key: string;
	text: string;
	kind: "section" | "item" | "gap";
	active?: boolean;
	collapsed?: boolean;
};

export type BuildTreeNavRowsOptions = {
	selectedIndex: number;
	maxWidth?: number;
	currentSection?: string;
	mode?: TreeNavMode;
	hideActiveSectionHeader?: boolean;
	emptyLabel?: string;
	expandedSectionMarker?: string;
	collapsedSectionMarker?: string;
	activeItemMarker?: string;
	inactiveItemMarker?: string;
};

type GroupedSection = {
	title: string;
	items: Array<{
		item: TreeNavItem;
		index: number;
	}>;
};

function marker(token: string | undefined, fallback: string): string {
	return typeof token === "string" && token.length > 0 ? token.slice(0, 1) : fallback;
}

function normalizeSection(value: string): string {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : "Docs";
}

function groupSections(items: ReadonlyArray<TreeNavItem>): GroupedSection[] {
	const groups: GroupedSection[] = [];

	for (const [index, item] of items.entries()) {
		const sectionTitle = normalizeSection(item.section);
		const current = groups[groups.length - 1];
		if (!current || current.title !== sectionTitle) {
			groups.push({
				title: sectionTitle,
				items: [{ item, index }],
			});
			continue;
		}
		current.items.push({ item, index });
	}

	return groups;
}

export function buildTreeNavRows(
	items: ReadonlyArray<TreeNavItem>,
	options: BuildTreeNavRowsOptions,
): TreeNavRow[] {
	const safeWidth = Math.max(20, Math.floor(options.maxWidth ?? 30));
	const mode = options.mode ?? "focus-section";
	const activeSection = normalizeSection(options.currentSection ?? "");
	const safeSelected =
		items.length > 0
			? clampNumber(toNonNegativeInt(options.selectedIndex, 0), 0, items.length - 1)
			: 0;
	const expandedSectionMarker = marker(options.expandedSectionMarker, "▾");
	const collapsedSectionMarker = marker(options.collapsedSectionMarker, "▸");
	const activeItemMarker = marker(options.activeItemMarker, "▸");
	const inactiveItemMarker = marker(options.inactiveItemMarker, "•");
	const rows: TreeNavRow[] = [];

	if (items.length === 0) {
		return [
			{
				key: "empty",
				text: options.emptyLabel ?? "(no docs pages)",
				kind: "item",
			},
		];
	}

	for (const [sectionIndex, section] of groupSections(items).entries()) {
		if (rows.length > 0) {
			rows.push({
				key: `gap-section-${sectionIndex}`,
				text: "",
				kind: "gap",
			});
		}

		const isActiveSection = section.title === activeSection;
		const collapsed = mode === "focus-section" && !isActiveSection;
		const sectionMarker = collapsed ? collapsedSectionMarker : expandedSectionMarker;
		const sectionLabel = truncateBoundedLine(`${sectionMarker} ${section.title}`, safeWidth, 20);

		if (!isActiveSection || !options.hideActiveSectionHeader) {
			rows.push({
				key: `section-${sectionIndex}`,
				text: sectionLabel,
				kind: "section",
				collapsed,
			});
		}

		if (collapsed) {
			continue;
		}

		for (const { item, index } of section.items) {
			const active = index === safeSelected;
			const itemMarker = active ? activeItemMarker : inactiveItemMarker;
			const rowText = truncateBoundedLine(` ${itemMarker} ${item.label}`, safeWidth, 20);
			rows.push({
				key: item.key,
				text: active ? padRight(rowText, safeWidth) : rowText,
				kind: "item",
				active,
			});
		}
	}

	return rows;
}

export type TreeNavProps = BuildTreeNavRowsOptions & {
	items: ReadonlyArray<TreeNavItem>;
	sectionIntent?: ColorIntent;
	collapsedSectionIntent?: ColorIntent;
	itemIntent?: ColorIntent;
	activeItemIntent?: ColorIntent;
	activeBackgroundIntent?: ColorIntent;
};

export function TreeNav({
	items,
	selectedIndex,
	maxWidth,
	currentSection,
	mode = "focus-section",
	hideActiveSectionHeader = false,
	emptyLabel,
	expandedSectionMarker,
	collapsedSectionMarker,
	activeItemMarker,
	inactiveItemMarker,
	sectionIntent = "sidebarSectionText",
	collapsedSectionIntent = "dimText",
	itemIntent = "sidebarItemText",
	activeItemIntent = "sidebarItemActiveText",
	activeBackgroundIntent = "sidebarItemActiveBackground",
}: TreeNavProps) {
	const theme = useTuiTheme();
	const colors = useTuiColors();
	const sectionColor = resolveIntentColor(theme, sectionIntent, colors);
	const collapsedSectionColor = resolveIntentColor(theme, collapsedSectionIntent, colors);
	const itemColor = resolveIntentColor(theme, itemIntent, colors);
	const activeColor = resolveIntentColor(theme, activeItemIntent, colors);
	const activeBackground = resolveIntentColor(theme, activeBackgroundIntent, colors);
	const rows = buildTreeNavRows(items, {
		selectedIndex,
		maxWidth,
		currentSection,
		mode,
		hideActiveSectionHeader,
		emptyLabel,
		expandedSectionMarker,
		collapsedSectionMarker,
		activeItemMarker,
		inactiveItemMarker,
	});

	return (
		<Box flexDirection="column">
			{rows.map((row) => {
				if (row.kind === "section") {
					return (
						<Text
							key={row.key}
							color={row.collapsed ? collapsedSectionColor : sectionColor}
							bold={!row.collapsed}
						>
							{row.text.length > 0 ? row.text : " "}
						</Text>
					);
				}
				if (row.kind === "gap") {
					return (
						<Text key={row.key} color={itemColor}>
							{" "}
						</Text>
					);
				}
				return (
					<Text
						key={row.key}
						color={row.active ? activeColor : itemColor}
						backgroundColor={row.active ? activeBackground : undefined}
						bold={row.active}
					>
						{row.text.length > 0 ? row.text : " "}
					</Text>
				);
			})}
		</Box>
	);
}
