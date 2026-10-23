# Gestão de Contas Bancárias

Módulo de gestão de contas bancárias, desenvolvido como avaliação técnica para a vaga de Full Stack Developer Júnior. Permite criar contas, consultar contas e saldo, realizar transferências entre contas e consultar o extracto de movimentos, com autenticação JWT e dois perfis (Administrador e Cliente).

## Funcionalidades

| Requisito do enunciado                                                                                                                                           | Estado      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| Criar contas (nome, NUIT, número único, tipo Ordem/Poupança, saldo inicial)                                                                                      | ✅          |
| Consultar contas e saldo                                                                                                                                         | ✅          |
| Transferências entre contas (origem, destino, valor, descrição)                                                                                                  | ✅          |
| Extracto (data/hora, tipo, valor, saldo resultante, descrição)                                                                                                   | ✅ paginado |
| Autenticação JWT com perfis Administrador e Cliente                                                                                                              | ✅          |
| API REST documentada (Swagger/OpenAPI)                                                                                                                           | ✅          |
| Migrações da base de dados (Flyway)                                                                                                                              | ✅          |
| Testes automáticos (JUnit)                                                                                                                                       | ✅          |
| Docker Compose                                                                                                                                                   | ✅          |
| Interface web (Angular)                                                                                                                                          | ✅          |
| Extras da interface: modo claro/escuro, cartão com saldo e últimos movimentos, transferência em 3 passos com comprovativo imprimível, extracto exportável em CSV | ✅          |

## Tecnologias

- **Backend:** Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA/Hibernate, Flyway, springdoc-openapi
- **Frontend:** Angular + TypeScript
- **Base de dados:** PostgreSQL 16
- **Infra:** Docker Compose · **Testes:** JUnit 5, Spring Boot Test, AssertJ

## Como executar

### Opção A: tudo com Docker (recomendada)

Requisito: [Docker](https://www.docker.com/) com Docker Compose.

```bash
docker compose up --build
```

A primeira execução compila o backend e o frontend e demora alguns minutos. Depois:

| Serviço       | Endereço                                    |
| ------------- | ------------------------------------------- |
| Interface web | http://localhost:4201                       |
| API           | http://localhost:8081/api                   |
| Swagger UI    | http://localhost:8081/swagger-ui/index.html |

Para parar: `Ctrl+C` (ou `docker compose down`). Para apagar também os dados: `docker compose down -v`.

### Opção B: desenvolvimento local

Requisitos: Docker, JDK 21 (ou 17+) e Node.js 20+.

```bash
# 1) Base de dados (só o PostgreSQL)
docker compose up -d db

# 2) Backend (noutro terminal)
cd backend
./gradlew bootRun          # Windows: gradlew.bat bootRun   (ou: gradle bootRun, com Gradle 8+)

# 3) Frontend (noutro terminal)
cd frontend
npm install
npm start                  # http://localhost:4201
```

## Credenciais de demonstração

| Perfil        | Utilizador    | Palavra-passe | Como obter                                        |
| ------------- | ------------- | ------------- | ------------------------------------------------- |
| Administrador | `admin`       | `Admin@123`   | Criado automaticamente no primeiro arranque       |
| Cliente       | _(à escolha)_ | _(à escolha)_ | O administrador cria o cliente ao abrir uma conta |

> Estas credenciais são **apenas para desenvolvimento**. Ver [Configuração](#configuração).

### Roteiro rápido de teste

1. Entrar como `admin` e abrir **Nova conta** (por exemplo, conta `100000000001`, saldo `1000.00`, utilizador `maria`).
2. Criar uma segunda conta (por exemplo, `100000000002`, utilizador `joao`).
3. Terminar sessão e entrar como `maria`.
4. Em **Transferir**, enviar um valor para a conta `100000000002`.
5. Em **Extracto**, confirmar o movimento e o saldo resultante.

## API REST

A documentação interactiva está no Swagger UI. Para testar endpoints protegidos: fazer login em `POST /api/auth/login`, copiar o `token`, clicar em **Authorize** e colá-lo.

| Método e rota                                      | Quem acede                            | Descrição                                   |
| -------------------------------------------------- | ------------------------------------- | ------------------------------------------- |
| `POST /api/auth/login`                             | todos                                 | Devolve o token JWT                         |
| `GET /api/auth/me`                                 | autenticado                           | Utilizador e perfis do token                |
| `POST /api/accounts`                               | Administrador                         | Cria cliente, conta e movimento de abertura |
| `GET /api/accounts`                                | Administrador                         | Lista todas as contas                       |
| `GET /api/accounts/me`                             | Cliente                               | A conta do utilizador autenticado           |
| `GET /api/accounts/{numero}`                       | Admin (qualquer) · Cliente (só a sua) | Dados da conta                              |
| `GET /api/accounts/{numero}/balance`               | Admin (qualquer) · Cliente (só a sua) | Saldo                                       |
| `GET /api/accounts/{numero}/statement?page=&size=` | Admin (qualquer) · Cliente (só a sua) | Extracto paginado                           |
| `POST /api/transfers`                              | Só Cliente (da sua própria conta)     | Transferência atómica                       |

Exemplo de login:

```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

### Colecção Postman

Está em `postman/gestao-contas.postman_collection.json`. Importar no Postman e executar com **Run collection**, por ordem, com a API em `http://localhost:8081` (variável `baseUrl`). Cobre login, criação de contas, consultas, extracto, transferências e os casos de erro (400, 403, 409, 422). Cada execução gera números de conta e utilizadores novos, por isso pode repetir-se sem limpar a base de dados.

### Códigos de erro

| Código | Quando                                                                 |
| ------ | ---------------------------------------------------------------------- |
| 400    | Dados inválidos (por exemplo, valor negativo ou NUIT mal formado)      |
| 401    | Sem token, ou token inválido/expirado                                  |
| 403    | Sem permissão (por exemplo, cliente a aceder a conta alheia)           |
| 404    | Conta inexistente (vista pelo administrador)                           |
| 409    | Conflito (número de conta ou utilizador já existente)                  |
| 422    | Regra de negócio violada (saldo insuficiente, origem igual ao destino) |

## Regras de negócio e onde são garantidas

| Regra                                      | Garantia                                                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Número de conta único                      | `UNIQUE` na base de dados + verificação no serviço (erro 409)                                                               |
| Saldo nunca negativo                       | Validação no serviço + `CHECK (balance >= 0)` na base de dados                                                              |
| Apenas valores positivos                   | Bean Validation (`@DecimalMin("0.01")`, máx. 2 casas decimais)                                                              |
| Todas as operações com data e hora         | Cada movimento é gravado com `created_at`                                                                                   |
| Transferências atómicas                    | `@Transactional`: qualquer falha desfaz saldos e movimentos                                                                 |
| Sem saldo "perdido" em acessos simultâneos | Bloqueio pessimista (`SELECT ... FOR UPDATE`) das duas contas, sempre pela mesma ordem (`id`), o que também evita deadlocks |
| Valores monetários exactos                 | `BigDecimal` / `NUMERIC(19,2)`                                                                                              |

Cada transferência gera **dois movimentos** (enviada e recebida) ligados pela mesma `transfer_reference`.

## Segurança

- Autenticação **JWT** sem sessão no servidor (stateless), com expiração de 60 minutos.
- Palavras-passe guardadas apenas como **hash BCrypt**; nunca em texto.
- O **Administrador** cria contas e consulta, mas não movimenta dinheiro: `POST /api/transfers` devolve 403 para o ADMIN, e o Cliente só transfere da sua própria conta.
- Autorização por perfil, em duas camadas: regras por URL no `SecurityConfig` e `@PreAuthorize` nos métodos.
- Um cliente que peça uma conta alheia ou inexistente recebe sempre **403**, para não revelar que números de conta existem.
- Erros devolvidos num formato JSON uniforme, sem expor detalhes internos.
- CORS limitado à origem do frontend (`http://localhost:4201`).

## Testes

```bash
cd backend
./gradlew test             # Windows: gradlew.bat test
```

Os testes usam **PostgreSQL real**, numa base separada (`gestao_contas_test`), porque o bloqueio de linhas (`FOR UPDATE`) não é reproduzido por bases em memória como o H2. Essa base é criada automaticamente na primeira vez que o `docker compose` arranca o PostgreSQL. Noutro PostgreSQL, criar com:

```sql
CREATE DATABASE gestao_contas_test;
```

| Teste                                    | O que prova                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| Transferência válida                     | Saldos actualizados e dois movimentos registados                                         |
| Saldo insuficiente                       | Rejeitada, sem alterar saldos nem movimentos                                             |
| Falha a meio                             | Rollback de saldos e do primeiro movimento                                               |
| 20 transferências simultâneas            | Com 1000 de saldo e pedidos de 100, passam exactamente 10; saldo final 0, nunca negativo |
| Transferências cruzadas (A→B e B→A)      | Terminam todas, sem deadlock                                                             |
| Cliente tenta transferir de conta alheia | Rejeitada (403), saldos intactos                                                         |
| Administrador tenta transferir           | Rejeitada (403), saldos intactos                                                         |

O relatório em HTML fica em `backend/build/reports/tests/test/index.html`.

## Modelo de dados

Migração em `backend/src/main/resources/db/migration/V1__criar_tabelas.sql` (aplicada pelo Flyway no arranque).

```
users (id, username UNIQUE, password_hash, role ADMIN|CLIENTE, created_at)
   │ 1
   │ 1
accounts (id, account_number UNIQUE, customer_name, nuit, account_type ORDEM|POUPANCA,
          balance CHECK >= 0, owner_id UNIQUE → users, created_at)
   │ 1
   │ N
movements (id, account_id → accounts, type ABERTURA|TRANSFERENCIA_ENVIADA|TRANSFERENCIA_RECEBIDA,
           amount, balance_after, description, counterpart_account_number,
           transfer_reference, created_at)
```

## Configuração

O backend lê estas variáveis de ambiente (os valores por omissão servem só para desenvolvimento):

| Variável                            | Por omissão                                      | Descrição                                                                      |
| ----------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `DB_URL`                            | `jdbc:postgresql://localhost:5433/gestao_contas` | Ligação à base de                                                              |
| dados                               |
| `DB_USER` / `DB_PASSWORD`           | `contas` / `contas123`                           | Credenciais da base de dados                                                   |
| `JWT_SECRET`                        | chave de desenvolvimento                         | Chave de assinatura do JWT. **Alterar em produção**                            |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `Admin@123`                            | Administrador inicial. **Alterar a palavra-passe em produção**                 |
| `SERVER_PORT`                       | `8081`                                           | Porta da API (no Docker, o contentor usa a 8080 e o compose publica-a na 8081) |
| `CORS_ALLOWED_ORIGINS`              | `http://localhost:4201`                          | Origens autorizadas pelo CORS, separadas por vírgula                           |

## Estrutura do projecto

```
gestao-contas/
├── backend/                      Spring Boot (arquitectura em camadas)
│   └── src/main/java/mz/gestaocontas/
│       ├── controller/           Endpoints REST
│       ├── service/              Regras de negócio e transacções
│       ├── repository/           Acesso a dados (Spring Data JPA)
│       ├── domain/               Entidades
│       ├── dto/                  Pedidos e respostas da API
│       ├── exception/            Tratamento global de erros
│       ├── security/             JWT, filtros e configuração de segurança
│       └── config/               OpenAPI, CORS e administrador inicial
├── frontend/                     Angular
│   └── src/app/
│       ├── core/                 Autenticação, API, guardas e interceptor
│       ├── layout/               Barra lateral e estrutura das páginas
│       └── pages/                Login, contas, nova conta, transferir, extracto
├── docker/                       Scripts de inicialização da base de dados
└── docker-compose.yml
```

## Decisões de âmbito e evolução

O que ficou deliberadamente fora desta versão, e como seria feito:

- **Recuperação de palavra-passe:** fora do âmbito do enunciado. Exigiria um fluxo por email com token de uso único e expiração curta.
- **Uma conta por cliente:** simplificação do modelo (`accounts.owner_id` é único). Para vários produtos por cliente (Ordem e Poupança), separava-se uma tabela `customers` (nome, NUIT) e cada conta passava a referenciá-la.
- **Edição e encerramento de contas:** não pedidos no enunciado.
- **Credenciais e chave JWT de desenvolvimento:** servem apenas para demonstração; em produção definem-se por variáveis de ambiente (ver Configuração).
