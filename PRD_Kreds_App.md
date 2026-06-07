# PRD - Kreds: Gestão de Mordomia e Mesada Cristã

## 1. Visão Geral (Product Vision)
O **Kreds** não é apenas um gerenciador de mesadas, mas uma ferramenta de discipulado e educação financeira fundamentada nos princípios bíblicos de mordomia. O aplicativo visa treinar crianças na administração de recursos, priorizando a Deus (Dízimo), o próximo (Generosidade) e a gestão pessoal (Tarefas e Desejos).

## 2. Princípios de Caráter e Valores
* **Mordomia Cristã:** Tudo pertence a Deus; somos apenas administradores.
* **Princípio das Primícias:** O dízimo (10%) é a primeira parte a ser separada de todo ganho.
* **Integridade e Zelo:** A regra das 72h incentiva a verdade e a disciplina no registro das ações.
* **Imitação de Cristo:** O serviço e a doação são reflexos do amor de Jesus.

## 3. Público-Alvo
* **Responsáveis:** Pais que desejam educar filhos sob a ótica cristã e financeira.
* **Filhos:** Crianças e adolescentes (foco inicial em crianças de 6+ anos).

## 4. Requisitos Funcionais (Core Features)

### 4.1 Gestão de Família (Multitenancy)
* Isolamento de dados por `family_id`.
* Cadastro de múltiplos responsáveis e filhos.
* Perfis com avatares customizados.

### 4.2 Ciclo de Atividades
* **Periodicidade:** Domingo a Sábado.
* **Status de Atividade:** Registro histórico de quando uma tarefa foi ativada/desativada.
* **Regra de Ouro (72h):** Bloqueio sistêmico para preenchimento de tarefas após 3 dias da data de ocorrência.

### 4.3 Motor Financeiro (The Kreds Engine)
* **Ganhos (+):** Crédito por tarefas realizadas.
* **Ajustes (-):** Débitos por comportamentos desalinhados.
* **Dízimo Automático (Primícias):** Retenção obrigatória de 10% de todos os ganhos positivos para o "Tesouro das Primícias".
* **Matching Fund de Doação:** Bonificação de 10% paga pelos pais sobre valores doados voluntariamente pela criança.

### 4.4 Módulos de Destinação
* **Wishlist (Desejos):** Metas de consumo com barras de progresso neon.
* **Kreds do Bem (Impacto Social):** Doações para causas/pessoas com incentivo dos pais.

## 5. Requisitos Técnicos e Stack
* **Frontend:** React/Next.js (Web & Mobile PWA) via Stitch.
* **Backend:** API em Go ou Node.js via OpenCode.
* **Database:** PostgreSQL (Relacional para auditoria de transações).
* **Infra:** Cluster Kubernetes (K8s), ArgoCD, Docker, Harbor.

## 6. Camada Bíblica (Integração de Conteúdo)
* Exibição estratégica de versículos (Malaquias 3:10, Provérbios 22:6, Colossenses 3:23).
* Relatório de Gratidão ao final do ciclo semanal.

---
