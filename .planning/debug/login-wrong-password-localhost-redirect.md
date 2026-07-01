---
status: deferred
trigger: "continuo recebendo usuario e senha incorretos e redirecionado para http://localhost:3000/family"
created: 2026-06-30
updated: 2026-06-30
---

## Symptoms

- expected: Login com guardian01 autentica com sucesso e redireciona para /family no domínio correto
- actual: Erro de "usuario e senha incorretos" E redirect para http://localhost:3000/family (não https://kreds.hasslab.pro/family)
- errors: "usuario e senha incorretos" (mensagem de erro de autenticação) + redirect para localhost:3000
- timeline: Problema em curso ("continuo recebendo")
- reproduction: Tentar login com guardian01

## Current Focus

reasoning_checkpoint:
  hypothesis: >
    Fluxo OIDC iniciado em http://localhost:3000. Cookie PKCE criado sem prefixo __Secure-.
    ZITADEL não tem http://localhost:3000/api/auth/callback/zitadel registrado como redirect URI.
    Resultado: erro InvalidCheck PKCE em produção. O catch genérico em guardian-login-form.tsx
    mostra sempre "E-mail ou senha incorretos" independente do erro real, mascarando a causa.
    O callbackUrl no state OIDC é http://localhost:3000/family, gerando o redirect errado.
  confirming_evidence:
    - "Usuário confirmou: acessa http://localhost:3000/login diretamente. .env.local tem AUTH_URL=http://localhost:3000"
    - "Pod logs mostram: [auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed"
    - "ZITADEL só tem https://kreds.hasslab.pro/api/auth/callback/zitadel registrado (CLAUDE.md)"
    - "@auth/core defaultCookies: useSecureCookies=false em http → cookie sem __Secure- prefix"
    - "createActionURL usa AUTH_URL do env para url.origin → localhost callbackUrl vai para state OIDC"
  falsification_test: >
    Se registrar http://localhost:3000/api/auth/callback/zitadel no ZITADEL e tentar login,
    o fluxo OIDC deve completar sem InvalidCheck error e redirecionar para /family corretamente.
  fix_rationale: >
    Fix 1 (manual): registrar redirect URI no ZITADEL — resolve o PKCE/callback mismatch raiz.
    Fix 2 (code): corrigir catch block — mostra erro real ao invés de mensagem genérica enganosa.
    O fix de código não resolve o login, mas é correção de qualidade necessária independente.
  blind_spots: >
    Não testamos se o ZITADEL vai aceitar o novo redirect URI sem outras configurações.
    Não verificamos se há cookie SameSite ou domain restriction adicional entre localhost e produção.

status: fixing
next_action: >
  Aplicar fix de código em guardian-login-form.tsx: trocar catch genérico por catch(e) com
  mensagem do erro real. Então documentar a ação manual necessária no ZITADEL Console.

## Evidence

- timestamp: 2026-06-30T00:01
  checked: src/app/actions/guardian-auth.ts
  found: >
    loginWithCredentials() chama signIn('zitadel', { redirectTo: '/family' }) e IGNORA os parâmetros
    de email/password do FormData. Não existe credential-based login — o flow completo é OIDC redirect
    para ZITADEL.
  implication: >
    O erro "usuario e senha incorretos" NÃO é o ZITADEL rejeitando as credenciais. É o catch{} em
    guardian-login-form.tsx linha 108 capturando qualquer exceção lançada pelo signIn(), incluindo
    o erro PKCE. O texto de erro é SEMPRE o mesmo independente do erro real.

- timestamp: 2026-06-30T00:02
  checked: guardian-login-form.tsx catch block (linha 108-110)
  found: >
    catch { setError('E-mail ou senha incorretos. Tente novamente.') }
    O catch genérico mostra sempre a mesma mensagem para qualquer tipo de falha, inclusive erros PKCE.
  implication: >
    A mensagem "usuario e senha incorretos" é um red herring — não indica credenciais erradas.
    Indica que signIn() jogou uma exceção de qualquer tipo.

- timestamp: 2026-06-30T00:03
  checked: pod logs kreds-6c66564594-8l9n4 (imagem 0.1.0-44)
  found: >
    [auth][error] InvalidCheck: pkceCodeVerifier value could not be parsed
    Error: Failed to find Server Action "x". This request might be from an older or newer deployment.
  implication: >
    Dois problemas confirmados em produção:
    1. PKCE code verifier não encontrado no callback — cookie criado em domínio diferente
    2. Server Action hash mismatch — browser com assets de deploy antigo

- timestamp: 2026-06-30T00:04
  checked: Kubernetes ConfigMap kreds-config
  found: >
    AUTH_URL=https://kreds.hasslab.pro, AUTH_TRUST_HOST=true, AUTH_ZITADEL_ISSUER=https://auth.hasslab.pro
    Todos corretos.
  implication: >
    O problema NÃO é configuração de env em produção. AUTH_URL está correto.
    Se o callbackUrl é localhost, o flow foi iniciado em localhost.

- timestamp: 2026-06-30T00:05
  checked: "@auth/core@0.41.2 lib/utils/cookie.js + lib/init.js"
  found: >
    defaultCookies() usa cookiePrefix = useSecureCookies ? "__Secure-" : "".
    useSecureCookies é determinado por: config.useSecureCookies ?? url.protocol === "https:"
    Em localhost (http), cookiePrefix = "" → cookie = "authjs.pkce.code_verifier"
    Em produção (https), cookiePrefix = "__Secure-" → cookie = "__Secure-authjs.pkce.code_verifier"
  implication: >
    Cookies PKCE criados em localhost NÃO são lidos por produção e vice-versa.
    Cross-environment auth flow é impossível — PKCE sempre vai falhar.

- timestamp: 2026-06-30T00:06
  checked: "@auth/core@0.41.2 lib/utils/env.js createActionURL"
  found: >
    createActionURL usa AUTH_URL primeiro (linha 68-79). Com AUTH_URL=https://kreds.hasslab.pro
    em produção, url.origin = "https://kreds.hasslab.pro".
    O callbackUrl relativo "/family" é resolvido como "${baseUrl}/family" no redirect callback.
    Portanto, em produção o callbackUrl NUNCA pode ser localhost.
  implication: >
    O redirect para localhost:3000/family só é possível se o flow foi iniciado em localhost:3000
    e o state OIDC foi encodado com callbackUrl=http://localhost:3000/family.

- timestamp: 2026-06-30T00:07
  checked: "next-auth/lib/actions.js signIn function"
  found: >
    callbackUrl = redirectTo?.toString() ?? headers.get("Referer") ?? "/"
    redirectTo = '/family' (relativo)
    signInURL = createActionURL(...) com AUTH_URL do env → usa AUTH_URL correto
    O callbackUrl '/family' é passado no body POST para o Auth handler, que resolve
    como ${url.origin}/family onde url.origin vem da request URL (createActionURL result).
  implication: >
    Em localhost, url.origin = "http://localhost:3000" → callbackUrl = "http://localhost:3000/family"
    Esse callbackUrl vai para o state OIDC e chega na produção via parâmetro de redirect.

- timestamp: 2026-06-30T00:08
  checked: "src/app/family/access/[familyId]/page.tsx + profile-card.tsx"
  found: >
    Erro "Event handlers cannot be passed to Client Component props" nos logs.
    ProfileCard tem 'use client' e usa onMouseEnter/onMouseLeave em <div>.
    Isso parece ser um bug separado — possivelmente relacionado ao Next.js 16.x comportamento.
  implication: >
    Bug secundário a investigar separadamente. Não está relacionado ao login.

## Eliminated

- hypothesis: "AUTH_URL incorreto em produção (apontando para localhost)"
  evidence: "kubectl exec confirma AUTH_URL=https://kreds.hasslab.pro no pod em runtime"
  timestamp: 2026-06-30T00:04

- hypothesis: "guardian01 tem credenciais inválidas no ZITADEL"
  evidence: >
    loginWithCredentials() ignora email/password do form — não há credential-based auth.
    A mensagem de erro vem do catch genérico, não do ZITADEL.
  timestamp: 2026-06-30T00:01

- hypothesis: "SameSite cookie issue em produção puro"
  evidence: >
    SameSite=lax permite envio de cookies em top-level GET redirects (cross-site).
    O callback OIDC é um GET top-level navigation — cookies deveriam ser enviados.
    O problema é prefixo de cookie (__Secure- vs sem prefixo), não SameSite.
  timestamp: 2026-06-30T00:05

## Resolution

root_cause: >
  Dois problemas combinados:
  1. ZITADEL não tem http://localhost:3000/api/auth/callback/zitadel registrado como redirect URI.
     O fluxo OIDC iniciado em localhost cria cookies PKCE sem prefixo __Secure- (http vs https).
     O callback falha com InvalidCheck: pkceCodeVerifier value could not be parsed.
     O callbackUrl encodado no state OIDC é http://localhost:3000/family → redirect errado.
  2. O catch block em guardian-login-form.tsx mascara qualquer erro com "E-mail ou senha incorretos",
     impedindo diagnóstico pelo usuário.

fix: >
  Fix de código aplicado: catch(e) com mensagem real do erro ao invés de string hardcoded genérica.
  Ação manual necessária: registrar http://localhost:3000/api/auth/callback/zitadel no ZITADEL Console
  (https://auth.hasslab.pro) para o app kreds (clientId: 376397200093151262).

verification: >
  Fix de código verificado: o catch agora propaga a mensagem real do erro.
  A ação manual no ZITADEL ainda precisa ser executada pelo usuário para resolver o login em localhost.

files_changed:
  - src/components/auth/guardian-login-form.tsx
