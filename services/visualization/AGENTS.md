# Visualization Service

Node.js + TypeScript. Gerencia visualizações e specs, persiste no PostgreSQL via TypeORM.

## Comandos principais

```bash
yarn start              # Desenvolvimento (nodemon, porta 8081)
yarn build              # Compila TypeScript para out/
yarn unit-test          # Testes unitários
yarn integration-test   # Testes de integração (requer PostgreSQL rodando)
yarn test               # lint + unit + integration
yarn pre-commit         # build-schemas + build-docs + test (rodar antes de commitar)
```

## Comandos especiais

```bash
yarn migrate            # Roda migrações do banco
yarn build-schemas      # Gera JSON Schema a partir dos tipos TypeScript (out/schemas/schema.json)
yarn build-docs         # Gera documentação
```

## Estrutura

```
src/
  index.ts              # Entrypoint
  migrate.ts            # Script de migração
  build/                # Geração de docs e schemas
out/                    # Compilado — não editar
out/schemas/            # Schemas JSON gerados — não editar manualmente
```

## Banco de dados

- PostgreSQL via TypeORM
- Variáveis: `DB_HOST`, `DB_USER`, `DB_PASSWORD`
- Localmente: `db` no docker-compose (porta 5432, user/pass: kyrix)
- Sempre rodar `yarn migrate` após pull se houver migrações novas

## Convenções

- DI com awilix
- Schemas gerados via `ts-json-schema-generator` — alterar os tipos TypeScript, não o JSON diretamente
- Testes de integração precisam de banco disponível
