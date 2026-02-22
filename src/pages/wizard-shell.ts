import type { WidgetBaseOptions } from "../widgets/types";
import { createPaneShell } from "../surfaces";

export type WizardPageShellOptions = WidgetBaseOptions & {
  footerText: string;
  contentScrollable?: boolean;
};

export function createWizardPageShell(options: WizardPageShellOptions) {
  return createPaneShell({
    ...options,
    contentScrollable: Boolean(options.contentScrollable),
    sidebarWidth: options.screen.theme.layout.sidebarWidth,
  });
}
