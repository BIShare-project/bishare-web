import { describe, expect, it } from "vitest";
import { serverProps } from "./server-props";

describe("serverProps", () => {
  it("leaves out an attribute that is false, as React does", () => {
    expect(serverProps("input", { autoFocus: false, disabled: false, maxLength: 1 })).toEqual({ maxLength: 1 });
  });

  it("keeps false where React writes it: aria, data and the booleanish attributes", () => {
    const props = { "aria-pressed": false, "data-open": false, draggable: false, spellCheck: false, contentEditable: false };
    expect(serverProps("div", props)).toEqual(props);
  });

  it("writes a true aria or data attribute as \"true\"", () => {
    expect(serverProps("div", { "data-selected": true, "aria-hidden": true, hidden: true })).toEqual({ "data-selected": "true", "aria-hidden": "true", hidden: true });
  });

  it("leaves components alone", () => {
    const props = { open: false };
    expect(serverProps(() => null, props)).toBe(props);
  });
});
