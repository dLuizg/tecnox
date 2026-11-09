import InfoPage from "@/src/components/info-page";

export default function ContatoPage() {
  return (
    <InfoPage eyebrow="Informações institucionais" title="Entre em contato" intro="A Tecnox é um projeto acadêmico vinculado às atividades de ensino da UNIFEOB. Abaixo estão os canais e dados institucionais da instituição.">
      <section><h2>Central de Relacionamento UNIFEOB</h2><p>Para entrar em contato com a instituição, utilize os canais publicados pela UNIFEOB:</p><p>E-mail: <a href="mailto:central.relacionamento@unifeob.edu.br">central.relacionamento@unifeob.edu.br</a><br />Telefone: <a href="tel:+551936023500">(19) 3602-3500</a></p><p>Consulte também a <a href="https://unifeob.edu.br/fale-conosco/" target="_blank" rel="noopener noreferrer">página oficial de contato da UNIFEOB</a> para conhecer outros canais e horários de atendimento.</p></section>
      <section><h2>Endereço</h2><p>Campus Mantiqueira<br />Avenida Dr. Octávio da Silva Bastos, 2439<br />Jardim Nova São João, São João da Boa Vista – SP<br />CEP 13874-149</p></section>
      <section><h2>Identificação institucional</h2><p>Fundação de Ensino Octávio Bastos<br />CNPJ: 59.764.555/0001-52</p><p>Esses são dados institucionais da UNIFEOB. A disponibilidade dos canais para suporte específico da Tecnox não está estabelecida.</p></section>
    </InfoPage>
  );
}
