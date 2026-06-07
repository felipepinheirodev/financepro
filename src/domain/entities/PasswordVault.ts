export interface PasswordVaultEntry {
  id: string;
  bankName: string;
  login?: string; // Optional as per user request
  encryptedPassword?: string; // Optional as per user request
}
