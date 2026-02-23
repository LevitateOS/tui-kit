import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { useTuiColors, useTuiTheme } from "../../app/app-provider";
import { resolveIntentColor } from "../../theme";
import { BorderSlotTitle } from "./border-slot-title";
import { PaneBands } from "./pane-bands";
import type { SurfacePaneProps } from "./types";

function renderNode(value: ReactNode, color?: string, bold = false): ReactNode {
	if (typeof value === "string") {
		return (
			<Text color={color} bold={bold}>
				{value}
			</Text>
		);
	}

	return value;
}

export function SurfacePane({
	title,
	body,
	bands,
	outerWidth,
	outerHeight,
	minOuterWidth,
	flexGrow,
	borderStyle,
	borderIntent = "border",
	backgroundIntent = "background",
	textIntent = "text",
	titleIntent = "sectionHeading",
	titleMode,
	titleStyle,
	paddingX,
	paddingY,
}: SurfacePaneProps) {
	const theme = useTuiTheme();
	const colors = useTuiColors();
	const borderColor = resolveIntentColor(theme, borderIntent, colors);
	const backgroundColor = resolveIntentColor(theme, backgroundIntent, colors);
	const textColor = resolveIntentColor(theme, textIntent, colors);
	const titleColor = resolveIntentColor(theme, titleIntent, colors);
	const resolvedTitleMode = titleMode ?? (title ? "slot" : "none");
	const resolvedTitleStyle = titleStyle ?? theme.chrome.titleStyle;
	const resolvedPaddingX = paddingX ?? theme.chrome.panePaddingX;
	const resolvedPaddingY = paddingY ?? theme.chrome.panePaddingY;
	const resolvedBorderStyle = borderStyle ?? theme.chrome.borderGlyphSet;
	const hasBorder = resolvedBorderStyle !== "none";
	const innerColumns =
		typeof outerWidth === "number" && Number.isFinite(outerWidth)
			? Math.max(1, Math.floor(outerWidth) - (hasBorder ? 2 : 0))
			: 40;
	const bodyRows =
		typeof outerHeight === "number" && Number.isFinite(outerHeight)
			? Math.max(
					1,
					Math.floor(outerHeight) -
						(hasBorder ? 2 : 0) -
						(title && resolvedTitleMode !== "none" ? 1 : 0),
				)
			: undefined;

	return (
		<Box
			width={outerWidth}
			height={outerHeight}
			minWidth={minOuterWidth}
			flexGrow={flexGrow}
			flexDirection="column"
			borderStyle={hasBorder ? resolvedBorderStyle : undefined}
			borderColor={hasBorder ? borderColor : undefined}
			backgroundColor={backgroundColor}
		>
			{title && resolvedTitleMode !== "none" ? (
				<Box flexShrink={0}>
					{resolvedTitleMode === "inline" ? (
						<Box paddingX={Math.max(0, resolvedPaddingX)}>
							{renderNode(title, titleColor, true)}
						</Box>
					) : (
						<BorderSlotTitle
							title={title}
							width={innerColumns}
							style={resolvedTitleStyle}
							borderColor={borderColor}
							titleColor={titleColor}
						/>
					)}
				</Box>
			) : null}
			<PaneBands
				bands={bands}
				body={renderNode(body, textColor)}
				bodyColor={textColor}
				bodyPaddingX={resolvedPaddingX}
				bodyPaddingY={resolvedPaddingY}
				bodyRows={bodyRows}
				borderStyle={resolvedBorderStyle}
				innerColumns={Math.max(1, innerColumns - Math.max(0, resolvedPaddingX * 2))}
			/>
		</Box>
	);
}
