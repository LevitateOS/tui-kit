import type { ScreenHandle } from "../core/screen";
import type { WidgetBaseOptions } from "../widgets/types";
import type { WizardStep } from "../wizard/steps";

export type WizardPageContextOptions = {
  screen: ScreenHandle;
  steps: ReadonlyArray<WizardStep>;
  sidebarTitle?: string;
  sidebarSubtitle?: string;
};

export type WizardStepOverrides = {
  sidebarTitle?: string;
  sidebarSubtitle?: string;
};

export type WizardPageContext = {
  forStep: (
    title: string,
    currentStep: string,
    overrides?: WizardStepOverrides,
  ) => WidgetBaseOptions;
};

export function createWizardPageContext(options: WizardPageContextOptions): WizardPageContext {
  return {
    forStep: (title, currentStep, overrides = {}) => ({
      screen: options.screen,
      title,
      sidebarTitle: overrides.sidebarTitle ?? options.sidebarTitle,
      sidebarSubtitle: overrides.sidebarSubtitle ?? options.sidebarSubtitle,
      steps: options.steps,
      currentStep,
    }),
  };
}
