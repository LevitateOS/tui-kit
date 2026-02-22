import { describe, expect, it } from "bun:test";
import { createWizardPageContext } from "../src/pages/wizard-context";
import { pageClampIndex, renderPageCard, truncatePageLine } from "../src/pages/shared";

describe("pages helpers", () => {
  it("clamps selected index within bounds", () => {
    expect(pageClampIndex(-1, 3)).toBe(0);
    expect(pageClampIndex(10, 3)).toBe(2);
    expect(pageClampIndex(1, 3)).toBe(1);
  });

  it("truncates lines with ellipsis", () => {
    expect(truncatePageLine("abcdef", 4)).toBe("a...");
    expect(truncatePageLine("ab", 4)).toBe("ab");
  });

  it("renders selected card marker", () => {
    const rendered = renderPageCard(
      {
        title: "Disk",
        lines: ["line"],
      },
      true,
      24,
    );
    expect(rendered.includes("> Disk")).toBe(true);
    expect(rendered.includes("Disk")).toBe(true);
  });

  it("builds wizard step options from context", () => {
    const context = createWizardPageContext({
      screen: {} as any,
      steps: [{ id: "disk", label: "Disk" }],
      sidebarTitle: "recpart",
      sidebarSubtitle: "workflow",
    });

    const options = context.forStep("Setup", "disk", { sidebarSubtitle: "disk step" });
    expect(options.title).toBe("Setup");
    expect(options.currentStep).toBe("disk");
    expect(options.sidebarTitle).toBe("recpart");
    expect(options.sidebarSubtitle).toBe("disk step");
  });
});
