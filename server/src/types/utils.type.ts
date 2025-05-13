/**
 * Utility type that replaces specific properties in type `T` with the corresponding
 * properties in type `R`. Useful for adjusting a subset of fields in an existing type.
 *
 * @template {T} - The original base type.
 * @template {R} - An object type whose keys extend the keys of `T` and whose values override the corresponding properties in `T`.
 *
 * @example
 * type Original = { id: number; name: string };
 * type Modified = Replace<Original, { id: string }>;
 * // Result: { id: string; name: string }
 */
export type Replace<T, R extends Partial<Record<keyof T, any>>> = Omit<
  T,
  keyof R
> &
  R;
