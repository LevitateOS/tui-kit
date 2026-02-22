import { TuiKitError } from "../core/errors";
import { clamp } from "../core/layout";
import { renderSurfaceBlock, type SurfaceBlock } from "../surfaces/semantic";
import type { ColorRuntime, TuiTheme } from "../theme";
import type { WidgetBaseOptions } from "../widgets/types";

export type PageCard = {
  title: string;
  lines: string[];
};

export type PageRenderStyleContext = {
  theme: TuiTheme;
  colors: ColorRuntime;
};

export function pageCancelled(message: string): TuiKitError {
  return new TuiKitError("CANCELLED", message, {
    component: "pages",
  });
}

export function pageClampIndex(index: number, count: number): number {
  if (!Number.isFinite(count) || count <= 0) {
    return 0;
  }
  return clamp(index, 0, Math.floor(count) - 1);
}

export function truncatePageLine(value: string, width: number): string {
  if (width <= 0) {
    return "";
  }
  if (value.length <= width) {
    return value;
  }
  if (width <= 3) {
    return value.slice(0, width);
  }
  return `${value.slice(0, width - 3)}...`;
}

export function renderPageCard(
  card: PageCard,
  selected: boolean,
  innerWidth: number,
  styleContext?: PageRenderStyleContext,
): string {
  const width = Math.max(20, innerWidth);
  const cardDirectives = selected
    ? "fg=$sidebarItemActiveText bg=$sidebarItemActiveBackground"
    : "fg=$text bg=$cardBackground";

  const block: SurfaceBlock = {
    kind: "card",
    lines: [
      {
        runs: [{ text: "─".repeat(width) }],
        intent: "cardBorder",
      },
      {
        runs: [
          {
            text: selected ? ">" : " ",
            directives: selected ? "fg=$accent bold" : "fg=$dimText",
          },
          { text: " " },
          { text: truncatePageLine(card.title, Math.max(1, width - 2)) },
        ],
        directives: cardDirectives,
        fill: true,
        truncate: "ellipsis",
      },
      ...card.lines.map((line) => ({
        runs: [
          { text: "  " },
          { text: truncatePageLine(line, Math.max(1, width - 2)) },
        ],
        directives: cardDirectives,
        fill: true,
        truncate: "ellipsis" as const,
      })),
      {
        runs: [{ text: "─".repeat(width) }],
        intent: "cardBorder",
      },
    ],
  };

  return renderSurfaceBlock(block, width, styleContext).join("\n");
}

export type PageBaseOptions = WidgetBaseOptions & {
  instruction: string;
  footerText?: string;
};
