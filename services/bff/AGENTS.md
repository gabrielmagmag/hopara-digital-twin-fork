# BFF Service

Node.js + TypeScript. Gateway entre o frontend e os serviços internos.

## Comandos principais

```bash
yarn start              # Desenvolvimento (nodemon, porta 8086)
yarn build              # Compila TypeScript para out/
yarn test               # Testes
yarn lint               # Lint
yarn pre-commit         # lint + test (rodar antes de commitar)
```

## Variáveis de ambiente

| Variável           | Descrição                        |
|--------------------|----------------------------------|
| `DATASET_URL`      | URL do serviço dataset           |
| `VISUALIZATION_URL`| URL do serviço visualization     |
| `TENANT_URL`       | URL do serviço de tenants        |
| `TEMPLATE_URL`     | URL do serviço template          |
| `RESOURCE_URL`     | URL do serviço resource-api      |

## Estrutura

```
src/            # Código fonte TypeScript
out/            # Compilado — não editar
```

## Convenções

- DI com awilix
- TypeScript strict
- Arquivo `out/` é gerado pelo build — não editar
