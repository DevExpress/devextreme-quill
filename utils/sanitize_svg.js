export const allowedTags = Object.freeze([
  'svg',
  'a',
  'altglyph',
  'altglyphdef',
  'altglyphitem',
  'animatecolor',
  'animatemotion',
  'animatetransform',
  'circle',
  'clippath',
  'defs',
  'desc',
  'ellipse',
  'enterkeyhint',
  'exportparts',
  'filter',
  'font',
  'g',
  'glyph',
  'glyphref',
  'hkern',
  'image',
  'inputmode',
  'line',
  'lineargradient',
  'marker',
  'mask',
  'metadata',
  'mpath',
  'part',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialgradient',
  'rect',
  'slot',
  'stop',
  'style',
  'switch',
  'symbol',
  'text',
  'textpath',
  'title',
  'tref',
  'tspan',
  'view',
  'vkern',
]);

export const allowedAttributes = Object.freeze([
  'accent-height',
  'accumulate',
  'additive',
  'alignment-baseline',
  'amplitude',
  'ascent',
  'attributename',
  'attributetype',
  'azimuth',
  'basefrequency',
  'baseline-shift',
  'begin',
  'bias',
  'by',
  'class',
  'clip',
  'clippathunits',
  'clip-path',
  'clip-rule',
  'color',
  'color-interpolation',
  'color-interpolation-filters',
  'color-profile',
  'color-rendering',
  'cx',
  'cy',
  'd',
  'dx',
  'dy',
  'diffuseconstant',
  'direction',
  'display',
  'divisor',
  'dur',
  'edgemode',
  'elevation',
  'end',
  'exponent',
  'fill',
  'fill-opacity',
  'fill-rule',
  'filter',
  'filterunits',
  'flood-color',
  'flood-opacity',
  'font-family',
  'font-size',
  'font-size-adjust',
  'font-stretch',
  'font-style',
  'font-variant',
  'font-weight',
  'fx',
  'fy',
  'g1',
  'g2',
  'glyph-name',
  'glyphref',
  'gradientunits',
  'gradienttransform',
  'height',
  'href',
  'id',
  'image-rendering',
  'in',
  'in2',
  'intercept',
  'k',
  'k1',
  'k2',
  'k3',
  'k4',
  'kerning',
  'keypoints',
  'keysplines',
  'keytimes',
  'lang',
  'lengthadjust',
  'letter-spacing',
  'kernelmatrix',
  'kernelunitlength',
  'lighting-color',
  'local',
  'marker-end',
  'marker-mid',
  'marker-start',
  'markerheight',
  'markerunits',
  'markerwidth',
  'maskcontentunits',
  'maskunits',
  'max',
  'mask',
  'media',
  'method',
  'mode',
  'min',
  'name',
  'numoctaves',
  'offset',
  'operator',
  'opacity',
  'order',
  'orient',
  'orientation',
  'origin',
  'overflow',
  'paint-order',
  'path',
  'pathlength',
  'patterncontentunits',
  'patterntransform',
  'patternunits',
  'points',
  'preservealpha',
  'preserveaspectratio',
  'primitiveunits',
  'r',
  'rx',
  'ry',
  'radius',
  'refx',
  'refy',
  'repeatcount',
  'repeatdur',
  'restart',
  'result',
  'rotate',
  'scale',
  'seed',
  'shape-rendering',
  'slope',
  'specularconstant',
  'specularexponent',
  'spreadmethod',
  'startoffset',
  'stddeviation',
  'stitchtiles',
  'stop-color',
  'stop-opacity',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke',
  'stroke-width',
  'style',
  'surfacescale',
  'systemlanguage',
  'tabindex',
  'tablevalues',
  'targetx',
  'targety',
  'transform',
  'transform-origin',
  'text-anchor',
  'text-decoration',
  'text-rendering',
  'textlength',
  'type',
  'u1',
  'u2',
  'unicode',
  'values',
  'viewbox',
  'visibility',
  'version',
  'vert-adv-y',
  'vert-origin-x',
  'vert-origin-y',
  'width',
  'word-spacing',
  'wrap',
  'writing-mode',
  'xchannelselector',
  'ychannelselector',
  'x',
  'x1',
  'x2',
  'xmlns',
  'y',
  'y1',
  'y2',
  'z',
  'zoomandpan',
  'xlink:href',
  'xml:id',
  'xlink:title',
  'xml:space',
  'xmlns:xlink',
]);

function isSafeUrl(value) {
  if (!value) return false;

  const lower = value.trim().toLowerCase();

  if (
    lower.startsWith('#')
    || lower.startsWith('data:image/')
  ) {
    return true;
  }

  if (
    // eslint-disable-next-line no-script-url
    lower.startsWith('javascript:')
    || lower.startsWith('vbscript:')
    || lower.startsWith('data:')
    || lower.startsWith('http:')
    || lower.startsWith('https:')
  ) {
    return false;
  }

  return true;
}

function sanitizeNode(node) {
  const tagName = node.tagName.toLowerCase();

  if (!allowedTags.includes(tagName)) {
    node.remove();
    return;
  }

  [...node.attributes].forEach((attr) => {
    const { name, value } = attr;

    const normalizedName = name.toLowerCase();

    if (!allowedAttributes.includes(normalizedName)) {
      node.removeAttribute(name);
      return;
    }

    if (normalizedName.startsWith('on')) {
      node.removeAttribute(name);
      return;
    }

    if ((normalizedName === 'href' || normalizedName === 'xlink:href') && !isSafeUrl(value)) {
      node.removeAttribute(name);
    }
  });

  [...node.children].forEach((child) => sanitizeNode(child));
}

export default function sanitizeSvg(svgString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');

  const svgElement = doc.documentElement;

  if (!svgElement || svgElement.tagName.toLowerCase() !== 'svg') {
    return null;
  }

  sanitizeNode(svgElement);

  return svgElement.outerHTML;
}
