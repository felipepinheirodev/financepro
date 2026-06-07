import React, { useState } from 'react';
import type { PasswordVaultEntry } from '../../domain/entities/PasswordVault';
import { CryptoService } from '../../infrastructure/security/CryptoService';
import { Eye, EyeOff, Key } from 'lucide-react';

interface Props {
  entry: PasswordVaultEntry;
}

export const PasswordVaultItem: React.FC<Props> = ({ entry }) => {
  const [isVisible, setIsVisible] = useState(false);

  const decryptedPassword = isVisible 
    ? CryptoService.decrypt(entry.encryptedPassword)
    : '••••••••••••';

  return (
    <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-border">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-secondary rounded-full">
          <Key className="w-4 h-4 text-secondary-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">{entry.bankName}</p>
          {entry.login && <p className="text-xs text-muted-foreground">Login: {entry.login}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-sm tracking-wider bg-background px-3 py-1 rounded border border-border">
          {decryptedPassword}
        </span>
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className="p-2 hover:bg-muted rounded-full transition-colors"
          title={isVisible ? "Ocultar senha" : "Ver senha"}
        >
          {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
