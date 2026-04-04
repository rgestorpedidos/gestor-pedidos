# Próximos Passos — Gestor Pedidos

> Documento de trabalho. Atualizado em: 2026-03-23.
> Para o roadmap macro, ver `docs/ROADMAP.md`.

---

## Situação Atual

> Estado atual do projeto: Fases 0 a 5 concluídas. Próxima frente: deploy Vercel + Postgres (Fase 6).

---

## Fase 4 — Admin: Usuários + Métricas

**Dependência:** Pedidos chegando (Fase 2c/3).

### Tarefas

- [x] **`/admin/users`** — listar usuários, criar, editar role, ativar/desativar
  - Criar usuário: Supabase Admin API + Prisma (`actions/admin/users.ts`)
  - Guard: apenas `SUPERADMIN` pode atribuir role SUPERADMIN

- [x] **Dashboard — métricas de pedidos**
  - Pedidos abertos (em andamento agora)
  - Pedidos fechados hoje + ticket médio (baseado em `precoUnitario * quantidade`)
  - Itens na cozinha (PedidoItem ENVIADO em pedidos ABERTOS)

---

## Decisões Pendentes

| Questão | Opções | Impacto |
|---------|--------|---------|
| Realtime na cozinha | Supabase Realtime vs polling 10s | Complexidade vs custo |
| Comanda impressa | Modal com window.print() | UX para garçom |
| QR code cardápio | URL pública por restaurante | Escopo multi-tenant |

---

## Ordem Recomendada

```
1. /cozinha (Fase 3)            → 2-3 sessões
2. /admin/users                 → 1-2 sessões
3. Dashboard métricas pedidos   → 1 sessão
4. Polish: comanda, QR code     → 1-2 sessões
5. Deploy: Vercel + Postgres    → 1 sessão
```




