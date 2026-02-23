import { Box, Text } from "ink";
import type { ReactNode } from "react";
import { toPositiveInt } from "../../utils/clamp";

export type GridProps = {
	items: ReadonlyArray<ReactNode>;
	columns?: number;
	gap?: number;
};

export function Grid({ items, columns = 2, gap = 1 }: GridProps) {
	const safeColumns = toPositiveInt(columns, 2);
	const rows = Math.ceil(items.length / safeColumns);

	return (
		<Box flexDirection="column">
			{Array.from({ length: rows }).map((_, rowIndex) => {
				const start = rowIndex * safeColumns;
				const rowItems = items.slice(start, start + safeColumns);

				return (
					<Box key={`row-${rowIndex}`} flexDirection="row">
						{rowItems.map((item, columnIndex) => (
							<Box
								key={`cell-${rowIndex}-${columnIndex}`}
								marginRight={columnIndex < rowItems.length - 1 ? gap : 0}
							>
								{item}
							</Box>
						))}
						{rowItems.length === 0 ? <Text /> : null}
					</Box>
				);
			})}
		</Box>
	);
}
