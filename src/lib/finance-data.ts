export type TxType = "receita" | "despesa";
export type TxStatus = "pago" | "pendente";

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  category: string;
  amount: number;
  type: TxType;
  status: TxStatus;
}

export const CATEGORIES = [
  "Salário",
  "Freelance",
  "Investimentos",
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Lazer",
  "Educação",
  "Assinaturas",
] as const;

export const MONTHS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
];

export const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const formatDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

const mk = (
  id: string,
  date: string,
  description: string,
  category: string,
  amount: number,
  type: TxType,
  status: TxStatus = "pago",
): Transaction => ({ id, date, description, category, amount, type, status });

function monthSet(prefix: string, ym: string, variation: number): Transaction[] {
  return [
    mk(`${prefix}-1`, `${ym}-05`, "Salário mensal", "Salário", 8500, "receita"),
    mk(`${prefix}-2`, `${ym}-12`, "Projeto freelance", "Freelance", 1200 + variation * 90, "receita"),
    mk(`${prefix}-3`, `${ym}-20`, "Dividendos e juros", "Investimentos", 320 + variation * 25, "receita"),
    mk(`${prefix}-4`, `${ym}-06`, "Aluguel + condomínio", "Moradia", 2450, "despesa"),
    mk(`${prefix}-5`, `${ym}-09`, "Supermercado do mês", "Alimentação", 980 + variation * 40, "despesa"),
    mk(`${prefix}-6`, `${ym}-11`, "Combustível e app", "Transporte", 460 + variation * 20, "despesa"),
    mk(`${prefix}-7`, `${ym}-15`, "Plano de saúde", "Saúde", 520, "despesa"),
    mk(`${prefix}-8`, `${ym}-18`, "Cinema, bares e viagens", "Lazer", 380 + variation * 55, "despesa"),
    mk(`${prefix}-9`, `${ym}-22`, "Curso online", "Educação", 240, "despesa", variation % 2 === 0 ? "pago" : "pendente"),
    mk(`${prefix}-10`, `${ym}-25`, "Streaming e softwares", "Assinaturas", 149.9, "despesa"),
  ];
}

export const YEAR = 2026;

export const transactions: Transaction[] = Array.from({ length: 8 }, (_, i) => {
  const month = String(i + 1).padStart(2, "0");
  return monthSet(`m${month}`, `${YEAR}-${month}`, i);
}).flat();

export const getMonth = (tx: Transaction) => Number(tx.date.slice(5, 7));

export const budgets = [
  { category: "Moradia", limit: 2600 },
  { category: "Alimentação", limit: 1200 },
  { category: "Transporte", limit: 600 },
  { category: "Lazer", limit: 700 },
  { category: "Saúde", limit: 600 },
  { category: "Assinaturas", limit: 200 },
];

export const goals = [
  { name: "Reserva de emergência", target: 30000, saved: 18400 },
  { name: "Viagem Patagônia", target: 12000, saved: 4300 },
  { name: "Notebook novo", target: 9000, saved: 6750 },
];
