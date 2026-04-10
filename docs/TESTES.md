# Roadmap de Testes — Gestor Pedidos

Siga na ordem. Cada bloco depende do anterior.

---

## 1. Setup inicial

- [x] Acessar `/login` e enviar magic link para o superadmin
- [x] Clicar no link e ser redirecionado para `/admin`
- [x] Sidebar mostra: Dashboard, Mesas, Cardápio, Usuários, Super Admin, Atendimento, Cozinha
- [x] Dashboard exibe métricas zeradas (0 mesas, 0 pedidos, 1 usuário ativo)

---

## 2. Mesas

**Em `/admin/mesas`:**

- [x] Criar mesa número **1**
- [x] Criar mesa número **2**
- [x] Criar mesa número **3**
- [x] Dashboard atualiza "Mesas Livres: 3"
- [x] Tentar criar mesa com número duplicado → erro esperado
- [x] Editar nome/número de uma mesa
- [x] Deletar a mesa 3 → confirmar que some da lista

---

## 3. Cardápio

**Em `/admin/cardapio`:**

### Categorias
- [x] Criar categoria **Bebidas** (ordem 1)
- [x] Criar categoria **Pratos** (ordem 2)
- [x] Tentar criar categoria com nome duplicado → erro esperado (refinar o erro na UI)

### Itens
- [x] Criar item **Água** → categoria Bebidas, preço R$ 4,00, `vaiParaCozinha: false`
- [x] Criar item **Refrigerante** → categoria Bebidas, preço R$ 6,00, `vaiParaCozinha: false`
- [x] Criar item **Frango Grelhado** → categoria Pratos, preço R$ 35,00, `vaiParaCozinha: true`
- [x] Criar item **Hambúrguer** → categoria Pratos, preço R$ 30,00, `vaiParaCozinha: true`
- [x] Adicionar grupo de opções ao Hambúrguer: clicar no ícone de engrenagem na coluna **Grupos** → **Novo grupo de opções**
  - Nome: **Ponto da carne**, obrigatório: sim, mín: 1, máx: 1
  - Adicionar opção: **Ao ponto** (+R$ 0,00)
  - Adicionar opção: **Bem passado** (+R$ 0,00)
- [x] Desativar um item → confirma que some do cardápio do garçom

---

## 4. Usuários

**Em `/admin/users`:**

- [x] Criar usuário **garcom@teste.com** com role `GARCOM`
- [x] Criar usuário **cozinha@teste.com** com role `COZINHA`
- [x] Desativar o garçom → `active: false`
- [x] Reativar o garçom
- [x] Tentar criar usuário com email já existente → erro esperado

**Em `/admin/super` (SUPERADMIN):**

- [x] Métricas do sistema visíveis
- [x] Lista todos os usuários incluindo o próprio superadmin
- [x] Botão Excluir aparece para outros usuários, não para si mesmo
- [x] Alterar role de um usuário
- [x] Excluir o usuário cozinha@teste.com → recriar depois

---

## 5. Fluxo completo de pedido

Abra **duas abas ou dois dispositivos** para simular garçom e cozinha em paralelo.

### 5.1 Login dos usuários operacionais

- [x] Fazer login com **garcom@teste.com** → redireciona para `/garcom`
- [x] Fazer login com **cozinha@teste.com** → redireciona para `/cozinha`

### 5.2 Atendimento (aba do garçom)

- [x] Grid mostra as mesas 1 e 2 com status **LIVRE**
- [x] Clicar na mesa 1 → abre a tela de pedido 
- [x] Cardápio exibe categorias Bebidas e Pratos com os itens ativos
- [x] Adicionar **Água** ao carrinho
- [x] Adicionar **Hambúrguer** → selecionar ponto da carne obrigatório → confirmar
- [x] Drawer do carrinho exibe 2 itens
- [x] Clicar **Enviar para cozinha** → itens mudam para status ENVIADO
- [x] Voltar ao grid → mesa 1 aparece com badge de itens enviados

### 5.3 Cozinha (aba da cozinha)

- [x] Painel exibe o **Hambúrguer** (vaiParaCozinha: true)
- [x] **Água não aparece** (vaiParaCozinha: false) ← comportamento esperado
- [x] Marcar Hambúrguer como **PRONTO**
- [x] Item some ou muda de status na fila da cozinha

### 5.4 Nova rodada

- [x] De volta ao garçom, adicionar **Refrigerante** ao carrinho
- [x] Enviar segunda rodada
- [x] Cozinha recebe apenas o Refrigerante? Não — `vaiParaCozinha: false`. Confirmar que não aparece na cozinha.

### 5.5 Fechar pedido

- [x] No carrinho do garçom, clicar **Fechar Pedido**
- [x] Selecionar forma de pagamento
- [x] Confirmar fechamento → mesa volta para status LIVRE no grid
- [x] Dashboard admin atualiza: "Pedidos Fechados: 1", Ticket Médio exibe valor

---

## 6. RBAC — controle de acesso

- [x] Garçom tenta acessar `/admin` → redirecionado (sem acesso)
- [x] Cozinha tenta acessar `/garcom` → redirecionado (sem acesso)
- [x] Usuário desativado tenta fazer login → "Email não autorizado"
- [x] Admin (não superadmin) acessa `/admin/super` → redirecionado para `/admin`

---

## 7. Polling e tempo real

- [x] Com dois dispositivos: garçom envia pedido → cozinha atualiza automaticamente em ~10s sem recarregar
- [x] Cozinha marca item como pronto → garçom vê atualização no carrinho em ~10s
- [x] Minimizar/trocar aba → polling pausa; voltar para aba → polling retoma

---

## 8. Verificação final no dashboard

Após os testes acima, o dashboard `/admin` deve mostrar:

- [x] Mesas Livres: 2 (mesa 1 fechou, mesa 2 livre)
- [x] Pedidos Fechados Hoje: ≥ 1
- [x] Ticket Médio: valor coerente com os itens pedidos
- [x] Total de Usuários: ≥ 3
- [x] Super Admin (`/admin/super`) mostra os mesmos dados + histórico completo de usuários
