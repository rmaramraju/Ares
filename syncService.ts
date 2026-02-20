/**
 * ARES SYNC SERVICE - SECURE PRODUCTION BRIDGE
 * 
 * UPGRADED: Implements AES-GCM (256-bit) authenticated encryption for local storage.
 * READY FOR PLUG & PLAY: Point BACKEND_URL to your server endpoint.
 */

import { AppState } from './types';

const STORAGE_KEY = 'ares_protocol_v4';
const VAULT_KEY = 'ares_vault_core';
const SYNC_QUEUE_KEY = 'ares_sync_queue';
const BACKEND_URL = 'https://api.ares.protocol/v1/sync'; // Placeholder for production

/**
 * Internal Crypto Engine
 */
const AresCrypto = {
  async getMasterKey(): Promise<CryptoKey> {
    const rawKey = localStorage.getItem(VAULT_KEY);
    if (rawKey) {
      const keyBuffer = Uint8Array.from(atob(rawKey), c => c.charCodeAt(0));
      return await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        'AES-GCM',
        true,
        ['encrypt', 'decrypt']
      );
    }

    const newKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    const exported = await crypto.subtle.exportKey('raw', newKey);
    const base64Key = btoa(String.fromCharCode(...new Uint8Array(exported)));
    localStorage.setItem(VAULT_KEY, base64Key);
    return newKey;
  },

  async encrypt(text: string): Promise<string> {
    const key = await this.getMasterKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
  },

  async decrypt(base64: string): Promise<string> {
    try {
      const key = await this.getMasterKey();
      const combined = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      );

      return new TextDecoder().decode(decrypted);
    } catch (e) {
      console.error("ARES_VAULT: Decryption failed.");
      throw e;
    }
  }
};

export const AresSyncEngine = {
  async loadState(): Promise<AppState | null> {
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) return null;

      const decrypted = await AresCrypto.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (e) {
      console.error("ARES_SYNC: Load failed.");
      return null;
    }
  },

  async saveState(state: AppState): Promise<boolean> {
    try {
      const stateToSave = { ...state };
      if (!state.rememberMe) {
        stateToSave.isAuthenticated = false;
      }
      
      const json = JSON.stringify(stateToSave);
      const encrypted = await AresCrypto.encrypt(json);

      localStorage.setItem(STORAGE_KEY, encrypted);

      if (navigator.onLine) {
        return await this.pushToCloud(state);
      } else {
        this.addToSyncQueue(state);
        return false;
      }
    } catch (e) {
      console.error("ARES_SYNC: Secure save failed.", e);
      return false;
    }
  },

  async pushToCloud(state: AppState): Promise<boolean> {
    if (!state.isAuthenticated || !state.profile?.email) return false;

    try {
      // Plug & Play: Replace this with your actual API endpoint logic
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('ares_session_token') || 'local-dev-token'}`,
          'X-Device-ID': 'native-mobile-v1'
        },
        body: JSON.stringify({
          email: state.profile.email,
          timestamp: new Date().toISOString(),
          payload: state
        })
      });

      if (response.ok) {
        localStorage.removeItem(SYNC_QUEUE_KEY);
        console.log("ARES_PROTOCOL: Cloud handshake successful.");
        return true;
      }
      return false;
    } catch (e) {
      this.addToSyncQueue(state);
      return false;
    }
  },

  addToSyncQueue(state: AppState) {
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify({
      pending: true,
      timestamp: new Date().toISOString()
    }));
  }
};