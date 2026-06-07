# Configuração do ZITADEL para desenvolvimento local

Este guia explica como configurar o ZITADEL como provedor de identidade para rodar o Kreds localmente. Siga os passos em ordem.

## Pré-requisitos

- Acesso ao console ZITADEL em <https://auth.hasslab.pro> (solicite ao administrador caso não tenha)
- Node.js (v22+) e pnpm instalados
- Banco de dados PostgreSQL acessível (conforme `DATABASE_URL`)

---

## Passo 1: Criar ou localizar o Application no ZITADEL

1. Acesse <https://auth.hasslab.pro> e faça login com sua conta de administrador.
2. Navegue até: **Organization → Projects → kreds** (crie o projeto se ainda não existir).
3. Dentro do projeto, vá em **Applications → Add Application**.
4. Configure:
   - **Name**: `kreds-local` (ou outro nome de sua preferência)
   - **Type**: `Web`
   - **Authentication Method**: `Code` (Authorization Code + Client Secret — recomendado)

---

## Passo 2: Configurar Redirect URIs

Após criar o application, adicione os seguintes **Redirect URIs** nas configurações do app:

| URI | Finalidade |
|-----|-----------|
| `http://localhost:3000/api/auth/callback/zitadel` | Callback de login (obrigatório) |
| `http://localhost:3000` | Post-logout redirect |

**Importante — Dev Mode**: O ZITADEL exige HTTPS por padrão. Para desenvolvimento local (HTTP):

1. Acesse as configurações do application.
2. Ative a opção **Dev Mode** (ou "Development Mode").
3. Salve as configurações.

Sem o Dev Mode ativado, o ZITADEL rejeitará o redirect para `http://localhost:3000` com erro de URI inválido.

---

## Passo 3: Obter Client ID e Client Secret

Dentro do application criado:

- **Client ID**: visível diretamente na tela do application (campo "Client ID").
- **Client Secret**: gere em **Keys → New Key** → copie o valor gerado (ele não é exibido novamente).

Guarde esses dois valores — você vai precisar deles no Passo 5.

---

## Passo 4: Gerar AUTH_SECRET

O `AUTH_SECRET` é a chave criptográfica usada pelo Next.js Auth.js para assinar os tokens de sessão JWT. Deve ser gerado localmente:

```bash
openssl rand -base64 33
```

Copie o output completo (incluindo `+`, `/`, e `=`). Esse é o valor que você vai usar como `AUTH_SECRET`.

> **Atenção**: nunca compartilhe ou commite esse valor. Ele deve estar apenas no `.env.local`.

---

## Passo 5: Criar .env.local

Na raiz do projeto, crie o arquivo `.env.local` com o seguinte conteúdo (substitua os valores pelos obtidos nos passos anteriores):

```dotenv
DATABASE_URL=postgresql://kreds:kreds_dev@localhost:5432/kreds_dev
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
AUTH_SECRET=<output do openssl rand -base64 33>
AUTH_ZITADEL_ID=<client-id do ZITADEL>
AUTH_ZITADEL_SECRET=<client-secret do ZITADEL>
AUTH_ZITADEL_ISSUER=https://auth.hasslab.pro
```

> O arquivo `.env.local` já está no `.gitignore`. **Nunca commite segredos**.

---

## Passo 6: Verificar configuração

Execute o script de diagnóstico para confirmar que todas as variáveis estão corretas antes de subir o servidor:

```bash
bash scripts/check-auth-config.sh
```

O script vai:

- Confirmar que `AUTH_SECRET`, `AUTH_ZITADEL_ID` e `AUTH_ZITADEL_SECRET` estão definidos (não placeholders)
- Testar conectividade com `https://auth.hasslab.pro/.well-known/openid-configuration`
- Exibir o Redirect URI que precisa estar cadastrado no ZITADEL

Todas as verificações devem passar (sem `[FAIL]`) antes de prosseguir.

---

## Passo 7: Testar login

1. Em um terminal, suba o servidor de desenvolvimento:

   ```bash
   pnpm dev
   ```

2. Abra <http://localhost:3000> no navegador.
3. Você deve ver a tela Sylvan com gradiente e o botão **"Entrar com ZITADEL"**.
4. Clique no botão — o navegador deve redirecionar para `https://auth.hasslab.pro`.
5. Faça login com suas credenciais no ZITADEL.
6. Após o login, o ZITADEL redireciona para `http://localhost:3000/api/auth/callback/zitadel`.
7. O Next.js Auth.js processa o callback e redireciona para:
   - `/family/onboarding` — se for o primeiro acesso (família ainda não criada)
   - `/family/children` — se a família já existir

---

## Solução de problemas comuns

### `redirect_uri_mismatch`

**Causa**: o Redirect URI cadastrado no ZITADEL não coincide exatamente com `http://localhost:3000/api/auth/callback/zitadel`.

**Solução**: verifique no console ZITADEL (Applications → [seu app] → Redirect URIs) se o URI está cadastrado sem barra final e com `/api/auth/callback/zitadel` exato. Certifique-se que o Dev Mode está ativado para permitir HTTP.

---

### `CLIENT_FETCH_ERROR`

**Causa**: `AUTH_ZITADEL_ISSUER` está inacessível, ou `AUTH_SECRET` é inválido/muito curto, ou `AUTH_ZITADEL_ID`/`AUTH_ZITADEL_SECRET` estão incorretos.

**Solução**:
1. Execute `bash scripts/check-auth-config.sh` e corrija os itens `[FAIL]`.
2. Confirme que o ZITADEL está ONLINE.
3. Verifique que `AUTH_SECRET` foi gerado com `openssl rand -base64 33` (não um valor manual curto).

---

### Página em branco após login

**Causa**: `AUTH_SECRET` gerado como variável de ambiente de shell (não persiste entre sessões) ou diferente do valor usado quando a sessão JWT foi criada.

**Solução**: garanta que `AUTH_SECRET` está definido no arquivo `.env.local` (não apenas exportado no shell). Reinicie o servidor após qualquer alteração em `.env.local`.

---

### "Authentication required — no ZITADEL subject (sub) in session"

**Causa**: o callback JWT não recebeu `profile.sub`, geralmente porque o scope `openid` não está incluído ou o application ZITADEL não retorna o claim `sub`.

**Solução**:
1. Confirme que o application ZITADEL tem os scopes configurados: `openid`, `email`, `profile`, `offline_access`.
2. Verifique em `auth.ts` que `scope: 'openid email profile offline_access'` está presente (já configurado no código).
3. Revogue tokens existentes no ZITADEL e tente login novamente.

---

## Scopes necessários

O application ZITADEL deve permitir os seguintes scopes (conforme configurado em `auth.ts`):

| Scope | Finalidade |
|-------|-----------|
| `openid` | Obrigatório — fornece o `sub` (identificador do usuário) |
| `email` | Endereço de e-mail do usuário |
| `profile` | Nome, foto e outros dados de perfil |
| `offline_access` | Refresh token (mantém sessão após expirar) |
