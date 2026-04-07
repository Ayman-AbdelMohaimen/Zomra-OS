// Simple obfuscation for local storage.
// In a real production app with a backend, this would use proper encryption.
export const encryptKey = (text: string): string => {
  if (!text) return '';
  return btoa(encodeURIComponent(text)).split('').reverse().join('');
};

export const decryptKey = (encrypted: string): string => {
  if (!encrypted) return '';
  try {
    return decodeURIComponent(atob(encrypted.split('').reverse().join('')));
  } catch (e) {
    return '';
  }
};
