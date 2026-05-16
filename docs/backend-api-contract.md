# Contrato da API

Este arquivo registra o comportamento esperado do back-end para o front web. Antes de implementar ou alterar consumo de API, leia este contrato junto com `docs/ai-guidelines.md` e `docs/project-architecture.md`.

## Autenticacao

Todas as rotas protegidas usam:

```http
Authorization: Bearer TOKEN
```

Se qualquer rota protegida retornar `401`, o front deve limpar a sessao local e redirecionar para `/login`.

## Rendas

As rendas usam os endpoints de `incomes`.

```http
GET /api/incomes/
POST /api/incomes/
PATCH /api/incomes/{id}
DELETE /api/incomes/{id}
DELETE /api/incomes/{id}?delete_future=true
```

Fontes possiveis:

- `Salario`
- `Salário`
- `Adiantamento`
- `Renda Extra`

Ao buscar rendas, o front recebe uma lista e filtra localmente por `month`, `year` e `source`.

### Buscar rendas

```http
GET /api/incomes/
Authorization: Bearer TOKEN
```

Filtro para salario:

```ts
(income.source === "Salario" || income.source === "Salário") &&
income.month === selectedMonth &&
income.year === selectedYear
```

Filtro para adiantamento:

```ts
income.source === "Adiantamento" &&
income.month === selectedMonth &&
income.year === selectedYear
```

Filtro para renda extra:

```ts
income.source === "Renda Extra" &&
income.month === selectedMonth &&
income.year === selectedYear
```

## Salario

### Criar salario

Quando nao existe salario naquele mes/ano:

```http
POST /api/incomes/
Authorization: Bearer TOKEN
```

Body:

```json
{
  "source": "Salario",
  "amount": 2752.0,
  "month": 5,
  "year": 2026,
  "type": "Fixa",
  "repeat_future": null
}
```

`repeat_future` so e usado pela renda extra no Android. Para salario pode mandar `null` ou omitir, conforme o back aceitar.

### Editar salario

Quando ja existe salario naquele mes/ano:

```http
PATCH /api/incomes/{incomeId}
Authorization: Bearer TOKEN
```

Body:

```json
{
  "amount": 3000.0,
  "update_future": true
}
```

Checkbox:

- Marcado: `update_future: true`
- Desmarcado: `update_future: false`

Texto do checkbox: `Atualizar este e os próximos meses`.

### Excluir salario

```http
DELETE /api/incomes/{incomeId}
Authorization: Bearer TOKEN
```

Se o usuario marcar `Excluir esta e as próximas`, mandar:

```http
DELETE /api/incomes/{incomeId}?delete_future=true
```

Se nao marcar, nao mandar `delete_future`.

## Adiantamento

### Criar adiantamento

Mesma logica do salario, mudando o `source`:

```http
POST /api/incomes/
Authorization: Bearer TOKEN
```

Body:

```json
{
  "source": "Adiantamento",
  "amount": 1000.0,
  "month": 5,
  "year": 2026,
  "type": "Fixa",
  "repeat_future": null
}
```

### Editar adiantamento

```http
PATCH /api/incomes/{incomeId}
Authorization: Bearer TOKEN
```

Body:

```json
{
  "amount": 1200.0,
  "update_future": true
}
```

### Excluir adiantamento

```http
DELETE /api/incomes/{incomeId}
Authorization: Bearer TOKEN
```

Ou, para excluir futuras:

```http
DELETE /api/incomes/{incomeId}?delete_future=true
```

## Renda Extra

### Criar renda extra

Quando nao existe renda extra naquele mes/ano:

```http
POST /api/incomes/
Authorization: Bearer TOKEN
```

Body:

```json
{
  "source": "Renda Extra",
  "amount": 500.0,
  "month": 5,
  "year": 2026,
  "type": "Fixa",
  "repeat_future": true
}
```

Campo importante:

- Marcado: `repeat_future: true`
- Desmarcado: `repeat_future: false`

Texto do checkbox: `Repetir nos próximos meses`.

Na criacao de renda extra, sempre usar `type: "Fixa"` e controlar repeticao apenas com `repeat_future`.

### Editar renda extra

Quando ja existe renda extra naquele mes/ano:

```http
PATCH /api/incomes/{incomeId}
Authorization: Bearer TOKEN
```

Body:

```json
{
  "amount": 700.0,
  "update_future": true
}
```

Checkbox:

- Marcado: `update_future: true`
- Desmarcado: `update_future: false`

Texto do checkbox: `Atualizar este e os próximos meses`.

### Excluir renda extra

```http
DELETE /api/incomes/{incomeId}
Authorization: Bearer TOKEN
```

Se o usuario marcar `Excluir esta e as próximas`, mandar:

```http
DELETE /api/incomes/{incomeId}?delete_future=true
```

Se nao marcar, nao mandar o parametro `delete_future`.

## Despesas

### Buscar despesas

Na tela de despesas, buscar por mes e ano:

```http
GET /api/expenses?month=5&year=2026
Authorization: Bearer TOKEN
```

Resposta esperada:

```json
{
  "expenses": [
    {
      "id": 1,
      "category_id": 2,
      "amount": 100.0,
      "description": "Supermercado",
      "date": "2026-05-08T00:00:00-03:00",
      "type": "Única",
      "installments": 1,
      "current_installment": null,
      "payment_source": "Salário"
    }
  ],
  "total": 1
}
```

### Buscar categorias

Categorias sao usadas para montar nome e icone.

```http
GET /api/categories/
Authorization: Bearer TOKEN
```

Montar map local:

```ts
const categoriesMap = {
  [category.id]: category.name,
};
```

### Criar categoria

Na tela de criar despesa existe um botao `+` no campo categoria. Ele cria a categoria e, depois da resposta, adiciona a categoria na lista local e ja deixa ela selecionada.

```http
POST /api/categories/
Authorization: Bearer TOKEN
```

Body:

```json
{
  "name": "Mercado"
}
```

### Filtros de despesas

Na tela `Despesas`, os filtros sao locais por texto e tipo.

Busca:

```ts
expense.description.includes(searchQuery)
```

Filtro por tipo:

- `Todas`: mostra tudo
- `Parceladas`: `expense.type === "Parcelada"`
- `Únicas`: `expense.type === "Única"` ou `expense.type === "Unica"`
- `Fixas`: `expense.type === "Fixa"`

Na Home, filtros locais por categoria e origem de pagamento.

Filtro por categoria:

```ts
selectedCategoryId == null || expense.category_id === selectedCategoryId
```

Filtro por origem:

```ts
selectedPaymentSource == null
```

```ts
selectedPaymentSource === "Salario" &&
(expense.payment_source === "Salario" || expense.payment_source === "Salário")
```

```ts
selectedPaymentSource === "Adiantamento" &&
expense.payment_source === "Adiantamento"
```

```ts
selectedPaymentSource === "Renda Extra" &&
expense.payment_source === "Renda Extra"
```

### Adicionar despesa

Antes de criar, carregar categorias:

```http
GET /api/categories/
Authorization: Bearer TOKEN
```

Campos do formulario:

- `amount`
- `description`
- `category_id`
- `payment_source`
- `date`
- `type`
- `installments`

Origens possiveis:

- `Salário`
- `Adiantamento`
- `Renda Extra`

Tipos possiveis:

- `Única`
- `Parcelada`
- `Fixa`

Se o tipo for `Parcelada`, o usuario escolhe a quantidade de parcelas. Se for `Única` ou `Fixa`, mandar `installments: 1`.

Endpoint:

```http
POST /api/expenses/
Authorization: Bearer TOKEN
```

Body de despesa unica:

```json
{
  "amount": 150.75,
  "description": "Supermercado",
  "category_id": 2,
  "payment_source": "Salário",
  "date": "2026-05-08T00:00:00-03:00",
  "type": "Única",
  "installments": 1
}
```

Body de despesa parcelada:

```json
{
  "amount": 500.0,
  "description": "Celular",
  "category_id": 4,
  "payment_source": "Adiantamento",
  "date": "2026-05-08T00:00:00-03:00",
  "type": "Parcelada",
  "installments": 5
}
```

Body de despesa fixa:

```json
{
  "amount": 89.9,
  "description": "Internet",
  "category_id": 3,
  "payment_source": "Salário",
  "date": "2026-05-08T00:00:00-03:00",
  "type": "Fixa",
  "installments": 1
}
```

### Editar despesa

Primeiro buscar os dados da despesa:

```http
GET /api/expenses/{expenseId}
Authorization: Bearer TOKEN
```

Tambem buscar categorias:

```http
GET /api/categories/
Authorization: Bearer TOKEN
```

Preencher formulario com:

- `amount`
- `description`
- `category_id`
- `payment_source`
- `date`
- `type`

Na edicao, o app Android nao deixa trocar o tipo diretamente. Ele guarda o tipo original em `originalType`.

Endpoint:

```http
PATCH /api/expenses/{expenseId}
Authorization: Bearer TOKEN
```

Body:

```json
{
  "amount": 200.0,
  "description": "Mercado atualizado",
  "category_id": 2,
  "payment_source": "Salário",
  "date": "2026-05-08T00:00:00-03:00",
  "update_future": null
}
```

Regra do `update_future`:

- Despesa `Única`: `update_future: null`
- Despesa `Parcelada` marcada para atualizar parcelas futuras: `update_future: true`
- Despesa `Parcelada` desmarcada: `update_future: false`
- Despesa `Fixa` marcada para atualizar despesas futuras: `update_future: true`

No Android, quando e fixa e o usuario marca atualizar futuras, aparece uma confirmacao antes de chamar o `PATCH`.

### Excluir despesa

Na listagem, cada despesa tem botao de excluir. Ao clicar, abrir confirmacao.

Endpoint:

```http
DELETE /api/expenses/{expenseId}
Authorization: Bearer TOKEN
```

Regras:

- Despesa `Única`: `DELETE /api/expenses/{expenseId}`
- Despesa `Parcelada` com checkbox `Excluir esta e todas as futuras` marcado: `DELETE /api/expenses/{expenseId}?delete_future=true`
- Despesa `Parcelada` sem checkbox marcado: `DELETE /api/expenses/{expenseId}`
- Despesa `Fixa`: o back-end sempre trata como exclusao futura, mesmo sem query string.

Para despesa fixa, estas chamadas tem o mesmo efeito:

```http
DELETE /api/expenses/{expenseId}
DELETE /api/expenses/{expenseId}?delete_future=true
```

Ambas removem a despesa do mes atual selecionado e todos os proximos registros da mesma serie, usando a regra:

```ts
year > ano_atual || (year === ano_atual && month >= mes_atual)
```

O back-end ainda nao suporta excluir somente o mes atual de uma despesa fixa.

## Resumo rapido

Rendas:

- `GET /api/incomes/`
- `POST /api/incomes/`
- `PATCH /api/incomes/{id}`
- `DELETE /api/incomes/{id}?delete_future=true` opcional

Despesas:

- `GET /api/expenses?month=&year=`
- `GET /api/expenses/{id}`
- `POST /api/expenses/`
- `PATCH /api/expenses/{id}`
- `DELETE /api/expenses/{id}?delete_future=true` opcional

Filtros sao locais no front:

- Categoria por `category_id`
- Origem por `payment_source`
- Tipo por `type`
- Busca por `description`

## Relatorios

Todas as rotas protegidas usam `Authorization: Bearer TOKEN` e seguem o tratamento global de `401`.

### Resumo financeiro mensal

```http
GET /api/reports/summary?month=5&year=2026
```

Campos usados no front:

- `total_income`
- `total_expense`
- `total_geral_disponivel`
- saldos e gastos por origem quando necessario

### Gastos por categoria

```http
GET /api/reports/categories?month=5&year=2026
```

Resposta esperada:

```json
[
  {
    "category_id": 1,
    "category_name": "Mercado",
    "total_amount": 800.0,
    "percentage": 45.5
  }
]
```

No web, o grafico de categorias deve ser de pizza. A lista lateral deve ordenar por `total_amount` decrescente.

### Grafico anual de renda vs despesa

```http
GET /api/reports/chart?year=2026
```

Resposta esperada:

```json
[
  {
    "month": 1,
    "income": 2752.0,
    "expense": 1800.0
  }
]
```

O filtro de periodo e local no front:

- `1 mês`: somente o mes selecionado
- `6 meses`: de `month - 3` ate `month + 2`, limitado entre 1 e 12
- `1 ano`: todos os dados retornados

### Resumo anual

```http
GET /api/reports/yearly-summary?year=2026
```

Resposta esperada:

```json
{
  "economia_total": 5500.0,
  "media_mensal": 458.33,
  "year": 2026
}
```
