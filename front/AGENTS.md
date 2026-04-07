# Front

React + TypeScript, organizado como yarn workspaces com múltiplos packages em `packages/`.

## Comandos principais

```bash
yarn start              # Sobe o app web em desenvolvimento
yarn build              # Compila todos os packages (ordem topológica)
yarn test               # Lint + testes em todos os packages
yarn lint               # Lint isolado
yarn pre-commit         # lint + test (rodar antes de commitar)
```

## Packages principais

| Package               | Descrição                        |
|-----------------------|----------------------------------|
| `@hopara/web`         | App React principal              |
| `@hopara/iframe`      | Versão embeddable via iframe     |
| `@hopara/react`       | Biblioteca de componentes React  |
| `@hopara/design-system` | Design system                  |
| `@hopara/state`       | Gerenciamento de estado          |
| `@hopara/dataset`     | Integração com serviço de dados  |

## Estrutura

```
packages/       # Workspaces individuais
  web/          # App principal (porta 3000)
  iframe/       # App embeddable
  react/        # Lib de componentes
  ...
```

## Convenções

- Node.js >= 18, yarn 4
- Testes com Jest + Testing Library
- ESLint configurado em `eslint.config.js` na raiz do front
- TypeScript strict — não usar `any` sem justificativa
- Arquivos `out/` e `build/` são gerados — não editar
- Para trabalhar em um package específico: `yarn workspace @hopara/<nome> <script>`
