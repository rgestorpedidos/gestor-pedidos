# 📋 Gestor Pedidos — Sistema de Gerenciamento de Pedidos

> Sistema completo para gerenciar pedidos em bares e restaurantes: app para garçons, painel para cozinha, relatórios para admin.

## 📦 Estrutura

```
gestor-pedidos/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login/autenticação
│   │   ├── (garcom)/        # App do garçom (mesas, pedidos)
│   │   ├── (cozinha)/       # Painel da cozinha (real-time)
│   │   ├── (admin)/         # Dashboard admin (relatórios, config)
│   │   └── api/             # API endpoints
│   ├── lib/                 # Utilities, hooks, validações
│   └── components/          # Componentes reutilizáveis
├── prisma/
│   └── schema.prisma        # Modelos de dados
└── docs/
    ├── CLAUDE.md            # Guia para Claude (em desenvolvimento)
    ├── ARQUITETURA.md       # Arquitetura detalhada
    ├── ROADMAP.md           # Fases e estimativas
    └── SETUP.md             # Setup inicial
```

## 🚀 Quick Start

```bash
# Setup do projeto (será feito na fase 1)
npm install
npx prisma generate
npm run dev
```

## 📚 Documentação

- **[CLAUDE.md](./docs/CLAUDE.md)** — Arquitetura, padrões, RBAC
- **[ANALISE_ADAPTACAO_CARDAPIO_PARA_BAR.md](../ANALISE_ADAPTACAO_CARDAPIO_PARA_BAR.md)** — Comparação com Cardápio Digital
- **[ROADMAP.md](./docs/ROADMAP.md)** — Fases de desenvolvimento (a criar)

## 📋 Status

- ✅ Análise arquitetura completa
- ✅ Pasta criada + estrutura base
- ⏳ Em breve: documentação e setup inicial

---

**Começar desenvolvimento?** → Veja [docs/ROADMAP.md](./docs/ROADMAP.md)
