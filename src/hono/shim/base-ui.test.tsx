/** @jsxImportSource hono/jsx */
import { describe, expect, it } from "vitest";
import { Button } from "./base-ui";

describe("Button", () => {
  it("marks a disabled button with data-disabled, as base-ui does", async () => {
    expect((await (<Button disabled>Go</Button>).toString()) as string).toBe('<button type="button" disabled="" data-disabled="">Go</button>');
  });

  it("adds nothing to an enabled button", async () => {
    expect((await (<Button>Go</Button>).toString()) as string).toBe('<button type="button">Go</button>');
  });
});
