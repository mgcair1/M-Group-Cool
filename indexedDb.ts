/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SyncItem {
  id: string;
  operation: 'CREATE_OR_UPDATE' | 'DELETE';
  path: string; // e.g., 'customers/CUS-000001/devices/DEV-001'
  payload: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
}

export function initIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MGroupCool_ERP_Offline_DB', 2);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('state')) {
        db.createObjectStore('state', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    };
    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };
    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
}

export class OfflineStorage {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = initIndexedDB();
  }

  public async saveState(state: any): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('state', 'readwrite');
      const store = transaction.objectStore('state');
      // Deep copy to prevent any proxy/frozen-object issues
      const cleanState = JSON.parse(JSON.stringify(state));
      const request = store.put({ key: 'current_state', value: cleanState });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getState(): Promise<any | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('state', 'readonly');
      const store = transaction.objectStore('state');
      const request = store.get('current_state');
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async getQueue(): Promise<SyncItem[]> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync_queue', 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.getAll();
      request.onsuccess = () => {
        const items = request.result || [];
        // Sort asc by timestamp so operations are processed in the right order
        items.sort((a, b) => a.timestamp - b.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async addToQueue(item: Omit<SyncItem, 'status'>): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync_queue', 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const fullItem: SyncItem = {
        ...item,
        status: 'pending'
      };
      const request = store.put(fullItem);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async updateQueueStatus(id: string, status: SyncItem['status'], error?: string): Promise<void> {
    const db = await this.dbPromise;
    const item = await this.getQueueItem(id);
    if (!item) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync_queue', 'readwrite');
      const store = transaction.objectStore('sync_queue');
      item.status = status;
      if (error) item.error = error;
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getQueueItem(id: string): Promise<SyncItem | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync_queue', 'readonly');
      const store = transaction.objectStore('sync_queue');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async deleteFromQueue(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync_queue', 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async clearQueue(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('sync_queue', 'readwrite');
      const store = transaction.objectStore('sync_queue');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineStorage = new OfflineStorage();
