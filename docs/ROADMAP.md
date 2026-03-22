# 🗺️ Roadmap — Gestor Pedidos

## Fases de Desenvolvimento

### Fase 1: Setup Base & Banco de Dados (2-3h)
- [ ] Copiar base do Cardápio Digital (estrutura, dependências, auth)
- [ ] Remover rotas desnecessárias (`(public)`, `super`, delivery)
- [ ] Simplificar autenticação (remover multi-tenant logic)
- [ ] Criar schema Prisma (Mesa, ItemCardapio, Pedido, PedidoItem, Consumo)
- [ ] Setup Supabase single-tenant
- [ ] Criar CLAUDE.md e ARQUITETURA.md

**Entregável:** Base pronta, DB criada, docs iniciais

---

### Fase 2: APIs Base & RBAC (3-4h)
- [ ] Implementar RBAC: ADMIN, GARCOM, COZINHA
- [ ] CRUD Mesas (`POST`, `GET`, `PATCH`, `DELETE`)
- [ ] CRUD Pedidos (criar, listar, atualizar status, cancelar)
- [ ] CRUD Itens Cardápio (GET, POST, DELETE)
- [ ] Validações Zod para todos endpoints
- [ ] Error handling padronizado

**Entregável:** APIs funcionando, testes manual via Postman

---

### Fase 3: Garçom App (4-5h)
- [ ] Dashboard mesas (grid visual com status)
- [ ] Fluxo criar pedido: select mesa → select itens → confirmar
- [ ] Histórico pedidos por mesa
- [ ] UI responsiva (tablets + mobile)
- [ ] Integração com APIs Fase 2

**Entregável:** App garçom funcional end-to-end

---

### Fase 4: Cozinha Panel (3-4h)
- [ ] Painel pedidos confirmados (real-time)
- [ ] Transições status: "confirmado" → "preparando" → "pronto"
- [ ] WebSocket para atualizações instantâneas
- [ ] Notificações sonoras (opcional: Fase 5)
- [ ] Layout otimizado para tátil/grande tela

**Entregável:** Painel cozinha funcional com real-time

---

### Fase 5: Admin Dashboard & Relatórios (2-3h)
- [ ] Dashboard vendas (gráficos, top produtos, horários)
- [ ] Relatório consumo por cliente/mesa
- [ ] Gerenciar cardápio (CRUD completo)
- [ ] Configurações bar (nome, mesas, horários)
- [ ] Gerenciar usuários (garçons, cozinheiros)

**Entregável:** Admin funcional com relatórios

---

### Fase 6: Polish & Deploy (1-2h)
- [ ] Testes end-to-end
- [ ] Performance optimization
- [ ] Deploy Vercel + Supabase
- [ ] Manual de uso (para bar)
- [ ] Treinamento setup

**Entregável:** Sistema em produção

---

## 📊 Timeline Estimado

| Fase | Duração | Status |
|------|---------|--------|
| 1 | 2-3h | ⏳ Próxima |
| 2 | 3-4h | 📋 Planejada |
| 3 | 4-5h | 📋 Planejada |
| 4 | 3-4h | 📋 Planejada |
| 5 | 2-3h | 📋 Planejada |
| 6 | 1-2h | 📋 Planejada |
| **TOTAL** | **15-20h** | - |

---

## 🎯 Prioridades

### MVP (Fases 1-4): 12-15h
- Base funcional
- Garçom toma pedidos
- Cozinha vê e confirma

### Nice-to-Haves (Fase 5): 2-3h
- Relatórios avançados
- Histórico consumo
- Notificações

### Fase 2.0 (Futuro): Expandir
- Integração delivery (reutilizar Cardápio Digital?)
- Self-checkout cliente
- Promoções/cupons
- Multi-bar (SaaS)

---

## ⚡ Decisões-Chave

1. **Single-tenant:** Cada bar = instância separada (simples > complexo)
2. **WebSocket:** Apenas cozinha (real-time crítico); garçom usa polling
3. **UI:** Tailwind + shadcn/ui (reusable + rápido)
4. **DB:** Prisma + Supabase (já familiar do Cardápio Digital)
5. **Auth:** JWT + Supabase (simplificado vs Cardápio)

---

## 📝 Próximo Passo

**Fase 1 iniciará com:**
1. Copy da estrutura Cardápio Digital
2. Escrita do schema Prisma completo
3. Remoção de rotas desnecessárias
4. Setup Supabase
5. Documentação CLAUDE.md

Pronto para começar? 🚀
