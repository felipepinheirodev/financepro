import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// Helper to convert price in cents
const cents = (reais: number) => Math.round(reais * 100);

// All filaments to seed (brand, material, color)
const FILAMENTS = [
  { brand: 'SUNLU',                  material: 'PETG', color: 'Verde',           weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'SUNLU',                  material: 'PETG', color: 'Cinza',           weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'SUNLU',                  material: 'PETG', color: 'Azul',            weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'SUNLU',                  material: 'PETG', color: 'Laranja',         weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'SUNLU',                  material: 'PETG', color: 'Amarelo',         weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'SUNLU',                  material: 'PETG', color: 'Azul-celeste',    weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Fremover',               material: 'PLA+', color: 'Army Green',      weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Fremover',               material: 'PLA+', color: 'Matte Green Plum', weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Fremover',               material: 'PLA+', color: 'Matte Cream Pink', weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'SUNLU PIRATA',           material: 'PETG', color: 'Branco',          weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Creality Soleyin Ultra', material: 'PLA',  color: 'Preto',           weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Creality Soleyin Ultra', material: 'PLA',  color: 'Azul Oceano',     weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Creality Soleyin Ultra', material: 'PLA',  color: 'Cinza',           weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Bambu Lab',              material: 'PLA',  color: 'Cinza',           weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Creality Soleyin Ultra', material: 'PETG', color: 'Transparente',    weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Easy Print',             material: 'PETG', color: 'Preto',           weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Easy Print',             material: 'PETG', color: 'Marrom Claro',    weightGrams: 1000, diameterMm: 1.75 },
  { brand: 'Easy Print',             material: 'PETG', color: 'Marrom',          weightGrams: 1000, diameterMm: 1.75 },
];

// Purchase data — store | brand | material | color | qty | unitPrice(R$) | date | link
const PURCHASES = [
  { store: 'Shopee',         brand: 'SUNLU',                  material: 'PETG', color: 'Verde',           qty: 1, unit: 79.80, date: '2026-05-15', link: 'https://shopee.com.br/user/purchase/order/232560665181478?type=6' },
  { store: 'Shopee',         brand: 'SUNLU',                  material: 'PETG', color: 'Cinza',           qty: 1, unit: 79.80, date: '2026-05-15', link: 'https://shopee.com.br/user/purchase/order/232560665181478?type=6' },
  { store: 'Shopee',         brand: 'SUNLU',                  material: 'PETG', color: 'Azul',            qty: 1, unit: 79.80, date: '2026-05-15', link: 'https://shopee.com.br/user/purchase/order/232560665181478?type=6' },
  { store: 'Shopee',         brand: 'SUNLU',                  material: 'PETG', color: 'Laranja',         qty: 1, unit: 79.80, date: '2026-05-15', link: 'https://shopee.com.br/user/purchase/order/232560665181478?type=6' },
  { store: 'Shopee',         brand: 'SUNLU',                  material: 'PETG', color: 'Amarelo',         qty: 1, unit: 79.80, date: '2026-05-15', link: 'https://shopee.com.br/user/purchase/order/232560665181478?type=6' },
  { store: 'Shopee',         brand: 'SUNLU',                  material: 'PETG', color: 'Azul-celeste',    qty: 1, unit: 79.80, date: '2026-05-15', link: 'https://shopee.com.br/user/purchase/order/232560665181478?type=6' },
  { store: 'Mercado Livre',  brand: 'Fremover',               material: 'PLA+', color: 'Army Green',      qty: 1, unit: 87.19, date: '2026-05-16', link: 'https://myaccount.mercadolivre.com.br/my_purchases/2000016458952876/status?packId=2000016458952876&orderId=2000016458952876' },
  { store: 'Mercado Livre',  brand: 'Fremover',               material: 'PLA+', color: 'Matte Green Plum', qty: 2, unit: 89.17, date: '2026-05-16', link: 'https://myaccount.mercadolivre.com.br/my_purchases/2000013010795009/status?packId=2000013010795013' },
  { store: 'Mercado Livre',  brand: 'Fremover',               material: 'PLA+', color: 'Matte Cream Pink', qty: 2, unit: 89.17, date: '2026-05-16', link: 'https://myaccount.mercadolivre.com.br/my_purchases/2000013010795009/status?packId=2000013010795013' },
  { store: 'Mercado Livre',  brand: 'SUNLU PIRATA',           material: 'PETG', color: 'Branco',          qty: 4, unit: 61.51, date: '2026-03-29', link: 'https://myaccount.mercadolivre.com.br/my_purchases/2000012017866625/status?packId=2000012017866627&orderId=2000015534969016' },
  { store: 'Amazon',         brand: 'Creality Soleyin Ultra', material: 'PLA',  color: 'Preto',           qty: 1, unit: 77.37, date: '2026-02-13', link: 'https://www.amazon.com.br/your-orders/order-details?orderID=702-5864292-6537041&ref=ppx_yo2ov_dt_b_fed_order_details' },
  { store: 'Amazon',         brand: 'Creality Soleyin Ultra', material: 'PLA',  color: 'Azul Oceano',     qty: 1, unit: 77.37, date: '2026-02-13', link: 'https://www.amazon.com.br/your-orders/order-details?orderID=702-5864292-6537041&ref=ppx_yo2ov_dt_b_fed_order_details' },
  { store: 'Amazon',         brand: 'Creality Soleyin Ultra', material: 'PLA',  color: 'Cinza',           qty: 2, unit: 77.37, date: '2026-02-13', link: 'https://www.amazon.com.br/your-orders/order-details?orderID=702-5864292-6537041&ref=ppx_yo2ov_dt_b_fed_order_details' },
  { store: 'Amazon',         brand: 'Bambu Lab',              material: 'PLA',  color: 'Cinza',           qty: 1, unit: 116.91, date: '2026-02-13', link: 'https://www.amazon.com.br/your-orders/order-details?orderID=702-0171105-6397004&ref=ppx_pop_dt_b_order_details' },
  { store: 'Shopee',         brand: 'Creality Soleyin Ultra', material: 'PETG', color: 'Transparente',    qty: 1, unit: 79.20, date: '2026-03-11', link: 'https://shopee.com.br/user/purchase/order/226722973107553?type=6' },
  { store: 'Mercado Livre',  brand: 'Easy Print',             material: 'PETG', color: 'Preto',           qty: 1, unit: 78.90, date: '2026-05-06', link: 'https://myaccount.mercadolivre.com.br/my_purchases/2000016309264832/status?packId=2000016309264832&orderId=2000016309264832' },
  { store: 'Mercado Livre',  brand: 'Easy Print',             material: 'PETG', color: 'Marrom Claro',    qty: 1, unit: 78.90, date: '2026-05-06', link: 'https://myaccount.mercadolivre.com.br/my_purchases/2000012749943489/status?packId=2000012749943493&orderId=2000016211753492' },
  { store: 'Mercado Livre',  brand: 'Easy Print',             material: 'PETG', color: 'Marrom',          qty: 1, unit: 78.90, date: '2026-05-06', link: 'https://myaccount.mercadolivre.com.br/my_purchases/2000012749943489/status?packId=2000012749943493&orderId=2000016211753494' },
];

async function main() {
  console.log('🌱 Seeding filament catalog...');

  // Create filaments and store id map (brand+material+color → id)
  const filamentMap = new Map<string, string>();

  for (const f of FILAMENTS) {
    const key = `${f.brand}|${f.material}|${f.color}`;
    // Check if already exists
    const existing = await prisma.filament.findFirst({
      where: { brand: f.brand, material: f.material, color: f.color },
    });
    if (existing) {
      filamentMap.set(key, existing.id);
      console.log(`  ⏭  Already exists: ${f.brand} ${f.material} ${f.color}`);
    } else {
      const created = await prisma.filament.create({ data: f });
      filamentMap.set(key, created.id);
      console.log(`  ✅ Created: ${f.brand} ${f.material} ${f.color}`);
    }
  }

  console.log('\n🛒 Seeding purchases...');
  let inserted = 0;
  for (const p of PURCHASES) {
    const key = `${p.brand}|${p.material}|${p.color}`;
    const filamentId = filamentMap.get(key);
    if (!filamentId) {
      console.error(`  ❌ No filament found for: ${key}`);
      continue;
    }
    const unitPriceCents = cents(p.unit);
    const totalPriceCents = unitPriceCents * p.qty;

    // Avoid duplicate: same filament + store + date + quantity
    const existing = await prisma.filamentPurchase.findFirst({
      where: { filamentId, store: p.store, purchaseDate: p.date, quantity: p.qty },
    });
    if (existing) {
      console.log(`  ⏭  Duplicate skipped: ${p.brand} ${p.color} @ ${p.store} ${p.date}`);
      continue;
    }

    await prisma.filamentPurchase.create({
      data: {
        filamentId,
        store: p.store,
        quantity: p.qty,
        unitPriceCents,
        totalPriceCents,
        purchaseDate: p.date,
        link: p.link,
      },
    });
    console.log(`  ✅ Purchase: ${p.brand} ${p.material} ${p.color} × ${p.qty} — R$ ${(totalPriceCents/100).toFixed(2)}`);
    inserted++;
  }

  console.log(`\n✨ Done! ${inserted} purchases inserted.`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
