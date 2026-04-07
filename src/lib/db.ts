export const get = (key: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('zomra-db', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('store');
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('store')) {
        resolve(undefined);
        return;
      }
      const tx = db.transaction('store', 'readonly');
      const store = tx.objectStore('store');
      const getRequest = store.get(key);
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const set = (key: string, val: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('zomra-db', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('store');
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      const putRequest = store.put(val, key);
      putRequest.onsuccess = () => resolve(putRequest.result);
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};
