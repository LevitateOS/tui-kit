import { createLifecycleScope } from "../core/lifecycle";
import type { PageBaseOptions, PageCard } from "./shared";
import { pageCancelled, pageClampIndex, renderPageCard } from "./shared";
import { createWizardPageShell } from "./wizard-shell";

export type AsyncCardListPageOptions<T> = PageBaseOptions & {
  load: (signal: AbortSignal) => Promise<ReadonlyArray<T>>;
  toCard: (item: T, index: number) => PageCard;
  defaultIndex?: number;
  loadingMessage?: string;
  emptyMessage?: string;
  refreshKeys?: ReadonlyArray<string>;
};

export type AsyncCardListSelection<T> = {
  index: number;
  item: T;
};

export function selectFromAsyncCardListPage<T>(
  options: AsyncCardListPageOptions<T>,
): Promise<AsyncCardListSelection<T>> {
  const shell = createWizardPageShell({
    ...options,
    footerText:
      options.footerText ??
      "Arrows/j/k move | Enter select | r refresh | q/Esc cancel",
    contentScrollable: true,
  });

  const refreshKeys = options.refreshKeys ?? ["r"];
  let items: ReadonlyArray<T> = [];
  let selected = pageClampIndex(options.defaultIndex ?? 0, 1);
  let loading = false;
  let errorMessage: string | null = null;

  return new Promise((resolve, reject) => {
    const scope = createLifecycleScope("pages.async-list.selectFromAsyncCardListPage");
    let settled = false;

    const settle = (action: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      scope.dispose();
      action();
    };

    const render = () => {
      const lines: string[] = [options.instruction, ""];
      if (loading) {
        lines.push(options.loadingMessage ?? "Loading...");
      } else if (errorMessage) {
        lines.push("Load failed:");
        lines.push(errorMessage);
        lines.push("");
        lines.push("Press r to retry.");
      } else if (items.length === 0) {
        lines.push(options.emptyMessage ?? "No items available.");
        lines.push("");
        lines.push("Press r to refresh.");
      } else {
        const cardWidth = Math.max(20, shell.geometry.contentInnerColumns - 4);
        const styleContext = {
          theme: options.screen.theme,
          colors: options.screen.colors,
        };
        for (const [index, item] of items.entries()) {
          lines.push(
            renderPageCard(options.toCard(item, index), selected === index, cardWidth, styleContext),
          );
          lines.push("");
        }
      }

      shell.content.setContent(lines.join("\n").trimEnd());
      shell.content.setScrollPerc(0);
      shell.content.focus();
      options.screen.render();
    };

    const load = () => {
      loading = true;
      errorMessage = null;
      render();
      void scope.runTask("load", async (signal) => {
        try {
          const loaded = await options.load(signal);
          if (signal.aborted) {
            return;
          }
          items = loaded;
          selected = pageClampIndex(selected, Math.max(1, items.length));
          loading = false;
          render();
        } catch (error: unknown) {
          if (signal.aborted) {
            return;
          }
          loading = false;
          errorMessage = error instanceof Error ? error.message : String(error);
          render();
        }
      });
    };

    const move = (delta: number) => {
      if (loading || errorMessage || items.length === 0) {
        return;
      }
      selected = pageClampIndex(selected + delta, items.length);
      render();
    };

    scope.onDispose(() => {
      options.screen.render();
    });

    scope.bindKey(options.screen, ["up", "k"], () => move(-1));
    scope.bindKey(options.screen, ["down", "j"], () => move(1));
    scope.bindKey(options.screen, [...refreshKeys], load);
    scope.bindKey(options.screen, ["enter"], () => {
      if (loading || errorMessage || items.length === 0) {
        return;
      }
      settle(() => resolve({ index: selected, item: items[selected]! }));
    });
    scope.bindKey(options.screen, ["escape", "q"], () =>
      settle(() => reject(pageCancelled("Async list selection cancelled by user."))),
    );

    load();
  });
}
