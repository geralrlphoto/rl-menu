const content = {
  hero: { title: "Reunião Marcada", brandLine: "RL Photo · Video", titleFont: "playfair", titleSize: "xl", brandColor: "#C9A84C", titleColor: "#ffffff" },
  countdown: { title: "Contagem Regressiva", titleColor: "#C9A84C" },
  video: { urls: ["https://www.youtube.com/watch?v=4TI7kgCJgls", "https://www.youtube.com/watch?v=Y1JJHQLYk1w", "https://www.youtube.com/watch?v=P-RJgcn2L50"], label: "O nosso trabalho", title: "Vê como captamos cada momento." },
  portfolio: { label: "O nosso trabalho", title: "Momentos que ficam para sempre.", photos: ["https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/1776285288525-ywcgj4rsp1k.jpg", "https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/1776285310226-409iiazoxum.png", "https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/1776286762905-8n82202ed3.jpeg"], titleFont: "cormorant", titleColor: "#ffffff" },
  testimonials: { items: [{ text: "Foi uma experiência excepcional desde a contratação do serviço até ao final. Equipa super simpática, prestável e disponível. A qualidade do trabalho igualmente incrível, com muita atenção ao detalhe. No dia do casamento a orientação, indicações, cuidado, boa energia foi incrível e fundamental.", author: "— Ana & Miguel · Casamento 2025" }, { text: "Foi um prazer enorme contar convosco num dia tão importante para nós. Sentimo-nos sempre muito à vontade e bem acompanhados. O resultado final superou as expectativas e recomendamos sem dúvida o vosso trabalho!", author: "— Joana & Sérgio · Casamento 2025" }], label: "O que dizem" },
  about: { text: "Somos especializados em fotografia e vídeo de casamentos. O nosso objetivo é preservar a autenticidade de cada momento a emoção, os detalhes, as histórias que só acontecem uma vez.", label: "Quem somos", title: "RL Photo · Video", textColor: "#ffffff", titleFont: "cormorant", titleColor: "#ffffff" },
  banner: { message: "Cada momento do vosso dia merece ser preservado para sempre. Estamos honrados em fazer parte desta história.", signature: "" },
  proposta: { password: "244727", buttonLabel: "Ver Proposta Criativa" },
  propostas: [{ nome: "Proposta 1", valor: "", servicos_foto: [], servicos_video: [] }, { nome: "Proposta 2", valor: "", servicos_foto: [], servicos_video: [] }, { nome: "Proposta 3", valor: "", servicos_foto: [], servicos_video: [] }],
  extras_proposta: [],
  propostaPage: {
    subtitle: "Uma proposta criada especialmente para vocês.",
    intro: "Preparámos com cuidado esta proposta personalizada. Cada detalhe foi pensado para reflectir a vossa história e garantir que cada momento do vosso dia seja preservado para sempre.",
    about: { text: "", photo: "https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/1776293095413-98ykuauj4hi.jpg", title: "SOBRE NÓS", titlePos: "bot-center", videoUrl: "https://drive.google.com/file/d/1DYz0ivQ6tMdxZp636SrC2nUUZBEkT_2M/view?usp=sharing" },
    relive: { imageUrl: "https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/1776296203965-qfzithjr6kh.png", buttonUrl: "https://galleries.vidflow.co/xmam2xui" },
    grandeDia: { p1: "Nas preparações (sempre que possível), normalmente o que aconselhamos é reunir com as noivas 1 hora e 45 minutos e com os noivos cerca de 1 hora, antes da saída para a cerimónia.", p2: "Por norma gostamos de chegar ao local da cerimónia 20 minutos antes do seu início, para conseguirmos recolher imagens do local antes do verdadeiro SIM.", p3: "Junto à golden hour recomendamos reservarem 30 minutos (no máx.) para a sessão de casal.", note: "* Caso a preparação do noivo tenha que ser realizada antes das 08h00 é obrigatório 2 videógrafos, no entanto e se pretenderem a preparação do noivo não é realizada.", title: "O GRANDE DIA", imageUrl: "https://awwbkmprgtwmnejeuiak.supabase.co/storage/v1/object/public/portal-images/1776377788058-l7mp5sz4xg.jpeg" },
    packages: [{ price: "Sob consulta", title: "Essencial", description: "Cobertura fotográfica completa do dia, edição premium e galeria online privada." }, { price: "Sob consulta", title: "Premium", description: "Fotografia + Vídeo cinematográfico com highlights do dia e música personalizada." }, { price: "Sob consulta", title: "Luxe", description: "Pacote completo com álbum premium, second shooter, pré-wedding e vídeo completo." }],
    ctaText: "Falemos sobre o vosso dia especial",
    typography: { bodyFont: "cormorant", bodyColor: "#c8c0b0", titleFont: "cormorant", titleSize: "xl", titleColor: "#ffffff", accentColor: "#C9A84C", pkgTitleFont: "cormorant", pkgTitleColor: "#C9A84C" },
    propostaAtiva: 0
  }
}

fetch('https://awwbkmprgtwmnejeuiak.supabase.co/rest/v1/crm_contacts?page_token=eq.85343645-b0d3-4412-ae78-795fd7f8ddf1', {
  method: 'PATCH',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2JrbXByZ3R3bW5lamV1aWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4Mzc4MywiZXhwIjoyMDkwNDU5NzgzfQ.C-nbBKj_SrEPsSBkXSeHOaPgs2kdsASIwTErRT3oOR4',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2JrbXByZ3R3bW5lamV1aWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg4Mzc4MywiZXhwIjoyMDkwNDU5NzgzfQ.C-nbBKj_SrEPsSBkXSeHOaPgs2kdsASIwTErRT3oOR4',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  },
  body: JSON.stringify({ page_content: content })
})
.then(r => r.text())
.then(t => console.log('Resultado:', t || 'OK - maquete atualizada!'))
.catch(e => console.error('Erro:', e))
