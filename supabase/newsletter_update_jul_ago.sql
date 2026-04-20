-- ============================================
-- COMPLETAR 4 NEWSLETTERS — Julho/Agosto 2026
-- Execute no Supabase SQL Editor depois do schema principal
-- ============================================

-- #5 — 02 Julho 2026
update newsletters set
  intro = 'O verao e a estacao mais procurada para casamentos, e a luz e a grande protagonista. Do sunset dourado ao crepusculo azulado, cada momento pede uma abordagem tecnica diferente. Saibam como tiramos partido de cada fase do dia.',
  sections = '[
    {"num":"01","title":"Golden hour: a hora dourada","body":"A hora antes do por-do-sol e o momento mais fotogenico do dia. Luz quente, suave e direcional. Se o casamento for ao ar livre, tentem que o brinde, o corte do bolo ou os retratos formais coincidam com esta janela de 45 minutos."},
    {"num":"02","title":"Luz do meio-dia","body":"Muitas cerimonias acontecem ao meio-dia com sol alto. E desafiante mas nao impossivel — trabalhamos com sombras duras, reflexoes em paredes claras ou transformamos sombras fortes em composicoes dramaticas a preto e branco."},
    {"num":"03","title":"A hora azul","body":"Logo apos o sunset, 15 a 20 minutos de ceu em tons azul profundo. Perfeito para fotografias com luzes decorativas acesas — string lights, velas, candeeiros. Cria um ambiente cinematografico unico."},
    {"num":"04","title":"Luz artificial criativa","body":"Na festa usamos flash com gelatinas coloridas, LEDs continuos e aproveitamos a iluminacao decorativa. A ideia nao e iluminar tudo — e esculpir a luz para destacar momentos."},
    {"num":"05","title":"Planeamento com o fotografo","body":"Falem com o fotografo sobre timeline com pelo menos 30 minutos de margem para golden hour retratos. Este e o segredo para fotografias de casamento realmente memoraveis."}
  ]'::jsonb,
  cta_label = 'Ver Portfolio Verao',
  cta_url = 'https://rlphotovideo.pt/portfolio',
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2026.jpg'
where slug = 'casamentos-verao-luz';

-- #6 — 16 Julho 2026
update newsletters set
  intro = 'Um dia de casamento, visto de dentro da nossa equipa, e uma coreografia invisivel de antecipacao, adaptacao e paciencia. Hoje partilhamos como funciona um dia normal para nos — do acordar as 7h a guardar o equipamento a 1 da manha.',
  sections = '[
    {"num":"06:30","title":"O despertar","body":"Revemos o briefing do casal, confirmamos timeline, verificamos as malas de equipamento. Baterias totalmente carregadas, cartoes de memoria formatados, lentes limpas. A preparacao da manha evita 90 por cento dos problemas do dia."},
    {"num":"09:00","title":"Preparativos da noiva","body":"Chegamos sempre cedo. Fotografamos detalhes — vestido, sapatos, aliancas, bouquet — sem interferir. A maquilhadora e a cabeleireira fazem o trabalho delas, nos documentamos. A magia comeca nas pequenas expressoes antes do grande momento."},
    {"num":"12:00","title":"A cerimonia","body":"Trabalhamos em equipa de 2 ou 3. Um no altar, outro nos convidados, videografo a captar a emocao. Nunca usamos flash em missas. Lentes rapidas, ISO alto, movimentos minimos. Queremos desaparecer e so a emocao fique."},
    {"num":"16:00","title":"Reportagem e retratos","body":"Depois do copo de agua, roubamos os noivos 20 minutos para retratos. Nunca mais. Eles querem estar com os convidados. Mas esses 20 minutos sao preciosos — sao as fotografias mais vistas do album."},
    {"num":"23:00","title":"A festa","body":"Trabalhamos ate as 1h. Capturamos a pista de danca, o bolo, os discursos. No fim, um ultimo portrait dos noivos a noite, luzes ao fundo. E hora de ir para casa descansar — amanha ha edicao."}
  ]'::jsonb,
  cta_label = 'Marcar Reuniao',
  cta_url = 'https://rlphotovideo.pt/contacto',
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2028.png'
where slug = 'bastidores-um-dia';

-- #7 — 30 Julho 2026
update newsletters set
  intro = 'Imaginem rever um mini-filme do vosso casamento ainda durante a festa, com os convidados ainda presentes. O Same Day Edit e isso — um trailer de 3 a 5 minutos montado durante o proprio dia. Vejam porque se tornou uma das nossas entregas mais pedidas.',
  sections = '[
    {"num":"01","title":"O conceito","body":"Um editor chega de manha, recebe o material dos videografos ao longo do dia e monta um filme resumo em tempo real. A meio da festa, projetamos o filme — muitas vezes e o momento mais emocionante da noite."},
    {"num":"02","title":"Por que funciona","body":"Os convidados ainda estao emocionalmente presentes. Veem as imagens da manha da noiva que nao viram, a emocao do pai no altar, a dança dos avos. E sentem o dia de fora. Ha sempre lagrimas."},
    {"num":"03","title":"A magia logistica","body":"Temos uma caixa movel com computador, colunas e projetor. Enquanto 2 videografos filmam, um editor monta. A musica e escolhida previamente com o casal. Tudo pronto por volta das 23h."},
    {"num":"04","title":"Nao substitui o filme completo","body":"Importante: o SDE nao e o vosso filme de casamento. E um trailer emocional do dia. O filme completo (20-40 min) e entregue 2 a 3 meses depois, com ritmo, som e narrativa mais trabalhados."},
    {"num":"05","title":"Vale a pena?","body":"Para quem quer viver o momento com os convidados, sim. Nao ha nada como ver a sala toda em silencio emocionado a ver o filme do dia. E a recordacao que os convidados levam para casa."}
  ]'::jsonb,
  cta_label = 'Saber Mais sobre SDE',
  cta_url = 'https://rlphotovideo.pt/contacto',
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2027.jpg'
where slug = 'same-day-edit';

-- #8 — 13 Agosto 2026
update newsletters set
  intro = 'De Norte a Sul, Portugal tem locais absolutamente magicos para casar. Quintas historicas, palacios, vinhedos, praias atlanticas. Hoje partilhamos alguns dos nossos favoritos, divididos por zonas.',
  sections = '[
    {"num":"Norte","title":"Vale do Douro e Gerês","body":"Quintas com vinhedos em socalcos, palacios em granito, lagoas de montanha. O Douro e dos locais mais fotogénicos do pais para casamentos ao por-do-sol. O Geres oferece natureza bruta para casamentos boho."},
    {"num":"Centro","title":"Serra da Estrela e Coimbra","body":"Quintas perto de Coimbra com vista para o Mondego, palacios em Viseu e Aveiro. A Serra da Estrela para quem quer neve ou nevoeiro dramatico no inverno."},
    {"num":"Lisboa","title":"Serra de Sintra e Arrabida","body":"Sintra oferece palacios de conto de fadas e floresta mistica. A Arrabida tem as melhores praias-calangas para casamentos estilo mediterrânico com mar turquesa."},
    {"num":"Alentejo","title":"Evora, Comporta e Monsaraz","body":"O Alentejo e cenario perfeito para casamentos minimalistas. Herdades com oliveiras, paisagens vastas, a luz mais bonita do pais. Comporta tornou-se destino internacional de casamentos de luxo."},
    {"num":"Algarve","title":"Costa Vicentina e Sotavento","body":"Falesias vermelhas, praias desertas, quintas com mar ao fundo. Perfeito de Maio a Outubro. A Costa Vicentina oferece paisagens selvagens unicas na Europa."}
  ]'::jsonb,
  cta_label = 'Ver Portfolio por Local',
  cta_url = 'https://rlphotovideo.pt/portfolio',
  hero_image_url = 'https://rlphotovideo.pt/casamentos-2026.jpg'
where slug = 'locais-sonho-portugal';
