import { toPositiveInt } from "../internal/numbers";
import { styleText } from "../theme";
import { truncateLine } from "../theme/styles";
import type { ColorIntent, ColorRuntime, TuiTheme } from "../theme";

export type SurfaceTextRun = {
  text: string;
  directives?: string;
  intent?: ColorIntent;
};

export type SurfaceLine = {
  runs: ReadonlyArray<SurfaceTextRun>;
  directives?: string;
  intent?: ColorIntent;
  fill?: boolean;
  truncate?: "clip" | "ellipsis";
};

export type SurfaceBlockKind =
  | "headerBar"
  | "idChip"
  | "sectionHeading"
  | "commandBar"
  | "warningBox"
  | "sidebarRow"
  | "card"
  | "footer";

export type SurfaceBlock = {
  kind: SurfaceBlockKind;
  lines: ReadonlyArray<SurfaceLine>;
};

export type SurfaceRenderContext = {
  theme: TuiTheme;
  colors: ColorRuntime;
};

function safeWidth(width: number): number {
  return Math.max(1, toPositiveInt(width, 1));
}

function escapeMarkup(text: string): string {
  return text.replaceAll("[[", "\\[[");
}

function applyDirectives(
  value: string,
  directives: string | undefined,
  context?: SurfaceRenderContext,
  escape = true,
): string {
  const normalized = directives?.trim() ?? "";
  if (normalized.length === 0 || !context) {
    return value;
  }

  const payload = escape ? escapeMarkup(value) : value;
  return styleText(`[[${normalized}]]${payload}[[/]]`, {
    theme: context.theme,
    runtime: context.colors,
  });
}

function clipText(value: string, width: number, mode: SurfaceLine["truncate"]): string {
  if (value.length <= width) {
    return value;
  }
  if (mode === "ellipsis") {
    return truncateLine(value, width);
  }
  return value.slice(0, width);
}

export function renderSurfaceLine(
  line: SurfaceLine,
  width: number,
  context?: SurfaceRenderContext,
): string {
  const normalizedWidth = safeWidth(width);
  const truncateMode = line.truncate ?? "clip";
  const runs = line.runs ?? [];

  const renderedRuns: string[] = [];
  let plainWidth = 0;

  for (const run of runs) {
    if (plainWidth >= normalizedWidth) {
      break;
    }

    const remaining = normalizedWidth - plainWidth;
    const raw = typeof run.text === "string" ? run.text : "";
    const clipped = clipText(raw, remaining, truncateMode);
    plainWidth += clipped.length;

    if (clipped.length === 0) {
      continue;
    }

    const runDirectives =
      run.directives?.trim() ??
      (run.intent ? `fg=$${run.intent}` : undefined);
    renderedRuns.push(applyDirectives(clipped, runDirectives, context, true));
  }

  let rendered = renderedRuns.join("");
  if (line.fill && plainWidth < normalizedWidth) {
    rendered += " ".repeat(normalizedWidth - plainWidth);
  }

  const lineDirectives =
    line.directives?.trim() ??
    (line.intent ? `fg=$${line.intent}` : undefined);
  return applyDirectives(rendered, lineDirectives, context, false);
}

export function renderSurfaceBlock(
  block: SurfaceBlock,
  width: number,
  context?: SurfaceRenderContext,
): string[] {
  return block.lines.map((line) => renderSurfaceLine(line, width, context));
}
