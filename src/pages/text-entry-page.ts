import { createLifecycleScope } from "../core/lifecycle";
import type { PageBaseOptions } from "./shared";
import { pageCancelled, truncatePageLine } from "./shared";
import { createWizardPageShell } from "./wizard-shell";

export type TextEntryPageOptions = PageBaseOptions & {
  label: string;
  initialValue?: string;
  allowEmpty?: boolean;
};

export function readTextEntryFromPage(options: TextEntryPageOptions): Promise<string> {
  const shell = createWizardPageShell({
    ...options,
    footerText:
      options.footerText ??
      "Type value directly | Backspace delete | Enter confirm | q/Esc cancel",
  });

  let value = options.initialValue ?? "";

  return new Promise((resolve, reject) => {
    const scope = createLifecycleScope("pages.text-entry.readTextEntryFromPage");
    let settled = false;

    const render = () => {
      const width = Math.max(20, shell.geometry.contentInnerColumns - 4);
      shell.content.setContent(
        [options.instruction, "", `${options.label}: ${truncatePageLine(value, width)}_`].join(
          "\n",
        ),
      );
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

    scope.onDispose(() => {
      options.screen.render();
    });

    scope.bindKey(options.screen, ["backspace"], () => {
      value = value.slice(0, -1);
      render();
    });

    scope.bindKey(options.screen, ["enter"], () => {
      const trimmed = value.trim();
      if (!options.allowEmpty && trimmed.length === 0) {
        return;
      }
      settle(() => resolve(trimmed));
    });

    scope.bindKey(options.screen, ["escape", "q"], () =>
      settle(() => reject(pageCancelled("Text entry cancelled by user."))),
    );

    scope.bindEvent(
      options.screen.raw as unknown as {
        on: (event: string, handler: (...args: unknown[]) => void) => void;
        removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
      },
      "keypress",
      (ch: unknown) => {
        if (typeof ch !== "string" || ch.length === 0) {
          return;
        }
        if (/[\u0000-\u001F\u007F]/.test(ch)) {
          return;
        }
        value += ch;
        render();
      },
    );

    render();
  });
}
