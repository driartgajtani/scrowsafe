const dbHandler = require('../helpers/dbHandler');
const Wallet = require('../../src/models/Wallet');

beforeAll(async () => await dbHandler.connect());
afterEach(async () => await dbHandler.clearDatabase());
afterAll(async () => await dbHandler.closeDatabase());

describe('Wallet Model', () => {
  const validWallet = {
    network: 'bitcoin',
    label: 'Bitcoin (BTC)',
    address: 'bc1qxyz...',
    explorer: 'https://blockchain.info/tx/',
  };

  describe('creation', () => {
    it('should create with valid fields', async () => {
      const wallet = await Wallet.create(validWallet);
      expect(wallet._id).toBeDefined();
      expect(wallet.network).toBe('bitcoin');
      expect(wallet.enabled).toBe(true);
    });

    it('should require network', async () => {
      await expect(Wallet.create({ ...validWallet, network: undefined })).rejects.toThrow();
    });

    it('should require label', async () => {
      await expect(Wallet.create({ ...validWallet, label: undefined })).rejects.toThrow();
    });

    it('should require address', async () => {
      await expect(Wallet.create({ ...validWallet, address: undefined })).rejects.toThrow();
    });

    it('should require explorer', async () => {
      await expect(Wallet.create({ ...validWallet, explorer: undefined })).rejects.toThrow();
    });

    it('should enforce unique network', async () => {
      await Wallet.create(validWallet);
      await expect(Wallet.create(validWallet)).rejects.toThrow();
    });

    it('should lowercase network', async () => {
      const wallet = await Wallet.create({ ...validWallet, network: 'ETHEREUM' });
      expect(wallet.network).toBe('ethereum');
    });

    it('should default enabled to true', async () => {
      const wallet = await Wallet.create(validWallet);
      expect(wallet.enabled).toBe(true);
    });

    it('should allow setting enabled to false', async () => {
      const wallet = await Wallet.create({ ...validWallet, enabled: false });
      expect(wallet.enabled).toBe(false);
    });
  });
});
