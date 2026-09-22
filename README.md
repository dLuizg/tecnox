# PI 2026.2 — Sistema de Controle de Estoque e Vendas

## 📌 Sobre o projeto

Este projeto foi desenvolvido para o **Módulo de Desenvolvimento de Aplicações Web da UNIFEOB**, como parte do Projeto Integrado (PI) 2026.2.

A aplicação tem como objetivo desenvolver um sistema web para uma **loja de tecnologia**, permitindo o gerenciamento de produtos, estoque, clientes e vendas em um único ambiente.

O sistema busca facilitar o controle das operações da loja, centralizando as informações e oferecendo uma interface simples para consulta e gerenciamento dos dados.

---

## 👥 Grupo 4

* **Eduardo Baldo**
* **Luiz Gustavo P. Diniz**
* **Matteo E. F. Bonvento**

**Instituição:** UNIFEOB
**Módulo:** Desenvolvimento de Aplicações Web
**Projeto:** PI 2026.2

---

## 🎯 Objetivos

O projeto tem como principais objetivos:

* Desenvolver uma aplicação web para gerenciamento de uma loja de tecnologia;
* Permitir o cadastro e gerenciamento de produtos;
* Controlar informações relacionadas ao estoque;
* Realizar o cadastro de clientes;
* Registrar vendas e pedidos;
* Disponibilizar o histórico de pedidos;
* Facilitar a visualização das informações da loja;
* Integrar serviços externos quando necessário;
* Utilizar tecnologias modernas de desenvolvimento web;
* Aplicar conceitos de desenvolvimento frontend, backend, banco de dados e computação em nuvem.

---

## ⚙️ Funcionalidades

Entre as funcionalidades previstas para a aplicação estão:

### 📦 Produtos e estoque

* Cadastro de produtos;
* Edição de produtos;
* Exclusão de produtos;
* Consulta de produtos;
* Controle da quantidade disponível em estoque;
* Informações sobre preços e características dos produtos.

### 👤 Clientes

* Cadastro de clientes;
* Armazenamento dos dados cadastrais;
* Consulta dos clientes;
* Associação dos clientes aos pedidos realizados.

### 🛒 Vendas e pedidos

* Registro de vendas;
* Criação de pedidos;
* Associação de produtos aos pedidos;
* Consulta de pedidos;
* Histórico de compras;
* Visualização das informações relacionadas às vendas.

### 📊 Gerenciamento

* Visualização das informações da loja;
* Acompanhamento do estoque;
* Consulta das vendas realizadas;
* Organização dos dados para facilitar a administração do negócio.

### 🌐 Integrações

A aplicação poderá utilizar APIs e serviços externos para funcionalidades específicas, como a consulta de endereço por **CEP**, evitando a necessidade de armazenar informações que podem ser obtidas de fontes externas.

---

## 🧩 Tecnologias utilizadas

### Frontend

* **React** — biblioteca utilizada para construção da interface da aplicação;
* **Next.js** — framework utilizado para estruturar e executar a aplicação React;
* **TypeScript** — linguagem utilizada para adicionar tipagem estática ao projeto;
* **Tailwind CSS** — framework utilizado para estilização e construção da interface.

### Backend e dados

* **Firebase** — plataforma utilizada para serviços de backend e armazenamento dos dados da aplicação.

O Firebase será responsável pelos serviços relacionados ao armazenamento e gerenciamento dos dados utilizados pelo sistema.

---

## 🏗️ Arquitetura

A aplicação segue uma arquitetura baseada em uma aplicação web moderna:

```text
┌─────────────────────────────┐
│          Usuário            │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Next.js            │
│                             │
│  ┌───────────────────────┐  │
│  │        React          │  │
│  │                       │  │
│  │     Interface/UI      │  │
│  └───────────────────────┘  │
│                             │
│      TypeScript             │
│      Tailwind CSS           │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│          Firebase           │
│                             │
│      Banco de dados         │
│      Autenticação           │
│      Serviços de backend    │
└─────────────────────────────┘
```

### Relação entre as tecnologias

O **Next.js** é utilizado como framework principal da aplicação, enquanto o **React** é responsável pela construção dos componentes e interfaces.

O **TypeScript** é utilizado no desenvolvimento do código, fornecendo tipagem e maior segurança durante a implementação.

O **Tailwind CSS** é utilizado para a estilização da interface.

O **Firebase** fornece os serviços necessários para persistência e gerenciamento dos dados da aplicação.

---

## 📁 Estrutura do projeto

A estrutura pode ser organizada seguindo o padrão utilizado pelo Next.js:

```text
/
├── app/
│   ├── components/
│   ├── pages/
│   ├── ...
│
├── public/
│   └── ...
│
├── lib/
│   └── firebase/
│
├── types/
│   └── ...
│
├── package.json
├── tsconfig.json
├── tailwind.config.*
└── README.md
```

A estrutura poderá ser modificada conforme o desenvolvimento do projeto e a organização das funcionalidades.

---

## 🔥 Firebase

O Firebase será utilizado como parte da infraestrutura da aplicação.

Entre os serviços utilizados ou previstos estão:

* Banco de dados para armazenamento das informações;
* Autenticação de usuários, caso necessária;
* Serviços de backend disponibilizados pela plataforma;
* Integração entre a aplicação web e os dados armazenados.

A escolha do Firebase está relacionada à necessidade de desenvolver o projeto com uma infraestrutura adequada ao contexto acadêmico, permitindo integração simplificada com a aplicação web.

---

## 🌐 APIs externas

Além dos dados armazenados no Firebase, a aplicação poderá utilizar fontes externas para informações específicas.

Um exemplo é a consulta de **CEP**, utilizada para obter dados de endereço durante o cadastro de clientes.

Dessa forma, informações que podem ser obtidas de uma fonte externa não precisam necessariamente ser cadastradas manualmente pelo usuário.

---

## ☁️ Computação em nuvem

O projeto também considera conceitos de **Cloud Computing**, trabalhados durante o desenvolvimento do PI.

A utilização do Firebase permite que parte da infraestrutura da aplicação seja disponibilizada por meio de serviços em nuvem.

Além disso, o projeto considera a utilização da infraestrutura disponibilizada por meio da parceria acadêmica, conforme as atividades desenvolvidas no módulo.

---

## 🚀 Instalação e execução

### Pré-requisitos

Para executar o projeto localmente, é necessário possuir:

* Node.js;
* npm ou outro gerenciador de pacotes;
* Git;
* Projeto configurado no Firebase.

### Clonar o repositório

```bash
git clone <URL_DO_REPOSITORIO>
```

Acesse a pasta do projeto:

```bash
cd <NOME_DO_PROJETO>
```

### Instalar as dependências

```bash
npm install
```

### Configurar o Firebase

As credenciais e configurações necessárias do Firebase devem ser adicionadas conforme a configuração do projeto.

As informações sensíveis não devem ser armazenadas diretamente no código-fonte ou publicadas no repositório.

### Executar o projeto

```bash
npm run dev
```

Após iniciar o servidor de desenvolvimento, a aplicação poderá ser acessada pelo endereço local apresentado no terminal.

---

## 🔐 Segurança

O projeto considera algumas práticas básicas de segurança:

* Não versionar credenciais ou chaves privadas;
* Utilizar variáveis de ambiente quando necessário;
* Controlar as permissões de acesso aos dados no Firebase;
* Validar os dados enviados pelos usuários;
* Restringir operações administrativas de acordo com as permissões definidas para cada usuário.

---

## 📚 Contexto acadêmico

O projeto faz parte das atividades do **Módulo de Desenvolvimento de Aplicações Web da UNIFEOB**, tendo como finalidade aplicar na prática conceitos de desenvolvimento de aplicações web, banco de dados, APIs, cloud computing e arquitetura de sistemas.

Durante o desenvolvimento, são considerados aspectos como levantamento de requisitos, modelagem dos dados, desenvolvimento da aplicação, integração com serviços externos, segurança e implantação.

---

## 📌 Status do projeto

**Em desenvolvimento — PI 2026.2**

Novas funcionalidades, melhorias de interface, integrações e ajustes na arquitetura serão adicionados conforme a evolução do projeto.

---

## 📝 Licença

Este projeto foi desenvolvido para fins **acadêmicos**, como parte das atividades da UNIFEOB.
