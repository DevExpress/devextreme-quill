// eslint-disable-next-line import/no-extraneous-dependencies
import hljs from 'highlight.js';
import Delta from 'quill-delta';
import Quill from '../../../core/quill';
import BoldBlot from '../../../formats/bold';
import CodeBlock, { CodeBlockContainer } from '../../../formats/code';
import Syntax, { CodeBlock as SyntaxCodeBlock } from '../../../modules/syntax';

const HIGHLIGHT_INTERVAL = 10;

describe('Syntax', function () {
  beforeAll(function () {
    Syntax.register();
    Syntax.DEFAULTS.languages = [
      { key: 'javascript', label: 'Javascript' },
      { key: 'ruby', label: 'Ruby' },
    ];
  });

  afterAll(function () {
    Quill.register(CodeBlock, true);
    Quill.register(CodeBlockContainer, true);
  });

  function initializeQuill(codeBlockText) {
    const codeBlockMarkup = codeBlockText ?? 'var test = 1;<br>var bugz = 0;<br>';
    const container = this.initialize(
      HTMLElement,
      `<pre data-language="javascript">${codeBlockMarkup}</pre>
      <p><br></p>`,
    );
    this.quill = new Quill(container, {
      modules: {
        syntax: {
          hljs,
          interval: HIGHLIGHT_INTERVAL,
        },
      },
    });
  }

  describe('highlightjs api', function () {
    it('logs no deprecation warning after code-block is applied (T1247520)', function (done) {
      const consoleSpy = spyOn(console, 'log');

      initializeQuill.call(this);

      setTimeout(() => {
        const logArgs = consoleSpy.calls.allArgs();
        expect(consoleSpy)
          .withContext(`console.log was called with "${logArgs}"`)
          .not.toHaveBeenCalled();
        consoleSpy.calls.reset();
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('works with no errors if old version of highlightjs is used', function (done) {
      const { versionString } = hljs;
      const initialCodeBlockText = 'my text\n';

      hljs.versionString = '10.1.4';
      const highlightSpy = spyOn(hljs, 'highlight');

      initializeQuill.call(this, initialCodeBlockText);

      setTimeout(() => {
        expect(highlightSpy).toHaveBeenCalledWith('javascript', initialCodeBlockText);
        hljs.versionString = versionString;
        highlightSpy.calls.reset();
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('uses modern api for new versions', function (done) {
      const { versionString } = hljs;
      const initialCodeBlockText = 'my text\n';

      hljs.versionString = '12.1.1';
      const highlightSpy = spyOn(hljs, 'highlight');

      initializeQuill.call(this, initialCodeBlockText);

      setTimeout(() => {
        expect(highlightSpy).toHaveBeenCalledWith(initialCodeBlockText, { language: 'javascript' });
        hljs.versionString = versionString;
        highlightSpy.calls.reset();
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });
  });

  describe('highlighting', function () {
    beforeEach(function () {
      initializeQuill.call(this);
    });

    it('initialize', function () {
      expect(this.quill.root).toEqualHTML(
        `<div class="ql-code-block-container" spellcheck="false">
          <div class="ql-code-block" data-language="javascript">var test = 1;</div>
          <div class="ql-code-block" data-language="javascript">var bugz = 0;</div>
        </div>
        <p><br></p>`,
      );
      expect(this.quill.getContents()).toEqual(
        new Delta()
          .insert('var test = 1;')
          .insert('\n', { 'code-block': 'javascript' })
          .insert('var bugz = 0;')
          .insert('\n', { 'code-block': 'javascript' })
          .insert('\n'),
      );
    });

    it('adds token', function (done) {
      setTimeout(() => {
        expect(this.quill.root).toEqualHTML(
          `<div class="ql-code-block-container" spellcheck="false">
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> test = <span class="ql-token hljs-number">1</span>;</div>
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> bugz = <span class="ql-token hljs-number">0</span>;</div>
          </div>
          <p><br></p>`,
        );
        expect(this.quill.getContents()).toEqual(
          new Delta()
            .insert('var test = 1;')
            .insert('\n', { 'code-block': 'javascript' })
            .insert('var bugz = 0;')
            .insert('\n', { 'code-block': 'javascript' })
            .insert('\n'),
        );
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('tokens do not escape', function (done) {
      this.quill.deleteText(22, 6);
      setTimeout(() => {
        expect(this.quill.root).toEqualHTML(`
          <div class="ql-code-block-container" spellcheck="false">
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> test = <span class="ql-token hljs-number">1</span>;</div>
          </div>
          <p>var bugz</p>`);
        expect(this.quill.getContents()).toEqual(
          new Delta()
            .insert('var test = 1;')
            .insert('\n', { 'code-block': 'javascript' })
            .insert('var bugz\n'),
        );
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('change language', function (done) {
      this.quill.formatLine(0, 20, 'code-block', 'ruby');
      setTimeout(() => {
        expect(this.quill.root).toEqualHTML(`
          <div class="ql-code-block-container" spellcheck="false">
            <div class="ql-code-block" data-language="ruby">var test = <span class="ql-token hljs-number">1</span>;</div>
            <div class="ql-code-block" data-language="ruby">var bugz = <span class="ql-token hljs-number">0</span>;</div>
          </div>
          <p><br></p>`);
        expect(this.quill.getContents()).toEqual(
          new Delta()
            .insert('var test = 1;')
            .insert('\n', { 'code-block': 'ruby' })
            .insert('var bugz = 0;')
            .insert('\n', { 'code-block': 'ruby' })
            .insert('\n'),
        );
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('invalid language', function (done) {
      this.quill.formatLine(0, 20, 'code-block', 'invalid');
      setTimeout(() => {
        expect(this.quill.root).toEqualHTML(`
          <div class="ql-code-block-container" spellcheck="false">
            <div class="ql-code-block" data-language="plain">var test = 1;</div>
            <div class="ql-code-block" data-language="plain">var bugz = 0;</div>
          </div>
          <p><br></p>`);
        expect(this.quill.getContents()).toEqual(
          new Delta()
            .insert('var test = 1;')
            .insert('\n', { 'code-block': 'plain' })
            .insert('var bugz = 0;')
            .insert('\n', { 'code-block': 'plain' })
            .insert('\n'),
        );
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('unformat first line', function (done) {
      this.quill.formatLine(0, 1, 'code-block', false);
      setTimeout(() => {
        expect(this.quill.root).toEqualHTML(`
          <p>var test = 1;</p>
          <div class="ql-code-block-container" spellcheck="false">
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> bugz = <span class="ql-token hljs-number">0</span>;</div>
          </div>
          <p><br></p>`);
        expect(this.quill.getContents()).toEqual(
          new Delta()
            .insert('var test = 1;\nvar bugz = 0;')
            .insert('\n', { 'code-block': 'javascript' })
            .insert('\n'),
        );
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('split container', function (done) {
      this.quill.updateContents(new Delta().retain(14).insert('\n'));
      setTimeout(() => {
        expect(this.quill.root).toEqualHTML(
          `
          <div class="ql-code-block-container" spellcheck="false">
            <select class="ql-ui" contenteditable="false">
              <option value="javascript">Javascript</option>
              <option value="ruby">Ruby</option>
            </select>
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> test = <span class="ql-token hljs-number">1</span>;</div>
          </div>
          <p><br></p>
          <div class="ql-code-block-container" spellcheck="false">
            <select class="ql-ui" contenteditable="false">
              <option value="javascript">Javascript</option>
              <option value="ruby">Ruby</option>
            </select>
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> bugz = <span class="ql-token hljs-number">0</span>;</div>
          </div>
          <p><br></p>`,
          false,
          false,
        );
        expect(this.quill.getContents()).toEqual(
          new Delta()
            .insert('var test = 1;')
            .insert('\n', { 'code-block': 'javascript' })
            .insert('\nvar bugz = 0;')
            .insert('\n', { 'code-block': 'javascript' })
            .insert('\n'),
        );
        done();
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('merge containers', function (done) {
      this.quill.updateContents(new Delta().retain(14).insert('\n'));
      setTimeout(() => {
        this.quill.deleteText(14, 1);
        setTimeout(() => {
          expect(this.quill.root).toEqualHTML(
            `
            <div class="ql-code-block-container" spellcheck="false">
              <select class="ql-ui" contenteditable="false">
                <option value="javascript">Javascript</option>
                <option value="ruby">Ruby</option>
              </select>
              <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> test = <span class="ql-token hljs-number">1</span>;</div>
              <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> bugz = <span class="ql-token hljs-number">0</span>;</div>
            </div>
            <p><br></p>`,
            false,
            false,
          );
          expect(this.quill.getContents()).toEqual(
            new Delta()
              .insert('var test = 1;')
              .insert('\n', { 'code-block': 'javascript' })
              .insert('var bugz = 0;')
              .insert('\n', { 'code-block': 'javascript' })
              .insert('\n'),
          );
          done();
        }, HIGHLIGHT_INTERVAL + 1);
      }, HIGHLIGHT_INTERVAL + 1);
    });

    it('code language', function () {
      expect(this.quill.getSemanticHTML()).toContain(
        'data-language="javascript"',
      );
    });

    describe('allowedChildren', function () {
      beforeAll(function () {
        SyntaxCodeBlock.allowedChildren.push(BoldBlot);
      });

      afterAll(function () {
        SyntaxCodeBlock.allowedChildren.pop();
      });

      it('modification', function (done) {
        this.quill.formatText(2, 3, 'bold', true);
        setTimeout(() => {
          expect(this.quill.root).toEqualHTML(`
          <div class="ql-code-block-container" spellcheck="false">
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">va</span><strong><span class="ql-token hljs-keyword">r</span> t</strong>est = <span class="ql-token hljs-number">1</span>;</div>
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">var</span> bugz = <span class="ql-token hljs-number">0</span>;</div>
          </div>
          <p><br></p>`);
          expect(this.quill.getContents()).toEqual(
            new Delta()
              .insert('va')
              .insert('r t', { bold: true })
              .insert('est = 1;')
              .insert('\n', { 'code-block': 'javascript' })
              .insert('var bugz = 0;')
              .insert('\n', { 'code-block': 'javascript' })
              .insert('\n'),
          );
          done();
        }, HIGHLIGHT_INTERVAL + 1);
      });

      it('removal', function (done) {
        this.quill.formatText(2, 3, 'bold', true);
        setTimeout(() => {
          this.quill.formatLine(0, 15, 'code-block', false);
          expect(this.quill.root).toEqualHTML(
            '<p>va<strong>r t</strong>est = 1;</p><p>var bugz = 0;</p><p><br></p>',
          );
          expect(this.quill.getContents()).toEqual(
            new Delta()
              .insert('va')
              .insert('r t', { bold: true })
              .insert('est = 1;\nvar bugz = 0;\n\n'),
          );
          done();
        }, HIGHLIGHT_INTERVAL + 1);
      });

      it('addition', function (done) {
        this.quill.setText('var test = 1;\n');
        this.quill.formatText(2, 3, 'bold', true);
        this.quill.formatLine(0, 1, 'code-block', 'javascript');
        setTimeout(() => {
          expect(this.quill.root).toEqualHTML(`
            <div class="ql-code-block-container" spellcheck="false">
            <div class="ql-code-block" data-language="javascript"><span class="ql-token hljs-keyword">va</span><strong><span class="ql-token hljs-keyword">r</span> t</strong>est = <span class="ql-token hljs-number">1</span>;</div>
          </div>`);
          expect(this.quill.getContents()).toEqual(
            new Delta()
              .insert('va')
              .insert('r t', { bold: true })
              .insert('est = 1;')
              .insert('\n', { 'code-block': 'javascript' }),
          );
          done();
        }, HIGHLIGHT_INTERVAL + 1);
      });
    });
  });
});
