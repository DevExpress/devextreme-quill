import Quill from '../../../core/quill';

function createClassDataBlot(BaseBlot, tagName) {
  return class ClassDataBlot extends BaseBlot {
    static create(value) {
      const node = super.create(value);
      if (value && value.customClass) node.className = value.customClass;
      if (value && value.customData) node.dataset.test = value.customData;
      return node;
    }

    static formats(node) {
      if (node.tagName !== tagName) return false;

      const formats = {};
      if (node.className) formats.customClass = node.className;
      if (node.dataset.test) formats.customData = node.dataset.test;

      return formats;
    }
  };
}

describe('Custom class/data blots', function () {
  const InlineBlot = Quill.import('blots/inline');
  const BlockBlot = Quill.import('blots/block');

  const ClassInline = createClassDataBlot(InlineBlot, 'SPAN');
  ClassInline.tagName = 'SPAN';

  const ClassBlock = createClassDataBlot(BlockBlot, 'P');
  ClassBlock.tagName = 'P';

  it('Inline: create() applies class and data; formats() extracts them back', function () {
    const node = ClassInline.create({ customClass: 'testClass', customData: 'testData' });

    expect(node.outerHTML).toEqualHTML('<span class="testClass" data-test="testData"></span>');
    expect(ClassInline.formats(node)).toEqual({ customClass: 'testClass', customData: 'testData' });
  });

  it('Block: create() applies class and data; formats() extracts them back', function () {
    const node = ClassBlock.create({ customClass: 'testClass', customData: 'testData' });

    expect(node.outerHTML).toEqualHTML(
      '<p class="testClass" data-test="testData"></p>',
    );

    expect(ClassBlock.formats(node)).toEqual({
      customClass: 'testClass',
      customData: 'testData',
    });
  });

  it('formats() returns false for unexpected tags', function () {
    const div = document.createElement('div');
    div.className = 'testClass';
    div.dataset.test = 'testData';

    expect(ClassInline.formats(div)).toBe(false);

    const span = document.createElement('span');
    span.className = 'testClass';
    span.dataset.test = 'testData';

    expect(ClassBlock.formats(span)).toBe(false);
  });
});
