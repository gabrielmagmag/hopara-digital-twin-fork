# Template Service

Node.js + TypeScript. Gerencia templates de visualização.

## Comandos principais

```bash
yarn start              # Desenvolvimento (nodemon, porta 8089)
yarn build              # Compila TypeScript para out/
yarn test               # Testes
yarn lint               # Lint
```

## Variáveis de ambiente

| Variável       | Descrição                  |
|----------------|----------------------------|
| `DATASET_URL`  | URL do serviço dataset     |
| `RESOURCE_URL` | URL do serviço resource    |

## Estrutura

```
src/            # Código fonte TypeScript
templates/      # Templates de visualização
out/            # Compilado — não editar
```

## Convenções

- TypeScript strict
- Diretório `out/` gerado pelo build — não editar
