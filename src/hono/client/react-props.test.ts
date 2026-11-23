import { describe, expect, it, vi } from "vitest";
import { reactProps } from "./react-props";

const f = () => {};

describe("reactProps", () => {
  it("writes boolean aria attributes as React does", () => {
    expect(reactProps("button", { "aria-pressed": false, "aria-expanded": true })).toEqual({ "aria-pressed": "false", "aria-expanded": "true" });
  });

  it("leaves other booleans to the runtime", () => {
    expect(reactProps("button", { disabled: false, hidden: true })).toEqual({ disabled: false, hidden: true });
  });

  it("fires onChange of text fields, sliders and text areas on every input, as React does", () => {
    expect(reactProps("input", { type: "email", onChange: f })).toEqual({ type: "email", onInput: f });
    expect(reactProps("input", { onChange: f })).toEqual({ onInput: f });
    expect(reactProps("input", { type: "range", onChange: f })).toEqual({ type: "range", onInput: f });
    expect(reactProps("textarea", { onChange: f })).toEqual({ onInput: f });
  });

  it("keeps onChange where the browser's change event is already React's", () => {
    for (const type of ["checkbox", "radio", "file"]) expect(reactProps("input", { type, onChange: f })).toEqual({ type, onChange: f });
    expect(reactProps("select", { onChange: f })).toEqual({ onChange: f });
  });

  it("focuses an autoFocus element once it is in the page, keeping its own ref", () => {
    const own = { current: null as unknown };
    const p = reactProps("input", { autoFocus: true, ref: own }) as { ref: (el: unknown) => void; autoFocus?: boolean };
    expect(p.autoFocus).toBeUndefined();
    let focused = 0;
    const el = { focus: () => focused++ };
    p.ref(el);
    expect(own.current).toBe(el);
    expect(focused).toBe(1);
  });

  it("focuses an element only the first time, not on every render", () => {
    let focused = 0;
    const el = { focus: () => focused++ };
    for (let i = 0; i < 3; i++) (reactProps("input", { autoFocus: true }) as { ref: (el: unknown) => void }).ref(el);
    expect(focused).toBe(1);
  });

  it("drops autoFocus={false}", () => {
    expect(reactProps("input", { autoFocus: false })).toEqual({});
  });

  it("puts a controlled field back to its value when the change did not move it, as React does", async () => {
    vi.useFakeTimers();
    const el = { value: "!" } as { value: string };
    const p = reactProps("input", { value: "", onChange: () => {} }) as { ref: (el: unknown) => void; onInput: (e: unknown) => void };
    p.ref(el);
    p.onInput({ currentTarget: el });
    await vi.runAllTimersAsync();
    expect(el.value).toBe("");
    vi.useRealTimers();
  });

  it("leaves a controlled field alone when its new value has been rendered", async () => {
    vi.useFakeTimers();
    const el = { value: "ab" } as { value: string };
    const first = reactProps("input", { value: "a", onChange: () => {} }) as { ref: (el: unknown) => void; onInput: (e: unknown) => void };
    first.ref(el);
    first.onInput({ currentTarget: el });
    // The re-render with the new value, before the check runs.
    (reactProps("input", { value: "ab", onChange: () => {} }) as { ref: (el: unknown) => void }).ref(el);
    await vi.runAllTimersAsync();
    expect(el.value).toBe("ab");
    vi.useRealTimers();
  });

  it("leaves components alone", () => {
    const props = { "aria-pressed": false, onChange: f };
    expect(reactProps(() => null, props)).toBe(props);
  });
});
