import { StatusLabelPipe, StatusColorPipe } from './status.pipe';

describe('StatusLabelPipe', () => {
  const pipe = new StatusLabelPipe();

  it('should transform pending', () => {
    expect(pipe.transform('pending')).toBe('Pending');
  });

  it('should transform payment_received', () => {
    expect(pipe.transform('payment_received')).toBe('Payment Received');
  });

  it('should transform credentials_received', () => {
    expect(pipe.transform('credentials_received')).toBe('Credentials Received');
  });

  it('should transform takeover_in_progress', () => {
    expect(pipe.transform('takeover_in_progress')).toBe('Takeover In Progress');
  });

  it('should transform completed', () => {
    expect(pipe.transform('completed')).toBe('Completed');
  });

  it('should transform refunded', () => {
    expect(pipe.transform('refunded')).toBe('Refunded');
  });

  it('should transform disputed', () => {
    expect(pipe.transform('disputed')).toBe('Disputed');
  });

  it('should return value as-is for unknown status', () => {
    expect(pipe.transform('unknown_status')).toBe('unknown_status');
  });
});

describe('StatusColorPipe', () => {
  const pipe = new StatusColorPipe();

  it('should return warn for pending', () => {
    expect(pipe.transform('pending')).toBe('warn');
  });

  it('should return accent for payment_received', () => {
    expect(pipe.transform('payment_received')).toBe('accent');
  });

  it('should return accent for credentials_received', () => {
    expect(pipe.transform('credentials_received')).toBe('accent');
  });

  it('should return primary for takeover_in_progress', () => {
    expect(pipe.transform('takeover_in_progress')).toBe('primary');
  });

  it('should return primary for completed', () => {
    expect(pipe.transform('completed')).toBe('primary');
  });

  it('should return warn for refunded', () => {
    expect(pipe.transform('refunded')).toBe('warn');
  });

  it('should return warn for disputed', () => {
    expect(pipe.transform('disputed')).toBe('warn');
  });

  it('should return default for unknown status', () => {
    expect(pipe.transform('unknown')).toBe('default');
  });
});
