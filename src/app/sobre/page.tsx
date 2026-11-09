import Link from "next/link";
import InfoPage from "@/src/components/info-page";

export default function SobrePage() {
  return (
    <InfoPage eyebrow="Conheça o projeto" title="Sobre a Tecnox" intro="Uma aplicação para reunir as informações e as atividades de uma loja de tecnologia em um único lugar.">
      <section><h2>Organização para o dia a dia</h2><p>A Tecnox foi pensada para apoiar a rotina de uma loja de tecnologia. Em vez de manter informações espalhadas, a aplicação reúne cadastros e registros que ajudam a consultar produtos, acompanhar o estoque e visualizar as vendas realizadas.</p><p>O objetivo é tornar mais simples o acesso às informações importantes da operação, com uma interface que ajude administradores e colaboradores a realizar suas tarefas cotidianas.</p></section>
      <section><h2>O que você encontra na aplicação</h2><p>A área da loja reúne recursos para cadastrar e consultar produtos, clientes e fornecedores, além de registrar vendas e acessar seu histórico. Também oferece áreas para acompanhar a operação, trabalhar com devoluções e gerenciar o acesso da equipe.</p><p>As informações são organizadas por loja e o acesso considera o papel de cada usuário. Assim, cada pessoa pode encontrar o ambiente correspondente à sua participação na operação.</p></section>
      <section><h2>Um projeto acadêmico</h2><p>A Tecnox é parte do Projeto Integrado (PI) 2026.2 do módulo de Desenvolvimento de Aplicações Web da UNIFEOB. O trabalho aplica conceitos de desenvolvimento web, banco de dados, serviços em nuvem, integrações e segurança a um problema prático de gestão.</p><p>O projeto foi desenvolvido pelo Grupo 4: Eduardo Baldo, Luiz Gustavo P. Diniz e Matteo E. F. Bonvento. Ele está em desenvolvimento e pode receber melhorias e novas funcionalidades ao longo de sua evolução.</p></section>
      <section><h2>Tecnologia a serviço da experiência</h2><p>A interface utiliza Next.js, React, TypeScript e Tailwind CSS. A aplicação usa serviços do Firebase para autenticação e dados, além de integrar serviços externos em funcionalidades específicas, como a consulta de CEP.</p><p>Para conhecer os fluxos disponíveis, visite a <Link href="/ajuda">central de ajuda</Link>. Os dados institucionais estão disponíveis em <Link href="/contato">Entre em contato</Link>.</p></section>
    </InfoPage>
  );
}
