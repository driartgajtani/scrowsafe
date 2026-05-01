jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn(),
  }),
}));

jest.mock('../../src/config/env', () => ({
  get: jest.fn((key) => {
    const vals = {
      SMTP_HOST: 'smtp.test.com',
      SMTP_PORT: 587,
      SMTP_USER: 'test@test.com',
      SMTP_PASS: 'testpass',
      FROM_EMAIL: 'Test <test@scrowsafe.com>',
    };
    return vals[key];
  }),
  isResolved: true,
}));

describe('mailer', () => {
  let sendMail;
  let mockTransport;

  beforeEach(() => {
    jest.resetModules();
    jest.mock('nodemailer', () => ({
      createTransport: jest.fn().mockReturnValue({
        sendMail: jest.fn(),
      }),
    }));
    jest.mock('../../src/config/env', () => ({
      get: jest.fn((key) => {
        const vals = {
          SMTP_HOST: 'smtp.test.com',
          SMTP_PORT: 587,
          SMTP_USER: 'test@test.com',
          SMTP_PASS: 'testpass',
          FROM_EMAIL: 'Test <test@scrowsafe.com>',
        };
        return vals[key];
      }),
      isResolved: true,
    }));
    mockTransport = require('nodemailer').createTransport();
    const mailer = require('../../src/utils/mailer');
    sendMail = mailer.sendMail;
  });

  it('should call transporter.sendMail with correct params', async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    mockTransport.sendMail.mockResolvedValue({ messageId: 'test-id' });

    const result = await sendMail('test@example.com', 'Test Subject', '<p>Hello</p>');

    expect(mockTransport.sendMail).toHaveBeenCalledWith({
      from: 'Test <test@scrowsafe.com>',
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
    });
    expect(result.messageId).toBe('test-id');
    console.log.mockRestore();
  });

  it('should throw when sendMail fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockTransport.sendMail.mockRejectedValue(new Error('SMTP error'));

    await expect(sendMail('test@example.com', 'Subject', '<p>Body</p>')).rejects.toThrow('SMTP error');
    expect(console.error).toHaveBeenCalledWith('Email send error:', 'SMTP error');
    console.error.mockRestore();
  });
});
