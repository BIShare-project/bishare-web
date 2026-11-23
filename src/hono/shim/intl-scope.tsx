/** @jsxImportSource hono/jsx */
import { raw } from "hono/html";
import type { PropsWithChildren } from "hono/jsx";
import { withScope } from "../page-context";

/**
 * IntlScope at build time: the islands below it also get these namespaces, for the parts they load later in the
 * browser (next/dynamic) whose strings the first render never reads.
 */
export async function IntlScope({ namespaces, children }: PropsWithChildren<{ namespaces: readonly string[] }>) {
  return raw(await withScope(namespaces, async () => (await (<>{children}</>).toString()) as string));
}
