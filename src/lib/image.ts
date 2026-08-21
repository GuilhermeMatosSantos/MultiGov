// Redimensiona uma imagem localmente (canvas) antes de a guardar como
// data URL — evita que fotos grandes esgotem depressa o limite do
// localStorage, que é partilhado por toda a aplicação.
export function ficheiroParaImagemComprimida(file: File, larguraMaxima = 900, qualidade = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Não foi possível ler o ficheiro."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Não foi possível processar a imagem."));
      img.onload = () => {
        const escala = Math.min(1, larguraMaxima / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas indisponível neste browser."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", qualidade));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
