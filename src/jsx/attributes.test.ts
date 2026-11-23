import { describe, expect, it } from "vitest";
import { attributes } from "./attributes";

describe("attributes", () => {
  it("leaves out an attribute that is false", () => {
    expect(attributes("input", { autoFocus: false, disabled: false, maxLength: 1 })).toEqual({ maxLength: 1 });
  });

  it("keeps false for aria, data and the booleanish attributes", () => {
    const props = { "aria-pressed": false, "data-open": false, draggable: false, spellCheck: false, contentEditable: false };
    expect(attributes("div", props)).toEqual(props);
  });

  it("writes a true aria or data attribute as \"true\"", () => {
    expect(attributes("div", { "data-selected": true, "aria-hidden": true, hidden: true })).toEqual({ "data-selected": "true", "aria-hidden": "true", hidden: true });
  });

  it("leaves components alone", () => {
    const props = { open: false };
    expect(attributes(() => null, props)).toBe(props);
  });
});
