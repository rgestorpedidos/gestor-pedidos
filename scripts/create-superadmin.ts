import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
dotenv.config()

import { createClient } from '@supabase/supabase-js'
import { PrismaClient } from '@prisma/client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY não configuradas no .env')
  process.exit(1)
}

const email = process.argv[2]
const name = process.argv[3]

if (!email || !name) {
  console.error('❌ Uso: npm run create-superadmin <email> "<nome>"')
  console.error('   Ex: npm run create-superadmin admin@exemplo.com "João Silva"')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const prisma = new PrismaClient()

async function main() {
  console.log(`\nCriando superadmin: ${email}`)

  // 1. Criar no Supabase Auth (sem senha, email já confirmado)
  let supabaseId: string

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
  })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      // Usuário já existe — busca o UUID existente
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers()
      if (listError) {
        console.error('❌ Erro ao buscar usuários:', listError.message)
        process.exit(1)
      }
      const existing = listData.users.find((u) => u.email === email)
      if (!existing) {
        console.error('❌ Usuário não encontrado no Supabase Auth')
        process.exit(1)
      }
      supabaseId = existing.id
      console.log(`ℹ️  Usuário já existe no Supabase Auth (id: ${supabaseId})`)
    } else {
      console.error('❌ Erro ao criar no Supabase Auth:', authError.message)
      process.exit(1)
    }
  } else {
    supabaseId = authData.user.id
    console.log(`✅ Usuário criado no Supabase Auth (id: ${supabaseId})`)
  }

  // 2. Criar no Prisma com o mesmo UUID do Supabase
  await prisma.user.create({
    data: {
      id: supabaseId,
      email,
      name,
      role: 'SUPERADMIN',
      active: true,
    },
  })

  console.log('✅ Usuário criado no banco local (Prisma)')
  console.log('\n🎉 Superadmin criado com sucesso! Faça login via magic link.')
}

main()
  .catch((err) => {
    console.error('❌ Erro inesperado:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
