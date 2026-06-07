# Biblioteca de Prompts Stitch - Projeto Kreds

Este documento contém os prompts otimizados para gerar a interface do app Kreds no Stitch, utilizando o design system **Vibrant Dark Glassmorphism**.

---

## 1. Design System & Global Styles
**Objetivo:** Definir as variáveis de estilo para consistência visual.

> **Prompt:** "Atue como UI Engineer Sênior. Configure o Design System global para o app 'Kreds'. Use as seguintes especificações: 
> - **Background:** #0F0F12 (Deep Charcoal).
> - **Cards:** #16161D com 60% opacidade e backdrop-filter: blur(12px).
> - **Primária:** #7000FF (Roxo Neon).
> - **Sucesso (Ganhos/Dízimo):** #BBFE1B (Verde Limão).
> - **Alerta/Ação:** #FF6BFF (Rosa Shocking).
> - **Impacto Social:** Gradiente Laranja para Ouro (#FF8C00 para #FFD700).
> - **Bordas:** Todas as pílulas e cards com border-radius de 32px.
> - **Tipografia:** Poppins (Títulos ExtraBold) e Inter (Corpo). 
> Gere as classes Tailwind ou CSS correspondentes."

---

## 2. Tela de Login e Seleção de Perfil
**Objetivo:** Acesso simplificado para crianças e seguro para pais.

> **Prompt:** "Gere uma tela de login 'Family Gateway'. No topo, ícone de raio neon com o título 'KREDS'. Abaixo, crie uma seção 'Quem vai administrar o tesouro hoje?' com avatares circulares grandes para os membros da família. Os avatares devem ter bordas pulsantes neon. Ao clicar em um perfil de criança, abra um Numpad de vidro para inserir PIN de 4 dígitos. Para o perfil de responsável, mostre login tradicional de e-mail/senha. Estilo: Glassmorphism e Dark Mode."

---

## 3. Dashboard da Criança (Checklist & Primícias)
**Objetivo:** Visualização diária de tarefas e dízimo acumulado.

> **Prompt:** "Crie a interface mobile da criança. 
> 1. **Topo:** Card de 'Meu Saldo' em verde limão e um card menor 'Dízimo (Malaquias 3:10)' mostrando o valor acumulado para Deus.
> 2. **Lista de Tarefas:** Cards com ícones 3D. 
> 3. **Lógica Visual:** Se a tarefa for de hoje ou dos últimos 2 dias, o botão de check roxo está ativo. Se tiver mais de 3 dias (72h), o card deve ficar em escala de cinza, desabilitado, exibindo um ícone de cadeado dourado e a mensagem 'Fora do Prazo'.
> 4. **Estilo:** Bordas ultra arredondadas e micro-interações de glow ao marcar tarefas."

---

## 4. Painel Administrativo do Responsável
**Objetivo:** Gestão de atividades e auditoria.

> **Prompt:** "Crie um painel administrativo desktop para os pais. 
> - **Dashboard:** Gráficos neon de evolução de saldo e dízimo por filho.
> - **Tabela de Atividades:** Colunas para Nome, Valor (Kreds), Tipo (+/-), Status (Ativa/Inativa) e 'Desde' (data da última mudança).
> - **Ações:** Botão flutuante rosa para 'Ajuste de Comportamento' (débito manual) com campo de motivo.
> - **Gestão de Filhos:** Área para editar idade, nome e PIN das crianças. Estilo: Dark mode corporativo moderno."

---

## 5. Módulo 'Kreds do Bem' & 'Wishlist'
**Objetivo:** Ensinar doação e consumo consciente.

> **Prompt:** "Crie duas abas no app da criança: 
> 1. **Kreds do Bem:** Interface de doação com gradiente laranja. Mostre um banner explicativo: 'Papai adiciona +10% em cada doação'. Use sliders de vidro para escolher o valor e mostre o cálculo do bônus em tempo real.
> 2. **Desejos:** Lista de desejos (Wishlist) com fotos. Cada item tem uma barra de progresso neon indicando a porcentagem do saldo necessária para atingir a meta. Adicione versículos sobre gratidão no rodapé."

---
