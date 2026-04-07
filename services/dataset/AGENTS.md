# Dataset Service

Java + Spring Boot, build com Gradle. Responsável por ingestão e consulta de dados.

## Comandos principais

```bash
./gradlew build         # Compila e roda testes
./gradlew test          # Só testes
./gradlew bootRun       # Sobe o serviço localmente (porta 8000)
```

## Variáveis de configuração

Passadas via system properties (`-D`) — ver `docker-compose.yml` para referência:

| Propriedade              | Descrição                      |
|--------------------------|--------------------------------|
| `databaseServer`         | Host do PostgreSQL             |
| `databaseUsername`       | Usuário do banco               |
| `databasePassword`       | Senha do banco                 |
| `databaseName`           | Nome do banco                  |
| `notificationEndpoint`   | URL do serviço de notificação  |
| `templateEndpoint`       | URL do serviço template        |
| `dataFiles.dir`          | Diretório de arquivos de dados |

## Estrutura

```
src/            # Código fonte Java
build/          # Compilado — não editar
libs/           # Dependências locais
```

## Convenções

- Spring Boot com configuração via properties
- Arquivos de dados em `storage/data-files/` (mapeado via volume no docker)
