# internschat

Backend do **Resenha**, o chat em tempo real dos estagiários (SAP CAP, Node + TypeScript, cds 9).

## Como rodar

```bash
npm install
npm run watch                          # cds-typer + cds-tsx watch em http://localhost:4004
# ou: npx cds-tsx serve all --port 4004
npm run typecheck                      # cds-typer + tsc --noEmit
node test/scripts/smoke.js             # teste de fumaça (REST + WebSocket) com o servidor no ar
```

Dev usa SQLite em memória com os dados de `test/data`. Produção usa HANA.

### Segredos e configuração

- `JWT_SECRET` não vai no `mta.yaml`. Em produção defina-o no ambiente da aplicação, com pelo menos 32 caracteres:
  `cf set-env Resenha-srv JWT_SECRET <segredo-longo-e-aleatorio>` e depois `cf restage Resenha-srv`.
  Sem ele (ou com valor curto ou com placeholder `${...}`) o servidor não sobe.
- Em dev, sem `JWT_SECRET`, usa-se um segredo fixo de desenvolvimento, com aviso no log. Para testar com um segredo próprio, copie `.env.example` para `.env`.
- `CORS_ORIGINS` (opcional) lista origens extras separadas por vírgula. Além dela, são aceitos `http://localhost:*` e `https://internschat.github.io`.
- Atrás do proxy do Cloud Foundry o IP do cliente vem de `req.ip` (`trust proxy` = 1), usado no limite de tentativas de login.

## Usuários de teste (senha `123456`)

| Usuário | E-mail | Papel |
|---|---|---|
| `davi` | davi@resenha.dev | dono do Geral e do grupo "Projeto X" |
| `ana` | ana@resenha.dev | membro do Geral e do "Projeto X" |
| `joao` | joao@resenha.dev | só no Geral |

## Endpoints

- `POST /auth/register` `{ Email, Password, DisplayName, Username }`
- `POST /auth/login` `{ Login, Password }` (Login = e-mail ou usuário)
- `POST /auth/refresh` `{ RefreshToken }` e `POST /auth/logout` `{ RefreshToken }`
- OData V4 em `/service/Chat` (`Authorization: Bearer <AccessToken>`): `People`, `Me`, `MySettings`, `Conversations`,
  `Members`, `Messages`, `SendMessage`, `MarkAsRead`
- WebSocket em `/ws?token=<AccessToken>`; eventos em `srv/realtime/events.ts`

Exemplos prontos em `test/http/auth.http` e `test/http/chat.http`.
