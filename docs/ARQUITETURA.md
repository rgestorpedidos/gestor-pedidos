# Arquitetura — Gestor Pedidos

> Single-tenant. Sistema de pedidos em tempo real para bares e restaurantes com 3 interfaces: garçom, cozinha e admin.

> Atualização: Fases 0–3 concluídas. `/admin/users` implementado. Próximas frentes: métricas de pedidos no dashboard, `/admin/super` e migração para Postgres em produção.

---

## Route Groups

```
src/app/
├── page.tsx                        # Root: redireciona por role
│
├── (auth)/
│   └── login/page.tsx              # Magic link — sem senha
│
├── (admin)/
│   ├── layout.tsx                  # Guard: ADMIN | SUPERADMIN + SidebarInset
│   ├── error.tsx                   # Error boundary do admin
│   └── admin/
│       ├── page.tsx                # Dashboard (Client Component, /api/admin/metrics)
│       ├── loading.tsx
│       ├── mesas/                  # CRUD de mesas
│       ├── cardapio/               # Tabs: Itens + Categorias
│       ├── users/                  # Gestão de usuários (page + loading)
│       └── super/                  # SUPERADMIN exclusivo (page + loading)
│
├── (garcom)/
│   ├── layout.tsx                  # Guard: GARCOM | ADMIN | SUPERADMIN
│   ├── error.tsx                   # Error boundary do garçom
│   └── garcom/
│       ├── page.tsx                # Grid de mesas com ENVIADO count
│       ├── loading.tsx
│       └── mesa/[id]/
│           ├── page.tsx            # Scroll menu cardápio + pedido ativo
│           ├── loading.tsx
│           └── not-found.tsx
│
├── (cozinha)/
│   ├── layout.tsx                  # Guard: COZINHA | ADMIN | SUPERADMIN
│   └── cozinha/page.tsx            # ← Painel da cozinha implementado
│
└── api/
    ├── auth/callback/route.ts      # Troca code do magic link por sessão
    └── admin/metrics/route.ts      # GET → getDashboardMetrics()
```

---

## Autenticação — Magic Link (sem senha)

```
1. Usuário digita e-mail em /login
2. checkEmailAuthorized() verifica se email existe em User (Prisma) e está active
3. supabase.auth.signInWithOtp() envia magic link por e-mail
4. Usuário clica no link → redireciona para /api/auth/callback?code=...
5. exchangeCodeForSession(code) → sessão criada
6. Redirect para / → root page redireciona por role
```

**Implementação:** `shouldCreateUser: false` — usuário deve ser criado via script `create-superadmin` ou pelo painel admin (Fase 4).

---

## RBAC (Role-Based Access Control)

### Constantes (`src/lib/roles.ts`)

```typescript
export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  COZINHA: 'COZINHA',
  GARCOM: 'GARCOM',
} as const

export const ADMIN_ROLES = [ROLES.SUPERADMIN, ROLES.ADMIN]
```

### Guard de sessão (`src/lib/auth.ts`)

```
getUserRole()
  → supabase.auth.getUser()     # Revalida token com servidor Supabase
  → prisma.user.findUnique()    # Busca role + active no banco
  → retorna Role | null
```

> **Regra crítica:** usa `getUser()` (não `getSession()`). `getSession()` lê cookie sem revalidar com o servidor — vulnerável a session fixation.

### Matriz de acesso

| Rota | SUPERADMIN | ADMIN | GARCOM | COZINHA |
|------|:---:|:---:|:---:|:---:|
| `/admin` | ✅ | ✅ | ❌ | ❌ |
| `/admin/cardapio` | ✅ | ✅ | ❌ | ❌ |
| `/garcom` | ✅ | ✅ | ✅ | ❌ |
| `/cozinha` | ✅ | ✅ | ❌ | ✅ |
| `/admin/super` | ✅ | ❌ | ❌ | ❌ |

---

## Modelos de Dados (Prisma)

### Usuários e Mesas

```
User ──── (login via Supabase Auth, id = UUID do Auth)
Mesa ──── Pedido[] (relação 1:N)
```

### Pedido e Itens

```
Mesa → Pedido (ABERTO | FECHADO)
     → PedidoItem (ENVIADO | PRONTO)
          ↓ FK itemCardapioId (RESTRICT)
       ItemCardapio
```

**PedidoItem** armazena snapshots imutáveis:
- `nomeSnapshot` — nome do item na hora do pedido
- `precoUnitario` — preço base + adicionais das opções selecionadas
- `opcoesSelecionadas Json?` — `Record<grupoId, opcaoId[]>`

### Cardápio

```
Categoria → ItemCardapio (vaiParaCozinha, ativo)
                ↓
           OpcaoGrupo (obrigatorio, minSelecoes, maxSelecoes)
                ↓
             Opcao (precoAdicional)
```

`ON DELETE RESTRICT` em toda a cadeia — garante integridade referencial. Para remover um item do cardápio, use `ativo = false`.

---

## Fluxo do Pedido

```
Garçom abre mesa
  → abrirOuObterPedido(mesaId)         # cria Pedido ABERTO + mesa → OCUPADA
  → Garçom navega no cardápio
  → ProductModal (itens com opcaoGrupos)
  → adicionarItem() no Zustand store   # RASCUNHO local
  → "Enviar Rodada" no CartDrawer
  → enviarRodada(mesaId, itens[])      # cria PedidoItems ENVIADO no banco
        ↓ (itens vaiParaCozinha = false → já nascem PRONTO)
  → Cozinha vê itens ENVIADO
  → marcarItemPronto(itemId)           # ENVIADO → PRONTO
  → CartDrawer mostra itens PRONTO
  → "Fechar Conta" (bloqueado se ENVIADO > 0)
  → fecharPedido(mesaId, pedidoId, metodoPagamento)
        → Pedido → FECHADO + Mesa → LIVRE
```

---

## Estado do Cliente (Zustand)

```typescript
// src/stores/carrinho-garcom.ts
useCarrinhoGarcomStore {
  carrinhos: Record<mesaId, { itens: CarrinhoItem[], expiresAt: number }>
  activeModal: string | null  // 'cart' | 'product:itemId' | null

  // Persisted: apenas `carrinhos` (TTL 8h por mesaId)
  // activeModal: ephemeral — não sobrevive reload
}
```

**Controle de modal (`activeModal`):**
- `null` → nenhum modal aberto (polling ativo)
- `'cart'` → CartDrawer aberto (polling pausado)
- `'product:id'` → ProductModal aberto (polling pausado)
- Abertura de um fecha o outro implicitamente

---

## Polling de Atualizações

```typescript
// src/hooks/useTabPolling.ts
useTabPolling(mesaId, 10_000)
  → setInterval(router.refresh(), 10s)
  → pausa quando activeModal !== null
  → pausa quando document.hidden
  → refresh imediato ao voltar para a aba
```

`router.refresh()` re-fetcha Server Components sem navegação, mantendo estado client-side.

---

## Server Actions

### Guards disponíveis

| Guard | Arquivo | Roles autorizados |
|-------|---------|-------------------|
| `requireAdmin()` | `actions/admin/*.ts` | SUPERADMIN, ADMIN |
| `requireGarcom()` | `actions/garcom/pedidos.ts` | SUPERADMIN, ADMIN, GARCOM |
| `requireCozinha()` | `actions/cozinha/*.ts` *(Fase 3)* | SUPERADMIN, ADMIN, COZINHA |

Todos os guards: `getUser()` → Prisma `findUnique` → verifica `active` e `role`.

### `actions/admin/cardapio.ts`
- CRUD: Categoria (3), ItemCardapio (4 + toggle), OpcaoGrupo (3), Opcao (3)
- `fkErrorMsg()` — trata `P2003` (FK RESTRICT) com mensagem legível
- `revalidatePath('/garcom')` em mutations que afetam itens visíveis ao garçom

### `actions/garcom/pedidos.ts`
- `abrirOuObterPedido(mesaId)` — `$transaction`: busca Pedido ABERTO ou cria + mesa → OCUPADA
- `enviarRodada(mesaId, itens[])` — Zod + validação DB + grupos obrigatórios + snapshots + bypass cozinha
- `cancelarItem(mesaId, itemId)` — deleta se ENVIADO; bloqueia se PRONTO
- `fecharPedido(mesaId, pedidoId, metodoPagamento?)` — bloqueia se count(ENVIADO) > 0
- `confirmarReserva(mesaId)` — RESERVADA → LIVRE
- `assertPedidoAcessivel(mesaId, pedidoId)` — helper interno: verifica propriedade do pedido

---

## Migrations

O projeto usa `prisma migrate dev` (não `db push`).

| Migration | Conteúdo |
|-----------|---------|
| `0_init` | Baseline: User, Mesa, Pedido, PedidoItem (v1) |
| `20260323022251_add_cardapio` | Categoria, ItemCardapio, OpcaoGrupo, Opcao |
| `20260323023226_reimplementar_garcom` | PedidoItem v2 + Pedido simplificado |

---

## Camadas de Segurança

```
Request
  ↓
Middleware          # Verifica sessão existe (cookie válido)
  ↓
Layout (Server)    # getUserRole() → getUser() + Prisma → verifica role
  ↓
Server Action      # Guard próprio → getUser() + Prisma novamente (defense in depth)
  ↓
Prisma query       # Dados retornados apenas se tudo passou
```

**BOLA (OWASP A01):** aceito por design no garçom — single-tenant, todos os garçons têm igual acesso a todas as mesas. `assertPedidoAcessivel` previne acesso a pedidos de outras mesas.

---

## Sidebar

```
components/app/
├── sidebar.tsx      # AppSidebar — monta sidebarData por role
├── nav-group.tsx    # SidebarGroup colapsável com dropdown collapsed
├── nav-user.tsx     # Footer: Avatar + dropdown com logout
└── types.ts         # NavLink | NavCollapsible | NavGroup | SidebarData
```

- Grupos: **Geral**, **Administração**, **Operacional**
- Item `Super Admin` apenas quando `userRole === ROLES.SUPERADMIN`
- Items sem rota → `disabled: true` → `opacity-40`, não clicáveis


