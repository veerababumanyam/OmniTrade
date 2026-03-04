/**
 * Classnames utility - A clsx-style classnames merger
 * Combines multiple class inputs into a single className string
 */

type ClassValue =
  | string
  | undefined
  | null
  | false
  | Record<string, boolean>
  | ClassValue[];

/**
 * Converts a class value to a string array
 */
function flattenClassValue(value: ClassValue): string[] {
  if (typeof value === 'string') {
    return value.trim() ? [value.trim()] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((v) => flattenClassValue(v));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.entries(value)
      .filter(([, condition]) => Boolean(condition))
      .map(([className]) => className);
  }

  return [];
}

/**
 * Combines multiple class names into a single string.
 * Supports strings, conditionals via objects, arrays, and falsy values.
 *
 * @param inputs - Class values to combine
 * @returns Combined className string
 *
 * @example
 * cn('foo', 'bar') // 'foo bar'
 * cn('foo', { bar: true, baz: false }) // 'foo bar'
 * cn('foo', undefined, null, false, 'bar') // 'foo bar'
 * cn(['foo', 'bar'], 'baz') // 'foo bar baz'
 */
export function cn(
  ...inputs: (string | undefined | null | false | Record<string, boolean>)[]
): string {
  const classes: string[] = [];

  for (const input of inputs) {
    const flattened = flattenClassValue(input);
    classes.push(...flattened);
  }

  // Deduplicate and join
  return [...new Set(classes)].join(' ');
}

export default cn;
