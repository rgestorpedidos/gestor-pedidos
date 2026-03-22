# 🔧 SETUP.md — Gestor Pedidos

> Guia passo-a-passo para setup inicial do projeto.

---

## 📋 Pré-requisitos

- **Node.js 18+** (verificar: `node --version`)
- **npm 9+** (ou yarn/pnpm)
- **Conta Supabase** (gratuito em https://supabase.com)
- **Git** (para versionamento)
- **VS Code** (recomendado)

---

## 🚀 1. Setup Local (Máquina)

### 1.1 Clone ou Copie Base do Cardápio Digital

```bash
cd /workspace
# Se já tiver a pasta gestor-pedidos vazia:
cd gestor-pedidos

# Se precisar copiar estrutura do cardapio-digital:
cp -r ../cardapio-digital/* .
```

### 1.2 Instale Dependências

```bash
npm install
```

### 1.3 Limpe Rotas Desnecessárias

```bash
# Remova rotas que não serão usadas:
rm -rf src/app/\(public\)              # Menu público não existe
rm -rf src/app/\(admin\)/admin/produtos
rm -rf src/app/\(admin\)/admin/categorias
rm -rf src/app/\(admin\)/admin/zonas
rm -rf src/app/\(admin\)/admin/horarios
rm -rf src/app/\(admin\)/admin/super    # Dashboard multi-tenant
```

### 1.4 Crie `.env.local`

```bash
# .env.local (NÃO commitar este arquivo!)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxx...
SUPABASE_SERVICE_KEY=eyxxxx...  # Service role (NÃO expor!)

# Aplicação
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Modo desenvolvimento
NODE_ENV=development
```

⚠️ **NUNCA commitar `.env.local`!** Use `.env.example` para documentação.

---

## 🔑 2. Setup Supabase

### 2.1 Crie Novo Projeto

1. Acesse https://supabase.com
2. Clique **"New Project"**
3. Configure:
   - **Name:** `gestor-pedidos-dev` (ou seu nome)
   - **Password:** Salve em local seguro!
   - **Region:** Escolha mais próximo (ex: `sa-east-1` para São Paulo)
4. Aguarde deployment (~2 min)

### 2.2 Copie Credenciais

Acesse **Project Settings → API**:
- Copie `URL` → `NEXT_PUBLIC_SUPABASE_URL`
- Copie `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Copie `service_role` key → `SUPABASE_SERVICE_KEY`

Cole em `.env.local`.

### 2.3 Configure Autenticação

Acesse **Authentication → Providers:**

1. **Email/Password** (já vem habilitado)
   - Deixe como padrão

2. (Opcional) **Google OAuth**
   - Se quiser login social depois

### 2.4 Habilite Realtime (WebSocket)

Acesse **Realtime → Backend only:**
- Deixe habilitado (para WebSocket cozinha)

---

## 📊 3. Banco de Dados

### 3.1 Crie Schema Prisma

Copie/crie `prisma/schema.prisma` com os modelos (veja CLAUDE.md).

### 3.2 Aplique Migrations

```bash
# Cria migration e aplica no dev
npx prisma migrate dev --name "init"
```

Se receber erro de conexão, verifique `.env.local`.

### 3.3 Abra Prisma Studio

```bash
npx prisma studio
```

Acesse http://localhost:5555 para visualizar banco.

### 3.4 Rode Seeds (Opcional)

```bash
# Cria mesas e itens cardápio padrão
npx prisma db seed
```

Se `prisma/seed.ts` não existir, crie com dados iniciais:

```typescript
// prisma/seed.ts
import { prisma } from "@/lib/prisma"

async function main() {
  // Criar mesas (1-10)
  for (let i = 1; i <= 10; i++) {
    await prisma.mesa.create({
      data: {
        numero: i,
        capacidade: 4,
        status: "LIVRE",
      },
    })
  }

  // Criar itens cardápio
  await prisma.itemCardapio.createMany({
    data: [
      { nome: "Cerveja", preco: 15.00, categoria: "bebida", ativo: true },
      { nome: "Refrigerante", preco: 8.00, categoria: "bebida", ativo: true },
      { nome: "Prato Principal", preco: 45.00, categoria: "prato", ativo: true },
      { nome: "Sobremesa", preco: 20.00, categoria: "sobremesa", ativo: true },
    ],
  })

  console.log("✅ Seeds criadas!")
}

main()
```

---

## 🔐 4. Autenticação & RBAC

### 4.1 Crie Usuários Teste

**Via Supabase Console:**

1. Acesse **Authentication → Users**
2. Clique **"Add User"**
3. Crie 3 usuários:

```
Usuario 1:
- Email: admin@test.com
- Senha: Test123!
- Role: ADMIN (será salvo no Prisma)

Usuario 2:
- Email: garcom@test.com
- Senha: Test123!
- Role: GARCOM

Usuario 3:
- Email: cozinha@test.com
- Senha: Test123!
- Role: COZINHA
```

### 4.2 Sincronize Roles no Prisma

Depois de criar users no Supabase, execute:

```bash
node scripts/sync-users.ts
```

Este script cria User records no Prisma com os roles correspondentes.

(Se não tiver o script, crie manualmente em Prisma Studio)

---

## 🧪 5. Teste Local

### 5.1 Inicie Dev Server

```bash
npm run dev
```

Acesse http://localhost:3000

### 5.2 Teste Login

```
Email: admin@test.com
Senha: Test123!
```

Se funcionar, você vê a dashboard admin.

### 5.3 Teste RBAC

Logout e faça login como `garcom@test.com` → deve ver apenas rotas garçom.

---

## 📁 Estrutura Esperada Após Setup

```
gestor-pedidos/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── (auth)/
│   │   ├── (garcom)/
│   │   ├── (cozinha)/
│   │   ├── (admin)/
│   │   └── api/
│   ├── lib/
│   └── components/
├── prisma/
│   ├── schema.prisma       ✅ Criado
│   ├── migrations/         ✅ Aplicado
│   └── seed.ts             ✅ (Opcional)
├── .env.local              ✅ Com credenciais
├── .env.example            ✅ Documentação
└── package.json            ✅ Já existe
```

---

## 🔍 Troubleshooting

### Erro: "Can't find @supabase/supabase-js"

```bash
npm install @supabase/supabase-js
```

### Erro: "Database connection refused"

Verifique `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL` correto?
- `SUPABASE_SERVICE_KEY` correto?
- Projeto Supabase está rodando?

### Erro: "Migration failed"

```bash
# Reset banco (CUIDADO: apaga tudo!)
npx prisma migrate reset
```

### WebSocket não conecta

1. Verifique se Realtime está ativado em Supabase
2. Tente hard refresh (Ctrl+Shift+R)
3. Verifique console do browser (F12)

---

## 📝 Próximas Etapas

✅ Setup local completo
✅ Banco criado + seeds
✅ Autenticação funcionando
✅ 3 usuários teste criados

➡️ **Próximo:** Fase 1 — Estrutura base + API routes

Veja [ROADMAP.md](./ROADMAP.md) para cronograma.

---

## 🆘 Precisa de Ajuda?

- **Supabase Docs:** https://supabase.com/docs
- **Prisma Docs:** https://www.prisma.io/docs
- **Next.js Docs:** https://nextjs.org/docs

Ou faça uma pergunta em Discord/comunidade!
