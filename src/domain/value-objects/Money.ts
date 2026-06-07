export class Money {
  private readonly amountInCents: number;

  constructor(amountInCents: number) {
    this.amountInCents = amountInCents;
  }

  get value(): number {
    return this.amountInCents / 100;
  }

  get cents(): number {
    return this.amountInCents;
  }

  static fromBRL(amount: number): Money {
    return new Money(Math.round(amount * 100));
  }

  static fromCents(cents: number): Money {
    return new Money(cents);
  }

  add(other: Money): Money {
    return new Money(this.amountInCents + other.cents);
  }

  subtract(other: Money): Money {
    return new Money(this.amountInCents - other.cents);
  }

  multiply(factor: number): Money {
    return new Money(Math.round(this.amountInCents * factor));
  }

  format(): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(this.value);
  }
}
