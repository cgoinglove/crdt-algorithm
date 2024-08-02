export const noop = () => {};

export const createIncrement =
  (start = 0) =>
  () =>
    start++;

export const autoIncrement = createIncrement();
