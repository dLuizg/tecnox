# Regras de Negócio (RN)

### RN01 — Identificação de produtos
Cada produto cadastrado deve possuir uma identificação única para que possa ser consultado, atualizado, removido e associado a pedidos sem ambiguidade.

### RN02 — Validação de produtos
Um produto só pode ser salvo quando os campos obrigatórios estiverem preenchidos e o preço e a quantidade em estoque forem valores válidos, não negativos.

### RN03 — Atualização do estoque por venda
Ao registrar um pedido, o sistema deve reduzir o estoque dos produtos vendidos pelas respectivas quantidades. A operação deve ser recusada se não houver quantidade suficiente em estoque.

### RN04 — Composição do pedido
Um pedido deve conter ao menos um produto e a quantidade correspondente de cada item. As quantidades devem ser maiores que zero.

### RN05 — Associação do pedido ao cliente
Cada pedido deve estar associado a um cliente cadastrado para permitir consulta e composição do histórico de compras.

### RN06 — Registro das informações da venda
O pedido deve preservar os produtos, quantidades e preços considerados no momento da venda, para que consultas futuras representem corretamente a operação registrada.

### RN07 — Exclusão de produto com histórico
A remoção de um produto do catálogo não deve apagar ou alterar os dados dos pedidos já registrados que contenham esse produto.

### RN08 — Cadastro de clientes
Os dados obrigatórios de cliente devem ser validados antes do cadastro. Quando a consulta de CEP não estiver disponível ou não localizar o endereço, o usuário poderá informar os dados manualmente.

### RN09 — Permissões administrativas
Somente usuários com permissão adequada podem cadastrar, alterar ou excluir produtos, clientes e pedidos, bem como executar operações de gerenciamento.

### RN10 — Persistência dos dados
Os dados de produtos, estoque, clientes e pedidos devem ser armazenados nos serviços de persistência configurados para a aplicação, previstos no projeto como Firebase.
