import sanitizeSvg from '../../../utils/sanitize_svg';

describe('sanitizeSvg', function () {
  it('should return null for non-SVG root', function () {
    const input = '<div><span>Test</span></div>';

    expect(sanitizeSvg(input)).toBeNull();
  });

  it('should keep allowed svg structure', function () {
    const input = '<svg><g><circle cx="10" cy="10" r="5"></circle></g></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    const circle = doc.querySelector('circle');

    expect(output).not.toBeNull();
    expect(circle).not.toBeNull();
    expect(circle.getAttribute('cx')).toEqual('10');
    expect(circle.getAttribute('r')).toEqual('5');
  });

  it('should remove banned and unknown tags', function () {
    const input = '<svg><script>alert(1)</script><unknown><circle cx="1" cy="1" r="1" /></unknown><circle cx="2" cy="2" r="2" /></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');

    expect(doc.querySelector('script')).toBeNull();
    expect(doc.querySelector('unknown')).toBeNull();
    expect(doc.querySelectorAll('circle').length).toEqual(1);
  });

  it('should remove banned attributes', function () {
    const input = '<svg foo="bar"><g bar="foo" custom="x"><circle cx="5" cy="5" r="2" bad="yes" /></g></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    const svg = doc.documentElement;
    const g = doc.querySelector('g');
    const circle = doc.querySelector('circle');

    expect(svg.hasAttribute('foo')).toBeFalse();
    expect(g.hasAttribute('bar')).toBeFalse();
    expect(g.hasAttribute('custom')).toBeFalse();
    expect(circle.hasAttribute('bad')).toBeFalse();
    expect(circle.getAttribute('cx')).toEqual('5');
  });

  it('should strip event handler attributes', function () {
    const input = '<svg><g onclick="alert(1)"><circle onmouseover="alert(2)" cx="3" cy="3" r="1" /></g></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    const g = doc.querySelector('g');
    const circle = doc.querySelector('circle');

    expect(g.hasAttribute('onclick')).toBeFalse();
    expect(circle.hasAttribute('onmouseover')).toBeFalse();
  });

  it('should keep safe href (#anchor)', function () {
    const input = '<svg><a href="#anchor"><text>Link</text></a></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    const a = doc.querySelector('a');

    expect(a.getAttribute('href')).toEqual('#anchor');
  });

  it('should keep data:image href and remove others (data, http, https, javascript)', function () {
    const input = '<svg>'
      + '<a id="a1" href="data:image/png;base64,AAAA" />'
      + '<a id="a2" href="data:text/plain;base64,BBBB" />'
      + '<a id="a3" href="http://example.com" />'
      + '<a id="a4" href="https://example.com" />'
      + '<a id="a5" href="javascript:alert(1)" />'
      + '</svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    const a1 = doc.getElementById('a1');
    const a2 = doc.getElementById('a2');
    const a3 = doc.getElementById('a3');
    const a4 = doc.getElementById('a4');
    const a5 = doc.getElementById('a5');

    expect(a1.getAttribute('href')).toEqual('data:image/png;base64,AAAA');
    expect(a2.hasAttribute('href')).toBeFalse();
    expect(a3.hasAttribute('href')).toBeFalse();
    expect(a4.hasAttribute('href')).toBeFalse();
    expect(a5.hasAttribute('href')).toBeFalse();
  });

  it('should sanitize nested structure recursively', function () {
    const input = '<svg><g><g><script>alert(1)</script><circle cx="1" cy="1" r="1" onclick="foo()" /></g></g></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    const circle = doc.querySelector('circle');

    expect(doc.querySelector('script')).toBeNull();
    expect(circle).not.toBeNull();
    expect(circle.hasAttribute('onclick')).toBeFalse();
  });

  it('should preserve allowed attributes (fill, stroke, transform, id)', function () {
    const input = '<svg id="root" viewBox="0 0 10 10" foo="bar"><g id="grp" transform="translate(1,1)" bar="baz"><path id="p1" d="M0 0 L5 5" fill="#fff" stroke="#000" stroke-width="2" custom="x" /></g></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    const svg = doc.documentElement;
    const g = doc.getElementById('grp');
    const path = doc.getElementById('p1');

    expect(svg.getAttribute('id')).toEqual('root');
    expect(svg.hasAttribute('foo')).toBeFalse();
    expect(g.getAttribute('transform')).toEqual('translate(1,1)');
    expect(g.hasAttribute('bar')).toBeFalse();
    expect(path.getAttribute('fill')).toEqual('#fff');
    expect(path.getAttribute('stroke')).toEqual('#000');
    expect(path.getAttribute('stroke-width')).toEqual('2');
    expect(path.hasAttribute('custom')).toBeFalse();
  });

  it('should treat attribute names as case-sensitive and drop uppercased ones', function () {
    const input = '<svg><circle CX="10" cy="11" R="5" r="6" FILL="red" fill="blue"></circle></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');
    const circle = doc.querySelector('circle');

    expect(circle.hasAttribute('CX')).toBeFalse();
    expect(circle.getAttribute('cy')).toEqual('11');
    expect(circle.hasAttribute('R')).toBeFalse();
    expect(circle.getAttribute('r')).toEqual('6');
    expect(circle.hasAttribute('FILL')).toBeFalse();
    expect(circle.getAttribute('fill')).toEqual('blue');
  });

  it('should return null for empty or whitespace-only input', function () {
    expect(sanitizeSvg('')).toBeNull();
    expect(sanitizeSvg('   ')).toBeNull();
  });

  it('should remove banned tag even if attributes are safe', function () {
    const input = '<svg><defs><path id="icon" d="M0 0 L1 1" /></defs><use href="#icon" x="0" y="0" /></svg>';

    const output = sanitizeSvg(input);

    const doc = new DOMParser().parseFromString(output, 'image/svg+xml');

    expect(doc.querySelector('defs path')).not.toBeNull();
    expect(doc.querySelector('use')).toBeNull();
  });
});
