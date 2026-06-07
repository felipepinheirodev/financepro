import { Money } from '../value-objects/Money';

interface FilamentPurchase {
  quantity: number;
  totalPriceCents: number;
}

interface Filament {
  id: string;
  weightGrams: number;
  purchases: FilamentPurchase[];
}

interface Printer {
  id: string;
  powerWatts: number;
}

export class PrintJobCostCalculator {
  /**
   * Calcula o custo por grama de um filamento com base no histórico de compras.
   */
  static calculateCostPerGram(filament: Filament): number {
    if (!filament || !filament.purchases || filament.purchases.length === 0) {
      return 0;
    }

    const totalPurchasedGrams = filament.purchases.reduce(
      (acc, purchase) => acc + (purchase.quantity * (filament.weightGrams || 1000)),
      0
    );

    const totalSpentCents = filament.purchases.reduce(
      (acc, purchase) => acc + purchase.totalPriceCents,
      0
    );

    return totalPurchasedGrams > 0 ? totalSpentCents / totalPurchasedGrams : 0;
  }

  /**
   * Estima o custo de energia elétrica de um trabalho de impressão em centavos.
   * Fórmula: (Watts / 1000) * Horas * Tarifa_KWh * 100 (para centavos)
   */
  static estimateEnergyCost(
    printer: Printer,
    printTimeHours: number,
    energyTariffKWh: number = 0.95
  ): Money {
    if (!printer || !printTimeHours || printTimeHours <= 0) {
      return Money.fromCents(0);
    }

    const powerWatts = printer.powerWatts || 350;
    const kwhConsumed = (powerWatts / 1000) * printTimeHours;
    const costCents = Math.round(kwhConsumed * energyTariffKWh * 100);

    return Money.fromCents(costCents);
  }

  /**
   * Estima o custo bruto do filamento gasto em centavos.
   */
  static estimateFilamentCost(
    filament: Filament,
    totalGrams: number
  ): Money {
    if (!filament || !totalGrams || totalGrams <= 0) {
      return Money.fromCents(0);
    }

    const costPerGram = this.calculateCostPerGram(filament);
    const costCents = Math.round(totalGrams * costPerGram);

    return Money.fromCents(costCents);
  }

  /**
   * Calcula o custo de produção total (Filamento + Energia)
   */
  static estimateTotalProductionCost(
    filament: Filament,
    totalGrams: number,
    printer: Printer,
    printTimeHours: number,
    energyTariffKWh: number = 0.95
  ): Money {
    const filamentCost = this.estimateFilamentCost(filament, totalGrams);
    const energyCost = this.estimateEnergyCost(printer, printTimeHours, energyTariffKWh);

    return filamentCost.add(energyCost);
  }

  /**
   * Calcula a margem de lucro estimada sobre um preço de venda em centavos.
   * Retorna a margem em porcentagem e o valor bruto do lucro.
   */
  static calculateProfitMargin(
    salePriceCents: number,
    productionCostCents: number
  ): { profit: Money; marginPercent: number } {
    const profit = Money.fromCents(Math.max(0, salePriceCents - productionCostCents));
    
    if (salePriceCents <= 0) {
      return { profit, marginPercent: 0 };
    }

    const marginPercent = (profit.cents / salePriceCents) * 100;

    return {
      profit,
      marginPercent: Math.round(marginPercent * 100) / 100
    };
  }
}
