# Gestão de Contas: Frontend (Angular 21 + TypeScript)

Interface Web do módulo de Gestão de Contas Bancárias. Consome a API REST Spring Boot (`http://localhost:8080/api`).

## Requisitos
- Node.js 22.12 ou superior e npm
- Backend a correr (`docker compose up -d` para o PostgreSQL + API em `localhost:8080`)

## Executar
```bash
cd frontend
npm install
ng serve        # http://localhost:4200
```

## Outros comandos
```bash
ng build              # build de produção em dist/
ng test --watch=false # testes unitários (Vitest)
```

## Perfis e ecrãs
| Perfil | Ecrãs |
|---|---|
| ADMIN | Lista de contas (pesquisa), criar conta, extracto de qualquer conta, transferir de qualquer conta |
| CLIENTE | A minha conta e saldo, o meu extracto, transferir a partir da sua conta |

## Decisões técnicas
- **Standalone components + signals** (Angular moderno, sem NgModules) e **lazy loading** por rota.
- **JWT**: `AuthService` guarda a sessão em `sessionStorage`; o `authInterceptor` junta o `Authorization: Bearer` e, em caso de 401, termina a sessão e volta ao login.
- **Guardas de rota** (`authGuard`, `roleGuard`, `guestGuard`): cada perfil só acede aos seus ecrãs. A autorização real continua no backend.
- **Formulários reactivos** com as mesmas regras da API (NUIT 9 dígitos, conta 6 a 20 dígitos, valor positivo com 2 casas decimais, conta de destino diferente da de origem).
- **Transferência em 3 passos** (preencher, rever, comprovativo) e botões desactivados durante o envio, para evitar duplicados.
- **Erros**: as mensagens do `ApiError` do backend são mostradas ao utilizador (`core/error.util.ts`).
- Sem bibliotecas de UI nem fontes externas: CSS próprio, com suporte a modo escuro e impressão do extracto.
- A URL da API está em `src/app/core/config.ts`.
