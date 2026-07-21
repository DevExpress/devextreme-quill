// eslint-disable-next-line import/no-extraneous-dependencies
import { ClientFunction } from 'testcafe';
import { getEditorSelector } from './helpers';
import url from './helpers/getPageUrl';

const getActiveElementId = ClientFunction(() => (document.activeElement
  ? document.activeElement.id
  : null));

fixture`HtmlEditor - tab focus (default inlineTabInsertion: true)`
  .page(url(__dirname, './example/index.html'));

test('Tab in plain text is trapped by default and inserts a tab character', async (t) => {
  const editor = getEditorSelector('.ql-editor');

  await t
    .typeText(editor, 'Test')
    .pressKey('tab')
    .expect(getActiveElementId())
    .notEql('after-editor')
    .expect(editor.innerHTML)
    .eql('<p>Test\t</p>');
});

test('Shift+Tab in plain text moves focus to the previous element (unaffected by inlineTabInsertion)', async (t) => {
  const editor = getEditorSelector('.ql-editor');

  await t
    .typeText(editor, 'Test')
    .pressKey('shift+tab')
    .expect(getActiveElementId())
    .eql('before-editor')
    .expect(editor.innerHTML)
    .eql('<p>Test</p>');
});

fixture`HtmlEditor - tab focus (inlineTabInsertion: false)`
  .page(`${url(__dirname, './example/index.html')}?inlineTabInsertion=false`);

test('Tab in plain text moves focus to the next element instead of being trapped', async (t) => {
  const editor = getEditorSelector('.ql-editor');

  await t
    .typeText(editor, 'Test')
    .pressKey('tab')
    .expect(getActiveElementId())
    .eql('after-editor')
    .expect(editor.innerHTML)
    .eql('<p>Test</p>');
});

test('Shift+Tab in plain text moves focus to the previous element instead of being trapped', async (t) => {
  const editor = getEditorSelector('.ql-editor');

  await t
    .typeText(editor, 'Test')
    .pressKey('shift+tab')
    .expect(getActiveElementId())
    .eql('before-editor')
    .expect(editor.innerHTML)
    .eql('<p>Test</p>');
});
