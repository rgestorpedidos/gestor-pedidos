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
- [ ] Adicionar grupo de opções ao Hambúrguer: clicar no ícone de engrenagem na coluna **Grupos** → **Novo grupo de opções**
  - Nome: **Ponto da carne**, obrigatório: sim, mín: 1, máx: 1
  - Adicionar opção: **Ao ponto** (+R$ 0,00)
  - Adicionar opção: **Bem passado** (+R$ 0,00)
- [ ] Desativar um item → confirma que some do cardápio do garçom

---

## 4. Usuários

**Em `/admin/users`:**

- [ ] Criar usuário **garcom@teste.com** com role `GARCOM`
- [ ] Criar usuário **cozinha@teste.com** com role `COZINHA`
- [ ] Desativar o garçom → `active: false`
- [ ] Reativar o garçom
- [ ] Tentar criar usuário com email já existente → erro esperado

**Em `/admin/super` (SUPERADMIN):**

- [ ] Métricas do sistema visíveis
- [ ] Lista todos os usuários incluindo o próprio superadmin
- [ ] Botão Excluir aparece para outros usuários, não para si mesmo
- [ ] Alterar role de um usuário
- [ ] Excluir o usuário cozinha@teste.com → recriar depois

---

## 5. Fluxo completo de pedido

Abra **duas abas ou dois dispositivos** para simular garçom e cozinha em paralelo.

### 5.1 Login dos usuários operacionais

- [ ] Fazer login com **garcom@teste.com** → redireciona para `/garcom`
- [ ] Fazer login com **cozinha@teste.com** → redireciona para `/cozinha`

### 5.2 Atendimento (aba do garçom)

- [ ] Grid mostra as mesas 1 e 2 com status **LIVRE**
- [ ] Clicar na mesa 1 → abre a tela de pedido
- [ ] Cardápio exibe categorias Bebidas e Pratos com os itens ativos
- [ ] Adicionar **Água** ao carrinho
- [ ] Adicionar **Hambúrguer** → selecionar ponto da carne obrigatório → confirmar
- [ ] Drawer do carrinho exibe 2 itens
- [ ] Clicar **Enviar para cozinha** → itens mudam para status ENVIADO
- [ ] Voltar ao grid → mesa 1 aparece com badge de itens enviados

### 5.3 Cozinha (aba da cozinha)

- [ ] Painel exibe o **Hambúrguer** (vaiParaCozinha: true)
- [ ] **Água não aparece** (vaiParaCozinha: false) ← comportamento esperado
- [ ] Marcar Hambúrguer como **PRONTO**
- [ ] Item some ou muda de status na fila da cozinha

### 5.4 Nova rodada

- [ ] De volta ao garçom, adicionar **Refrigerante** ao carrinho
- [ ] Enviar segunda rodada
- [ ] Cozinha recebe apenas o Refrigerante? Não — `vaiParaCozinha: false`. Confirmar que não aparece na cozinha.

### 5.5 Fechar pedido

- [ ] No carrinho do garçom, clicar **Fechar Pedido**
- [ ] Selecionar forma de pagamento
- [ ] Confirmar fechamento → mesa volta para status LIVRE no grid
- [ ] Dashboard admin atualiza: "Pedidos Fechados: 1", Ticket Médio exibe valor

---

## 6. RBAC — controle de acesso

- [ ] Garçom tenta acessar `/admin` → redirecionado (sem acesso)
- [ ] Cozinha tenta acessar `/garcom` → redirecionado (sem acesso)
- [ ] Usuário desativado tenta fazer login → "Email não autorizado"
- [ ] Admin (não superadmin) acessa `/admin/super` → redirecionado para `/admin`

---

## 7. Polling e tempo real

- [ ] Com dois dispositivos: garçom envia pedido → cozinha atualiza automaticamente em ~10s sem recarregar
- [ ] Cozinha marca item como pronto → garçom vê atualização no carrinho em ~10s
- [ ] Minimizar/trocar aba → polling pausa; voltar para aba → polling retoma

---

## 8. Verificação final no dashboard

Após os testes acima, o dashboard `/admin` deve mostrar:

- [ ] Mesas Livres: 2 (mesa 1 fechou, mesa 2 livre)
- [ ] Pedidos Fechados Hoje: ≥ 1
- [ ] Ticket Médio: valor coerente com os itens pedidos
- [ ] Total de Usuários: ≥ 3
- [ ] Super Admin (`/admin/super`) mostra os mesmos dados + histórico completo de usuários
