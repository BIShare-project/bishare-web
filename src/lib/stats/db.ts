// The statistics database, as far as /stats reads it. The Worker's own types (server/types.ts) are not the pages'.
import { requestContext } from "@/site/request-context";

interface Statement {
  bind(...values: unknown[]): Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}

export const statsDb = () => requestContext().env.DB as { prepare(query: string): Statement };
