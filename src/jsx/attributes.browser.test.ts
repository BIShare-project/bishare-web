import { describe, expect, it, vi } from "vitest";
import { attributes } from "./attributes.browser";

const f = () => {};

describe("attributes", () => {
  it("writes boolean aria attributes", () => {
    expect(attributes("button", { "aria-pressed": false, "aria-expanded": true })).toEqual({ "aria-pressed": "false", "aria-expanded": "true" });
  });

  it("writes boolean data attributes", () => {
    expect(attributes("div", { "data-selected": true, "data-open": false })).toEqual({ "data-selected": "true", "data-open": "false" });
  });

  it("leaves other booleans to the runtime", () => {
    expect(attributes("button", { disabled: false, hidden: true })).toEqual({ disabled: false, hidden: true });
  });

  it("fires onChange of text fields, sliders and text areas on every input", () => {
    expect(attributes("input", { type: "email", onChange: f })).toEqual({ type: "email", onInput: f });
    expect(attributes("input", { onChange: f })).toEqual({ onInput: f });
    expect(attributes("input", { type: "range", onChange: f })).toEqual({ type: "range", onInput: f });
    expect(attributes("textarea", { onChange: f })).toEqual({ onInput: f });
  });

  it("keeps onChange where the change event is the one wanted", () => {
    for (const type of ["checkbox", "radio", "file"]) expect(attributes("input", { type, onChange: f })).toEqual({ type, onChange: f });
    expect(attributes("select", { onChange: f })).toEqual({ onChange: f });
  });

  it("focuses an autoFocus element once it is in the page, keeping its own ref", async () => {
    const own = { current: null as unknown };
    const p = attributes("input", { autoFocus: true, ref: own }) as { ref: (el: unknown) => void; autoFocus?: boolean };
    expect(p.autoFocus).toBeUndefined();
    let focused = 0;
    const el = { focus: () => focused++ };
    p.ref(el);
    expect(own.current).toBe(el);
    // The element is not in the page yet when its ref is called.
    expect(focused).toBe(0);
    await Promise.resolve();
    expect(focused).toBe(1);
  });

  it("focuses an element only the first time, not on every render", async () => {
    let focused = 0;
    const el = { focus: () => focused++ };
    for (let i = 0; i < 3; i++) (attributes("input", { autoFocus: true }) as { ref: (el: unknown) => void }).ref(el);
    await Promise.resolve();
    expect(focused).toBe(1);
  });

  it("drops autoFocus={false}", () => {
    expect(attributes("input", { autoFocus: false })).toEqual({});
  });

  it("puts a controlled field back to its value when the change did not move it", async () => {
    vi.useFakeTimers();
    const el = { value: "!" } as { value: string };
    const p = attributes("input", { value: "", onChange: () => {} }) as { ref: (el: unknown) => void; onInput: (e: unknown) => void };
    p.ref(el);
    p.onInput({ currentTarget: el });
    await vi.runAllTimersAsync();
    expect(el.value).toBe("");
    vi.useRealTimers();
  });

  it("leaves a controlled field alone when its new value has been rendered", async () => {
    vi.useFakeTimers();
    const el = { value: "ab" } as { value: string };
    const first = attributes("input", { value: "a", onChange: () => {} }) as { ref: (el: unknown) => void; onInput: (e: unknown) => void };
    first.ref(el);
    first.onInput({ currentTarget: el });
    // The re-render with the new value, before the check runs.
    (attributes("input", { value: "ab", onChange: () => {} }) as { ref: (el: unknown) => void }).ref(el);
    await vi.runAllTimersAsync();
    expect(el.value).toBe("ab");
    vi.useRealTimers();
  });

  it("listens to the browser's dblclick for onDoubleClick", () => {
    const f = () => {};
    const out = attributes("div", { onDoubleClick: f });
    expect(out.onDblClick).toBe(f);
    expect(out.onDoubleClick).toBeUndefined();
  });

  it("leaves components alone", () => {
    const props = { "aria-pressed": false, onChange: f };
    expect(attributes(() => null, props)).toBe(props);
  });
});
