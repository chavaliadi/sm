import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes safely (later classes win over earlier conflicting
 * ones). Standard shadcn/ui utility — every component built with `npx shadcn
 * add <component>` expects this to exist at this exact path.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
