// Tiny classname combiner - filters falsy values, no external dependency needed.
export const cn = (...classes) => classes.filter(Boolean).join(' ');
