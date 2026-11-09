import Link from "next/link";
import InfoPage from "@/src/components/info-page";

export default function AjudaPage() {
  return (
    <InfoPage eyebrow="Central de ajuda" title="Como usar a Tecnox" intro="Encontre orientações para começar e organizar as atividades da sua loja em um só lugar.">
      <section><h2>Primeiros passos</h2><p>Crie sua conta ou entre com suas credenciais. Na área <Link href="/store">Minhas lojas</Link>, administradores podem cadastrar uma loja e escolher qual operação acessar. Colaboradores acessam a loja à qual foram convidados; caso ainda não haja um convite disponível, a aplicação informa que o acesso está aguardando convite.</p><p>Confira seus dados em Minha conta e mantenha as informações de acesso atualizadas. Se você recebeu um convite, entre com o mesmo endereço de e-mail utilizado pelo administrador.</p></section>
      <section><h2>Produtos e estoque</h2><p>Na área da loja, acesse Produtos para cadastrar os itens que fazem parte do catálogo, incluindo suas informações, preços e quantidades. Use a listagem para consultar e atualizar os produtos e acompanhar o estoque disponível.</p><p>Antes de registrar uma venda, confira se os produtos e valores estão corretos. Manter os cadastros organizados facilita a consulta e ajuda a acompanhar as movimentações da operação.</p></section>
      <section><h2>Clientes e fornecedores</h2><p>Em Clientes, registre e consulte informações cadastrais necessárias para identificar seus compradores. Em Fornecedores, mantenha os dados de contato e identificação das empresas com as quais sua loja trabalha.</p><p>Ao preencher um endereço com CEP, a consulta pode ajudar a completar os campos disponíveis. Revise as informações retornadas e complete o que for necessário antes de salvar.</p></section>
      <section><h2>Vendas e devoluções</h2><p>Em Nova venda, selecione os produtos e confira os dados da operação antes de concluir. O Histórico de vendas permite consultar os registros realizados. A área de Devoluções e trocas oferece o fluxo disponível para cancelar uma venda e registrar o motivo correspondente.</p><p>Uma venda em andamento pode ser guardada no navegador para facilitar a continuidade. Confira os dados novamente antes de finalizar, especialmente se estiver usando um computador compartilhado.</p></section>
      <section><h2>Equipe e acesso</h2><p>Administradores podem acessar a área de equipe e convidar colaboradores pelo e-mail, informando a função de cada pessoa. O colaborador deve usar esse mesmo e-mail ao acessar sua conta. O acesso às informações e à administração da equipe depende das permissões da conta e da loja.</p></section>
      <section><h2>Precisa de mais informações?</h2><p>Conheça o contexto do projeto em <Link href="/sobre">Sobre</Link> ou consulte os dados institucionais na página <Link href="/contato">Entre em contato</Link>.</p></section>
    </InfoPage>
  );
}
