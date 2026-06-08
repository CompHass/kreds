# Phase 02: Family Access, Tenancy, Roles, and Profiles - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md - this log preserves the alternatives considered.

**Date:** 2026-06-06T22:18:07Z
**Phase:** 02-Family Access, Tenancy, Roles, and Profiles
**Areas discussed:** Family onboarding, Guardian invitations, Child profiles, Roles and audit, Child avatars

---

## Family Onboarding

| Decision Point | Options Presented | Selected |
|----------------|-------------------|----------|
| First required step after ZITADEL login | Create family first; Accept privacy first; Full wizard; You decide | Create family first |
| Parental consent presentation | Explicit checkbox; Informational text; Formal signature; You decide | Explicit checkbox |
| Minimum family onboarding data | Name and timezone; Name only; Name, timezone, and country; You decide | Name and timezone, with readable locality UI |
| Post-family-creation destination | Create child; Family dashboard; Invite guardian; You decide | Create child |

**Notes:** The user asked how timezone would be presented. The decision is to show readable localities, such as `Brazil - Sao Paulo`, while storing IANA values like `America/Sao_Paulo`.

---

## Guardian Invitations

| Decision Point | Options Presented | Selected |
|----------------|-------------------|----------|
| How another guardian joins | Email invitation; Registered by first guardian; Invitation code; You decide | Email invitation |
| Who may invite guardians | Any guardian; Creator guardian; Guardian with admin flag; You decide | Any guardian |
| Invitation lifecycle | Pending/accepted; Pending/accepted/expired; Full lifecycle; You decide | Full lifecycle |
| Data before acceptance | Pending record; Immediate membership; Nothing persisted; You decide | Pending record |

**Notes:** Membership becomes active only after authenticated acceptance through ZITADEL.

---

## Child Profiles

| Decision Point | Options Presented | Selected |
|----------------|-------------------|----------|
| Minimum child profile data | Name and avatar; Nickname only; Name, avatar, and age; You decide | Name, avatar, and age |
| Child access model | Guardian selection; Child local PIN; Child ZITADEL login; Managed profiles; Child ZITADEL accounts; Future hybrid | Future hybrid |
| Child without active guardian | Never; Temporary orphan; You decide | Never |
| Removal/deactivation | Soft deactivate; Delete cascade; No removal in v1; You decide | Soft deactivate |
| Age granularity | Age in years; Age range; Date of birth; You decide | Age in years |

**Notes:** The user initially expected children could have ZITADEL accounts with emails. We clarified the existing privacy inventory baseline that v1 uses parent-managed child profiles. The selected direction is hybrid future: v1 remains guardian-managed, while the model should leave room for a future optional child ZITADEL identity link.

---

## Roles and Audit

| Decision Point | Options Presented | Selected |
|----------------|-------------------|----------|
| Role set | Guardian and child; Owner, guardian, child; Admin, guardian, child; System owner plus family guardian/child | System owner plus family guardian/child |
| Authorization source | Kreds domain source; ZITADEL claims source; Both in sync; Split global IAM and family domain roles | Split global IAM and family domain roles |
| Audit visibility | All guardians; Creator/owner only; Guardians with admin flag; You decide | All guardians |
| Audit UI detail | Simple timeline; Detailed diff; Raw technical log; You decide | Simple timeline |

**Notes:** The user wanted a global owner role for whole-system management, but only guardian and child roles per family. We clarified that FAM-04 requires Kreds family roles in the domain model, not only ZITADEL claims. The accepted split is ZITADEL for identity/global system owner and Kreds for family membership/roles by `family_id`.

---

## Child Avatars

| Decision Point | Options Presented | Selected |
|----------------|-------------------|----------|
| Avatar type | Preset Sylvan; Color and initials; Image upload; You decide | Preset Sylvan |
| Static or growth/progress | Static per profile; Visual growth; You decide | Static per profile |
| Who can edit | Guardian only; Child chooses with approval; Any member; You decide | Guardian only |
| Sibling differentiation | Avatar plus color; Avatar plus initials; Name only; You decide | Avatar plus color |

**Notes:** No child photo upload in v1. Growth/progression visuals are deferred so Phase 02 avatars remain identity markers, not reward/progress mechanics.

---

## the agent's Discretion

- Exact table names, route names, form layout, invitation token mechanics, audit event schema, and implementation details remain available to downstream agents.
- Downstream agents may choose the simplest secure ZITADEL/Next.js integration that preserves server-side authorization and Kreds-domain family roles.

## Deferred Ideas

- Child-owned ZITADEL login is deferred beyond v1, with only future-ready model support in Phase 02.
- Avatar growth/progression is deferred to later task, earnings, or child experience phases.

---

# Post-Execution Update — 2026-06-08

**Areas discussed:** acesso-filhos, roles-zitadel
**Context:** Gaps identified after phase was marked complete — child access blocking issue + Zitadel role config clarification.

## Acesso de filhos ao app

| Option | Description | Selected |
|--------|-------------|----------|
| Conta Zitadel criada pelo guardian | Filho faz login com email+senha Zitadel criado pelo parent | |
| PIN local no app | Filho usa PIN definido pelo guardian, auth flow separado do Zitadel | ✓ |
| Guardian delega sessão | Guardian entra e seleciona perfil filho; sem conta separada | |

**User's choice:** PIN local
**Notes:** Usuário perguntou sobre colisões e armazenamento. PIN é per child_profile (scoped por family_id) — sem colisão possível. Acesso via QR/link gerado pelo guardian com familyId embutido. Child session = JWT separado {childProfileId, familyId, role:'child'} em httpOnly cookie. Guardian define PIN ao criar perfil. Sessão filho limitada ao próprio childProfileId. last_accessed_at registrado no child_profiles para audit do guardian.

## Roles no Zitadel

| Option | Description | Selected |
|--------|-------------|----------|
| Manter atual: roles só no DB Kreds | Zitadel = identity provider puro; system_owner = DB flag | ✓ |
| Configurar system_owner no Zitadel | Role no Zitadel + claim no token | |
| Claims de role no token OIDC | Zitadel Actions injetam roles no JWT | |

**User's choice:** Manter roles só no DB Kreds
**Notes:** D-16 implementado corretamente. Nenhuma config adicional no Zitadel para v1.

## Deferred Ideas (post-execution session)

- Tree evolution visual (5 growth stages): clicar nos botões 1-5 mostra preview da planta em cada estágio. Deferred para Fase 9+ junto com progressão real. Visual ref: `stitch_.../set_of_5_growth_stages.../screen.png`.
