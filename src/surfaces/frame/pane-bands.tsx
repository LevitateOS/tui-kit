import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { useTuiColors, useTuiTheme } from "../../app/app-provider";
import { resolveIntentColor } from "../../theme";
import type { SurfacePaneBandProps, SurfacePaneBandsProps } from "./types";

type PaneBandsProps = {
	bands?: SurfacePaneBandsProps;
	body: ReactNode;
	bodyColor?: string;
	bodyPaddingX: number;
	bodyPaddingY: number;
	bodyRows?: number;
	borderStyle?: "single" | "double" | "round" | "bold" | "none";
	innerColumns?: number;
};

function horizontalGlyph(borderStyle: "single" | "double" | "round" | "bold" | "none"): string {
	if (borderStyle === "double") {
		return "═";
	}
	if (borderStyle === "bold") {
		return "━";
	}
	if (borderStyle === "none") {
		return "─";
	}
	return "─";
}

function renderBandNode(value: ReactNode, color?: string, bold = false): ReactNode {
	if (typeof value === "string") {
		return (
			<Text color={color} bold={bold}>
				{value}
			</Text>
		);
	}
	return value;
}

function Band({
	band,
	defaultTextColor,
	separatorColor,
	separatorGlyph,
	width,
}: {
	band: SurfacePaneBandProps;
	defaultTextColor?: string;
	separatorColor?: string;
	separatorGlyph: string;
	width: number;
}) {
	const theme = useTuiTheme();
	const colors = useTuiColors();
	const textColor =
		band.textIntent !== undefined
			? resolveIntentColor(theme, band.textIntent, colors)
			: defaultTextColor;
	const backgroundColor =
		band.backgroundIntent !== undefined
			? resolveIntentColor(theme, band.backgroundIntent, colors)
			: undefined;
	const safePaddingX =
		typeof band.paddingX === "number" && Number.isFinite(band.paddingX)
			? Math.max(0, Math.floor(band.paddingX))
			: 1;
	const separatorLine = separatorGlyph.repeat(Math.max(1, width));

	return (
		<Box flexDirection="column">
			<Box paddingX={safePaddingX} backgroundColor={backgroundColor}>
				{renderBandNode(band.content, textColor, Boolean(band.bold))}
			</Box>
			{band.separatorBelow ? <Text color={separatorColor}>{separatorLine}</Text> : null}
		</Box>
	);
}

export function PaneBands({
	bands,
	body,
	bodyColor,
	bodyPaddingX,
	bodyPaddingY,
	bodyRows,
	borderStyle = "single",
	innerColumns = 20,
}: PaneBandsProps) {
	const theme = useTuiTheme();
	const colors = useTuiColors();
	const safeBodyPaddingX = Math.max(0, Math.floor(bodyPaddingX));
	const safeBodyPaddingY = Math.max(0, Math.floor(bodyPaddingY));
	const separatorGlyph = horizontalGlyph(borderStyle);
	const safeInnerColumns = Math.max(1, Math.floor(innerColumns));

	return (
		<Box flexDirection="column" flexGrow={1} height={bodyRows}>
			{bands?.top ? (
				<Band
					band={bands.top}
					defaultTextColor={bodyColor}
					separatorColor={resolveIntentColor(theme, bands.top.separatorIntent ?? "border", colors)}
					separatorGlyph={separatorGlyph}
					width={safeInnerColumns}
				/>
			) : null}
			{bands?.subtop ? (
				<Band
					band={bands.subtop}
					defaultTextColor={bodyColor}
					separatorColor={resolveIntentColor(
						theme,
						bands.subtop.separatorIntent ?? "border",
						colors,
					)}
					separatorGlyph={separatorGlyph}
					width={safeInnerColumns}
				/>
			) : null}
			<Box
				paddingX={safeBodyPaddingX}
				paddingY={safeBodyPaddingY}
				flexGrow={1}
				flexDirection="column"
			>
				{renderBandNode(body, bodyColor)}
			</Box>
			{bands?.bottom ? (
				<Band
					band={bands.bottom}
					defaultTextColor={bodyColor}
					separatorColor={resolveIntentColor(
						theme,
						bands.bottom.separatorIntent ?? "border",
						colors,
					)}
					separatorGlyph={separatorGlyph}
					width={safeInnerColumns}
				/>
			) : null}
		</Box>
	);
}
