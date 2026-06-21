---
phase: 2
slug: authentication
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-20
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.8 |
| **Config file** | `vitest.config.ts` (raiz) |
| **Quick run command** | `pnpm test -- --reporter=verbose tests/unit/child-auth-endpoint.test.ts tests/unit/child-pin-management.test.ts tests/unit/child-session-guard.test.ts tests/unit/middleware.test.ts` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command (4 test files above)
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| child-session module | 01 | W0 | D-08, D-09, D-11 | PIN brute force | checkBruteForce bloqueia após 5 tentativas por childId | unit | `pnpm test -- tests/unit/child-auth-endpoint.test.ts` | ✅ (falha: módulo ausente) | ⬜ pending |
| child-pin module | 01 | W0 | D-10, CAUTH-01 | Timing attack | bcrypt.compare() — constante no tempo | unit | `pnpm test -- tests/unit/child-pin-management.test.ts` | ✅ (falha: módulo ausente) | ⬜ pending |
| child-guard module | 01 | W0 | D-12, D-13 | Session cookie theft | validateChildSessionScope rejeita tokens expirados/inválidos | unit | `pnpm test -- tests/unit/child-session-guard.test.ts` | ✅ (falha: módulo ausente) | ⬜ pending |
| middleware | 01 | W0 | D-12, D-13 | Access control bypass | 12 cenários: /child/* e /guardian/* protegidos por sessão correta | unit | `pnpm test -- tests/unit/middleware.test.ts` | ✅ (falha: módulo ausente) | ⬜ pending |
| PIN screen UI | 02 | W1 | CAUTH-01..05 | — | N/A (UI visual) | visual/manual | — | ❌ W1 | ⬜ pending |
| Guardian login UI | 02 | W1 | GAUTH-01..04 | OIDC CSRF | next-auth v5 state+PKCE nativo | visual/manual | `pnpm test -- tests/unit/middleware.test.ts` | ✅ | ⬜ pending |
| Password reset | 02 | W1 | GAUTH-05 | — | N/A | manual only | — | ❌ W1 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Os 4 módulos de backend devem ser criados antes de qualquer UI task. Testes já existem e falham por `ERR_MODULE_NOT_FOUND`:

- [ ] `src/lib/families/child-session.ts` — cobre `child-auth-endpoint.test.ts` (7 testes: signChildSession, verifyChildSession, brute force)
- [ ] `src/lib/families/child-pin.ts` — cobre `child-pin-management.test.ts` (9 testes: hashPin, verifyPin, validatePinFormat)
- [ ] `src/lib/auth/child-guard.ts` — cobre `child-session-guard.test.ts` (6 testes: validateChildSessionScope, extractChildProfileId, extractFamilyId)
- [ ] `src/middleware.ts` — cobre `middleware.test.ts` (12 testes: route protection /child/* /guardian/*)
- [ ] `src/app/api/auth/[...nextauth]/route.ts` — handlers next-auth v5 (sem teste unitário; necessário para GAUTH-01)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Animação de portão PIN correto | CAUTH-03 | CSS transform visual | Digitar 1234 → verificar painel esquerdo/direito translateX(±101%) 1s cubic-bezier |
| kredsShake nos dots de erro | CAUTH-02 | CSS animation visual | Digitar PIN errado → verificar shake 0.5s + reset em 950ms |
| kredsSprout por dot preenchido | CAUTH-05 | SVG animation visual | Preencher 1 dot → verificar SVG brotinho com kredsSprout |
| kredsBreath na plant hero | CAUTH-01 | CSS animation visual | Verificar translateY 0→-5px loop infinito na plant hero |
| Spinner CSS loading GAUTH-04 | GAUTH-04 | CSS spinner visual | Clicar "Entrar na conta" → verificar spinner branco no botão |
| E-mail mascarado GAUTH-05 | GAUTH-05 | UI state visual | Enviar reset → verificar `ana***@email.com` + botão "Reenviar e-mail" |
| Google/Apple identity_provider_hint | GAUTH-02 | OAuth redirect | Clicar "Continuar com Google" → verificar redirect vai para Google via Zitadel |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
