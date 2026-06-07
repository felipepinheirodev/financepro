import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env'), quiet: true });
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

const prisma = new PrismaClient();

const demoValueMultiplier = 2.5;
const cents = (value: number) => Math.round(value * demoValueMultiplier * 100);

type CategorySeed = {
  name: string;
  color: string;
  icon: string;
};

const categories: CategorySeed[] = [
  { name: 'Moradia', color: '#2563EB', icon: 'Home' },
  { name: 'Alimentacao', color: '#16A34A', icon: 'Utensils' },
  { name: 'Transporte', color: '#F97316', icon: 'Car' },
  { name: 'Saude', color: '#DC2626', icon: 'HeartPulse' },
  { name: 'Lazer', color: '#9333EA', icon: 'Gamepad2' },
  { name: 'Educacao', color: '#0891B2', icon: 'GraduationCap' },
  { name: 'Assinaturas', color: '#64748B', icon: 'Repeat' },
  { name: 'Impressao 3D', color: '#7C3AED', icon: 'Box' },
  { name: 'Salario', color: '#059669', icon: 'Wallet' },
  { name: 'Freelance', color: '#0D9488', icon: 'Briefcase' },
  { name: 'Imposto', color: '#B91C1C', icon: 'Receipt' },
  { name: 'Pagamento Cartao', color: '#475569', icon: 'CreditCard' },
  { name: 'Outros', color: '#6B7280', icon: 'Tag' },
];

async function clearDatabase() {
  await prisma.$transaction([
    prisma.productBom.deleteMany(),
    prisma.product.deleteMany(),
    prisma.printJob.deleteMany(),
    prisma.accessory.deleteMany(),
    prisma.printer.deleteMany(),
    prisma.filamentStock.deleteMany(),
    prisma.filamentPurchase.deleteMany(),
    prisma.filament.deleteMany(),
    prisma.passwordVaultEntry.deleteMany(),
    prisma.transaction.deleteMany(),
    prisma.recurringTemplate.deleteMany(),
    prisma.creditCard.deleteMany(),
    prisma.account.deleteMany(),
    prisma.category.deleteMany(),
    prisma.supplier.deleteMany(),
  ]);
}

async function seedCategories() {
  const map = new Map<string, string>();

  for (const category of categories) {
    const created = await prisma.category.create({ data: category });
    map.set(category.name, created.id);
  }

  return map;
}

async function seedFinance(categoryIds: Map<string, string>) {
  const mainAccount = await prisma.account.create({
    data: {
      name: 'Conta Principal',
      type: 'CHECKING',
      initialBalanceCents: cents(2850),
      color: '#2563EB',
    },
  });

  const reserveAccount = await prisma.account.create({
    data: {
      name: 'Reserva de Emergencia',
      type: 'SAVINGS',
      initialBalanceCents: cents(12400),
      color: '#059669',
    },
  });

  const walletAccount = await prisma.account.create({
    data: {
      name: 'Carteira',
      type: 'WALLET',
      initialBalanceCents: cents(320),
      color: '#F97316',
    },
  });

  const personalCard = await prisma.creditCard.create({
    data: {
      name: 'Cartao Pessoal',
      accountId: mainAccount.id,
      limitCents: cents(12000),
      closingDay: 25,
      dueDay: 5,
      color: '#111827',
    },
  });

  const businessCard = await prisma.creditCard.create({
    data: {
      name: 'Cartao Projetos',
      accountId: mainAccount.id,
      limitCents: cents(8000),
      closingDay: 20,
      dueDay: 10,
      color: '#7C3AED',
    },
  });

  const recurringTemplates = await Promise.all([
    prisma.recurringTemplate.create({
      data: {
        description: 'Salario CLT',
        amountCents: cents(7800),
        type: 'INCOME',
        categoryId: categoryIds.get('Salario'),
        accountId: mainAccount.id,
        frequency: 'MONTHLY',
        dayOfMonth: 5,
      },
    }),
    prisma.recurringTemplate.create({
      data: {
        description: 'Aluguel',
        amountCents: cents(1850),
        type: 'EXPENSE',
        expenseType: 'FIXA',
        categoryId: categoryIds.get('Moradia'),
        accountId: mainAccount.id,
        frequency: 'MONTHLY',
        dayOfMonth: 8,
      },
    }),
    prisma.recurringTemplate.create({
      data: {
        description: 'Internet fibra',
        amountCents: cents(129.9),
        type: 'EXPENSE',
        expenseType: 'FIXA',
        categoryId: categoryIds.get('Assinaturas'),
        accountId: mainAccount.id,
        frequency: 'MONTHLY',
        dayOfMonth: 12,
      },
    }),
    prisma.recurringTemplate.create({
      data: {
        description: 'Academia',
        amountCents: cents(119.9),
        type: 'EXPENSE',
        expenseType: 'FIXA',
        categoryId: categoryIds.get('Saude'),
        accountId: mainAccount.id,
        frequency: 'MONTHLY',
        dayOfMonth: 15,
      },
    }),
  ]);

  const [salaryTemplate, rentTemplate, internetTemplate, gymTemplate] = recurringTemplates;

  const txData = [
    ['2026-01-05', 'Salario CLT', 7800, 'INCOME', 'Salario', null, salaryTemplate.id, mainAccount.id],
    ['2026-02-05', 'Salario CLT', 7800, 'INCOME', 'Salario', null, salaryTemplate.id, mainAccount.id],
    ['2026-03-05', 'Salario CLT', 7950, 'INCOME', 'Salario', null, salaryTemplate.id, mainAccount.id],
    ['2026-04-05', 'Salario CLT', 7950, 'INCOME', 'Salario', null, salaryTemplate.id, mainAccount.id],
    ['2026-05-05', 'Salario CLT', 8200, 'INCOME', 'Salario', null, salaryTemplate.id, mainAccount.id],
    ['2026-06-05', 'Salario CLT', 8200, 'INCOME', 'Salario', null, salaryTemplate.id, mainAccount.id],
    ['2026-01-18', 'Freelance dashboard operacional', 1450, 'INCOME', 'Freelance', null, null, mainAccount.id],
    ['2026-03-22', 'Freelance integracao de API', 2300, 'INCOME', 'Freelance', null, null, mainAccount.id],
    ['2026-05-27', 'Consultoria de automacao financeira', 680, 'INCOME', 'Freelance', null, null, mainAccount.id],
    ['2026-06-03', 'Projeto de dashboard executivo', 420, 'INCOME', 'Freelance', null, null, walletAccount.id],

    ['2026-01-08', 'Aluguel', 1850, 'EXPENSE', 'Moradia', 'FIXA', rentTemplate.id, mainAccount.id],
    ['2026-02-08', 'Aluguel', 1850, 'EXPENSE', 'Moradia', 'FIXA', rentTemplate.id, mainAccount.id],
    ['2026-03-08', 'Aluguel', 1850, 'EXPENSE', 'Moradia', 'FIXA', rentTemplate.id, mainAccount.id],
    ['2026-04-08', 'Aluguel', 1850, 'EXPENSE', 'Moradia', 'FIXA', rentTemplate.id, mainAccount.id],
    ['2026-05-08', 'Aluguel', 1850, 'EXPENSE', 'Moradia', 'FIXA', rentTemplate.id, mainAccount.id],
    ['2026-06-08', 'Aluguel', 1850, 'EXPENSE', 'Moradia', 'FIXA', rentTemplate.id, mainAccount.id],
    ['2026-01-12', 'Internet fibra', 129.9, 'EXPENSE', 'Assinaturas', 'FIXA', internetTemplate.id, mainAccount.id],
    ['2026-02-12', 'Internet fibra', 129.9, 'EXPENSE', 'Assinaturas', 'FIXA', internetTemplate.id, mainAccount.id],
    ['2026-03-12', 'Internet fibra', 129.9, 'EXPENSE', 'Assinaturas', 'FIXA', internetTemplate.id, mainAccount.id],
    ['2026-04-12', 'Internet fibra', 129.9, 'EXPENSE', 'Assinaturas', 'FIXA', internetTemplate.id, mainAccount.id],
    ['2026-05-12', 'Internet fibra', 129.9, 'EXPENSE', 'Assinaturas', 'FIXA', internetTemplate.id, mainAccount.id],
    ['2026-06-12', 'Internet fibra', 129.9, 'EXPENSE', 'Assinaturas', 'FIXA', internetTemplate.id, mainAccount.id],
    ['2026-01-15', 'Academia', 119.9, 'EXPENSE', 'Saude', 'FIXA', gymTemplate.id, mainAccount.id],
    ['2026-02-15', 'Academia', 119.9, 'EXPENSE', 'Saude', 'FIXA', gymTemplate.id, mainAccount.id],
    ['2026-03-15', 'Academia', 119.9, 'EXPENSE', 'Saude', 'FIXA', gymTemplate.id, mainAccount.id],
    ['2026-04-15', 'Academia', 119.9, 'EXPENSE', 'Saude', 'FIXA', gymTemplate.id, mainAccount.id],
    ['2026-05-15', 'Academia', 119.9, 'EXPENSE', 'Saude', 'FIXA', gymTemplate.id, mainAccount.id],
    ['2026-06-15', 'Academia', 119.9, 'EXPENSE', 'Saude', 'FIXA', gymTemplate.id, mainAccount.id],

    ['2026-01-21', 'Mercado do mes', 742.45, 'EXPENSE', 'Alimentacao', 'VARIAVEL', null, mainAccount.id],
    ['2026-02-19', 'Mercado do mes', 688.1, 'EXPENSE', 'Alimentacao', 'VARIAVEL', null, mainAccount.id],
    ['2026-03-20', 'Mercado do mes', 733.8, 'EXPENSE', 'Alimentacao', 'VARIAVEL', null, mainAccount.id],
    ['2026-04-18', 'Mercado do mes', 704.5, 'EXPENSE', 'Alimentacao', 'VARIAVEL', null, mainAccount.id],
    ['2026-05-20', 'Mercado do mes', 812.25, 'EXPENSE', 'Alimentacao', 'VARIAVEL', null, mainAccount.id],
    ['2026-06-04', 'Mercado do mes', 526.75, 'EXPENSE', 'Alimentacao', 'VARIAVEL', null, mainAccount.id],
    ['2026-02-03', 'Uber e transporte urbano', 186.4, 'EXPENSE', 'Transporte', 'VARIAVEL', null, mainAccount.id],
    ['2026-03-14', 'Combustivel', 312.7, 'EXPENSE', 'Transporte', 'VARIAVEL', null, mainAccount.id],
    ['2026-04-06', 'Consulta medica', 280, 'EXPENSE', 'Saude', 'VARIAVEL', null, mainAccount.id],
    ['2026-05-10', 'Curso TypeScript avancado', 349.9, 'EXPENSE', 'Educacao', 'VARIAVEL', null, mainAccount.id],
    ['2026-05-17', 'Filamentos PLA e PETG', 486.9, 'EXPENSE', 'Impressao 3D', 'VARIAVEL', null, mainAccount.id],
    ['2026-06-02', 'Bicos e mesa magnetica', 221.3, 'EXPENSE', 'Impressao 3D', 'VARIAVEL', null, mainAccount.id],
    ['2026-06-06', 'Restaurante fim de semana', 168.4, 'EXPENSE', 'Lazer', 'VARIAVEL', null, walletAccount.id],
    ['2026-06-11', 'Imposto DAS mensal', 186.92, 'EXPENSE', 'Imposto', 'FIXA', null, mainAccount.id],
    ['2026-06-25', 'Aporte reserva de emergencia', 900, 'EXPENSE', 'Outros', 'VARIAVEL', null, reserveAccount.id],
  ] as const;

  for (const [date, description, amount, type, category, expenseType, recurringTemplateId, accountId] of txData) {
    await prisma.transaction.create({
      data: {
        accountId,
        categoryId: categoryIds.get(category),
        recurringTemplateId,
        description,
        amountCents: cents(amount),
        type,
        category,
        expenseType,
        date,
        status: date > '2026-06-07' ? 'PENDING' : 'PAID',
      },
    });
  }

  await prisma.transaction.createMany({
    data: [
      {
        accountId: mainAccount.id,
        creditCardId: personalCard.id,
        categoryId: categoryIds.get('Assinaturas'),
        description: 'Streaming e ferramentas digitais',
        amountCents: cents(96.7),
        type: 'EXPENSE',
        category: 'Assinaturas',
        expenseType: 'FIXA',
        date: '2026-06-03',
        status: 'PAID',
      },
      {
        accountId: mainAccount.id,
        creditCardId: personalCard.id,
        categoryId: categoryIds.get('Lazer'),
        description: 'Cinema e jantar',
        amountCents: cents(214.8),
        type: 'EXPENSE',
        category: 'Lazer',
        expenseType: 'VARIAVEL',
        date: '2026-06-05',
        status: 'PAID',
      },
      {
        accountId: mainAccount.id,
        creditCardId: businessCard.id,
        categoryId: categoryIds.get('Impressao 3D'),
        description: 'Upgrade extrusora impressora',
        amountCents: cents(579.9),
        type: 'EXPENSE',
        category: 'Impressao 3D',
        expenseType: 'VARIAVEL',
        date: '2026-06-09',
        status: 'PENDING',
        isInstallment: true,
        installmentId: 'upgrade-extrusora-demo',
        currentInstallment: 1,
        totalInstallments: 3,
        interestRate: 0,
      },
    ],
  });
}

async function seedPrinting3d() {
  await prisma.supplier.createMany({
    data: [
      { name: '3D Prime', url: 'https://example.com/3d-prime', notes: 'Fornecedor demo de filamentos premium.' },
      { name: 'Maker Supply', url: 'https://example.com/maker-supply', notes: 'Pecas e acessorios para reposicao.' },
      { name: 'PrintLab Store', url: 'https://example.com/printlab-store', notes: 'Insumos para producao sob demanda.' },
    ],
  });

  const filaments = await Promise.all([
    prisma.filament.create({
      data: {
        brand: 'Bambu Lab',
        material: 'PLA',
        color: 'Cinza Matte',
        colorHex: '#9CA3AF',
        printTempMin: 205,
        printTempMax: 220,
        bedTempMin: 55,
        bedTempMax: 65,
        notes: 'Bom acabamento para pecas decorativas.',
      },
    }),
    prisma.filament.create({
      data: {
        brand: 'SUNLU',
        material: 'PETG',
        color: 'Transparente',
        colorHex: '#DDEBF7',
        printTempMin: 230,
        printTempMax: 245,
        bedTempMin: 75,
        bedTempMax: 85,
        notes: 'Usado em pecas funcionais e organizadores.',
      },
    }),
    prisma.filament.create({
      data: {
        brand: 'Fremover',
        material: 'PLA+',
        color: 'Verde Oliva',
        colorHex: '#556B2F',
        printTempMin: 205,
        printTempMax: 225,
        bedTempMin: 55,
        bedTempMax: 65,
        notes: 'Boa resistencia para prototipos.',
      },
    }),
    prisma.filament.create({
      data: {
        brand: 'Creality',
        material: 'TPU',
        color: 'Preto',
        colorHex: '#111827',
        printTempMin: 220,
        printTempMax: 235,
        bedTempMin: 40,
        bedTempMax: 55,
        notes: 'Flexivel, usado em pezinhos e protecoes.',
      },
    }),
  ]);

  await prisma.filamentPurchase.createMany({
    data: [
      {
        filamentId: filaments[0].id,
        store: '3D Prime',
        quantity: 2,
        unitPriceCents: cents(119.9),
        totalPriceCents: cents(239.8),
        purchaseDate: '2026-05-12',
        link: 'https://example.com/pedido/demo-pla-cinza',
        notes: 'Compra demo para portifolio.',
      },
      {
        filamentId: filaments[1].id,
        store: 'PrintLab Store',
        quantity: 1,
        unitPriceCents: cents(89.9),
        totalPriceCents: cents(89.9),
        purchaseDate: '2026-05-18',
        link: 'https://example.com/pedido/demo-petg-transparente',
      },
      {
        filamentId: filaments[2].id,
        store: 'Maker Supply',
        quantity: 2,
        unitPriceCents: cents(96.5),
        totalPriceCents: cents(193),
        purchaseDate: '2026-06-01',
        link: 'https://example.com/pedido/demo-pla-verde',
      },
      {
        filamentId: filaments[3].id,
        store: '3D Prime',
        quantity: 1,
        unitPriceCents: cents(132.9),
        totalPriceCents: cents(132.9),
        purchaseDate: '2026-06-03',
        link: 'https://example.com/pedido/demo-tpu-preto',
      },
    ],
  });

  await prisma.filamentStock.createMany({
    data: [
      {
        filamentId: filaments[0].id,
        type: 'ENTRADA',
        quantityInStock: 1540,
        usedGrams: 460,
        status: 'EM_USO',
        location: 'Prateleira A',
        notes: 'Carretel aberto na impressora principal.',
      },
      {
        filamentId: filaments[1].id,
        type: 'ENTRADA',
        quantityInStock: 760,
        usedGrams: 240,
        status: 'DISPONIVEL',
        location: 'Prateleira B',
      },
      {
        filamentId: filaments[2].id,
        type: 'ENTRADA',
        quantityInStock: 1810,
        usedGrams: 190,
        status: 'DISPONIVEL',
        location: 'Prateleira A',
      },
      {
        filamentId: filaments[3].id,
        type: 'ENTRADA',
        quantityInStock: 930,
        usedGrams: 70,
        status: 'DISPONIVEL',
        location: 'Caixa flexiveis',
      },
    ],
  });

  const printers = await Promise.all([
    prisma.printer.create({
      data: {
        name: 'Bambu Lab A1 Mini',
        powerWatts: 280,
      },
    }),
    prisma.printer.create({
      data: {
        name: 'Creality K1',
        powerWatts: 350,
      },
    }),
  ]);

  const accessories = await Promise.all([
    prisma.accessory.create({
      data: {
        name: 'Bico 0.4mm',
        costCents: cents(12.9),
        stock: 8,
      },
    }),
    prisma.accessory.create({
      data: {
        name: 'Embalagem kraft',
        costCents: cents(2.4),
        stock: 120,
      },
    }),
    prisma.accessory.create({
      data: {
        name: 'Fita dupla face',
        costCents: cents(1.1),
        stock: 60,
      },
    }),
  ]);

  const jobs = await Promise.all([
    prisma.printJob.create({
      data: {
        printerId: printers[0].id,
        filamentId: filaments[0].id,
        pieceName: 'Organizador modular de mesa',
        quantity: 4,
        gramsPerPiece: 86,
        totalGrams: 344,
        printTimeHours: 9.4,
        nozzleTemp: 215,
        bedTemp: 60,
        speedMmS: 180,
        retractionMm: 0.8,
        status: 'COMPLETED',
        energyCostCents: cents(3.95),
        filamentCostCents: cents(41.2),
      },
    }),
    prisma.printJob.create({
      data: {
        printerId: printers[1].id,
        filamentId: filaments[1].id,
        pieceName: 'Suporte de parede para controles',
        quantity: 6,
        gramsPerPiece: 52,
        totalGrams: 312,
        printTimeHours: 7.2,
        nozzleTemp: 240,
        bedTemp: 80,
        speedMmS: 140,
        retractionMm: 1.1,
        status: 'COMPLETED',
        energyCostCents: cents(3.4),
        filamentCostCents: cents(28.1),
      },
    }),
    prisma.printJob.create({
      data: {
        printerId: printers[0].id,
        filamentId: filaments[2].id,
        pieceName: 'Luminaria geometrica personalizada',
        quantity: 2,
        gramsPerPiece: 164,
        totalGrams: 328,
        printTimeHours: 11.8,
        nozzleTemp: 215,
        bedTemp: 60,
        speedMmS: 160,
        retractionMm: 0.8,
        status: 'PENDING',
        energyCostCents: 0,
        filamentCostCents: cents(31.65),
      },
    }),
  ]);

  await prisma.product.create({
    data: {
      name: 'Kit home office 3D',
      salePriceCents: cents(189.9),
      components: {
        create: [
          { jobId: jobs[0].id, quantity: 1 },
          { accessoryId: accessories[1].id, quantity: 1 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Suporte premium para controles',
      salePriceCents: cents(79.9),
      components: {
        create: [
          { jobId: jobs[1].id, quantity: 1 },
          { accessoryId: accessories[2].id, quantity: 2 },
          { accessoryId: accessories[0].id, quantity: 1 },
        ],
      },
    },
  });
}

async function main() {
  console.log('[seed:demo] Limpando dados atuais...');
  await clearDatabase();

  console.log('[seed:demo] Criando categorias e dados financeiros...');
  const categoryIds = await seedCategories();
  await seedFinance(categoryIds);

  console.log('[seed:demo] Criando dados de estoque e producao 3D...');
  await seedPrinting3d();

  const [transactions, filaments, jobs, products] = await Promise.all([
    prisma.transaction.count(),
    prisma.filament.count(),
    prisma.printJob.count(),
    prisma.product.count(),
  ]);

  console.log('[seed:demo] Concluido.');
  console.log(`[seed:demo] ${transactions} transacoes, ${filaments} filamentos, ${jobs} jobs e ${products} produtos criados.`);
}

main()
  .catch((error) => {
    console.error('[seed:demo] Falha ao gerar dados ficticios.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
