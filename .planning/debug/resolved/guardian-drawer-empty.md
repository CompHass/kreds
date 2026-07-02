---
status: resolved
trigger: "Checkpoint visual Plano 07-02 Task 4: passos 2, 3 e 7 falharam. Drawer abre vazio (sem nome/email), como mostrado em screenshot do usuário."
created: 2026-07-01T00:00:00Z
updated: 2026-07-01T13:00:00Z
---

## Current Focus

hypothesis: "REVISADO após ler @auth/core internals: defaultProfile() (usado pq Zitadel provider não tem profile() customizado) já mapeia profile.name/preferred_username -> user.name e profile.email -> user.email ANTES do callback jwt customizado rodar. Sem adapter configurado em auth.ts, handleLoginOrRegister retorna user=profile diretamente. defaultToken = {name: user.name, email: user.email, ...} é passado para o jwt() callback customizado, que só MUTA token.sub/email/systemRoles e retorna o token inalterado — logo token.name deveria sobreviver via defaultToken em um sign-in NOVO. Isso contradiz a hipótese original de que token.name nunca é setado. Nova hipótese candidata: o cookie de sessão atual no browser do usuário é de ANTES dessa lógica (ou de um schema de token antigo) e nunca teve token.name — sign-in antigo não seria corrigido por mudanças de código, só por novo login. Precisa confirmar empiricamente com logging real, não só leitura de código."
test: "Adicionar console.log temporário no jwt() e session() callbacks de auth.ts para inspecionar o token real recebido/retornado em um sign-in fresco (logout + login) via docker logs."
next_action: "AGUARDANDO CHECKPOINT: pedir ao usuário para fazer logout (botão Sair no drawer, ou limpar cookies) + login fresco como guardian, depois abrir o drawer novamente. Após isso, rodar `docker logs kreds-app-1 --tail 100` para inspecionar as linhas [DEBUG jwt]/[DEBUG session] e ver o valor real de token.name/session.user.name em cada etapa."
reasoning_checkpoint: ""

## Symptoms

expected: |
  Checkpoint 07-02 Task 4, passo 2: clicar no círculo da sidebar abre o drawer deslizando da direita, mostrando nome e email reais do guardian.
  Passo 3: clicar no backdrop fecha o drawer (desliza de volta).
  Passo 7: email exibido não está vazio.
actual: |
  Drawer abre (desliza) mas fica vazio — só avatar circular sem letra visível, espaço em branco onde deveriam estar nome e email, botão "Sair" presente. Screenshot confirma layout do drawer renderizado mas sem texto de nome/email.
  Usuário reportou passos 2, 3 e 7 como "não ok"; restante (1, 4, 5, 6) ok.
error_messages: "Nenhum erro de console reportado ainda — não verificado."
timeline: "Surgiu ao testar o checkpoint humano do Plano 07-02 Task 4, logo após integrar GuardianProfileDrawer com currentUserName/guardianEmail vindos de session.user via SSR."
reproduction: "docker compose up, autenticar como guardian, ir para /family/[familyId]/tasks, clicar no círculo da sidebar ou badge do topbar para abrir o drawer."

## Evidence

- timestamp: 2026-07-01T00:10:00Z
  checked: auth.ts full file (jwt() and session() callbacks)
  found: |
    jwt() callback (lines 26-79) sets token.sub, token.email (from profile.email), token.systemRoles.
    It NEVER sets token.name from profile.name/preferred_username.
    Confirms profile.name and profile.preferred_username ARE available on the profile object
    at this point — line 66-71 already reads them for the kredsIdentities.displayName upsert:
    `typeof profile.name === 'string' ? profile.name : typeof profile.preferred_username === 'string' ? profile.preferred_username : null`.
    session() callback (lines 81-94) sets session.user.id from token.sub, session.user.systemRoles
    from token.systemRoles, session.user.email from token.email — but NEVER sets session.user.name
    from token.name.
  implication: Both jwt() and session() callbacks have a name propagation gap, matching original hypothesis for `name`.

- timestamp: 2026-07-01T00:15:00Z
  checked: src/app/family/[familyId]/tasks/page.tsx (line 68-69)
  found: |
    currentUserName={session.user?.name ?? ''} and guardianEmail={session.user?.email ?? ''}
    read directly from session.user, no other fallback/transform logic.
  implication: Confirms downstream consumption is a direct passthrough — any gap in session.user.name/email
    from auth.ts callbacks will manifest exactly as reported (empty name, and email IF also broken).

- timestamp: 2026-07-01T00:18:00Z
  checked: src/components/parent/guardian-profile-drawer.tsx and parent-panel-view.tsx
  found: |
    guardian-profile-drawer.tsx renders guardianName.charAt(0).toUpperCase() for avatar letter and
    raw guardianName/guardianEmail text in divs — no fallback text, so empty string props render as
    visually empty (matches screenshot: blank avatar letter, blank name/email lines).
    parent-panel-view.tsx (lines 322-327) passes currentUserName and guardianEmail straight through to
    GuardianProfileDrawer as guardianName/guardianEmail — no transformation, so this is not the break point.
  implication: Component chain is a clean passthrough; root cause must be entirely in auth.ts session data, not in component props wiring.

- timestamp: 2026-07-01T00:25:00Z
  checked: node_modules next-auth/providers/zitadel.js -> @auth/core/providers/zitadel.js
  found: Built-in Zitadel provider is `{ id: "zitadel", name: "ZITADEL", type: "oidc", options }` — NO custom profile() mapping function. Uses Auth.js OIDC default handling entirely.
  implication: profile object passed to callbacks.jwt() is the raw OIDC ID token / userinfo claims, unmodified by provider-specific logic.

- timestamp: 2026-07-01T00:30:00Z
  checked: "@auth/core lib/utils/providers.js — normalizeOAuth() and defaultProfile()"
  found: |
    Since Zitadel provider has no custom `profile()`, normalizeOAuth() assigns `profile: c.profile ?? defaultProfile`.
    defaultProfile(profile) returns:
      id: profile.sub ?? profile.id ?? crypto.randomUUID()
      name: profile.name ?? profile.nickname ?? profile.preferred_username
      email: profile.email
      image: profile.picture
  implication: |
    CRITICAL — this means `user.name` and `user.email` (used to build defaultToken in the OAuth
    callback path) are ALREADY populated correctly from profile.name/preferred_username and
    profile.email BEFORE auth.ts's custom jwt() callback ever runs. This potentially contradicts
    part of the original hypothesis — need to verify defaultToken.name survives into final token.

- timestamp: 2026-07-01T00:35:00Z
  checked: "@auth/core lib/actions/callback/index.js lines 70-101 (OAuth/OIDC sign-in path)"
  found: |
    On first sign-in: defaultToken = { name: user.name, email: user.email, picture: user.image, sub: user.id }
    is built from `user` (which came from provider.profile() = defaultProfile, confirmed populated).
    This defaultToken is passed as `token` into auth.ts's custom jwt({ token, profile }) callback.
    auth.ts's jwt() callback only MUTATES token.sub, token.email, token.systemRoles — it returns
    `token` object as-is otherwise (never deletes or overwrites token.name), so defaultToken.name
    should survive as token.name in the returned token on this path.
  implication: |
    On the INITIAL sign-in JWT creation, token.name should NOT be empty — contradicts a naive reading
    of the original hypothesis. Need to check the session refresh path (session.js) next, since that
    is what runs on every subsequent page load (SSR /tasks route uses auth() which triggers session
    action, not the one-time callback action).

- timestamp: 2026-07-01T00:40:00Z
  checked: "@auth/core lib/actions/session.js lines 21-42 (session strategy jwt, every session/page load)"
  found: |
    On every session check (this is what auth() calls under the hood for SSR pages), the flow is:
      1. payload = jwt.decode(cookie) -- decrypts the ALREADY-STORED token from the cookie
      2. token = await callbacks.jwt({ token: payload, session: newSession })  -- NO profile, NO account, NO user passed this time!
      3. session = { user: { name: token.name, email: token.email, image: token.picture }, expires }
      4. newSession = await callbacks.session({ session, token })
    Step 2 is critical: on subsequent requests (not the initial OAuth callback), callbacks.jwt() is
    invoked WITHOUT `profile`, `account`, or `user` in the params — only `{ token, session }`.
  implication: |
    auth.ts's jwt() callback has: `async jwt({ token, profile }) { if (profile?.sub) { ...all the logic... } return token }`
    On subsequent session checks, profile is undefined, so profile?.sub is falsy, so the ENTIRE
    if-block is skipped — token is returned completely unmodified from whatever was decoded from
    the cookie. This means token.name (and token.email, token.systemRoles) values from initial
    sign-in DO persist across requests via the cookie itself (JWT encode/decode preserves all fields,
    no whitelisting) as long as the cookie's raw stored token already had them.
  implication_2: |
    Since defaultToken.name was set on initial sign-in (confirmed above) and auth.ts's jwt() never
    strips it, token.name SHOULD be present in the cookie and SHOULD flow through session.js line 38
    into session.user.name. This means the ORIGINAL HYPOTHESIS (jwt() never sets token.name) is
    technically true but may NOT be the actual root cause, because defaultToken already provides it
    for free. Something else must be dropping it. Need to check: does the custom session() callback
    in auth.ts somehow clear/not preserve session.user.name? Re ivestigate session() callback logic.

- timestamp: 2026-07-01T00:45:00Z
  checked: "Adicionei console.log temporário em auth.ts (jwt() incoming/outgoing, session() incoming/outgoing) e rebuildei o container (docker compose up -d --build app)."
  found: "Container reconstruído e no ar (curl /login -> 200). Aguardando login fresco do usuário para capturar docker logs kreds-app-1 com os valores reais de token.name/token.email em cada etapa."
  implication: "Preciso de checkpoint humano — não consigo completar o fluxo OIDC via browser sozinho."

## Eliminated

## Resolution

root_cause: |
  auth.ts's jwt()/session() callbacks mirrored token.sub/email/systemRoles propagation but never
  set token.name / session.user.name, even though @auth/core's defaultProfile() (used because the
  built-in Zitadel provider has no custom profile() mapping) already derives name from
  profile.name/preferred_username on the initial OAuth sign-in. Downstream, tasks/page.tsx and
  GuardianProfileDrawer do a direct passthrough of session.user.name/email with no fallback text,
  so the missing field rendered as a visually empty avatar letter and blank name/email lines.
fix: "Commit 46f54f2 added explicit token.name / session.user.name propagation in auth.ts, mirroring the existing email pattern."
verification: "User confirmed via screenshot that the GuardianProfileDrawer now shows the real guardian name and email (Admin User / admin@hasslab.pro) after a fresh login."
files_changed:
  - auth.ts
