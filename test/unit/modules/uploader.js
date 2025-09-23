import Uploader from '../../../modules/uploader';
import { Range } from '../../../core/selection';
import sanitizeSvg from '../../../utils/sanitize_svg';

describe('Uploader', function () {
  describe('image uploading', function () {
    [
      {
        name: 'test.png',
        type: 'image/png',
      },
      {
        name: 'test.jpeg',
        type: 'image/jpeg',
      },
      {
        name: 'test.pjpeg',
        type: 'image/pjpeg',
      },
      {
        name: 'test.gif',
        type: 'image/gif',
      },
      {
        name: 'test.webp',
        type: 'image/webp',
      },
      {
        name: 'test.bmp',
        type: 'image/bmp',
      },
      {
        name: 'test.svg',
        type: 'image/svg+xml',
      },
      {
        name: 'test.icon',
        type: 'image/vnd.microsoft.icon',
      },
      {
        name: 'test.html',
        type: 'text/html',
        isNotImage: true,
      },
    ].forEach((file) => {
      it(`upload ${file.name}`, function () {
        const testRange = new Range(0);
        let uploads = [];

        const quillMock = {
          root: {
            addEventListener: () => {},
          },
        };

        const uploaderInstance = new Uploader(quillMock, {
          mimetypes: Uploader.DEFAULTS.mimetypes,
          handler: (range, files) => {
            uploads = files;
          },
        });

        uploaderInstance.upload(testRange, [file]);

        expect(uploads.length).toEqual(file.isNotImage ? 0 : 1);
      });
    });

    it('should not prevent default when no files to drop', function () {
      const quillMock = {
        root: document.createElement('input'),
      };

      // eslint-disable-next-line no-new
      new Uploader(quillMock);
      const dataTransferInstance = new DataTransfer();
      dataTransferInstance.setData('text/plain', 'just text');
      const dropEvent = new DragEvent('drop', {
        dataTransfer: dataTransferInstance,
        cancelable: true,
      });

      quillMock.root.dispatchEvent(dropEvent);

      expect(dropEvent.defaultPrevented).toBeFalse();
    });

    it('should prevent default on drop files', function () {
      const quillMock = {
        root: document.createElement('input'),
      };

      // eslint-disable-next-line no-new
      new Uploader(quillMock);
      const dataTransferInstance = new DataTransfer();
      const fileContent = ['<u>test</u>'];

      dataTransferInstance.setData('text/plain', 'just text');
      dataTransferInstance.items.add(
        new File([new Blob(fileContent, { type: 'text/html' })], 'test.html'),
      );

      const dropEvent = new DragEvent('drop', {
        dataTransfer: dataTransferInstance,
        cancelable: true,
      });

      quillMock.root.dispatchEvent(dropEvent);

      expect(dropEvent.defaultPrevented).toBeTrue();
    });

    [
      {
        preventValue: true,
      },
      {
        preventValue: false,
      },
      {
        preventValue: false,
        forceUpload: true,
      },
    ].forEach((data) => {
      it(`check preventImageUploading ${data.preventValue}`, function () {
        const testRange = new Range(0);
        const file = {
          name: 'test.png',
          type: 'image/png',
        };
        const expectedUploadsCount = data.preventValue && !data.forceUpload ? 0 : 1;
        let uploads = [];

        const quillMock = {
          root: {
            addEventListener: () => {},
          },
        };

        const uploaderInstance = new Uploader(quillMock, {
          mimetypes: Uploader.DEFAULTS.mimetypes,
          handler: (range, files) => {
            uploads = files;
          },
        });

        uploaderInstance.preventImageUploading(!data.preventValue);
        uploaderInstance.preventImageUploading(data.preventValue);

        uploaderInstance.upload(testRange, [file], data.forceUpload);

        expect(uploaderInstance.preventImageUploading()).toEqual(
          data.preventValue,
        );
        expect(uploads.length).toEqual(expectedUploadsCount);
      });
    });

    describe('SVG uploading', function () {
      it('should sanitize SVG before converting to data URL', function (done) {
        const unsanitized = '<svg><script>alert(1)</script><circle cx="1" cy="2" r="3"/></svg>';
        const file = new File([unsanitized], 'icon.svg', { type: 'image/svg+xml' });

        const quillMock = {
          updateContents: (delta) => {
            try {
              expect(delta && delta.ops && delta.ops.length).toBeGreaterThan(0);
              const insertOp = delta.ops.find((op) => op.insert && op.insert.image);
              expect(insertOp).toBeDefined();
              const dataUrl = insertOp.insert.image;
              expect(dataUrl.startsWith('data:image/svg+xml;base64,')).toBeTrue();
              const base64 = dataUrl.split(',')[1];
              const decoded = window.atob(base64);
              expect(decoded.includes('<script')).toBeFalse();
              expect(decoded.includes('<circle')).toBeTrue();
              const expected = sanitizeSvg(unsanitized);
              expect(decoded).toEqual(expected);
              done();
            } catch (e) {
              done.fail(e);
            }
          },
          setSelection: () => {},
        };

        const context = { quill: quillMock };
        Uploader.DEFAULTS.handler.call(context, new Range(0, 0), [file], 'image');
      });

      it('should not sanitize non-SVG and keep original content (including <script> text) in data URL', function (done) {
        const pngContent = 'PNGDATA<script>alert(2)</script>';
        const file = new File([pngContent], 'test.png', { type: 'image/png' });

        const quillMock = {
          updateContents: (delta) => {
            try {
              const insertOp = delta.ops.find((op) => op.insert && op.insert.image);
              const dataUrl = insertOp.insert.image;
              const decoded = window.atob(dataUrl.split(',')[1]);

              expect(dataUrl.startsWith('data:image/png;base64,')).toBeTrue();
              expect(decoded).toEqual(pngContent);
              expect(decoded.includes('<script>alert(2)</script>')).toBeTrue();
              done();
            } catch (e) {
              done.fail(e);
            }
          },
          setSelection: () => {},
        };

        const context = { quill: quillMock };
        Uploader.DEFAULTS.handler.call(context, new Range(0, 0), [file], 'image');
      });

      it('should process mixed SVG and other types of images correctly', function (done) {
        const svgRaw = '<svg><circle cx="5" cy="5" r="2"/></svg>';
        const pngRaw = 'RAWPNG';
        const svgFile = new File([svgRaw], 'a.svg', { type: 'image/svg+xml' });
        const pngFile = new File([pngRaw], 'b.png', { type: 'image/png' });

        const quillMock = {
          updateContents: (delta) => {
            try {
              const images = delta.ops
                .filter((op) => op.insert && op.insert.image)
                .map((op) => op.insert.image);

              expect(images.length).toEqual(2);

              const [first, second] = images;

              expect(first.startsWith('data:image/svg+xml;base64,')).toBeTrue();
              expect(second.startsWith('data:image/png;base64,')).toBeTrue();

              const decodedSvg = window.atob(first.split(',')[1]);
              const decodedPng = window.atob(second.split(',')[1]);

              expect(decodedSvg).toEqual(sanitizeSvg(svgRaw));
              expect(decodedPng).toEqual(pngRaw);
              done();
            } catch (e) {
              done.fail(e);
            }
          },
          setSelection: () => {},
        };

        const context = { quill: quillMock };
        Uploader.DEFAULTS.handler.call(context, new Range(0, 0), [svgFile, pngFile], 'image');
      });

      it('should handle invalid SVG returning null sanitized result', function (done) {
        const invalidSvg = '<div>not svg</div>';
        const file = new File([invalidSvg], 'bad.svg', { type: 'image/svg+xml' });

        const quillMock = {
          updateContents: (delta) => {
            try {
              const insertOp = delta.ops.find((op) => op.insert && op.insert.image);
              const dataUrl = insertOp.insert.image;
              const decoded = window.atob(dataUrl.split(',')[1]);

              expect(decoded).toEqual('null');
              done();
            } catch (e) {
              done.fail(e);
            }
          },
          setSelection: () => {},
        };

        const context = { quill: quillMock };
        Uploader.DEFAULTS.handler.call(context, new Range(0, 0), [file], 'image');
      });
    });
  });
});
