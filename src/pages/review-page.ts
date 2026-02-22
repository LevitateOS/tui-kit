import { createLifecycleScope } from "../core/lifecycle";
import type { PageBaseOptions } from "./shared";
import { createWizardPageShell } from "./wizard-shell";

export type ReviewPageOptions = PageBaseOptions & {
  content: string;
};

export function showReviewPage(options: ReviewPageOptions): Promise<void> {
  const shell = createWizardPageShell({
    ...options,
    footerText:
      options.footerText ?? "Arrows/PageUp/PageDown scroll | Enter/q/Esc close",
    contentScrollable: true,
  });

  shell.content.setContent(options.content);
  shell.content.setScroll(0);
  shell.content.focus();
  options.screen.render();

  return new Promise((resolve) => {
    const scope = createLifecycleScope("pages.review.showReviewPage");
    let settled = false;

    const close = () => {
      if (settled) {
        return;
      }
      settled = true;
      scope.dispose();
      resolve();
    };
    const scrollBy = (delta: number) => {
      shell.content.scroll(delta);
      options.screen.render();
    };

    scope.onDispose(() => {
      options.screen.render();
    });

    scope.bindKey(options.screen, ["up", "k"], () => scrollBy(-1));
    scope.bindKey(options.screen, ["down", "j"], () => scrollBy(1));
    scope.bindKey(options.screen, ["pageup", "b"], () => scrollBy(-10));
    scope.bindKey(options.screen, ["pagedown", "space"], () => scrollBy(10));
    scope.bindKey(options.screen, ["g", "home"], () => {
      shell.content.setScroll(0);
      options.screen.render();
    });
    scope.bindKey(options.screen, ["G", "end", "S-g"], () => {
      shell.content.setScrollPerc(100);
      options.screen.render();
    });
    scope.bindKey(options.screen, ["enter", "escape", "q"], close);
  });
}
