export default function isEqual(a, b) {
  if (a === b) return true;

  if (a == null || b == null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false;
    }

    return a.every((item, index) => isEqual(item, b[index]));
  }

  if (Array.isArray(b)) return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(
    (key) => Object.prototype.hasOwnProperty.call(b, key) && isEqual(a[key], b[key]),
  );
}
