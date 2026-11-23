declare module "negotiator" {
  /** The part used here; the package ships no types. */
  export default class Negotiator {
    constructor(request: { headers: Record<string, string | undefined> });
    languages(): string[];
  }
}
