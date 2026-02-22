import { createBlessedBox, type BlessedBox } from "../adapters/blessed/box";
import type { ScreenHandle } from "./screen";
import { resolveIntentColor } from "../theme";
import { renderSurfaceLine, type SurfaceRenderContext } from "../surfaces/semantic";
import { safeDestroy } from "./lifecycle";
import { clampNumber, toPositiveInt } from "../internal/numbers";

export type TwoPaneGeometry = {
  contentInnerColumns: number;
  contentInnerRows: number;
  sidebarColumns: number;
  sidebarInnerColumns: number;
  bodyRows: number;
};

export type TwoPaneMetrics = TwoPaneGeometry & {
  totalColumns: number;
  totalRows: number;
  contentColumns: number;
  headerRows: number;
  footerRows: number;
};

export type TwoPaneOptions = {
  title: string;
  sidebarContent: string;
  footerText?: string;
  contentScrollable?: boolean;
  sidebarWidth?: number;
  showContentBorder?: boolean;
  emphasizeSidebarBorder?: boolean;
  sidebarBorderMode?: "line" | "none";
  headerFramed?: boolean;
  headerMode?: "plain" | "bar";
  footerSeparator?: boolean;
};

export type TwoPaneShell = {
  root: BlessedBox;
  header: BlessedBox;
  sidebar: BlessedBox;
  content: BlessedBox;
  footer: BlessedBox;
  geometry: TwoPaneGeometry;
};

const shellMap = new WeakMap<object, TwoPaneShell>();

function truncateAscii(text: string, width: number): string {
  if (width <= 0) {
    return "";
  }
  if (text.length <= width) {
    return text;
  }
  if (width <= 3) {
    return text.slice(0, width);
  }
  return `${text.slice(0, width - 3)}...`;
}

function destroyShell(shell: TwoPaneShell | undefined): void {
  if (!shell) {
    return;
  }

  safeDestroy(shell.root);
}

export function clamp(value: number, min: number, max: number): number {
  return clampNumber(value, min, max);
}

export function computeTwoPaneMetrics(
  totalColumns: number,
  totalRows: number,
  desiredSidebar: number,
  headerRows: number,
  footerRows: number,
): TwoPaneMetrics {
  const columns = Math.max(2, toPositiveInt(totalColumns, 80));
  const rows = Math.max(3, toPositiveInt(totalRows, 24));

  const normalizedHeaderRows = clamp(toPositiveInt(headerRows, 1), 1, rows - 2);
  const normalizedFooterRows = clamp(
    toPositiveInt(footerRows, 1),
    1,
    rows - normalizedHeaderRows - 1,
  );
  const bodyRows = Math.max(1, rows - normalizedHeaderRows - normalizedFooterRows);

  const minContentColumns = Math.min(20, Math.max(1, columns - 1));
  const maxSidebarColumns = Math.max(1, columns - minContentColumns);
  const minSidebarColumns = Math.min(18, maxSidebarColumns);
  const sidebarColumns = clamp(
    toPositiveInt(desiredSidebar, 30),
    minSidebarColumns,
    maxSidebarColumns,
  );
  const contentColumns = Math.max(1, columns - sidebarColumns);

  return {
    totalColumns: columns,
    totalRows: rows,
    contentColumns,
    headerRows: normalizedHeaderRows,
    footerRows: normalizedFooterRows,
    sidebarColumns,
    sidebarInnerColumns: Math.max(1, sidebarColumns - 2),
    bodyRows,
    contentInnerColumns: Math.max(1, contentColumns - 2),
    contentInnerRows: Math.max(1, bodyRows - 2),
  };
}

export function createTwoPaneShell(screen: ScreenHandle, options: TwoPaneOptions): TwoPaneShell {
  const key = screen.raw as object;
  destroyShell(shellMap.get(key));

  const layout = screen.theme.layout;
  const metrics = computeTwoPaneMetrics(
    screen.width,
    screen.height,
    options.sidebarWidth ?? layout.sidebarWidth,
    layout.headerHeight,
    layout.footerHeight,
  );

  const textColor = resolveIntentColor(screen.theme, "text", screen.colors);
  const dimTextColor = resolveIntentColor(screen.theme, "dimText", screen.colors);
  const backgroundColor = resolveIntentColor(screen.theme, "background", screen.colors);
  const borderColor = resolveIntentColor(screen.theme, "border", screen.colors);
  const sidebarBorderColor =
    resolveIntentColor(screen.theme, "sidebarBorder", screen.colors) ?? borderColor;
  const sidebarBackground =
    resolveIntentColor(screen.theme, "sidebarBackground", screen.colors) ?? backgroundColor;
  const contentBackground =
    resolveIntentColor(screen.theme, "contentBackground", screen.colors) ?? backgroundColor;
  const headerBackground =
    resolveIntentColor(screen.theme, "headerBackground", screen.colors) ?? backgroundColor;
  const footerBackground =
    resolveIntentColor(screen.theme, "footerBackground", screen.colors) ?? backgroundColor;
  const sidebarText =
    resolveIntentColor(screen.theme, "sidebarItemText", screen.colors) ?? textColor;
  const showContentBorder = options.showContentBorder ?? false;
  const sidebarBorderMode = options.sidebarBorderMode ?? "line";
  const showSidebarBorder = sidebarBorderMode === "line";
  const headerFramed = options.headerFramed ?? true;
  const headerMode = options.headerMode ?? "bar";
  const footerSeparator = options.footerSeparator ?? metrics.footerRows > 1;
  const emphasizeSidebarBorder = options.emphasizeSidebarBorder ?? true;
  const surfaceContext: SurfaceRenderContext = {
    theme: screen.theme,
    colors: screen.colors,
  };
  const contentInnerColumns = Math.max(1, metrics.contentColumns - (showContentBorder ? 2 : 0));
  const contentInnerRows = Math.max(1, metrics.bodyRows - (showContentBorder ? 2 : 0));
  const sidebarInnerColumns = Math.max(1, metrics.sidebarColumns - (showSidebarBorder ? 2 : 0));

  const root = createBlessedBox({
    parent: screen.raw,
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    style: {
      bg: backgroundColor,
    },
  });

  const headerLineWidth = Math.max(3, metrics.totalColumns);
  const separatorLine = "─".repeat(headerLineWidth);
  const headerContent: string[] = [];
  if (headerMode === "bar") {
    headerContent.push(
      renderSurfaceLine(
        {
          runs: [{ text: ` ${options.title.trim()} ` }],
          directives: "fg=$text bg=$headerBackground bold",
          fill: true,
          truncate: "ellipsis",
        },
        headerLineWidth,
        surfaceContext,
      ),
    );
    if (headerFramed && metrics.headerRows > 1) {
      headerContent.push(
        renderSurfaceLine(
          {
            runs: [{ text: separatorLine }],
            intent: "border",
            truncate: "clip",
          },
          headerLineWidth,
          surfaceContext,
        ),
      );
    }
  } else {
    headerContent.push(
      renderSurfaceLine(
        {
          runs: [{ text: truncateAscii(options.title, headerLineWidth) }],
          directives: "fg=$text bg=$headerBackground bold",
          fill: true,
          truncate: "ellipsis",
        },
        headerLineWidth,
        surfaceContext,
      ),
    );
  }
  while (headerContent.length < metrics.headerRows) {
    headerContent.push(
      renderSurfaceLine(
        {
          runs: [{ text: "" }],
          directives: "bg=$headerBackground",
          fill: true,
        },
        headerLineWidth,
        surfaceContext,
      ),
    );
  }

  const header = createBlessedBox({
    parent: root,
    top: 0,
    left: 0,
    width: "100%",
    height: metrics.headerRows,
    content: headerContent.slice(0, metrics.headerRows).join("\n"),
    tags: true,
    style: {
      fg: textColor,
      bg: headerBackground,
      bold: true,
    },
  });

  const sidebar = createBlessedBox({
    parent: root,
    top: metrics.headerRows,
    left: 0,
    width: metrics.sidebarColumns,
    height: metrics.bodyRows,
    border: showSidebarBorder ? "line" : undefined,
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    content: options.sidebarContent,
    style: {
      fg: sidebarText,
      bg: sidebarBackground,
      border: showSidebarBorder && sidebarBorderColor ? { fg: sidebarBorderColor } : undefined,
      bold: emphasizeSidebarBorder,
    },
  });

  const content = createBlessedBox({
    parent: root,
    top: metrics.headerRows,
    left: metrics.sidebarColumns,
    width: metrics.contentColumns,
    height: metrics.bodyRows,
    border: showContentBorder ? "line" : undefined,
    tags: true,
    scrollable: Boolean(options.contentScrollable),
    alwaysScroll: Boolean(options.contentScrollable),
    keys: true,
    vi: true,
    style: {
      fg: textColor,
      bg: contentBackground,
      border: showContentBorder && borderColor ? { fg: borderColor } : undefined,
    },
  });

  const footerSeparatorLine = "─".repeat(Math.max(3, metrics.totalColumns));
  const footerLines: string[] = [];
  if (footerSeparator && metrics.footerRows > 1) {
    footerLines.push(
      renderSurfaceLine(
        {
          runs: [{ text: footerSeparatorLine }],
          intent: "footerSeparator",
          truncate: "clip",
        },
        metrics.totalColumns,
        surfaceContext,
      ),
    );
  }
  footerLines.push(options.footerText ?? "");
  while (footerLines.length < metrics.footerRows) {
    footerLines.push("");
  }

  const footer = createBlessedBox({
    parent: root,
    top: metrics.headerRows + metrics.bodyRows,
    left: 0,
    width: "100%",
    height: metrics.footerRows,
    content: footerLines.slice(0, metrics.footerRows).join("\n"),
    tags: true,
    style: {
      fg: dimTextColor,
      bg: footerBackground,
    },
  });

  const shell: TwoPaneShell = {
    root,
    header,
    sidebar,
    content,
    footer,
    geometry: {
      contentInnerColumns,
      contentInnerRows,
      sidebarColumns: metrics.sidebarColumns,
      sidebarInnerColumns,
      bodyRows: metrics.bodyRows,
    },
  };

  shellMap.set(key, shell);
  return shell;
}
