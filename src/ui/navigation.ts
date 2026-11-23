/** Moving on, for components that do it from code. While a page is built nothing moves. */
const never = () => {
  throw new Error("navigation while building a page");
};
export const useRouter = () => ({ push: never as (href: string) => void, replace: never as (href: string) => void, refresh: never as () => void });
