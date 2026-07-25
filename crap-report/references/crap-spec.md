# Especificação CRAP compartilhada

Fonte de verdade para `crap4py` e `crap4ts`. Divergências entre as duas implementações
são bugs.

## Fórmula

```text
CRAP = CC² × (1 - coverage/100)³ + CC
```

`CC` é a complexidade ciclomática (pontos de decisão + 1). `coverage` é o percentual de
statements cobertos dentro do range da função.

Casos de referência, conferidos contra a fórmula:

| CC | Coverage | CRAP  |
|----|----------|-------|
| 1  | 100%     | 1.0   |
| 3  | 100%     | 3.0   |
| 10 | 80%      | 10.8  |
| 12 | 45%      | 36.0  |
| 5  | 0%       | 30.0  |
| 12 | 0%       | 156.0 |
| 5  | ausente  | null  |

A tabela do README do crap4go mostra `CC 12, 45%, 130.2`, que não satisfaz a própria
fórmula. Não usar como referência nem para calibrar testes.

## Faixas

| CRAP | Risco |
|------|-------|
| 1–5  | Baixo — código limpo |
| 5–30 | Moderado — refatorar ou adicionar testes |
| 30+  | Alto — complexo e mal testado |

`crappy` conta entradas com CRAP ≥ 30.

## Cobertura ausente

- Arquivo fora do relatório de cobertura → `coverage: null`, `crap: null`, exibido `N/A`
- Arquivo presente no relatório, mas a função não tem statements medidos no seu range → `coverage: 0.0`

"Não medido" não é "não testado".

## Ordenação

CRAP decrescente; `null` por último; empate por nome ascendente.

## Funções aninhadas

Cada função aninhada é uma entrada própria. O CC dela não soma no pai e os statements
dela não contam na cobertura do pai. Divergência consciente do crap4go, que acumula
closures na função externa.

## Contrato JSON

Gravado em `target/crap/report.json`.

```json
{
  "version": 1,
  "language": "python",
  "generated_at": "2026-07-24T19:40:00Z",
  "filters": { "paths": [], "diff_base": null },
  "summary": { "functions": 42, "crappy": 3, "max_crap": 36.0 },
  "entries": [
    {
      "name": "Order.process",
      "module": "src.billing.order",
      "file": "src/billing/order.py",
      "start_line": 12,
      "end_line": 48,
      "complexity": 12,
      "coverage": 45.0,
      "crap": 36.0,
      "statements": 20,
      "covered_statements": 9
    }
  ]
}
```

## Formato da tabela

```text
CRAP Report
===========
Function                       Module                                CC    Cov%     CRAP
----------------------------------------------------------------------------------------
Order.process                  src.billing.order                     12   45.0%     36.0
parse_config                   src.config                             3  100.0%      3.0
legacy_helper                  src.legacy                             7     N/A      N/A
```

Formato de cada linha, com um espaço entre todas as colunas, totalizando 88 caracteres:

```text
{name:<30} {module:<35} {complexity:>4} {coverage:>7} {crap:>8}
```

Cobertura e CRAP ausentes imprimem `N/A` no lugar do número.

## Modo revisão

`--diff BASE` filtra o relatório para funções tocadas, sem alterar a medição: a suíte
completa continua rodando.

1. `git diff --unified=0 BASE...HEAD -- <extensions>`
2. Parsear headers `@@ -a,b +c,d @@`, extraindo o range do arquivo novo
3. Incluir a função quando `[start_line, end_line]` intersecta algum hunk

Três pontos, não dois: `BASE...HEAD` usa o merge-base e mostra só o que a branch trouxe.
Quando o count é omitido (`@@ -41 +41 @@`), vale 1. Quando o count é 0, o hunk é uma
deleção pura e o range vira `(start, start)`, capturando a função que perdeu linhas.

## CLI

```text
<skill> [path-filter ...] [--test-command CMD] [--diff BASE] [--json-only] [-h]
```
