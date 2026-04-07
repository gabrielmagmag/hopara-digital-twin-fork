# Hopara Digital Twin

Plataforma open source de digital twin — representação visual em tempo real de operações. Tecnicamente, uma combinação de Grafana, Figma e Prezi.

## Estrutura do monorepo

```
front/          # Frontend React (yarn workspaces, múltiplos packages)
services/
  bff/          # BFF Node/TS — gateway entre front e serviços internos
  visualization/ # Node/TS — gerencia visualizações, usa PostgreSQL
  dataset/      # Java/Spring Boot — ingestão e consulta de dados
  template/     # Node/TS — gerencia templates de visualização
  notification/ # Node/TS — serviço de notificações
  resource/     # Python — gerencia recursos (imagens, arquivos)
docker-compose.yml
storage/        # Volumes locais (postgres, resource, data-files)
```

## Configuração inicial

```bash
git submodule update --init --recursive
```

## Ambiente local

```bash
docker compose up
```

Portas dos serviços:

| Serviço       | Porta |
|---------------|-------|
| front         | 3000  |
| bff           | 8086  |
| visualization | 8081  |
| dataset       | 8000  |
| template      | 8089  |
| notification  | 8085  |
| resource-api  | 2022  |
| PostgreSQL    | 5432  |

Dados persistidos em `storage/` (não commitar).

## Convenções gerais

- Licença: AGPL-3.0
- TypeScript em todos os serviços Node.js
- Cada serviço tem seu próprio `yarn.lock` ou `gradlew` — não usar o gerenciador de pacotes errado
- Sempre rodar o `pre-commit` do serviço antes de commitar (ver CLAUDE.md de cada serviço)
- Não editar arquivos em diretórios `out/`, `build/` ou `dist/` — são gerados
