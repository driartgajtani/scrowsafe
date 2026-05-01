const request = require('supertest');
const express = require('express');

jest.mock('../../src/config/db', () => jest.fn().mockResolvedValue(undefined));

describe('Tidio Routes', () => {
  let app;

  beforeAll(() => {
    app = require('../../src/app');
  });

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  it('POST /api/tidio/webhook should return success', async () => {
    const res = await request(app)
      .post('/api/tidio/webhook')
      .send({
        event: 'new_message',
        visitor: { email: 'test@test.com' },
        message: { text: 'Hello support' },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.received).toBe(true);
  });

  it('POST /api/tidio/webhook should handle empty body', async () => {
    const res = await request(app)
      .post('/api/tidio/webhook')
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
