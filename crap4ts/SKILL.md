---
name: crap4ts
description: Use when the user asks for a CRAP report, cyclomatic complexity analysis, or code quality metrics on a TypeScript project
---

# crap4ts — métrica CRAP para TypeScript

Calcula o CRAP (Change Risk Anti-Pattern) de cada função e método TypeScript. O CRAP
combina complexidade ciclomática com cobertura de testes para encontrar o código mais
arriscado de mudar: complexo e mal testado.

## Pré-requisitos

O projeto alvo precisa de `typescript` e de uma suíte com cobertura **istanbul**:

```bash
npm install --save-dev typescript @vitest/coverage-istanbul
```

O provider istanbul é obrigatório. O padrão do vitest é v8, cujo mapa de statements é
reconstruído a partir de ranges de bytes e não casa de forma confiável por linha.

## Uso

Rode a partir da raiz do projeto:

```bash
node ~/.claude/skills/crap4ts/scripts/crap_ts.mjs
```

Filtrando por fragmento de caminho:

```bash
node ~/.claude/skills/crap4ts/scripts/crap_ts.mjs src/billing
```

Durante uma revisão, restringindo às funções tocadas pela branch:

```bash
node ~/.claude/skills/crap4ts/scripts/crap_ts.mjs --diff main
```

Com uma invocação de teste diferente:

```bash
node ~/.claude/skills/crap4ts/scripts/crap_ts.mjs --test-command "npx vitest run --coverage --coverage.provider=istanbul --coverage.reporter=json"
```

Gravando apenas o JSON, sem imprimir a tabela:

```bash
node ~/.claude/skills/crap4ts/scripts/crap_ts.mjs --json-only
```

## O que ele faz

1. Apaga `target/crap/` e roda vitest ou jest com cobertura istanbul
2. Lê `coverage/coverage-final.json`
3. Extrai complexidade via TypeScript Compiler API, ignorando `node_modules`, `dist`,
   `*.test.ts`, `*.spec.ts`, `*.d.ts`
4. Casa cobertura por range de linhas, descontando statements de funções aninhadas
5. Aplica a fórmula, ordena pior primeiro, imprime a tabela e grava
   `target/crap/report.json`

## Saída

```text
CRAP Report
===========
Function                       Module                                CC    Cov%     CRAP
----------------------------------------------------------------------------------------
Order.process                  src/billing/order                     12   45.0%     36.0
parseConfig                    src/config                             3  100.0%      3.0
```

| CRAP | Leitura |
|------|---------|
| 1–5  | Limpo |
| 5–30 | Refatorar ou adicionar testes |
| 30+  | Complexo e mal testado |

`N/A` significa que o arquivo não apareceu no relatório de cobertura — não medido, que é
diferente de não testado.

## Funções aninhadas

Cada arrow ou callback é uma entrada própria: o CC não soma no pai e os statements dela
não contam na cobertura do pai. Callbacks inline costumam ter CC 1 e caem para o fim da
ordenação.

## Regras da métrica

Fórmula, faixas, contrato JSON, ordenação e modo revisão estão em
`crap-report/references/crap-spec.md`. As duas implementações seguem esse documento;
divergência entre elas é bug.
