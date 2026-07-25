---
name: crap-report
description: Use when the user asks for a CRAP report or code quality metrics without naming the language, or on a monorepo with both Python and TypeScript
---

# crap-report — relatório CRAP por linguagem

Detecta a linguagem do projeto e delega para a skill correta. Em monorepo com Python e
TypeScript, roda as duas.

## Detecção

```bash
python3 ~/.claude/skills/crap-report/scripts/detect_language.py
```

| Marcador na raiz | Linguagem | Skill |
|---|---|---|
| `pyproject.toml`, `setup.py` ou `setup.cfg` | Python | `crap4py` |
| `package.json` **e** `tsconfig.json` | TypeScript | `crap4ts` |

Nada detectado: informe que não há projeto Python ou TypeScript na raiz e pergunte qual
diretório analisar.

## Delegação

Python:

```bash
python ~/.claude/skills/crap4py/scripts/crap_py.py [argumentos]
```

TypeScript:

```bash
node ~/.claude/skills/crap4ts/scripts/crap_ts.mjs [argumentos]
```

Os argumentos são idênticos nas duas e passam adiante sem tradução:

```text
[path-filter ...] [--test-command CMD] [--diff BASE] [--json-only] [-h]
```

## Monorepo

Rode as duas na ordem `python`, `typescript`, imprimindo as duas tabelas. Cada uma grava
seu próprio `target/crap/report.json`; ao rodar as duas na mesma raiz, renomeie a saída
para `report.python.json` e `report.typescript.json` antes de rodar a segunda.

## Modo revisão

`--diff main` restringe às funções tocadas pela branch. A suíte completa continua rodando
— o diff filtra a apresentação, não a medição.

## Regras da métrica

`references/crap-spec.md` é a fonte de verdade: fórmula, faixas, contrato JSON, ordenação,
regra de cobertura ausente e parsing de diff. Divergência entre `crap4py` e `crap4ts` é
bug, não variação aceitável.
