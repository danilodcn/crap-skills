---
name: crap4py
description: Use when the user asks for a CRAP report, cyclomatic complexity analysis, or code quality metrics on a Python project
---

# crap4py — métrica CRAP para Python

Calcula o CRAP (Change Risk Anti-Pattern) de cada função e método Python. O CRAP combina
complexidade ciclomática com cobertura de testes para encontrar o código mais arriscado de
mudar: complexo e mal testado.

## Pré-requisitos

O projeto alvo precisa de `radon` e `coverage`:

```bash
pip install "radon>=6.0" "coverage>=7.15"
```

Se o projeto usa `uv`:

```bash
uv add --dev "radon>=6.0" "coverage>=7.15"
```

## Uso

Rode a partir da raiz do projeto:

```bash
python ~/.claude/skills/crap4py/scripts/crap_py.py
```

Filtrando por fragmento de caminho:

```bash
python ~/.claude/skills/crap4py/scripts/crap_py.py src/billing
```

Durante uma revisão, restringindo às funções tocadas pela branch:

```bash
python ~/.claude/skills/crap4py/scripts/crap_py.py --diff main
```

Com uma invocação de teste diferente:

```bash
python ~/.claude/skills/crap4py/scripts/crap_py.py --test-command "coverage run -m pytest tests/unit"
```

Gravando apenas o JSON, sem imprimir a tabela:

```bash
python ~/.claude/skills/crap4py/scripts/crap_py.py --json-only
```

## O que ele faz

1. Apaga `target/crap/` e roda `coverage run -m pytest`
2. Exporta `coverage json` com dados por função
3. Roda `radon cc -j` sobre os fontes, ignorando testes, `.venv`, `target`
4. Casa complexidade e cobertura pela linha inicial de cada função
5. Aplica a fórmula, ordena pior primeiro, imprime a tabela e grava
   `target/crap/report.json`

## Saída

```text
CRAP Report
===========
Function                       Module                                CC    Cov%     CRAP
----------------------------------------------------------------------------------------
Order.process                  src.billing.order                     12   45.0%     36.0
parse_config                   src.config                             3  100.0%      3.0
```

| CRAP | Leitura |
|------|---------|
| 1–5  | Limpo |
| 5–30 | Refatorar ou adicionar testes |
| 30+  | Complexo e mal testado |

`N/A` significa que o arquivo não apareceu no relatório de cobertura — não medido, que é
diferente de não testado.

## Regras da métrica

Fórmula, faixas, contrato JSON, ordenação e modo revisão estão em
`crap-report/references/crap-spec.md`. As duas implementações seguem esse documento;
divergência entre elas é bug.

## Se a suíte falhar

O relatório ainda é gerado, com aviso em stderr de que os números podem estar
subestimados. Um relatório parcial e sinalizado é mais útil durante uma revisão do que
nenhum.
