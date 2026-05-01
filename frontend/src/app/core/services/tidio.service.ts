import { Injectable, NgZone, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { Transaction } from '../models/transaction.model';

declare global {
  interface Window {
    tidioChatApi: any;
  }
}

@Injectable({ providedIn: 'root' })
export class TidioService {
  private loaded = false;
  private scriptElement: HTMLScriptElement | null = null;
  private readyPromise: Promise<void> | null = null;
  private readonly platformId = inject(PLATFORM_ID);

  private get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  constructor(private zone: NgZone) {}

  load(): Promise<void> {
    if (!this.isBrowser) return Promise.resolve();

    if (this.loaded && window.tidioChatApi) {
      return Promise.resolve();
    }

    if (this.readyPromise) {
      return this.readyPromise;
    }

    const key = environment.tidioPublicKey;
    if (!key || key === 'your_tidio_public_key_here') {
      console.warn('[Tidio] No public key configured. Skipping chat widget.');
      return Promise.resolve();
    }

    this.readyPromise = new Promise<void>((resolve) => {
      const onReady = () => {
        this.loaded = true;
        this.zone.run(() => resolve());
      };

      if (window.tidioChatApi) {
        onReady();
        return;
      }

      document.addEventListener('tidioChat-ready', onReady, { once: true });

      if (!this.scriptElement) {
        this.scriptElement = document.createElement('script');
        this.scriptElement.src = `//code.tidio.co/${key}.js`;
        this.scriptElement.async = true;

        this.scriptElement.onerror = () => {
          console.error('[Tidio] Failed to load chat widget script.');
          this.readyPromise = null;
          resolve();
        };

        document.head.appendChild(this.scriptElement);
      }
    });

    return this.readyPromise;
  }

  identifyUser(user: User): void {
    if (!this.isBrowser) return;
    const api = window.tidioChatApi;
    if (!api) return;

    api.setVisitorData({
      distinct_id: user._id,
      email: user.email,
      name: user.name,
    });

    api.setContactProperties({
      role: user.role,
    });
  }

  identify(user: User, transaction: Transaction): void {
    if (!this.isBrowser) return;
    const api = window.tidioChatApi;
    if (!api) return;

    const isBuyer = typeof transaction.buyerId === 'object'
      && transaction.buyerId._id === user._id;
    const role = isBuyer ? 'buyer' : 'seller';

    api.setVisitorData({
      distinct_id: user._id,
      email: user.email,
      name: user.name,
    });

    api.setContactProperties({
      transaction_id: transaction.transactionId,
      role,
      platform: transaction.platform,
      amount: transaction.totalToPay,
      status: transaction.status,
    });
  }

  show(): void {
    if (!this.isBrowser) return;
    const api = window.tidioChatApi;
    if (!api) {
      console.warn('[Tidio] Chat API not available.');
      return;
    }
    api.show();
    setTimeout(() => api.open(), 300);
  }

  hide(): void {
    if (!this.isBrowser) return;
    const api = window.tidioChatApi;
    if (api) {
      api.close();
      api.hide();
    }
  }

  destroy(): void {
    if (!this.isBrowser) return;
  }
}
