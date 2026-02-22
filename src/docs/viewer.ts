import { clamp, createLifecycleScope, createTwoPaneShell, type ScreenHandle } from "../core";
import { styleText } from "../theme";
import type { DocsContentLike, DocsRenderStyleContext } from "./render";
import type { FlatDocsNavItem } from "./nav";
import { renderDocsHeader, renderDocsPageLines, renderDocsSidebar } from "./render";

export type InitialDocSelection = {
  index: number;
  unknownSlug?: string;
};

export type DocsViewport = {
  headerLines: string[];
  bodyLines: string[];
  totalLines: number;
  visibleRows: number;
  maxScroll: number;
  scrollOffset: number;
  startLine: number;
  endLine: number;
};

export type DocsViewerOptions = {
  screen: ScreenHandle;
  navItems: ReadonlyArray<FlatDocsNavItem>;
  getContent: (slug: string, title: string) => DocsContentLike;
  initialSlug?: string;
  title?: string;
};

export type DocsViewerHandle = {
  dispose: () => void;
};

export function resolveInitialDocSelection(
  navItems: ReadonlyArray<FlatDocsNavItem>,
  slug?: string,
): InitialDocSelection {
  if (navItems.length === 0) {
    return { index: 0 };
  }

  const normalized = slug?.trim() ?? "";
  if (normalized.length === 0) {
    return { index: 0 };
  }

  const index = navItems.findIndex((item) => item.slug === normalized);
  if (index >= 0) {
    return { index };
  }

  return {
    index: 0,
    unknownSlug: normalized,
  };
}

export function resolveInitialDocIndex(
  navItems: ReadonlyArray<FlatDocsNavItem>,
  slug?: string,
): number {
  return resolveInitialDocSelection(navItems, slug).index;
}

export function computeDocsViewport(
  content: DocsContentLike,
  slug: string,
  requestedScrollOffset: number,
  contentInnerRows: number,
  contentWidth: number,
  styleContext?: DocsRenderStyleContext,
): DocsViewport {
  const safeRows = Math.max(1, contentInnerRows);
  const safeWidth = Math.max(20, contentWidth);
  const pageLines = renderDocsPageLines(content, safeWidth, { styleContext });

  const provisionalHeader = renderDocsHeader(
    content,
    slug,
    0,
    pageLines.length,
    safeRows,
    safeWidth,
    { styleContext },
  );
  const visibleRows = Math.max(1, safeRows - provisionalHeader.length);
  const maxScroll = Math.max(0, pageLines.length - visibleRows);
  const scrollOffset = clamp(requestedScrollOffset, 0, maxScroll);
  const headerLines = renderDocsHeader(
    content,
    slug,
    scrollOffset,
    pageLines.length,
    visibleRows,
    safeWidth,
    { styleContext },
  );

  const startLine = pageLines.length === 0 ? 0 : scrollOffset + 1;
  const endLine = pageLines.length === 0 ? 0 : Math.min(pageLines.length, scrollOffset + visibleRows);

  return {
    headerLines,
    bodyLines: pageLines.slice(scrollOffset, scrollOffset + visibleRows),
    totalLines: pageLines.length,
    visibleRows,
    maxScroll,
    scrollOffset,
    startLine,
    endLine,
  };
}

function escapeStyleMarkup(value: string): string {
  return value.replaceAll("[[", "\\[[");
}

function styleWithScreen(screen: ScreenHandle, value: string): string {
  return styleText(value, {
    theme: screen.theme,
    runtime: screen.colors,
  });
}

function docsFooter(
  screen: ScreenHandle,
  currentIndex: number,
  pageCount: number,
  startLine: number,
  endLine: number,
  totalLines: number,
  note?: string,
): string {
  const status = `page ${currentIndex + 1}/${pageCount} | lines ${startLine}-${endLine}/${totalLines}`;
  const normalizedNote = note?.trim();
  const noteSegment =
    normalizedNote && normalizedNote.length > 0
      ? ` | [[fg=$warning bold]]${escapeStyleMarkup(normalizedNote)}[[/]]`
      : "";

  return styleWithScreen(
    screen,
    "[[fg=$dimText]][docs][[/]] " +
      "[[fg=$accent bold]]q[[/]] quit | " +
      "[[fg=$accent bold]]h/l[[/]] page | " +
      "[[fg=$accent bold]]j/k[[/]] scroll | " +
      "[[fg=$accent bold]]g/G[[/]] top/end | " +
      status +
      noteSegment,
  );
}

function createDocsShell(screen: ScreenHandle, title: string) {
  return createTwoPaneShell(screen, {
    title,
    sidebarContent: "",
    footerText: styleWithScreen(
      screen,
      "[[fg=$dimText]][docs][[/]] [[fg=$accent bold]]q[[/]] quit | [[fg=$accent bold]]h/l[[/]] page | [[fg=$accent bold]]j/k[[/]] scroll",
    ),
    contentScrollable: false,
    headerMode: "bar",
    footerSeparator: true,
  });
}

export function startDocsViewer(options: DocsViewerOptions): DocsViewerHandle {
  if (options.navItems.length === 0) {
    throw new Error("No docs pages are available.");
  }

  const selection = resolveInitialDocSelection(options.navItems, options.initialSlug);
  const fallbackSlug = options.navItems[0]?.slug ?? "index";
  let startupNotice =
    selection.unknownSlug === undefined
      ? undefined
      : `unknown slug '${selection.unknownSlug}', showing '${fallbackSlug}'`;
  let currentIndex = selection.index;
  let scrollOffset = 0;

  const scope = createLifecycleScope("docs.viewer");
  let shell = createDocsShell(options.screen, options.title ?? "LevitateOS Docs");
  scope.onDispose(() => {
    options.screen.destroy();
  });

  const render = () => {
    const item = options.navItems[clamp(currentIndex, 0, options.navItems.length - 1)]!;
    const content = options.getContent(item.slug, item.title);

    const contentWidth = Math.max(20, shell.geometry.contentInnerColumns);
    const sidebarWidth = Math.max(20, shell.geometry.sidebarInnerColumns);
    const styleContext: DocsRenderStyleContext = {
      theme: options.screen.theme,
      colors: options.screen.colors,
    };
    const viewport = computeDocsViewport(
      content,
      item.slug,
      scrollOffset,
      shell.geometry.contentInnerRows,
      contentWidth,
      styleContext,
    );

    scrollOffset = viewport.scrollOffset;

    shell.sidebar.setContent(
      renderDocsSidebar(options.navItems.slice(), currentIndex, {
        maxWidth: sidebarWidth,
        styleContext,
      }),
    );
    shell.content.setContent([...viewport.headerLines, ...viewport.bodyLines].join("\n"));
    shell.footer.setContent(
      docsFooter(
        options.screen,
        currentIndex,
        options.navItems.length,
        viewport.startLine,
        viewport.endLine,
        viewport.totalLines,
        startupNotice,
      ),
    );

    options.screen.render();
  };

  const movePage = (delta: number) => {
    const nextIndex = clamp(currentIndex + delta, 0, options.navItems.length - 1);
    if (nextIndex === currentIndex) {
      return;
    }
    currentIndex = nextIndex;
    scrollOffset = 0;
    startupNotice = undefined;
    render();
  };

  const scrollBy = (delta: number) => {
    if (delta === 0) {
      return;
    }
    const nextOffset = Math.max(0, scrollOffset + delta);
    if (nextOffset === scrollOffset) {
      return;
    }
    scrollOffset = nextOffset;
    startupNotice = undefined;
    render();
  };

  const scrollToTop = () => {
    if (scrollOffset === 0) {
      return;
    }
    scrollOffset = 0;
    startupNotice = undefined;
    render();
  };

  const scrollToBottom = () => {
    scrollOffset = Number.MAX_SAFE_INTEGER;
    startupNotice = undefined;
    render();
  };

  scope.bindEvent(options.screen, "resize", () => {
    shell = createDocsShell(options.screen, options.title ?? "LevitateOS Docs");
    render();
  });

  scope.bindKey(options.screen, ["q", "escape", "C-c"], () => {
    scope.dispose();
  });
  scope.bindKey(options.screen, ["left", "h"], () => movePage(-1));
  scope.bindKey(options.screen, ["right", "l"], () => movePage(1));
  scope.bindKey(options.screen, ["up", "k"], () => scrollBy(-1));
  scope.bindKey(options.screen, ["down", "j"], () => scrollBy(1));
  scope.bindKey(options.screen, ["pageup", "b"], () => scrollBy(-10));
  scope.bindKey(options.screen, ["pagedown", "space"], () => scrollBy(10));
  scope.bindKey(options.screen, ["g", "home"], scrollToTop);
  scope.bindKey(options.screen, ["G", "end", "S-g"], scrollToBottom);

  render();

  return {
    dispose: () => {
      scope.dispose();
    },
  };
}
