import { Text } from "ink";
import { useTuiColors, useTuiTheme, useTuiViewport } from "../../app/app-provider";
import { resolveIntentColor } from "../../theme";
import { horizontalRule } from "../../utils/strings";

export type DividerProps = {
	width?: number;
};

export function Divider({ width }: DividerProps) {
	const theme = useTuiTheme();
	const colors = useTuiColors();
	const viewport = useTuiViewport();
	const lineWidth = width ?? viewport.columns;
	const color = resolveIntentColor(theme, "footerSeparator", colors);

	return <Text color={color}>{horizontalRule(Math.max(1, lineWidth), "-")}</Text>;
}
