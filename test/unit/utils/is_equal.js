import isEqual from '../../../utils/is_equal';

describe('isEqual', function () {
  it('should return true for same primitive values', function () {
    expect(isEqual(1, 1)).toBeTrue();
    expect(isEqual('test', 'test')).toBeTrue();
    expect(isEqual(true, true)).toBeTrue();
  });

  it('should return false for different primitive values', function () {
    expect(isEqual(1, 2)).toBeFalse();
    expect(isEqual('a', 'b')).toBeFalse();
    expect(isEqual(true, false)).toBeFalse();
  });

  it('should return true for null compared to null', function () {
    expect(isEqual(null, null)).toBeTrue();
  });

  it('should return false if one is null and the other is not', function () {
    expect(isEqual(null, {})).toBeFalse();
    expect(isEqual([], null)).toBeFalse();
  });

  it('should return true for equal arrays', function () {
    expect(isEqual([1, 2, 3], [1, 2, 3])).toBeTrue();
    expect(isEqual([], [])).toBeTrue();
  });

  it('should return false for different arrays', function () {
    expect(isEqual([1, 2], [1, 2, 3])).toBeFalse();
    expect(isEqual([1, 2, 3], [3, 2, 1])).toBeFalse();
  });

  it('should return true for equal flat objects', function () {
    expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBeTrue();
  });

  it('should return false for objects with different keys or values', function () {
    expect(isEqual({ a: 1 }, { a: 2 })).toBeFalse();
    expect(isEqual({ a: 1 }, { b: 1 })).toBeFalse();
  });

  it('should return true for deeply equal nested objects', function () {
    const a = { x: { y: [1, 2, 3] } };
    const b = { x: { y: [1, 2, 3] } };
    expect(isEqual(a, b)).toBeTrue();
  });

  it('should return false for nested objects with different values', function () {
    const a = { x: { y: [1, 2, 3] } };
    const b = { x: { y: [1, 2, 4] } };
    expect(isEqual(a, b)).toBeFalse();
  });

  it('should return false if types mismatch', function () {
    expect(isEqual({ a: 1 }, [1])).toBeFalse();
    expect(isEqual({}, 'a')).toBeFalse();
  });
});
