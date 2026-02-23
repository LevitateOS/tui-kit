import { Text } from "ink";
import type { ReactNode } from "react";
import { truncateLine } from "../../utils/strings";
import type { SurfacePaneTitleStyle } from "./types";

export type BorderSlotTitleProps = {
	title?: ReactNode;
	width?: number;
	style?: SurfacePaneTitleStyle;
	borderColor?: string;
	titleColor?: string;
	align?: "left" | "center" | "right";
	inset?: number;
};

function clippedTitle(value: ReactNode, maxWidth: number): string {
	if (typeof value !== "string") {
		return "";
	}
	return truncateLine(value.trim(), maxWidth);
}

function slotOffset(
	align: "left" | "center" | "right",
	lineWidth: number,
	slotWidth: number,
	inset: number,
): number {
	if (align === "center") {
		return Math.max(0, Math.floor((lineWidth - slotWidth) / 2));
	}
	if (align === "right") {
		return Math.max(0, lineWidth - slotWidth - inset);
	}
	return Math.max(0, inset);
}

function slotGlyph(style: SurfacePaneTitleStyle): string {
	if (style === "plain") {
		return " ";
	}
	return style === "notched" ? "╴" : "─";
}

export function BorderSlotTitle({
	title,
	width = 40,
	style = "slot",
	borderColor,
	titleColor,
	align = "left",
	inset = 1,
}: BorderSlotTitleProps) {
	if (typeof title !== "string") {
		return title ?? null;
	}

	const safeWidth = Math.max(1, Math.floor(width));
	const safeInset = Math.max(0, Math.floor(inset));
	const glyph = slotGlyph(style);

	if (style === "plain") {
		return (
			<Text color={titleColor} bold>
				{clippedTitle(title, safeWidth)}
			</Text>
		);
	}

	const text = clippedTitle(title, Math.max(1, safeWidth - 2));
	if (text.length === 0) {
		return <Text color={borderColor}>{glyph.repeat(safeWidth)}</Text>;
	}

	if (style === "notched") {
		return (
			<Text>
				<Text color={borderColor}>╶ </Text>
				<Text color={titleColor} bold>
					{text}
				</Text>
				<Text color={borderColor}> ╴</Text>
			</Text>
		);
	}

	const titleSlot = ` ${text} `;
	const start = slotOffset(align, safeWidth, titleSlot.length, safeInset);
	const left = glyph.repeat(start);
	const right = glyph.repeat(Math.max(0, safeWidth - start - titleSlot.length));

	return (
		<Text>
			<Text color={borderColor}>{left}</Text>
			<Text color={titleColor} bold>
				{titleSlot}
			</Text>
			<Text color={borderColor}>{right}</Text>
		</Text>
	);
}
