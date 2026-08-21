// Pré-visualização de links via microlink.io — serviço público, sem chave
// de API para uso pontual, que aceita pedidos diretos do browser (CORS
// aberto). Usado só quando o utilizador pede explicitamente (botão
// "Pré-preencher"), nunca automaticamente — o URL colado é enviado a este
// serviço de terceiros nesse momento.

export interface PreVisualizacaoLink {
  titulo: string;
  resumo: string;
  imagem: string;
}

export async function obterPreVisualizacao(url: string): Promise<PreVisualizacaoLink> {
  const resposta = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
  if (!resposta.ok) {
    throw new Error(`Falha ao obter pré-visualização (${resposta.status})`);
  }
  const corpo = await resposta.json();
  if (corpo.status !== "success") {
    throw new Error("Não foi possível processar este link.");
  }
  const dados = corpo.data ?? {};
  return {
    titulo: typeof dados.title === "string" ? dados.title : "",
    resumo: typeof dados.description === "string" ? dados.description : "",
    imagem: dados.image && typeof dados.image.url === "string" ? dados.image.url : "",
  };
}
