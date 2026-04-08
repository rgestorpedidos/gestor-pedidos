# Changelog — Gestor Pedidos

Todas as mudanças significativas do projeto estão documentadas aqui.
Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

---

## [0.13.0] — 2026-04-08

### Cardápio — Grupos de Opções: deploy na produção + refinamentos de UX

- **`src/components/app/cardapio/cardapio-tabs.tsx`** — coluna "Grupos" entrou em produção (branch `feat/admin-users` mergeada em `main` e deployada na Vercel); ícone de engrenagem `Settings2` abre o `OpcaoGrupoSheet`
- **`src/components/app/cardapio/opcao-grupo-sheet.tsx`** — input de `precoAdicional` refatorado: prefixo "R$" fixo com posicionamento absoluto (`pl-9`), placeholder `0,00`, `defaultValue` `0.00` — padrão nativo Shadcn
- **`src/components/app/cardapio/item-form.tsx`** — campo "Preço" recebe o mesmo tratamento: wrapper `relative`, prefixo "R$" e `pl-9` no Input; label simplificado de "Preço (R$)" para "Preço"

### Core — Sincronização de Versão

- **`src/lib/version.ts`** *(novo)* — constante `APP_VERSION` centralizada; fonte única da verdade para a versão exibida na UI
- **`src/components/app/sidebar.tsx`** — substituído `v1.0.0` hardcoded por `v{APP_VERSION}` importado de `@/lib/version`
- **`package.json`** — campo `version` atualizado de `0.1.0` para `0.13.0` (sincronizado com o histórico real do Changelog)



---

## [0.12.0] — 2026-04-04

### Cardápio — UI de grupos de opções

- **`src/components/app/cardapio/opcao-grupo-sheet.tsx`** — novo componente Sheet; lista grupos do item, cria/deleta `OpcaoGrupo` (nome, obrigatório, min/max seleções), adiciona/deleta `Opcao` (nome, preço adicional); estado expandido por grupo; `useTransition` + toast em cada ação
- **`/admin/cardapio/page.tsx`** — query extendida com `include: { opcaoGrupos: { include: { opcoes } } }`; dados serializados e passados para `CardapioTabs`
- **`CardapioTabs`** — nova coluna "Grupos" com botão de engrenagem (`Settings2`) que abre `OpcaoGrupoSheet`; tipo `ItemWithCategoria` extendido com `opcaoGrupos: GrupoData[]`

---

## [0.11.0] — 2026-04-04

### Superadmin (Fase 5)

- **`src/actions/admin/users.ts`** — `deleteUser(userId)`: guard `requireSuperAdmin` (role === SUPERADMIN); bloqueia auto-deleção; deleta do Prisma (fonte de verdade do RBAC) e depois do Supabase Auth (best-effort); `revalidatePath` em `/admin/super`, `/admin/users`, `/admin`
- **`/admin/super/page.tsx`** — Server Component; guard: redirect se role !== SUPERADMIN; `Promise.all` para users + getDashboardMetrics; 8 cards de métricas consolidadas (mesas, pedidos, usuários); tabela completa de usuários com delete; passa `currentUserId` para prevenir auto-deleção na UI
- **`/admin/super/loading.tsx`** — skeleton 8 cards + tabela
- **`UsersTable`** — novas props `showDelete` e `currentUserId`; `DeleteCell` com `AlertDialog` de confirmação; botão desabilitado para o próprio usuário; coluna extra visível apenas quando `showDelete = true`
- **Sidebar** — link "Super Admin" habilitado (removido `disabled: true`)

---

## [0.10.0] — 2026-04-03

### Dashboard: Métricas de Pedidos (Fase 4 — completo)

- **`src/actions/admin/metrics.ts`** — `DashboardMetrics` expandido com 4 novos campos: `pedidosAbertos` (count ABERTO), `pedidosFechadosHoje` (count FECHADO desde 00:00), `ticketMedio` (média de `precoUnitario * quantidade` por pedido FECHADO hoje), `itensNaCozinha` (count PedidoItem ENVIADO em pedido ABERTO); todas as 8 queries em `Promise.allSettled` — falha parcial não derruba o dashboard
- **`/admin/page.tsx`** — dashboard reorganizado em seções "Mesas" e "Pedidos — hoje"; 4 novos cards: Pedidos Abertos, Pedidos Fechados, Ticket Médio (formatado em R$), Itens na Cozinha; `formatCurrency()` com `toLocaleString pt-BR`; `DashboardMetrics` importado do actions (tipo compartilhado, sem duplicação)

---

## [0.9.0] — 2026-04-03

### Admin: Usuários (Fase 4 — parcial)

- **`src/actions/admin/users.ts`** — `requireAdmin()` guard; `createUser` (Supabase Admin API + Prisma, reutiliza authUserId existente se email já existe no Auth); `updateUserRole` com `canAssignRole` (só SUPERADMIN pode atribuir role SUPERADMIN); `setUserActive` (ativar/desativar sem deletar)
- **`/admin/users/page.tsx`** — Server Component com guard ADMIN_ROLES; ordena por `active desc, updatedAt desc`; passa `UserRow[]` para `UsersTable`
- **`/admin/users/loading.tsx`** — skeleton da tabela
- **`UsersTable`** — tabela com badge de role e status ativo/inativo; ações inline por linha
- **`UserForm`** — Sheet para criar usuário (email, nome, role, ativo)
- **Dashboard** — card de atalho "Gerenciar Usuários" agora aponta para `/admin/users` (implementada)

---

## [0.8.0] — 2026-03-23

### Painel Cozinha (Fase 3)

- **`src/actions/cozinha/pedidos.ts`** — `requireCozinha()` guard (COZINHA | ADMIN | SUPERADMIN); `marcarItemPronto(itemId)` — valida status ENVIADO antes de atualizar; `marcarTodosProntos(pedidoId)` — `updateMany` atômico; `revalidatePath('/cozinha')` + `revalidatePath('/garcom')`
- **`/cozinha/page.tsx`** — Server Component; query `PedidoItem(ENVIADO)` com `include pedido.mesa`; agrupamento por pedidoId em Map; calcula `minutosEspera` por item; passa `PedidoCozinhaData[]` para `CozinhaView`
- **`/cozinha/loading.tsx`** — skeleton grid 3 cards
- **`/cozinha/error.tsx`** — error boundary do route group cozinha
- **`CozinhaView`** — client component; polling 10s com `visibilitychange`; estado vazio com ícone ChefHat verde
- **`PedidoCozinhaCard`** — card por pedido/mesa; botão "Pronto" por item; botão "Tudo pronto" com `marcarTodosProntos`; badge vermelho para itens ≥15min; borda vermelha quando maxEspera ≥ 15min
- **Layout cozinha** — corrigido: SUPERADMIN adicionado ao guard; migrado para `SidebarInset` (padrão do projeto)

---

## [0.7.0] — 2026-03-23

### App Garçom Reimplementado (Fase 2c)

- **`useCarrinhoGarcomStore`** — Zustand com `persist` + `subscribeWithSelector`; carrinhos por `mesaId`; TTL 8h; `partialize` persiste apenas `carrinhos` (não `activeModal`); chave `carrinho-garcom-v1`
- **`useTabPolling`** — polling de `router.refresh()` a cada 10s; pausa em `document.hidden` e quando `activeModal !== null`; retoma com refresh imediato ao voltar para a aba
- **`/garcom/page.tsx`** — atualizado com query Prisma que traz contagem de itens ENVIADO por mesa; badge "X na cozinha" em mesas OCUPADAS
- **`MesaGarcomCard`** — botão "Confirmar chegada" inline para mesas RESERVADAS (chama `confirmarReserva`)
- **`/garcom/mesa/[id]/page.tsx`** — Server Component reimplementado; `Promise.all` para 3 queries (mesa, pedido ativo, cardápio completo); passa dados serializados para `MesaGarcomView`
- **`/garcom/mesa/[id]/not-found.tsx`** — página de mesa não encontrada
- **`MesaGarcomView`** — client component principal; integra `useTabPolling`, `purgeExpired` on mount, ProductModal e CartDrawer
- **`ItemCardapioCard`** — card de item com botão `+` (touch target 44px), badge "Imediato" para `vaiParaCozinha = false`
- **`ProductModal`** — Sheet bottom; RadioGroup (maxSelecoes = 1) ou Checkbox (maxSelecoes > 1) por grupo; validação de grupos obrigatórios; `precoUnitario` com adicionais; campo observação
- **`CartDrawer`** — Sheet bottom com 3 seções: **No carrinho** (RASCUNHO do Zustand) / **Na cozinha** (ENVIADO do DB) / **Pronto** (PRONTO do DB); botão "Enviar Rodada" com total; "Fechar Conta" bloqueado se há ENVIADO, exige forma de pagamento
- **`src/app/(garcom)/error.tsx`** — error boundary do route group garçom

---

## [0.6.0] — 2026-03-23

### Admin Cardápio (Fase 2a) + Schema Garçom Reimplementado (Fase 2b)

#### Adicionado — Fase 2a

- **Schema Prisma — Cardápio:**
  - `Categoria` (nome, ordem, ativo)
  - `ItemCardapio` (nome, descricao, preco, imagemUrl, vaiParaCozinha, ativo, categoriaId)
  - `OpcaoGrupo` (nome, obrigatorio, minSelecoes, maxSelecoes, itemCardapioId)
  - `Opcao` (nome, precoAdicional, ativo, opcaoGrupoId)
  - `ON DELETE RESTRICT` em toda a cadeia; `@@index` em todas as FKs
- **`src/actions/admin/cardapio.ts`** — 13 Server Actions com `requireAdmin()`: CRUD completo de Categoria, ItemCardapio (+ `toggleItemAtivo`), OpcaoGrupo e Opcao; `fkErrorMsg()` trata P2003 com mensagem legível; `revalidatePath('/garcom')` em todas as mutations
- **`/admin/cardapio/page.tsx`** — Server Component com `Promise.all`; passa dados para `CardapioTabs`
- **`/admin/cardapio/loading.tsx`** — skeleton automático
- **`CardapioTabs`** — client component com tabs "Itens" e "Categorias"; `ToggleAtivo` com `useTransition`; delete com `AlertDialog`
- **`CategoriaForm` / `ItemForm`** — Sheet forms com `Switch` para `vaiParaCozinha`
- **Sidebar** — item "Cardápio" ativado (removido `disabled: true`)

#### Adicionado — Fase 2b

- **Schema Prisma — PedidoItem reimplementado:**
  - `itemCardapioId` FK com `ON DELETE RESTRICT`
  - `nomeSnapshot String` — imutável após pedido
  - `precoUnitario Float` — snapshot do preço + adicionais
  - `quantidade Int`
  - `observacao String?`
  - `opcoesSelecionadas Json?`
  - `status String @default("ENVIADO")` — ENVIADO | PRONTO
  - `@@index([pedidoId])` e `@@index([itemCardapioId])`
- **Schema Prisma — Pedido simplificado:**
  - Status: apenas `ABERTO | FECHADO` (removido CONFIRMADO | PRONTO)
  - `metodoPagamento String?`
  - `@@index([mesaId])`
- **`src/actions/garcom/pedidos.ts`** — Server Actions: `abrirOuObterPedido` (`$transaction` sem `isolationLevel` para SQLite), `enviarRodada` (Zod array + validação DB + grupos obrigatórios + snapshots + bypass cozinha), `cancelarItem` (guard ENVIADO), `fecharPedido` (guard itens ENVIADO + `$transaction`), `confirmarReserva`
- **Baseline migration** — `0_init` criado e marcado como aplicado; projeto migrado de `db push` para `migrate dev`
- **Migration** `20260323022251_add_cardapio` — 4 tabelas do cardápio
- **Migration** `20260323023226_reimplementar_garcom` — PedidoItem + Pedido

---

## [0.5.0] — 2026-03-22

### Adicionado — App Garçom (Fase 2 — versão original, substituída em 0.6.0/0.7.0)

- Schema Prisma: modelos `Pedido` e `PedidoItem` (versão simples — nome/quantidade/preço livre)
- Server Actions com guard `requireGarcom`: `criarPedido`, `adicionarItem`, `removerItem`, `confirmarPedido`, `fecharPedido`
- `/garcom/page.tsx` — grid de mesas
- `/garcom/mesa/[id]/page.tsx` — detalhe da mesa com pedido ativo

### Modificado

- `src/app/(garcom)/layout.tsx` — migrado para `SidebarInset` + `SidebarTrigger`; guard para `ROLES` constants + `SUPERADMIN`

---

## [0.3.0] — 2026-03-22

### Adicionado

- **Sidebar reformulada** — `NavGroup` + `NavUser` + `SidebarRail` (estilo cardapio-digital)
- **`src/components/app/types.ts`** — tipos de navegação compartilhados
- **`src/components/app/nav-group.tsx`** — grupos colapsáveis com dropdown collapsed
- **`src/components/app/nav-user.tsx`** — footer com Avatar e dropdown de logout
- **`src/app/api/admin/metrics/route.ts`** — endpoint REST para dashboard client-side
- **`docs/PROXIMOS-PASSOS.md`** — documento de trabalho por fase
- **`/admin/mesas`** — CRUD completo (grid, criar, editar, excluir, status)
- **`src/actions/admin/mesas.ts`** — Server Actions com `requireAdmin()` + Zod

### Modificado

- Dashboard admin convertido para Client Component com skeletons inline por métrica
- Layout admin migrado para `SidebarInset` + header com `SidebarTrigger`

---

## [0.2.0] — 2026-03-22

### Adicionado

- **Magic Link Auth** via Supabase OTP
- **`src/lib/roles.ts`** — constantes de roles tipadas via `as const`
- **`src/app/api/auth/callback/route.ts`** — handler do magic link
- **`src/actions/auth/check-auth.ts`** — verifica email no Prisma antes do magic link
- **`src/actions/admin/metrics.ts`** — `Promise.allSettled` + tipo `DashboardMetrics`
- **`scripts/create-superadmin.ts`** — CLI para criar superadmin via Supabase Admin API

### Corrigido

- Loop de redirect infinito para `SUPERADMIN`
- 404 ao clicar em "Dashboard" na sidebar (href errado)
- Guard de RBAC com token expirado (`getSession()` → `getUser()`)

---

## [0.1.0] — 2026-03-22

### Adicionado

- Setup inicial: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui
- Prisma com SQLite — modelos `User` e `Mesa`
- Supabase Auth + `@supabase/ssr` configurado
- Route groups: `(auth)`, `(admin)`, `(garcom)`, `(cozinha)`
- Middleware de proteção de rotas
- Sidebar com navegação por role
- Layouts por área com guards de role básicos
- Documentação inicial
