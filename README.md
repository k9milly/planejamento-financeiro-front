# Amethyst Finance

Crie uma interface moderna e completa de sistema de planejamento financeiro pessoal, estilo dashboard/SaaS. 
Diretrizes de Design:
- Tema: Dark Mode refinado com paleta em tons de roxo escuro (Deep Purple/Dark Violet), fundo com contraste adequado, texto legível em branco/cinza claro, e destaques em tons de verde (entradas) e vermelho/rosa (saídas).
- Estilo do layout: Limpo, fluido e responsivo (estilo aplicativo web de alta performance).
Estrutura de Layout e Componentes:
1. Header/Sidebar:
   - Logo/Nome do App ("Planejamento Financeiro").
   - Menu de navegação: Dashboard, Lançamentos, Tabela Dinâmica, Metas & Orçamentos, Configurações.
   - Filtro de Período Global (Mês/Ano) no topo.
2. Seção "Dashboard":
   - Cards de KPI no topo: Saldo Total, Entradas do Mês, Saídas do Mês, Taxa de Poupança (%).
   - Gráfico de Barras/Linha comparativo: Entradas vs Saídas ao longo dos meses.
   - Gráfico de Rosca/Donut: Distribuição das Saídas por Categoria.
3. Seção "Lançamentos" (Estilo Planilha Interativa):
   - Barra de busca e filtros rápidos (Categoria, Tipo: Receita/Despesa, Status: Pago/Pendente).
   - Tabela estilizada (grid limpo estilo Google Sheets) mostrando: Data, Descrição, Categoria, Valor (R$), Tipo, Status e Botões de Ação (Editar/Excluir).
   - Botão destacado "Novo Lançamento" que abra um Modal limpo para inserção de dados.
4. Seção "Tabela Dinâmica / Análise":
   - Tabela resumida cruzando Categorias x Meses para análise rápida de gastos acumulados.
Gere componentes modulares em React com Tailwind CSS e Lucide Icons, utilizando dados mocado-exemplo bem estruturados.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c044c6d3-5c5f-4e76-80f3-c6dbd0ffa8df).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
