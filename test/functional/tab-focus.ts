// eslint-disable-next-line import/no-extraneous-dependencies
import { ClientFunction } from 'testcafe';
import { getEditorSelector } from './helpers';
import url from './helpers/getPageUrl';

fixture`HtmlEditor - tab focus`
  .page(url(__dirname, './example/index.html'));

const getActiveElementId = ClientFunction(() => (document.activeElement
  ? document.activeElement.id
  : null));

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
    .eql('updateSelection')
    .expect(editor.innerHTML)
    .eql('<p>Test</p>');
});
