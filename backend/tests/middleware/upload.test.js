const mockEnv = {
  get: jest.fn((key) => {
    const defaults = { UPLOAD_DIR: 'uploads', MAX_FILE_SIZE: 10485760 };
    return defaults[key];
  }),
  isResolved: true,
};

describe('upload middleware', () => {
  let upload;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../src/config/env', () => mockEnv);
    upload = require('../../src/middleware/upload');
  });

  afterEach(() => {
    jest.dontMock('../../src/config/env');
  });

  it('should export a multer instance', () => {
    expect(upload).toBeDefined();
    expect(upload.single).toBeDefined();
    expect(upload.array).toBeDefined();
  });

  describe('storage callbacks', () => {
    let capturedStorage;

    beforeEach(() => {
      jest.resetModules();
      jest.doMock('../../src/config/env', () => mockEnv);
      jest.doMock('multer', () => {
        const fn = (opts) => ({
          single: jest.fn(),
          array: jest.fn(),
          fields: jest.fn(),
        });
        fn.diskStorage = jest.fn((opts) => {
          capturedStorage = opts;
          return {};
        });
        return fn;
      });
      require('../../src/middleware/upload');
    });

    afterEach(() => {
      jest.dontMock('multer');
    });

    it('should use UPLOAD_DIR from env resolver', () => {
      const cb = jest.fn();
      capturedStorage.destination({}, {}, cb);
      expect(cb).toHaveBeenCalledWith(null, 'uploads');
    });

    it('should generate a unique filename with extension', () => {
      const cb = jest.fn();
      capturedStorage.filename({}, { originalname: 'test-photo.jpg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/^[a-f0-9-]+\.jpg$/));
    });

    it('should handle files without extension', () => {
      const cb = jest.fn();
      capturedStorage.filename({}, { originalname: 'noextension' }, cb);
      expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/^[a-f0-9-]+$/));
    });
  });

  describe('fileFilter', () => {
    let fileFilter;

    beforeEach(() => {
      jest.resetModules();
      jest.doMock('../../src/config/env', () => mockEnv);
      let capturedFilter;
      jest.doMock('multer', () => {
        const fn = (opts) => {
          capturedFilter = opts.fileFilter;
          return {
            single: jest.fn(),
            array: jest.fn(),
            fields: jest.fn(),
          };
        };
        fn.diskStorage = jest.fn().mockReturnValue({});
        return fn;
      });
      require('../../src/middleware/upload');
      fileFilter = capturedFilter;
    });

    afterEach(() => {
      jest.dontMock('multer');
    });

    it('should accept JPEG files', () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept PNG files', () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept WebP files', () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'image/webp' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept PDF files', () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/pdf' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept DOC files', () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/msword' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should accept DOCX files', () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it('should reject unsupported file types', () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/zip' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });

    it('should reject executable files', () => {
      const cb = jest.fn();
      fileFilter({}, { mimetype: 'application/x-msdownload' }, cb);
      expect(cb).toHaveBeenCalledWith(expect.any(Error), false);
    });
  });
});
