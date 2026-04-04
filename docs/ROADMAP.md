# Roadmap — Gestor Pedidos

> Estado atual do produto: Fases 0 a 5 concluídas. O próximo trabalho está concentrado na Fase 6 (Polish + Deploy).

---

## Status geral

| Fase | Descrição | Status |
|------|-----------|--------|
| 0 | Fundação: Auth, RBAC, Dashboard | ✅ Concluída |
| 0.5 | UI/UX: Sidebar + Dashboard (estilo cardapio-digital) | ✅ Concluída |
| 1 | Gerenciamento de Mesas | ✅ Concluída |
| 2a | Admin: Cardápio (Categoria, ItemCardapio, OpcaoGrupo, Opcao) | ✅ Concluída |
| 2b | Schema Garçom Reimplementado (snapshots, status por item) | ✅ Concluída |
| 2c | App Garçom Reimplementado (Zustand, ProductModal, CartDrawer) | ✅ Concluída |
| 3 | Painel Cozinha (polling 10s, marcar pronto por item/pedido) | ✅ Concluída |
| 4 | Admin: Usuários + Dashboard com métricas de pedidos | ✅ Concluída |
| 5 | Superadmin: Painel exclusivo + delete usuário + métricas consolidadas | ✅ Concluída |
| 6 | Polish + Deploy | 📋 Planejada |

---

## Fase 0 — Fundação ✅

- [x] Autenticação via Magic Link (sem senha)
- [x] RBAC com 4 roles: `SUPERADMIN`, `ADMIN`, `GARCOM`, `COZINHA`
- [x] Constantes de roles tipadas (`lib/roles.ts`)
- [x] Guard de sessão com `getUser()` (revalida token no servidor)
- [x] Script `create-superadmin` via CLI
- [x] Dashboard admin com métricas reais
- [x] Skeleton loading automático via `loading.tsx`
- [x] Error boundary via `error.tsx`
- [x] Correção de loop de redirect para `SUPERADMIN`

## Fase 0.5 — UI/UX ✅

- [x] Sidebar: `NavGroup` + `NavUser` + `SidebarRail` (estilo cardapio-digital)
- [x] Layout admin: `SidebarInset` + header com `SidebarTrigger`
- [x] Dashboard: Client Component com skeletons inline por métrica
- [x] Hero card de status + ações rápidas

---

## Fase 1 — Gerenciamento de Mesas ✅

- [x] Listar mesas com status visual (LIVRE / OCUPADA / RESERVADA)
- [x] Criar / editar / excluir mesas
- [x] Alterar status da mesa manualmente
- [x] Rota `/admin/mesas`

---

## Fase 2a — Admin: Cardápio ✅

- [x] Modelos Prisma: `Categoria`, `ItemCardapio`, `OpcaoGrupo`, `Opcao`
- [x] `vaiParaCozinha` por item — bypass da fila da cozinha para bebidas/não-preparados
- [x] `ON DELETE RESTRICT` em toda a cadeia cardápio → pedido
- [x] Server Actions CRUD com `requireAdmin()` + Zod (13 actions)
- [x] `/admin/cardapio` — tabs Itens e Categorias, toggle de disponibilidade
- [x] Sidebar: "Cardápio" ativado

## Fase 2b — Schema Garçom Reimplementado ✅

- [x] Baseline migration (`0_init`) — projeto migrado de `db push` para `migrate dev`
- [x] `PedidoItem` reimplementado: `itemCardapioId` FK, `nomeSnapshot`, `precoUnitario`, `observacao`, `opcoesSelecionadas Json?`, `status ENVIADO|PRONTO`
- [x] `Pedido` simplificado: status `ABERTO|FECHADO` apenas, `metodoPagamento`
- [x] Indexes: `@@index([mesaId])`, `@@index([pedidoId])`, `@@index([itemCardapioId])`
- [x] Server Actions garçom: `abrirOuObterPedido`, `enviarRodada`, `cancelarItem`, `fecharPedido`, `confirmarReserva`

## Fase 2c — App Garçom Reimplementado ✅

- [x] `useCarrinhoGarcomStore` — Zustand persist + subscribeWithSelector + TTL 8h por mesaId
- [x] `useTabPolling` — polling 10s com pause em visibilitychange e activeModal
- [x] `/garcom` — badge ENVIADO count em mesas OCUPADAS + botão "Confirmar chegada" em RESERVADAS
- [x] `/garcom/mesa/[id]` — scroll menu por categoria, header sticky com counters
- [x] `ItemCardapioCard` — touch targets 44px, badge "Imediato" para `vaiParaCozinha = false`
- [x] `ProductModal` — bottom sheet, radio/checkbox por grupo, observação, preço em tempo real
- [x] `CartDrawer` — 3 seções (RASCUNHO / ENVIADO / PRONTO), Enviar Rodada, Fechar Conta
- [x] `not-found.tsx` para mesa inexistente

---

## Fase 3 — Painel Cozinha ✅

- [x] `/cozinha` — cards de pedidos com itens ENVIADO agrupados por mesa
- [x] Transição de status por item: ENVIADO → PRONTO (`marcarItemPronto`)
- [x] "Tudo pronto" por pedido (`marcarTodosProntos`)
- [x] Badge de urgência (≥15min em vermelho)
- [x] Polling 10s com pause em `document.hidden`
- [x] `requireCozinha()` guard — COZINHA | ADMIN | SUPERADMIN
- [x] `error.tsx` + `loading.tsx` no route group cozinha
- [x] Layout cozinha corrigido — SUPERADMIN + SidebarInset
- [ ] Notificação sonora ao receber item novo (Fase 4)

---

## Fase 4 — Admin: Usuários + Dashboard

- [x] `/admin/users` — listar, criar, editar role, ativar/desativar
- [x] Integração com Supabase Admin API para criação de usuário
- [x] Dashboard — métricas de pedidos: pedidos abertos, fechados hoje, ticket médio, itens na cozinha
- [x] `ItemCardapio` — campo `onDelete: Restrict` já garante histórico (sem dados perdidos ao inativar)
- [x] Card de atalho do dashboard aponta para `/admin/users` (implementada)

---

## Fase 5 — Superadmin ✅

- [x] `/admin/super` — exclusivo para `SUPERADMIN`
- [x] Visão consolidada de todas as métricas do sistema (mesas + pedidos + usuários)
- [x] Gestão completa de usuários com delete permanente (Prisma + Supabase Auth)
- [x] Sidebar: link "Super Admin" habilitado

---

## Fase 6 — Polish + Deploy

- [ ] Deploy Vercel + Supabase
- [ ] Migrar banco de SQLite para Supabase Postgres
- [ ] Testes end-to-end
- [ ] Manual de uso / comanda impressa (modal)
- [ ] QR code do cardápio para clientes

---

## Decisões arquiteturais

| Decisão | Motivo |
|---------|--------|
| Magic Link em vez de senha | Segurança — sem credenciais para vazar |
| SQLite no dev | Simplicidade local; migra para Postgres em produção |
| `getUser()` em vez de `getSession()` | Revalida token no servidor — imune a session fixation |
| `Promise.allSettled` nas métricas | Falha parcial não derruba o dashboard |
| Roles como constantes `as const` | Typos geram erro de compilação TypeScript |
| Tab único por mesa | Garçom gerencia uma conta aberta por noite; nova rodada acumula na mesma tab |
| `vaiParaCozinha` por item | Bebidas geladas e similares não precisam de fila na cozinha |
| `nomeSnapshot + precoUnitario` | Histórico imutável — preço não muda retroativamente |
| `opcoesSelecionadas Json?` | Snapshot das opções sem FK para preservar histórico de opções deletadas |
| Zustand TTL 8h | Carrinhos de turnos anteriores expiram automaticamente no localStorage |
| `subscribeWithSelector` no store | `useTabPolling` pode pausar/retomar via subscription sem re-render |
| Polling 10s + visibilitychange | Balanço entre atualização e custo de requisições |

---

## Prioridade Atual

1. Deploy: Vercel + migração SQLite → Postgres (Fase 6)




