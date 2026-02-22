import { createTwoPaneShell, type TwoPaneShell } from "../core/layout";
import { TuiKitError } from "../core/errors";
import type { ScreenHandle } from "../core/screen";
import { renderWizardSidebar } from "../wizard/sidebar";
import type { WizardStep } from "../wizard/steps";

export type PaneBaseOptions = {
  screen: ScreenHandle;
  title: string;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
  steps?: ReadonlyArray<WizardStep>;
  currentStep?: string;
};

export type PaneShellOptions = PaneBaseOptions & {
  footerText: string;
  contentScrollable?: boolean;
  sidebarWidth?: number;
};

export function assertPaneBaseOptions(options: PaneBaseOptions, component: string): void {
  if (!options || typeof options !== "object") {
    throw new TuiKitError("INTERNAL", "Pane options are missing.", {
      component,
    });
  }

  if (!options.screen) {
    throw new TuiKitError("INTERNAL", "Pane options.screen is required.", {
      component,
    });
  }

  if (typeof options.title !== "string" || options.title.trim().length === 0) {
    throw new TuiKitError("INTERNAL", "Pane options.title must be non-empty.", {
      component,
    });
  }
}

export function paneSidebarContent(options: PaneBaseOptions): string {
  const steps = options.steps ?? [];
  const safeSidebarTitle =
    typeof options.sidebarTitle === "string" ? options.sidebarTitle.trim() : "";
  const safeSidebarSubtitle =
    typeof options.sidebarSubtitle === "string" ? options.sidebarSubtitle.trim() : "";

  if (steps.length > 0) {
    const fallbackStepId = steps[0].id;
    const requestedStepId = options.currentStep ?? fallbackStepId;
    const current = steps.some((step) => step.id === requestedStepId)
      ? requestedStepId
      : fallbackStepId;

    return renderWizardSidebar(steps, current, {
      title: safeSidebarTitle,
      subtitle: safeSidebarSubtitle,
    });
  }

  const lines: string[] = [];
  if (safeSidebarTitle.length > 0) {
    lines.push(safeSidebarTitle);
  }
  if (safeSidebarSubtitle.length > 0) {
    lines.push(safeSidebarSubtitle);
  }
  if (lines.length === 0) {
    lines.push("tui-kit");
  }

  return lines.join("\n");
}

export function createPaneShell(options: PaneShellOptions): TwoPaneShell {
  assertPaneBaseOptions(options, "surfaces.two-pane.createPaneShell");

  return createTwoPaneShell(options.screen, {
    title: options.title.trim(),
    sidebarContent: paneSidebarContent(options),
    footerText: options.footerText,
    contentScrollable: Boolean(options.contentScrollable),
    sidebarWidth: options.sidebarWidth ?? options.screen.theme.layout.sidebarWidth,
  });
}
