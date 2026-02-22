import { TuiKitError } from "../core/errors";
import type { WidgetBaseOptions } from "./types";
import { assertPaneBaseOptions, createPaneShell, paneSidebarContent } from "../surfaces";

export function assertWidgetBaseOptions(options: WidgetBaseOptions, component: string): void {
  assertPaneBaseOptions(options, component);
}

export function widgetSidebarContent(options: WidgetBaseOptions): string {
  return paneSidebarContent(options);
}

export function createWidgetShell(
  options: WidgetBaseOptions,
  footerText: string,
  contentScrollable = false,
) {
  assertWidgetBaseOptions(options, "widgets.shared.createWidgetShell");

  return createPaneShell({
    ...options,
    footerText,
    contentScrollable,
  });
}

export function cancelled(message: string): TuiKitError {
  return new TuiKitError("CANCELLED", message, {
    component: "widgets",
  });
}
