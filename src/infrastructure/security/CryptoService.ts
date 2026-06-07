import CryptoJS from 'crypto-js';

const SECRET_KEY = 'finance-pro-local-secret-key-do-not-use-in-prod'; // Fixed key for local prototype

export class CryptoService {
  static encrypt(password: string): string {
    return CryptoJS.AES.encrypt(password, SECRET_KEY).toString();
  }

  static decrypt(encryptedPassword?: string): string {
    if (!encryptedPassword) return '';
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedPassword, SECRET_KEY);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error('Error decrypting password', e);
      return '';
    }
  }
}
