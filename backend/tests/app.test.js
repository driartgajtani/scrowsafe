const request = require('supertest');

jest.mock('./helpers/dbHandler');
jest.mock('../src/config/db', () => jest.fn().mockResolvedValue(undefined));

describe('App', () => {
  let app;

  beforeAll(() => {
    app = require('../src/app');
  });

  describe('GET /api/health', () => {
    it('should return health check response', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Scrowsafe API is running');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('404 handler', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/api/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('/api/nonexistent');
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const res = await request(app)
        .options('/api/health')
        .set('Origin', 'http://localhost:4200');
      expect(res.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
