# Setup — Gestor Pedidos

---

## Pré-requisitos

- Node.js 18+
- Conta Supabase (gratuito em https://supabase.com)

---

## 1. Instalar dependências

```bash
npm install
```

---

## 2. Variáveis de ambiente

Crie `.env.local` na raiz do projeto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhb...
SUPABASE_SERVICE_ROLE_KEY=eyJhb...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Valores disponíveis em: **Supabase → Settings → API**

O `.env` já contém `DATABASE_URL` para o SQLite local — não altere.

---

## 3. Banco de dados local (Prisma + SQLite)

```bash
npx prisma migrate dev
```

Aplica as migrations locais e cria/atualiza o arquivo `prisma/dev.db`.

Se for a primeira execução em uma máquina nova, esse comando também prepara o schema local completo.

Para inspecionar os dados visualmente:

```bash
npx prisma studio
```

---

## 4. Configurar Supabase

### 4.1 Auth → Providers → Email

- **Enable Email provider** → ✅ ativado
- Demais campos → padrão

### 4.2 Auth → URL Configuration

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:** adicionar `http://localhost:3000/api/auth/callback`

> Para produção, adicionar também `https://seudominio.com/api/auth/callback`

---

## 5. Criar superadmin

```bash
npm run create-superadmin seu@email.com "Seu Nome"
```

O script:
1. Cria o usuário no **Supabase Auth** sem senha (email já confirmado)
2. Cria o registro no **Prisma** com `role: SUPERADMIN` e `active: true`
3. Se o usuário já existir no Supabase Auth, reutiliza o UUID existente

---

## 6. Rodar o projeto

```bash
npm run dev
```

Acesse `http://localhost:3000/login`, insira o e-mail do superadmin e clique no link enviado por e-mail.

---

## Criar usuários adicionais

Acesse `/admin/users` como ADMIN ou SUPERADMIN e clique em **Novo Usuário**. O sistema cria o usuário no Supabase Auth e no banco em uma operação só.

> Para criar o primeiro SUPERADMIN (bootstrap), use o script CLI:
> ```bash
> npm run create-superadmin seu@email.com "Seu Nome"
> ```

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run create-superadmin <email> "<nome>"` | Cria superadmin via CLI |
| `npx prisma migrate dev` | Aplica migrations locais no SQLite |
| `npx prisma studio` | Abre o explorer do banco |

---

## Troubleshooting

**"Email não autorizado" ao fazer login**
→ O e-mail não existe em `User` (Prisma) ou `active` está `false`.

**Magic link não chega**
→ Verifique spam. Supabase tem rate limit de 1 e-mail por minuto por IP.

**404 após clicar no magic link**
→ A URL de callback não está cadastrada em Supabase → Auth → URL Configuration.

**Erro ao rodar `create-superadmin`**
→ Verifique se `.env.local` tem `SUPABASE_SERVICE_ROLE_KEY` preenchido.
