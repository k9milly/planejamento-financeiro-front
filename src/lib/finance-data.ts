/**
 * Tipos e dados mocados do domínio financeiro.
 *
 * Nomenclatura em português (valor, tipo, contaId, categoriaId,
 * formaPagamento, diaVencimento...) de propósito: é o mesmo vocabulário do
 * contrato da API real (ver docs/CONTRATO-API.md do backend), então a
 * integração futura não exige tradução de campo nenhuma — só trocar a
 * origem do dado (mock → fetch).
 */

export type TipoLancamento =
  "entrada" | "saida" | "guardado" | "retirado" | "rendimento" | "perda" | "transferencia";

export type FormaPagamento = "credito" | "debito" | "pix" | "dinheiro";

/** Só relevante para `tipo` "rendimento"/"perda": onde o ganho/perda é aplicado. */
export type DestinoRendimento = "conta" | "guardado";

export type TipoConta = "corrente" | "cartao_credito";

export type Importancia = "alta" | "media" | "baixa";

export interface Categoria {
  id: string;
  nome: string;
  cor: string;
  ativa: boolean;
}

export interface Conta {
  id: string;
  nome: string;
  cor: string;
  tipo: TipoConta;
  /** 1–31; só quando tipo === "cartao_credito". */
  diaVencimentoFatura?: number;
  /** Mock — no domínio real vem calculado do resumo do mês. */
  saldo: number;
  /** Mock — só quando tipo === "cartao_credito". */
  faturaEmAberto?: number;
}

export interface Lancamento {
  id: string;
  data: string; // ISO yyyy-mm-dd
  descricao: string;
  valor: number;
  tipo: TipoLancamento;
  contaId: string;
  /** Só quando tipo === "saida". */
  categoriaId?: string;
  /** Só quando tipo === "saida". */
  formaPagamento?: FormaPagamento;
  /** Só quando tipo === "transferencia". */
  contaDestinoId?: string;
  /** Só quando tipo === "rendimento" ou "perda". */
  destino?: DestinoRendimento;
}

export interface GastoFixo {
  id: string;
  descricao: string;
  valor: number;
  diaVencimento: number;
  contaId: string;
  categoriaId?: string;
  formaPagamento?: FormaPagamento;
  ativo: boolean;
  /** Situação por mês (1–12) do ano corrente — chave ausente = pendente. */
  situacoes: Record<number, "pago" | "pendente">;
}

export interface Desejo {
  id: string;
  desejo: string;
  valor: number;
  importancia: Importancia;
  somar: boolean;
  comprado: boolean;
}

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

export const YEAR = 2026;

export const ROTULO_TIPO_LANCAMENTO: Record<TipoLancamento, string> = {
  entrada: "Entrada",
  saida: "Saída",
  guardado: "Guardado",
  retirado: "Retirado",
  rendimento: "Rendimento",
  perda: "Perda",
  transferencia: "Transferência",
};

export const ROTULO_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  credito: "Crédito",
  debito: "Débito",
  pix: "Pix",
  dinheiro: "Dinheiro",
};

// ---------------------------------------------------------------------------
// Categorias
// ---------------------------------------------------------------------------

export const categorias: Categoria[] = [
  { id: "salario", nome: "Salário", cor: "#22c55e", ativa: true },
  { id: "freelance", nome: "Freelance", cor: "#84cc16", ativa: true },
  { id: "investimentos", nome: "Investimentos", cor: "#eab308", ativa: true },
  { id: "moradia", nome: "Moradia", cor: "#f97316", ativa: true },
  { id: "alimentacao", nome: "Alimentação", cor: "#ef4444", ativa: true },
  { id: "transporte", nome: "Transporte", cor: "#ec4899", ativa: true },
  { id: "saude", nome: "Saúde", cor: "#8b5cf6", ativa: true },
  { id: "lazer", nome: "Lazer", cor: "#06b6d4", ativa: true },
  { id: "educacao", nome: "Educação", cor: "#3b82f6", ativa: true },
  { id: "assinaturas", nome: "Assinaturas", cor: "#64748b", ativa: true },
];

export const categoriaPorId = (id: string | undefined) =>
  id ? categorias.find((c) => c.id === id) : undefined;

export const categoriaPorNome = (nome: string) => categorias.find((c) => c.nome === nome);

// ---------------------------------------------------------------------------
// Contas
// ---------------------------------------------------------------------------

export const accounts: Conta[] = [
  { id: "nubank", nome: "Nubank", cor: "#820ad1", tipo: "corrente", saldo: 8420.5 },
  { id: "mercado-pago", nome: "Mercado Pago", cor: "#00b1ea", tipo: "corrente", saldo: 1265.3 },
  {
    id: "nubank-cartao",
    nome: "Nubank Cartão",
    cor: "#f97316",
    tipo: "cartao_credito",
    diaVencimentoFatura: 15,
    saldo: 0,
    faturaEmAberto: 1874.4,
  },
];

export const contaPorId = (id: string | undefined) =>
  id ? accounts.find((c) => c.id === id) : undefined;

// ---------------------------------------------------------------------------
// Lançamentos
// ---------------------------------------------------------------------------

function mk(
  id: string,
  data: string,
  descricao: string,
  valor: number,
  tipo: TipoLancamento,
  extra: Partial<Lancamento> = {},
): Lancamento {
  return { id, data, descricao, valor, tipo, contaId: "nubank", ...extra };
}

function monthSet(prefix: string, ym: string, variation: number): Lancamento[] {
  return [
    mk(`${prefix}-1`, `${ym}-05`, "Salário mensal", 8500, "entrada", { contaId: "nubank" }),
    mk(`${prefix}-2`, `${ym}-12`, "Projeto freelance", 1200 + variation * 90, "entrada", {
      contaId: "mercado-pago",
    }),
    mk(`${prefix}-3`, `${ym}-20`, "Dividendos e juros", 320 + variation * 25, "rendimento", {
      contaId: "nubank",
      destino: "conta",
    }),
    mk(`${prefix}-4`, `${ym}-06`, "Aluguel + condomínio", 2450, "saida", {
      contaId: "nubank",
      categoriaId: "moradia",
      formaPagamento: "debito",
    }),
    mk(`${prefix}-5`, `${ym}-09`, "Supermercado do mês", 980 + variation * 40, "saida", {
      contaId: "nubank-cartao",
      categoriaId: "alimentacao",
      formaPagamento: "credito",
    }),
    mk(`${prefix}-6`, `${ym}-11`, "Combustível e app", 460 + variation * 20, "saida", {
      contaId: "mercado-pago",
      categoriaId: "transporte",
      formaPagamento: "pix",
    }),
    mk(`${prefix}-7`, `${ym}-15`, "Plano de saúde", 520, "saida", {
      contaId: "nubank",
      categoriaId: "saude",
      formaPagamento: "debito",
    }),
    mk(`${prefix}-8`, `${ym}-18`, "Cinema, bares e viagens", 380 + variation * 55, "saida", {
      contaId: "nubank-cartao",
      categoriaId: "lazer",
      formaPagamento: "credito",
    }),
    mk(`${prefix}-9`, `${ym}-22`, "Curso online", 240, "saida", {
      contaId: "nubank",
      categoriaId: "educacao",
      formaPagamento: "dinheiro",
    }),
    mk(`${prefix}-10`, `${ym}-25`, "Streaming e softwares", 149.9, "saida", {
      contaId: "nubank-cartao",
      categoriaId: "assinaturas",
      formaPagamento: "credito",
    }),
    mk(`${prefix}-11`, `${ym}-28`, "Reserva do mês", 500, "guardado", { contaId: "nubank" }),
  ];
}

const monthly: Lancamento[] = Array.from({ length: 8 }, (_, i) => {
  const month = String(i + 1).padStart(2, "0");
  return monthSet(`m${month}`, `${YEAR}-${month}`, i);
}).flat();

/** Alguns exemplos extras, num mês só, para mostrar os tipos menos comuns na tela. */
const exemplosExtras: Lancamento[] = [
  mk("extra-1", `${YEAR}-08-08`, "Ajuste de carteira de ações", 180, "perda", {
    contaId: "nubank",
    destino: "guardado",
  }),
  mk("extra-2", `${YEAR}-08-14`, "Retirada da reserva para imprevisto", 300, "retirado", {
    contaId: "nubank",
  }),
  mk("extra-3", `${YEAR}-08-19`, "Transferência para o Mercado Pago", 400, "transferencia", {
    contaId: "nubank",
    contaDestinoId: "mercado-pago",
  }),
];

export const transactions: Lancamento[] = [...monthly, ...exemplosExtras];

export const getMonth = (t: Lancamento) => Number(t.data.slice(5, 7));

// ---------------------------------------------------------------------------
// Gastos fixos
// ---------------------------------------------------------------------------

export const gastosFixos: GastoFixo[] = [
  {
    id: "gf-aluguel",
    descricao: "Aluguel",
    valor: 2450,
    diaVencimento: 5,
    contaId: "nubank",
    categoriaId: "moradia",
    formaPagamento: "debito",
    ativo: true,
    situacoes: { 1: "pago", 2: "pago", 3: "pago", 4: "pago", 5: "pago", 6: "pago", 7: "pago" },
  },
  {
    id: "gf-internet",
    descricao: "Internet + streaming",
    valor: 149.9,
    diaVencimento: 10,
    contaId: "nubank",
    categoriaId: "assinaturas",
    formaPagamento: "debito",
    ativo: true,
    situacoes: { 1: "pago", 2: "pago", 3: "pago", 4: "pago", 5: "pago", 6: "pago", 7: "pago" },
  },
  {
    id: "gf-academia",
    descricao: "Academia",
    valor: 129.9,
    diaVencimento: 8,
    contaId: "nubank-cartao",
    categoriaId: "saude",
    formaPagamento: "credito",
    ativo: true,
    situacoes: { 1: "pago", 2: "pago", 3: "pendente", 4: "pago", 5: "pago", 6: "pago", 7: "pago" },
  },
];

// ---------------------------------------------------------------------------
// Wishlist
// ---------------------------------------------------------------------------

export const wishlistPadrao: Desejo[] = [
  {
    id: "w-fone",
    desejo: "Fone com cancelamento de ruído",
    valor: 1450,
    importancia: "media",
    somar: true,
    comprado: false,
  },
  {
    id: "w-viagem",
    desejo: "Viagem para a Patagônia",
    valor: 12000,
    importancia: "alta",
    somar: true,
    comprado: false,
  },
  {
    id: "w-notebook",
    desejo: "Notebook novo",
    valor: 9000,
    importancia: "alta",
    somar: false,
    comprado: false,
  },
];

/** Mock fixo de "total guardado", até haver uma fonte real (soma de reservas por conta). */
export const totalGuardadoMock = 6750;

// ---------------------------------------------------------------------------
// Metas & Orçamentos (tela intocada — só os nomes de categoria continuam
// batendo com `categorias` acima, que é o que a tela usa para achar gasto).
// ---------------------------------------------------------------------------

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
