/** Join class names into a single string, filtered of falsy values. */
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}
