export type FilamentMaterial = 'PLA' | 'PLA+' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'NYLON' | 'PC' | 'SILK' | 'WOOD' | 'CF' | 'OUTRO';

export interface Filament {
  id: string;
  brand: string;
  material: FilamentMaterial | string;
  color: string;
  colorHex?: string;       // Hex color for visual swatch
  weightGrams: number;     // Total weight (usually 1000g)
  diameterMm: number;      // 1.75 or 2.85
  printTempMin?: number;   // Min nozzle temp
  printTempMax?: number;   // Max nozzle temp
  bedTempMin?: number;     // Min bed temp
  bedTempMax?: number;     // Max bed temp
  notes?: string;          // Observations about the filament
  createdAt?: string;
  updatedAt?: string;
}

export type PurchaseStore = 'Shopee' | 'Mercado Livre' | 'Amazon' | 'Bambu Lab' | 'AliExpress' | 'Outro';

export interface FilamentPurchase {
  id: string;
  filamentId: string;
  filament?: Filament;
  store: string;
  quantity: number;
  unitPriceCents: number;  // Price in cents (BRL)
  totalPriceCents: number;
  purchaseDate: string;    // YYYY-MM-DD
  link?: string;           // Purchase link
  notes?: string;          // Observations (e.g. "1 impressora suspense para impressão e impressão de teste")
  createdAt?: string;
  updatedAt?: string;
}

export interface FilamentStock {
  id: string;
  filamentId: string;
  filament?: Filament;
  quantityInStock: number;         // Number of spools in stock
  usedGrams: number;               // Total grams used from current spools
  status: 'DISPONIVEL' | 'EM_USO' | 'ACABOU'; 
  location?: string;               // Where it's stored
  notes?: string;
  lastUpdated?: string;
  createdAt?: string;
  updatedAt?: string;
}
