# Requisitos Não Funcionais (RNF)

### RNF01 — Interface web
O sistema deve ser disponibilizado por uma interface web acessível por navegadores modernos, utilizando layout responsivo para os tamanhos de tela suportados pela aplicação.

### RNF02 — Usabilidade
A interface deve organizar as funções de produtos, estoque, clientes e vendas de forma clara, permitindo que o usuário identifique e consulte essas informações sem precisar acessar diretamente o banco de dados.

### RNF03 — Segurança de credenciais
Credenciais e chaves privadas de serviços externos não devem ser armazenadas no código-fonte nem publicadas no repositório. Configurações sensíveis devem ser fornecidas por configuração de ambiente apropriada.

### RNF04 — Segurança de acesso aos dados
As permissões de acesso aos dados devem ser configuradas nos serviços Firebase utilizados, e as operações devem validar os dados recebidos antes de persistí-los.

### RNF05 — Integridade dos dados
O sistema deve manter associações consistentes entre clientes, pedidos e produtos, e impedir que uma venda reduza o estoque para uma quantidade inválida.

### RNF06 — Manutenibilidade
O código deve utilizar TypeScript e manter organização compatível com a estrutura da aplicação Next.js, separando componentes de interface, tipos e integrações conforme a necessidade do projeto.

### RNF07 — Compatibilidade tecnológica
A aplicação deve ser executável em ambiente compatível com Node.js e deve utilizar as tecnologias definidas para o projeto: Next.js, React, TypeScript, Tailwind CSS e Firebase.

### RNF08 — Dependência de serviços externos
Falhas ou indisponibilidade da consulta externa de CEP devem ser comunicadas ao usuário sem impedir o preenchimento manual dos dados de endereço.

### RNF09 — Proteção de dados pessoais
Os dados cadastrais dos clientes devem ser utilizados apenas para as funções de cadastro e associação aos pedidos, com acesso limitado conforme as permissões definidas para o sistema.
