# Resource Service

Python. Gerencia recursos como imagens e arquivos. Dois componentes: `api/` (resource-api, porta 2022) e `consumer/` (resource-consumer, porta 2023).

## Comandos principais

```bash
./pre_commit.sh         # ruff + lint-imports + mypy + testes (rodar antes de commitar)
python -m unittest      # Só testes
ruff check --fix .      # Lint e auto-fix
mypy -p api -p consumer -p common   # Verificação de tipos
```

## Variáveis de ambiente

| Variável               | Descrição                          |
|------------------------|------------------------------------|
| `DISABLE_LOCALSTACK`   | `true` em dev local sem LocalStack |
| `LOCAL_STORAGE_PATH`   | Caminho para armazenamento local   |
| `CONSUMER_URL`         | URL do consumer (usada pela api)   |

## Estrutura

```
api/            # Resource API (porta 2022)
consumer/       # Resource Consumer (porta 2023)
common/         # Código compartilhado
resources/      # Arquivos de recursos
tests/          # Testes
```

## Convenções

- Ruff para lint (configurado em `ruff.toml`)
- Mypy para tipos (configurado em `mypy.ini`)
- Testes com `unittest`
- Armazenamento local em `storage/resource/` (mapeado via volume no docker)
