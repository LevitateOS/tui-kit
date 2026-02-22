import { createLifecycleScope } from "../core/lifecycle";
import type { PageBaseOptions, PageCard } from "./shared";
import { pageCancelled, pageClampIndex, renderPageCard } from "./shared";
import { createWizardPageShell } from "./wizard-shell";

export type CardListPageOptions = PageBaseOptions & {
  cards: ReadonlyArray<PageCard>;
  defaultIndex?: number;
};

export function selectCardFromPage(options: CardListPageOptions): Promise<number> {
  if (options.cards.length === 0) {
    return Promise.reject(new Error("selectCardFromPage requires at least one card."));
  }

  const shell = createWizardPageShell({
    ...options,
    footerText: options.footerText ?? "Arrows/j/k move | Enter select | q/Esc cancel",
    contentScrollable: true,
  });
  let selected = pageClampIndex(options.defaultIndex ?? 0, options.cards.length);

  return new Promise((resolve, reject) => {
    const scope = createLifecycleScope("pages.card-list.selectCardFromPage");
    let settled = false;

    const render = () => {
      const parts: string[] = [options.instruction, ""];
      const cardWidth = Math.max(20, shell.geometry.contentInnerColumns - 4);
      const styleContext = {
        theme: options.screen.theme,
        colors: options.screen.colors,
      };
      for (const [index, card] of options.cards.entries()) {
        parts.push(renderPageCard(card, selected === index, cardWidth, styleContext));
        parts.push("");
      }
      shell.content.setContent(parts.join("\n").trimEnd());
      shell.content.setScrollPerc(0);
      shell.content.focus();
      options.screen.render();
    };

    const settle = (action: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      scope.dispose();
      action();
    };

    const move = (delta: number) => {
      selected = pageClampIndex(selected + delta, options.cards.length);
      render();
    };

    scope.onDispose(() => {
      options.screen.render();
    });

    scope.bindKey(options.screen, ["up", "k"], () => move(-1));
    scope.bindKey(options.screen, ["down", "j"], () => move(1));
    scope.bindKey(options.screen, ["enter"], () => settle(() => resolve(selected)));
    scope.bindKey(options.screen, ["escape", "q"], () =>
      settle(() => reject(pageCancelled("Card selection cancelled by user."))),
    );

    render();
  });
}
