# crap-skills

Relatório **CRAP** (Change Risk Anti-Pattern) para projetos Python e TypeScript.

O CRAP combina complexidade ciclomática com cobertura de testes para achar as funções
mais arriscadas de mudar: as que são complexas **e** mal testadas ao mesmo tempo. Porte
conceitual do [crap4go](https://github.com/unclebob/crap4go) de Robert C. Martin.

```text
CRAP Report
===========
Function                       Module                                CC    Cov%     CRAP
----------------------------------------------------------------------------------------
apply_discount                 src.billing                            6    0.0%     42.0
label                          src.billing                            1  100.0%      1.0
```

| CRAP | Leitura |
|------|---------|
| 1–5 | Limpo |
| 5–30 | Refatorar ou adicionar testes |
| 30+ | Complexo e mal testado |

`N/A` significa que o arquivo não apareceu no relatório de cobertura — não medido, que é
diferente de não testado.

## Instalação

```bash
git clone <este-repositorio> crap-skills
cd crap-skills
./install.sh
```

O instalador:

1. cria um virtualenv próprio em `.crap-venv` com `radon` e `coverage`, para você não
   precisar instalá-los em cada projeto analisado;
2. instala `typescript` em `crap4ts/node_modules`, usado para medir complexidade;
3. cria os comandos `crap4py`, `crap4ts` e `crap-report` em `~/.local/bin`;
4. registra as skills nos agentes que encontrar — Claude Code, Codex e opencode.

Os comandos apontam de volta para este clone. Um `git pull` atualiza tudo na hora, mas
**não mova nem apague este diretório** depois de instalar.

### Opções

```bash
./install.sh --cli-only        # só os comandos, sem tocar nos agentes
./install.sh --skills-only     # só as skills
./install.sh --prefix ~/bin    # outro diretório para os comandos
./install.sh --force           # substitui arquivos que estejam no caminho
./install.sh --help
```

Variáveis de ambiente aceitas: `PYTHON` (interpretador usado para criar o virtualenv) e
`OPENCODE_SKILL_DIR` (caso sua versão do opencode use outro diretório de skills).

### Onde as skills são instaladas

| Agente | Diretório |
|--------|-----------|
| Claude Code | `~/.claude/skills/` |
| Codex | `~/.codex/skills/` |
| opencode | `~/.config/opencode/skill/` |

São symlinks para este repositório. Um agente cujo diretório de configuração não existir
é simplesmente pulado.

## Uso

```bash
cd ~/meu-projeto
crap-report              # detecta a linguagem e roda a ferramenta certa
```

Ou direto, quando você já sabe a linguagem:

```bash
crap4py                  # projeto Python
crap4ts                  # projeto TypeScript
```

Todos aceitam as mesmas opções:

```bash
crap4py src/billing                          # só arquivos cujo caminho casa
crap4py --diff main                          # só as funções que a branch tocou
crap4py --test-command "coverage run -m pytest tests/unit"
crap4py --json-only                          # grava o JSON sem imprimir a tabela
crap4py --help
```

### Modo revisão

`--diff main` restringe o relatório às funções que a branch alterou:

```bash
$ crap4ts --diff main
CRAP Report
===========
Function                       Module                                CC    Cov%     CRAP
----------------------------------------------------------------------------------------
added                          src/orders                             2    0.0%      6.0
```

Importante: **o diff filtra a apresentação, não a medição.** A suíte completa continua
rodando e todas as funções continuam sendo medidas — a cobertura de uma função vem de
qualquer teste que a exercite, não só dos testes que a branch tocou. Por isso a
comparação usa três pontos (`main...HEAD`, via merge-base): o relatório mostra o que a
branch introduziu, não o que entrou na base depois.

## O que cada linguagem exige do projeto

### Python

Nada além de uma suíte com `pytest`. O `radon` e o `coverage` vêm do virtualenv da
ferramenta.

Uma ressalva: o comando padrão é `coverage run -m pytest`, que precisa enxergar as
dependências do **seu** projeto. Se o projeto tem virtualenv próprio, ative-o antes de
rodar, ou passe `--test-command`. O virtualenv da ferramenta entra no fim do `PATH`, ou
seja, o `coverage` do seu projeto tem prioridade quando existe.

Complexidade vem do `radon cc -j`; cobertura por função vem da seção `functions` do
`coverage json`, e as duas são casadas pela **linha inicial** de cada função — nomes
divergem entre as ferramentas, linhas não.

### TypeScript

Precisa de `typescript` e de uma suíte com cobertura **istanbul**:

```bash
npm install --save-dev typescript @vitest/coverage-istanbul
```

O provider istanbul é obrigatório. O padrão do vitest é o v8, cujo mapa de statements é
reconstruído a partir de ranges de bytes e não casa de forma confiável por linha:

```bash
crap4ts --test-command "npx vitest run --coverage --coverage.provider=istanbul --coverage.reporter=json"
```

A complexidade é extraída com a TypeScript Compiler API, não com a regra `complexity` do
ESLint — essa reporta o range do *nome* da função, não do corpo, e sem a linha final não
há como casar a cobertura.

## Saída

Além da tabela, cada execução grava `target/crap/report.json`:

```json
{
  "version": 1,
  "language": "python",
  "summary": { "functions": 32, "crappy": 0, "max_crap": 8.0 },
  "entries": [
    {
      "name": "apply_discount",
      "module": "src.billing",
      "file": "src/billing.py",
      "start_line": 1,
      "end_line": 9,
      "complexity": 6,
      "coverage": 0.0,
      "crap": 42.0,
      "statements": 7,
      "covered_statements": 0
    }
  ]
}
```

Em monorepo com as duas linguagens, `crap-report` gera `report.python.json` e
`report.typescript.json`.

## As três skills

| Skill | Quando o agente usa |
|-------|---------------------|
| `crap-report` | Pedido sem dizer a linguagem, ou monorepo |
| `crap4py` | Projeto Python |
| `crap4ts` | Projeto TypeScript |

Peça "gera um relatório CRAP" ao agente e ele escolhe sozinho.

`crap-report/references/crap-spec.md` é a fonte de verdade compartilhada: fórmula, faixas,
contrato JSON, ordenação e regra de cobertura ausente. As duas implementações seguem esse
documento — divergência entre elas é bug, não variação aceitável.

## A métrica

```text
CRAP = CC² × (1 - coverage/100)³ + CC
```

Casos de referência, conferidos contra a fórmula:

| CC | Cobertura | CRAP |
|----|-----------|------|
| 1 | 100% | 1.0 |
| 10 | 80% | 10.8 |
| 12 | 45% | 36.0 |
| 5 | 0% | 30.0 |
| 12 | 0% | 156.0 |

O exemplo do README do crap4go mostra `CC 12, 45%, 130.2`, que não satisfaz a própria
fórmula. Não use para calibrar nada.

Funções aninhadas são entradas próprias: a complexidade delas não soma no pai e os
statements delas não contam na cobertura do pai. É uma divergência consciente do crap4go,
alinhada ao comportamento do radon.

## Desenvolvimento

```bash
cd crap4py && .venv/bin/python -m pytest -q     # 55 testes
cd crap4ts && npm test                          # 41 testes
crap4py/.venv/bin/python -m pytest crap-report/tests -q   # 6 testes
```

Dogfooding — a ferramenta analisando o próprio código:

```bash
cd crap4py && PATH="$PWD/.venv/bin:$PATH" .venv/bin/python scripts/crap_py.py
```

## Desinstalação

```bash
rm ~/.local/bin/crap4py ~/.local/bin/crap4ts ~/.local/bin/crap-report
rm ~/.claude/skills/crap4py ~/.claude/skills/crap4ts ~/.claude/skills/crap-report
rm ~/.codex/skills/crap4py ~/.codex/skills/crap4ts ~/.codex/skills/crap-report
rm ~/.config/opencode/skill/crap4py ~/.config/opencode/skill/crap4ts ~/.config/opencode/skill/crap-report
```

Todos são symlinks; apagá-los não afeta este repositório.
