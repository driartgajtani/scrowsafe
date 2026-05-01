const walletController = require('../../src/controllers/walletController');
const Wallet = require('../../src/models/Wallet');

jest.mock('../../src/models/Wallet');

describe('Wallet Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getPublicWallets', () => {
    it('should return enabled wallets', async () => {
      Wallet.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([{ network: 'bitcoin', enabled: true }]),
        }),
      });
      await walletController.getPublicWallets(req, res, next);
      expect(Wallet.find).toHaveBeenCalledWith({ enabled: true });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      Wallet.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      });
      await walletController.getPublicWallets(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('getAllWallets', () => {
    it('should return all wallets', async () => {
      Wallet.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });
      await walletController.getAllWallets(req, res, next);
      expect(Wallet.find).toHaveBeenCalledWith();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      Wallet.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockRejectedValue(new Error('DB error')),
        }),
      });
      await walletController.getAllWallets(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('upsertWallet', () => {
    it('should upsert wallet', async () => {
      req.params = { network: 'Bitcoin' };
      req.body = { label: 'BTC', address: 'bc1q...', explorer: 'https://...', enabled: true };
      Wallet.findOneAndUpdate.mockResolvedValue({ network: 'bitcoin', label: 'BTC' });

      await walletController.upsertWallet(req, res, next);
      expect(Wallet.findOneAndUpdate).toHaveBeenCalledWith(
        { network: 'bitcoin' },
        expect.any(Object),
        expect.objectContaining({ upsert: true, new: true }),
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should default enabled to true when not false', async () => {
      req.params = { network: 'eth' };
      req.body = { label: 'ETH', address: '0x...', explorer: 'https://...' };
      Wallet.findOneAndUpdate.mockResolvedValue({});

      await walletController.upsertWallet(req, res, next);
      expect(Wallet.findOneAndUpdate).toHaveBeenCalledWith(
        { network: 'eth' },
        expect.objectContaining({ enabled: true }),
        expect.any(Object),
      );
    });

    it('should call next on error', async () => {
      req.params = { network: 'bitcoin' };
      req.body = { label: 'BTC', address: 'bc1q...' };
      Wallet.findOneAndUpdate.mockRejectedValue(new Error('DB error'));
      await walletController.upsertWallet(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('deleteWallet', () => {
    it('should return 404 if wallet not found', async () => {
      req.params = { network: 'unknown' };
      Wallet.findOneAndDelete.mockResolvedValue(null);
      await walletController.deleteWallet(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should delete wallet successfully', async () => {
      req.params = { network: 'bitcoin' };
      Wallet.findOneAndDelete.mockResolvedValue({ network: 'bitcoin' });
      await walletController.deleteWallet(req, res, next);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should call next on error', async () => {
      req.params = { network: 'bitcoin' };
      Wallet.findOneAndDelete.mockRejectedValue(new Error('DB error'));
      await walletController.deleteWallet(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
