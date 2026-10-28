import { Fragment } from 'react'
import type { Metadata } from 'next'
import { CSS_BRIEFING } from '@/app/_briefing/estilo'

/* Portal do editorial Zankyou × Quinta da Ria: plano de vídeo (dois filmes, uma produção).
   Página pública (link partilhado com a Zankyou e a Quinta da Ria), no sistema do /nova-lead:
   abertura em ecrã inteiro e dez capítulos, cada um com etiqueta, título, linha dourada e rodapé. */

export const metadata: Metadata = {
  title: 'Editorial de Casamento · Zankyou × Quinta da Ria',
  description: 'Plano de vídeo: dois filmes, uma produção. RL Photo Video.',
}

const TEL = '+351912923768'
const EMAIL = 'geral.rlphoto@gmail.com'
const SITE = 'https://www.rlphotovideo.pt'
const TOTAL = 11

/* Entregas: todo o material de vídeo é entregue aqui. Sem link fica "Aguardar";
   com link (Drive, WeTransfer, Vimeo…) passa a "Disponível" com o botão Ver / Descarregar. */
type Entrega = { nome: string; formato: string; link?: string; data?: string }
const ENTREGAS: Array<{ parceiro: string; sub: string; itens: Entrega[] }> = [
  { parceiro: 'Zankyou', sub: 'Editorial', itens: [
    { nome: 'Filme editorial', formato: '16:9 · 60–90 s' },
    { nome: 'Reel 1 · Detalhes', formato: '9:16 · 15–30 s' },
    { nome: 'Reel 2 · Casal', formato: '9:16 · 15–30 s' },
    { nome: 'Reel 3 · Ambiente', formato: '9:16 · 15–30 s' },
    { nome: 'Teaser do lançamento', formato: '9:16 · vertical' },
  ] },
  { parceiro: 'Quinta da Ria', sub: 'Apresentação do espaço', itens: [
    { nome: 'Filme de apresentação do espaço', formato: '16:9 · 60–90 s' },
  ] },
]

// Fotos do portfólio no Wfolio (i.wfolio.com, 0 no Supabase), fixas por URL; o número é a posição na galeria
const FOTOS = {
  escada: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuoqY-vLHW6sRUFwrtuKYLpjK/a_TLR17QiyyDObXJaCKKVzrmmybQN-0u/g8Vi1Abpxm_lQqASOuoK3jLfiSIcVN7h/5R5m9Sw2veSNI7ygjWtfP3hYBePE13UG/_eTwz0P7fqXpnQJvqwQAN-RxA2KHe_wz/Sn2NE0f2jW-qFK7f022Vc3rQ4CB4otOy/Y8OYEa4FcwAhOICxhuGN83EupFB3Cf8C/Dc-Dwk8GexAwgJq_Xvnm0sOIOfpBiWR_/GB4IqRDpfnsNnkNpAe6IZvdTmU-AX0-E/0e3F0q29wvhZUOeyYaKcam6143L4w14K/1aa8EmFP9VU.jpg', // 1
  veu: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOB_kPne_I7mp/v99noRd8LUeBSHXoSkr_QbbI6hiIMeUL/rNl6Z1c9xSShuKDSIU4uboR9D5ia-pIt/XTdkMb0sJsLB6vFsg8adbTEetBWyHFDR/dRUEr1-h-TKPpWtGlTWviCl6O0mthhau/3GUrhwtIBy3xEoMaGAZgOw9n5kffjLTo/oO4fp_83uKxPh76CocEZt4ihAU8VELIs/xg0TNn524Gow99zJQm4f8qr03HNr44qW/i-JvpETOZW5cPbYtauYTr-F8OcoNB5od/4_8e5AMxT3WqIrSdaW-aiqtFA_qcoLmE/d_XlmuAZtcVWeGwIWzlRm691oudMZzrT/WKnLto29g0Q.jpg', // 14
  detalhes: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuoo08jMtAYonXF5z8gyZ-DDT/pjLPGuyEdRc-kt1QRlluaUK8ROptAJUA/u03FjARsw-R59P1C61tZSBBqz_L6B4nU/SLphIa57vRqkH8bVyYxnARfexiu9BqEL/jWnr9-sLWcISZP1db_QuKJCwS7ibFtT7/NBogrbPQbfOpS0nPB1GFSVqMR7s_k9Mw/k6SCaX7AH6zV2kjxr64jiC5Otkhob_1w/d1Z8JKVaMKmAwTI4-_SiiDxIsI5183m0/3SyvoGcHbOw7ELAEUKDJ0xcP5QHl6a58/e_LgDNftvYjlblKLpWE4i_468Kwtetgi/U1cQ96Ax6pA.jpg', // 16
  vestido: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOIMbcGxDJZtB/bOHCKTwSQU_4-G5KPNej9vWYznMV2agt/sQTzlkwrFWsm-vLux3bu66sT8tRurGMD/J29BRKSUFbf_8AJx2LnnNIJi4vYaGadq/qjgBOWFx9tLPJDKTeH0bMgoM52qBl4MA/uZqPVlb9dFbiSJeEFZ1AWDuiPPdwrjK7/MUWnkKsnd4oHPCVPOlQ1hoE-2ohmZuwj/UeXN_jQYzh-TJuzOFeZQEHNzpOHKWgB_/JNzSRYQsLl-qeNelnFyxaFVFWBs3Ud2v/Jn7V2UaC3KMjQH8CYjJHrMNGEWf5ywXW/WE-XHiGXXArISuuvTSuaedJXlLixBVee/J7moUGpVRrA.jpg', // 10
  atar: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuoqqXF-nkolK8KtGIG1Vea6I/nXJ4oTdrFWyFGuaG9KwDZvaU4wvQ0aQs/vHlNvjfYk_wxmkEUhSxqJZLGmPs5B-Ed/1Akl-ZG4LTSL3SzpaBY_5Qzt33q2Iq_L/pHSH1J526lkSCzGjCQ2e3EKnEE3-V2YJ/t51aG5gvFKOyYgjiz0uN96WFhJKJcbhL/VFxbmRXwibit9ttQN81Y06bhw4N6jeBA/ZR3fm62-taLTPDnGaex0aT113BBIGCSB/XbGKUHAHYevjxoiAB4vCHjj0RotPke4E/i_9JDb8cICRgFpgA9aLRi3ov0RLapw34/8Yd7kARjJZ0.jpg', // 17
  pedra: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOB_kPne_I7mp/v99noRd8LUewpUL3fCmY0lMfLPDSLUY-/GdrQsQjxLQhiVbHm81Lhn6djHOwo5B6f/BRISSv7jr-hy0PpPnLO7uUYyLACS8p5D/hhgrNbkgW-47MT71sJPi-qWzK5TVgiQa/RBuDxrApHu3r1OsTMzdaqZeCFWX9EDlQ/tvhNzghb0sPtPjzX-TWFZ62Hdc_jLevC/GfsJ1yzkN_lUnuky0emvJ-oLfMJHUCkZ/TyM592a0X9uDPk4_UCjKYOkDH8SUUlf0/JanzSxjirsq0z3S5tcgD20K-BcHcuX_l/R1oBYEk8jMH-6_z34pvw_g1sEmIxfpvV/4q54a8aYa3M.jpg', // 6
  candeeiros: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuorKLUuIraQlIPOVD1sdllg5/BuUch2i1YLYD4lL_aMm9stBltlc--zYt/gr0a2mzXSYTcQ111X9C-FxcFUx296VQh/1I4zZcWeqoPftwKXkqm3xvXvHJ68nGt6/WeAxD_A50JNmKfcZRV6J5CGJ4O9YQvXS/M-Uo7kCGEWf_DTLs2-SvBUtoPKBDAjpK/tmWklHsOjngchxrIFYi_DSzEvi2yLhHz/CIIs2SPpaDt0W0vRotobIXY0TDA2QmpA/i0cod4MbXY-gNKEzaa69eb5SRCzowWbI/6vOKWkNUzdgpUHuMUBh6Rd65z8sTktd0/1qZCm58_ziY.jpg', // 25
  dourada: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOB_kPne_I7mp/v99noRd8LUekd05hq-4QFo2LnT4LmYdH/oBfqci0iedSwKhVxdteGerz35FSTc9g8/ST298jZ_7i9IVCWHchJufoz1nvRebmuQ/TUHciwxVcXsDXPQ1xbPQQJlFBduRGxuR/ST5iymTIiQUpLWESejG_PNRc5ZzAzWit/okW0lciyqunTq9rULze6jlyR1U7ET80A/S_Apj1paGw0U3HB4Z1tPP6DtI2tzF3bU/ppFW_4tJNlk96fDG3K01C6dq_DXeI6K7/liYxsQU1Za6jQ_vXJH-nlMs9BzFaA7Vl/Od_OopiKfslunD9IJqGmmA2d4gB6hCig/Pb0MFK5a1zk.jpg', // 15
  movimento: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuoqB1cKJOmpAzCW6YcyMPuYy/DRCk1fOU91Eo70wFmTZO34xlasI7WQJy/PMoWDtYqiH8acbnAVuFOKKFbFpXo0xEX/mtmX_9QPYNm8RVw63Eo9lesBqG2jfq77/DVLI3xZWuCexkq4Ii4luRoepD5LBMmbd/uIB_JsKpgRqUVwogE1ZG7llQAKLVNh3n/EP6Dt_pxQtofKP6Asfj3TZgq9XGOAkyS/PPAZ7250Gn0uhfMj_adc_We4gEqX2uwc/gSKQM3BoyIRUzA857qlpEurDi0Y5yE0e/3HJO5dJmj4HjGEsr52evdFpu14beJWBh/SsdWu56OaIg.jpg', // 3
  maos: 'https://i.wfolio.com/x/KfN2JhbB89-m6UeUSQ-43b-4LTDPyZVn/q6sVLUvjujnOk6mXbO2srbIKpPlcOqy0/t7rVx8PT5NFW95R5iPfYgBdCvXqdZSYC/zyAGIGx14QnH8prwkbZ-T_VQC0dpw9Hp/imD7pN62XUepN3NSIwunZoos_XinagtM/fbvcdOyKJWF1e5Z62MJQXoK8GOyeLUdi/LKuebCPWUyqXzGP1hnLy0odg3uAVZ1Ek/I65fwkJIUKkYjy8XoUJP1k-dbpQ_WQPX/5sgMnZmG15TobA87u2fFOKOL4-cUkc2O/MZ4r9ovAuoqhmbQy9CfDa0daUXrv1zuz/YpfUV1ZRNWYCFIw_Tkd-ilkIPYKrEMRY/ES_rPO1P_nabPEQiVu9kM-u8wAW9xf74/_KpBIdRV95rGcuYqIbuxdhQk155K8CAr/Ho1EU1bzx29rTD5vFdpGrNGZgDk8k6cb/A45grNZxoXG2tk_ZVWgwxZY_y3OgdAAk/tEBKhq2GD4eSAL0pcHapVlJraJFPO_KG/t_O-50yUIB3P3_mZXu1pxjkQ6XI0CkvX/X-u99pvGJKkozQVHsHNyOFZFcYcqRCLg/k8O6e0xDTgxSqO5cl4gzpPP7zwtvBx2K/Cd5qVpOVgdI.jpg', // 20
}

const CSS = `
.ed{overflow-x:clip;} /* clip (e não hidden) para o índice ficar fixo no topo */
/* ── Abertura ── */
.ed .hero{position:relative;height:100svh;min-height:600px;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center;padding:0 20px clamp(44px,9vh,80px);}
/* Cabeçalho igual ao do menu (/photo): foto a preto e branco esbatida, brilho dourado, pontilhado e anéis finos */
.ed .hero-img{position:absolute;inset:0;background:url('/casamentos-2028.webp') center 35%/cover no-repeat;filter:grayscale(1);opacity:.22;animation:edKen 16s cubic-bezier(.2,.6,.2,1) both;}
.ed .hero-brilho{position:absolute!important;inset:0;background:radial-gradient(ellipse 55% 50% at 55% 38%,rgba(201,168,76,.10),transparent 70%);}
.ed .hero-pontos{position:absolute!important;inset:0;opacity:.4;background-image:radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px);background-size:26px 26px;
  -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 42%,#000 25%,transparent 75%);mask-image:radial-gradient(ellipse 70% 60% at 50% 42%,#000 25%,transparent 75%);}
.ed .hero-aneis{position:absolute!important;left:55%;top:40%;width:1000px;height:1000px;transform:translate(-50%,-50%);opacity:.09;pointer-events:none;}
.ed .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,#0b0b0b 0%,rgba(11,11,11,.45) 20%,rgba(11,11,11,.55) 65%,var(--ink) 100%);}
.ed .hero > *:not(.hero-img):not(.hero-brilho):not(.hero-pontos):not(.hero-aneis){position:relative;z-index:2;}
.ed .parceiros{position:absolute!important;top:clamp(26px,6vh,52px);left:0;right:0;font-family:var(--fm);font-size:10px;letter-spacing:.42em;text-transform:uppercase;color:var(--tx);opacity:0;animation:edFade 1.6s .3s var(--ease) forwards;padding:0 16px;}
.ed .parceiros b{color:var(--g);font-weight:400;margin:0 .5em;}
.ed .titulo{font-family:var(--fs);font-weight:300;font-size:clamp(50px,11vw,124px);line-height:.95;letter-spacing:-.02em;color:var(--tx);margin:18px 0 0;}
.ed .titulo em{font-style:italic;color:var(--g);}
.ed .titulo span{display:inline-block;opacity:0;transform:translateY(.3em);filter:blur(10px);animation:edLetra 1.3s var(--ease) forwards;}
.ed .titulo .pal{font-weight:inherit;white-space:nowrap;}
.ed .local{font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(22px,5vw,30px);color:var(--tx-mid);margin-top:14px;opacity:0;animation:edSobe 1.4s 2s var(--ease) forwards;}
.ed .linha{width:64px;height:1px;background:var(--g);margin:24px auto 0;transform:scaleX(0);animation:edLinha 1.4s 2.2s var(--ease) forwards;}
.ed .plano{font-family:var(--fm);font-size:11px;letter-spacing:.26em;text-transform:uppercase;color:var(--g);margin-top:22px;opacity:0;animation:edSobe 1.4s 2.4s var(--ease) forwards;}
.ed .hero .eyebrow{opacity:0;animation:edSobe 1.2s .9s var(--ease) forwards;}
.ed .apres{font-family:var(--fm);font-size:9.5px;letter-spacing:.3em;text-transform:uppercase;color:var(--tx-dim);margin-top:clamp(30px,6vh,52px);opacity:0;animation:edFade 1.2s 2.8s var(--ease) forwards;}

/* ── Índice ── */
.ed .indice{position:sticky;top:0;z-index:30;background:rgba(11,10,8,.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line-soft);}
.ed .indice nav{max-width:1080px;margin:0 auto;display:flex;gap:6px;overflow-x:auto;padding:12px 16px;scrollbar-width:none;}
.ed .indice nav::-webkit-scrollbar{display:none;}
.ed .indice a{flex:none;font-family:var(--fm);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);text-decoration:none;padding:8px 13px;border:1px solid var(--line-soft);border-radius:40px;transition:.3s var(--ease);}
.ed .indice a i{font-style:normal;color:var(--g);margin-right:.6em;}
.ed .indice a:hover{color:var(--g);border-color:rgba(216,190,147,.5);}
/* No computador os botões passam para a linha de baixo em vez de ficarem cortados; no telemóvel desliza */
@media (min-width:760px){
  .ed .indice nav{max-width:none;flex-wrap:wrap;justify-content:center;overflow:visible;}
  .ed .indice a{letter-spacing:.14em;padding:7px 12px;}
}

/* ── Capítulos ── */
.ed .cap{max-width:1080px;margin:0 auto;padding:clamp(72px,12vh,120px) 16px 0;scroll-margin-top:100px;}
.ed .cap-h h2{font-size:clamp(36px,6vw,58px);margin:18px 0 0;}
.ed .cap-h .ln{width:56px;height:1px;background:var(--g);margin-top:22px;}
.ed .cap-h .lead{max-width:760px;margin-top:26px;}
.ed .rod{display:flex;justify-content:space-between;gap:16px;margin-top:clamp(48px,8vh,72px);padding-top:16px;border-top:1px solid var(--line-soft);}
.ed .rod span{font-family:var(--fm);font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-dim);}
.ed .rod b{font-weight:400;color:var(--g);white-space:nowrap;}

.ed .grid{display:grid;gap:14px;margin-top:clamp(34px,5vh,48px);}
.ed .g2{grid-template-columns:repeat(2,minmax(0,1fr));}
.ed .g3{grid-template-columns:repeat(3,minmax(0,1fr));}
.ed .g4{grid-template-columns:repeat(4,minmax(0,1fr));}
@media (max-width:900px){.ed .g3,.ed .g4{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media (max-width:620px){.ed .g2,.ed .g3,.ed .g4{grid-template-columns:minmax(0,1fr);}}

/* Cartão */
.ed .card{position:relative;padding:26px 24px;border-radius:16px;background:radial-gradient(120% 140% at 0% 0%,rgba(216,190,147,.08),transparent 55%),var(--ink-2);border:1px solid var(--line-soft);}
.ed .card .k{font-family:var(--fm);font-size:9.5px;letter-spacing:.26em;text-transform:uppercase;color:var(--g);}
.ed .card h3{font-family:var(--fs);font-weight:300;font-size:clamp(25px,3vw,30px);line-height:1.1;color:var(--tx);margin:12px 0 0;}
.ed .card h3 em{font-style:italic;color:var(--g);}
.ed .card ul{list-style:none;margin:18px 0 0;padding:0;}
.ed .card li{position:relative;padding:11px 0 11px 22px;border-top:1px solid var(--line-soft);color:var(--tx-mid);font-size:14.5px;line-height:1.55;}
.ed .card li::before{content:"";position:absolute;left:2px;top:20px;width:9px;height:1px;background:var(--g);}
.ed .card li b{color:var(--tx);font-weight:500;}
.ed .card li a{color:var(--tx);text-decoration:none;border-bottom:1px solid rgba(216,190,147,.35);}
.ed .card li a:hover{color:var(--g);}
.ed .card.ouro{border-color:rgba(216,190,147,.35);}

/* Bloco escuro (números) */
.ed .bloco{padding:24px 22px;border-radius:14px;background:#070605;border:1px solid var(--line-soft);}
.ed .bloco .v{font-family:var(--fs);font-weight:300;font-size:clamp(30px,3.6vw,40px);line-height:1;color:var(--g);}
.ed .bloco .v em{font-style:italic;}
.ed .bloco .t{font-family:var(--fm);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid);margin-top:12px;line-height:1.7;}
.ed .bloco .n{font-family:var(--fs);font-style:italic;font-size:22px;color:var(--g);}
.ed .bloco h4{font-family:var(--fs);font-weight:300;font-size:26px;color:var(--tx);margin:8px 0 0;}
.ed .bloco p{color:var(--tx-mid);font-size:14px;line-height:1.6;margin:10px 0 0;}

/* Tabela */
.ed .tab{margin-top:clamp(30px,5vh,44px);border:1px solid var(--line-soft);border-radius:16px;overflow:hidden;}
.ed .tab-t{font-family:var(--fm);font-size:10px;letter-spacing:.26em;text-transform:uppercase;color:var(--g);margin:clamp(34px,5vh,48px) 0 0;}
.ed .tab-t + .tab{margin-top:14px;}
.ed .tr{display:grid;gap:18px;padding:16px 20px;align-items:start;}
.ed .tr.cab{background:#070605;}
.ed .tr.cab span{font-family:var(--fm);font-size:9.5px;letter-spacing:.22em;text-transform:uppercase;color:var(--g);}
.ed .tr:not(.cab):nth-child(even){background:rgba(243,237,226,.025);}
.ed .tr:not(.cab){border-top:1px solid var(--line-soft);}
.ed .tr span{color:var(--tx-mid);font-size:14.5px;line-height:1.55;min-width:0;}
.ed .tr span.m{font-family:var(--fs);font-size:21px;color:var(--tx);line-height:1.2;}
.ed .tr span.d{font-family:var(--fm);font-size:11px;letter-spacing:.08em;color:var(--g);white-space:nowrap;}
.ed .tr span.f b{color:var(--tx);font-weight:500;font-style:italic;font-family:var(--fs);font-size:19px;}
.ed .tr span[data-c]::before{display:none;}
@media (max-width:720px){
  .ed .tr.cab{display:none;}
  .ed .tr{grid-template-columns:minmax(0,1fr)!important;gap:8px;}
  .ed .tr span[data-c]::before{display:block;content:attr(data-c);font-family:var(--fm);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--tx-dim);margin-bottom:3px;}
  .ed .tr span.m::before,.ed .tr span.d::before{font-size:9px;}
}

/* Nota */
.ed .nota{margin-top:18px;padding:20px 22px;border-left:1px solid var(--g);background:rgba(216,190,147,.04);border-radius:0 12px 12px 0;color:var(--tx-mid);font-size:14.5px;line-height:1.65;}
.ed .nota b{font-family:var(--fm);font-weight:400;font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);display:block;margin-bottom:8px;}
.ed .formatos{font-family:var(--fs);font-style:italic;font-size:clamp(19px,2.2vw,23px);color:var(--tx-mid);margin-top:26px;line-height:1.45;}
.ed .formatos em{color:var(--g);}

/* Fotos: faixa entre capítulos e grelhas dentro dos filmes */
.ed .faixa-foto{position:relative;margin-top:clamp(72px,12vh,120px);height:clamp(280px,62vh,620px);overflow:hidden;}
.ed .faixa-foto img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;}
.ed .faixa-foto::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,var(--ink) 0%,rgba(11,10,8,.1) 22%,rgba(11,10,8,.1) 70%,var(--ink) 100%);}
.ed .faixa-foto figcaption{position:absolute;z-index:2;left:0;right:0;bottom:clamp(22px,5vh,40px);text-align:center;font-family:var(--fs);font-style:italic;font-weight:300;font-size:clamp(22px,3.4vw,34px);color:var(--tx);padding:0 16px;}
.ed .faixa-foto figcaption em{color:var(--g);}
@supports (animation-timeline: view()){
  .ed .faixa-foto img{animation:edParalaxe linear both;animation-timeline:view();}
}
/* Fotos verticais: inteiras ao centro (nunca cortam cabeças), com a mesma foto desfocada a encher a faixa */
.ed .faixa-foto.vert{height:clamp(440px,86vh,820px);}
.ed .faixa-foto.vert .fundo{filter:blur(28px) brightness(.45);transform:scale(1.2);animation:none;}
.ed .faixa-foto.vert .inteira{position:relative;z-index:1;display:block;width:auto;height:84%;max-width:calc(100% - 32px);inset:auto;margin:6% auto 0;object-fit:contain;border-radius:6px;box-shadow:0 30px 80px -20px rgba(0,0,0,.8);animation:none;}
.ed .faixa-foto.vert figcaption{bottom:clamp(10px,2.4vh,20px);}
@keyframes edParalaxe{from{transform:scale(1.14) translateY(-4%)}to{transform:scale(1.14) translateY(4%)}}
.ed .fotos{display:grid;gap:12px;margin-top:clamp(30px,5vh,44px);}
.ed .fotos figure{margin:0;position:relative;border-radius:14px;overflow:hidden;border:1px solid var(--line-soft);}
.ed .fotos img{display:block;width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease);}
.ed .fotos figure:hover img{transform:scale(1.04);}
.ed .fotos figcaption{position:absolute;left:12px;bottom:10px;font-family:var(--fm);font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:var(--tx);text-shadow:0 1px 8px rgba(0,0,0,.8);}
.ed .fotos.f3{grid-template-columns:repeat(3,minmax(0,1fr));}
.ed .fotos.f3 figure{aspect-ratio:4/5;}
.ed .fotos.f2{grid-template-columns:minmax(0,1fr) minmax(0,1.5fr);}
.ed .fotos.f2 figure{aspect-ratio:auto;height:clamp(240px,42vw,460px);}
@media (max-width:620px){.ed .fotos.f2{grid-template-columns:minmax(0,1fr);}.ed .fotos.f3{gap:6px;}.ed .fotos figcaption{font-size:8px;left:8px;}}

/* Entregas */
.ed .ent-resumo{display:flex;align-items:center;gap:18px;margin-top:clamp(30px,5vh,44px);}
.ed .ent-resumo .barra{flex:1;height:3px;border-radius:2px;background:var(--line-soft);overflow:hidden;}
.ed .ent-resumo .barra i{display:block;height:100%;background:var(--g);}
.ed .ent-resumo span{font-family:var(--fm);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--tx-mid);white-space:nowrap;}
.ed .ent-grupo{margin-top:clamp(30px,5vh,44px);}
.ed .ent-grupo h3{font-family:var(--fs);font-weight:300;font-size:clamp(26px,3vw,32px);color:var(--tx);margin:0;display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;}
.ed .ent-grupo h3 small{font-family:var(--fm);font-size:9.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--g);}
.ed .ent-lista{margin-top:14px;border:1px solid var(--line-soft);border-radius:16px;overflow:hidden;}
.ed .ent{display:flex;align-items:center;gap:16px;padding:16px 20px;}
.ed .ent + .ent{border-top:1px solid var(--line-soft);}
.ed .ent:nth-child(even){background:rgba(243,237,226,.025);}
.ed .ent .ic{width:38px;height:38px;flex:none;display:grid;place-items:center;border-radius:50%;border:1px solid var(--line-soft);color:var(--tx-dim);}
.ed .ent.ok .ic{border-color:rgba(216,190,147,.5);color:var(--g);}
.ed .ent .ic svg{width:15px;height:15px;}
.ed .ent .t{flex:1;min-width:0;}
.ed .ent .t b{display:block;font-family:var(--fd);font-weight:300;font-size:clamp(16px,1.6vw,18px);color:var(--tx);}
.ed .ent .t span{display:block;font-family:var(--fm);font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-dim);margin-top:4px;}
.ed .ent .est{flex:none;font-family:var(--fm);font-size:9.5px;letter-spacing:.2em;text-transform:uppercase;padding:9px 14px;border-radius:40px;border:1px solid var(--line-soft);color:var(--tx-dim);}
.ed .ent a.est{border-color:var(--g);background:var(--g);color:var(--ink);text-decoration:none;transition:.3s var(--ease);}
.ed .ent a.est:hover{background:transparent;color:var(--g);}
@media (max-width:560px){.ed .ent{flex-wrap:wrap;padding:14px 16px;}.ed .ent .est{margin-left:54px;}}

/* Próximos passos */
.ed .passos{list-style:none;margin:clamp(34px,5vh,48px) 0 0;padding:0;}
.ed .passos li{display:flex;gap:20px;align-items:baseline;padding:20px 2px;border-top:1px solid var(--line-soft);}
.ed .passos li:last-child{border-bottom:1px solid var(--line-soft);}
.ed .passos .n{font-family:var(--fs);font-style:italic;font-size:26px;color:var(--g);width:34px;flex:none;}
.ed .passos .t{font-family:var(--fd);font-weight:300;font-size:clamp(17px,2vw,20px);color:var(--tx);line-height:1.4;}

/* Faixa final */
.ed .faixa{margin-top:0;background:#070605;border-top:1px solid var(--line-soft);text-align:center;padding:clamp(60px,11vh,100px) 16px 48px;}
.ed .faixa h2{font-size:clamp(42px,8vw,72px);margin:0;}
.ed .faixa .ln{width:56px;height:1px;background:var(--g);margin:24px auto 0;}
.ed .faixa .ct{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 26px;margin-top:28px;}
.ed .faixa .ct a,.ed .faixa .ct span{font-family:var(--fm);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tx-mid);text-decoration:none;}
.ed .faixa .ct a:hover{color:var(--g);}
.ed .faixa .acoes{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:36px;}
.ed .faixa img{width:44px;margin:46px auto 0;display:block;opacity:.75;}
.ed .faixa .hint{margin-top:16px;}

@supports (animation-timeline: view()){
  .ed .rv{animation:edSobe linear both;animation-timeline:view();animation-range:entry 0% entry 60%;}
}
@keyframes edKen{from{transform:scale(1.16)}to{transform:scale(1)}}
@keyframes edFade{to{opacity:1}}
@keyframes edLetra{to{opacity:1;transform:none;filter:blur(0)}}
@keyframes edLinha{to{transform:scaleX(1)}}
@keyframes edSobe{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.ed *,.ed *::before,.ed *::after{animation-duration:.01s!important;animation-delay:0s!important;animation-iteration-count:1!important;}}
`

const CAPITULOS = [
  { id: 'quem-somos', nome: 'Quem somos' },
  { id: 'visao-geral', nome: 'Visão geral' },
  { id: 'filme-1', nome: 'Filme 1' },
  { id: 'filme-2', nome: 'Filme 2' },
  { id: 'guiao', nome: 'Guião' },
  { id: 'captacao', nome: 'Captação' },
  { id: 'entregaveis', nome: 'Entregáveis' },
  { id: 'distribuicao', nome: 'Distribuição' },
  { id: 'proximos-passos', nome: 'Próximos passos' },
  { id: 'entregas', nome: 'Entregas' },
]

/* ── Peças ─────────────────────────────────────────────────────────────── */

function Cabeca({ n, etiqueta, children, lead }: { n: number; etiqueta: string; children: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <header className="cap-h rv">
      <p className="eyebrow">{String(n).padStart(2, '0')} &middot; {etiqueta}</p>
      <h2>{children}</h2>
      <div className="ln" />
      {lead && <p className="lead">{lead}</p>}
    </header>
  )
}

function Rodape({ n }: { n: number }) {
  return (
    <div className="rod">
      <span>Editorial de Casamento | Quinta da Ria, Algarve | RL Photo Video</span>
      <span><b>{String(n).padStart(2, '0')} / {TOTAL}</b></span>
    </div>
  )
}

function Cartao({ k, titulo, itens, ouro }: { k?: string; titulo: React.ReactNode; itens: React.ReactNode[]; ouro?: boolean }) {
  return (
    <div className={`card rv${ouro ? ' ouro' : ''}`}>
      {k && <p className="k">{k}</p>}
      <h3>{titulo}</h3>
      <ul>{itens.map((it, i) => <li key={i}>{it}</li>)}</ul>
    </div>
  )
}

type Col = { nome: string; cls?: string }
function Tabela({ colunas, largura, linhas }: { colunas: Col[]; largura: string; linhas: React.ReactNode[][] }) {
  return (
    <div className="tab rv">
      <div className="tr cab" style={{ gridTemplateColumns: largura }}>
        {colunas.map(c => <span key={c.nome}>{c.nome}</span>)}
      </div>
      {linhas.map((l, i) => (
        <div key={i} className="tr" style={{ gridTemplateColumns: largura }}>
          {l.map((cel, j) => <span key={j} className={colunas[j].cls} data-c={colunas[j].nome}>{cel}</span>)}
        </div>
      ))}
    </div>
  )
}

function FaixaFoto({ src, pos = 'center', vertical, children }: { src: string; pos?: string; vertical?: boolean; children?: React.ReactNode }) {
  if (vertical) return (
    <figure className="faixa-foto vert" style={{ margin: 0 }}>
      <img className="fundo" src={src} alt="" loading="lazy" />
      <img className="inteira" src={src} alt="" loading="lazy" />
      {children && <figcaption>{children}</figcaption>}
    </figure>
  )
  return (
    <figure className="faixa-foto" style={{ margin: 0 }}>
      <img src={src} alt="" loading="lazy" style={{ objectPosition: pos }} />
      {children && <figcaption>{children}</figcaption>}
    </figure>
  )
}

function Fotos({ cls, fotos }: { cls: string; fotos: Array<[string, string, string?]> }) {
  return (
    <div className={`fotos ${cls} rv`}>
      {fotos.map(([src, leg, pos]) => (
        <figure key={src}><img src={src} alt={leg} loading="lazy" style={{ objectPosition: pos ?? 'center' }} /><figcaption>{leg}</figcaption></figure>
      ))}
    </div>
  )
}

const IcPlay = () => <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z" /></svg>
const IcRelogio = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>

function Entregas() {
  const todas = ENTREGAS.flatMap(g => g.itens)
  const feitas = todas.filter(e => e.link).length
  return (
    <>
      <div className="ent-resumo rv">
        <div className="barra"><i style={{ width: `${(feitas / todas.length) * 100}%` }} /></div>
        <span>{feitas} de {todas.length} entregues</span>
      </div>
      {ENTREGAS.map(g => (
        <div key={g.parceiro} className="ent-grupo rv">
          <h3>{g.parceiro} <small>{g.sub}</small></h3>
          <div className="ent-lista">
            {g.itens.map(e => (
              <div key={e.nome} className={`ent${e.link ? ' ok' : ''}`}>
                <span className="ic">{e.link ? <IcPlay /> : <IcRelogio />}</span>
                <span className="t"><b>{e.nome}</b><span>{e.formato}{e.data ? ` · entregue a ${e.data}` : ''}</span></span>
                {e.link
                  ? <a className="est" href={e.link} target="_blank" rel="noopener noreferrer">Ver / Descarregar ↗</a>
                  : <span className="est">Aguardar</span>}
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  )
}

function Titulo() {
  // Cada palavra fica num bloco sem quebra, para não partir "Casamento" no telemóvel
  const palavras: Array<[string, boolean]> = [['Editorial', false], ['de', false], ['Casamento', true]]
  let i = 0
  const letras = (txt: string) => txt.split('').map(c => <span key={i} style={{ animationDelay: `${1.1 + (i++) * 0.045}s` }}>{c}</span>)
  return (
    <h1 className="titulo" aria-label="Editorial de Casamento">
      {palavras.map(([txt, it], k) => (
        <Fragment key={k}>
          {k > 0 && ' '}
          <b className="pal">{it ? <em>{letras(txt)}</em> : letras(txt)}</b>
        </Fragment>
      ))}
    </h1>
  )
}

/* ── Página ────────────────────────────────────────────────────────────── */

export default function EditorialZankyouPage() {
  return (
    <main className="nlead ed" style={{ minHeight: '100vh', background: 'var(--ink)' }}>
      <style>{CSS_BRIEFING + CSS}</style>
      <div className="fx-grain" aria-hidden="true" />

      {/* 01 · Capa */}
      <section className="hero" id="capa">
        <div className="hero-img" aria-hidden="true" />
        <div className="hero-brilho" aria-hidden="true" />
        <div className="hero-pontos" aria-hidden="true" />
        <svg className="hero-aneis" viewBox="0 0 100 100" fill="none" stroke="#C9A84C" strokeWidth="0.1" aria-hidden="true">
          <circle cx="50" cy="50" r="18" />
          <circle cx="50" cy="50" r="30" strokeDasharray="0.5 1.2" />
          <circle cx="50" cy="50" r="44" />
        </svg>
        <p className="parceiros">Zankyou<b>×</b>Quinta da Ria<b>×</b>RL Photo Video</p>
        <p className="eyebrow">Plano de vídeo</p>
        <Titulo />
        <p className="local">Quinta da Ria, Algarve</p>
        <div className="linha" />
        <p className="plano">Dois filmes, uma produção</p>
        <p className="apres">Apresentado por RL Photo Video | Palmela, Portugal</p>
      </section>

      <div className="indice">
        <nav aria-label="Capítulos">
          {CAPITULOS.map((c, i) => (
            <a key={c.id} href={`#${c.id}`}><i>{String(i + 2).padStart(2, '0')}</i>{c.nome}</a>
          ))}
        </nav>
      </div>

      {/* 02 · Quem somos */}
      <section className="cap" id="quem-somos">
        <Cabeca n={2} etiqueta="Quem somos" lead="A RL Photo Video é uma produtora especializada em casamentos, sediada em Palmela, Setúbal, com uma equipa de cerca de 10 elementos organizada em departamentos de vídeo, fotografia e financeiro. Não nos limitamos a filmar: pensamos cada projeto, planeamos cada momento e contamos histórias reais com uma linguagem cinematográfica, natural e emotiva.">
          RL Photo <em>Video</em>
        </Cabeca>
        <div className="grid g4">
          <div className="bloco rv"><div className="v">±10</div><div className="t">Elementos na equipa</div></div>
          <div className="bloco rv"><div className="v"><em>Vídeo</em></div><div className="t">Departamento dedicado</div></div>
          <div className="bloco rv"><div className="v"><em>Fotografia</em></div><div className="t">Departamento dedicado</div></div>
          <div className="bloco rv"><div className="v"><em>Financeiro</em></div><div className="t">Gestão e acompanhamento</div></div>
        </div>
        <div className="grid g3">
          <Cartao k="O que fazemos" titulo={<>Serviços</>} itens={[
            'Fotografia de casamento',
            'Wedding Film cinematográfico',
            'Same Day Edit: filme exibido no próprio dia',
            'Relive Wedding e conteúdo vertical para redes',
          ]} />
          <Cartao k="Como trabalhamos" titulo={<>A nossa <em>abordagem</em></>} itens={[
            'Não nos limitamos a filmar: criamos a história',
            'Discretos, sem encenar o que é verdadeiro',
            'Luz natural e paisagem como parte da história',
            'Captação pensada para cinema e para redes',
          ]} />
          <Cartao k="Contacto" titulo={<>Fale <em>connosco</em></>} ouro itens={[
            <b key="n">Rui Gonçalves</b>,
            <a key="t" href={`tel:${TEL}`}>912 923 768</a>,
            <a key="e" href={`mailto:${EMAIL}`}>{EMAIL}</a>,
            <a key="s" href={SITE} target="_blank" rel="noopener noreferrer">www.rlphotovideo.pt</a>,
          ]} />
        </div>
        <Rodape n={2} />
      </section>

      <FaixaFoto src={FOTOS.escada} vertical>Contamos histórias <em>reais</em></FaixaFoto>

      {/* 03 · Visão geral */}
      <section className="cap" id="visao-geral">
        <Cabeca n={3} etiqueta="Visão geral" lead="O editorial da Zankyou na Quinta da Ria é a oportunidade de criar, num só dia de produção, dois filmes complementares. Cada um tem um público e um objetivo diferente, mas partilham a mesma estética, a mesma equipa e o mesmo cenário.">
          Uma produção, <em>dois filmes</em>
        </Cabeca>
        <div className="grid g2">
          <Cartao k="Filme 1" titulo={<>Editorial de <em>casamento</em></>} itens={[
            <><b>Para:</b> Zankyou e o seu público de noivos</>,
            <><b>Objetivo:</b> inspirar e emocionar</>,
            <><b>Mensagem:</b> «é assim que um casamento pode ser»</>,
            'Mostra tendências, styling e o trabalho dos fornecedores',
            'Valoriza a marca Zankyou como referência de inspiração',
          ]} />
          <Cartao k="Filme 2" titulo={<>Apresentação do <em>espaço</em></>} itens={[
            <><b>Para:</b> Quinta da Ria e casais à procura de local</>,
            <><b>Objetivo:</b> fazer o casal imaginar-se ali</>,
            <><b>Mensagem:</b> «o vosso casamento acontece aqui»</>,
            'Mostra o percurso do dia no espaço',
            'Termina com convite claro à visita do espaço',
          ]} />
        </div>
        <Rodape n={3} />
      </section>

      <FaixaFoto src={FOTOS.veu} pos="center 40%">Véu ao vento, <em>luz dourada</em></FaixaFoto>

      {/* 04 · Filme 1 */}
      <section className="cap" id="filme-1">
        <Cabeca n={4} etiqueta="Filme 1" lead="Conceito narrativo: um dia de casamento condensado, dos preparativos ao pôr do sol, guiado por um fio condutor emocional: uma carta ou votos lidos em voz off pelos noivos. A luz dourada do Algarve e a paisagem da ria são personagens do filme.">
          Editorial de <em>casamento</em>
        </Cabeca>
        <p className="tab-t rv">Estrutura (60–90 segundos)</p>
        <Tabela
          largura="minmax(0,.8fr) minmax(0,1.5fr) minmax(0,1.2fr)"
          colunas={[{ nome: 'Momento', cls: 'm' }, { nome: 'O que se mostra' }, { nome: 'Intenção' }]}
          linhas={[
            ['Abertura', 'Plano forte: véu ao vento, luz dourada, vista aérea', 'Captar atenção nos primeiros 2 segundos'],
            ['Preparativos', 'Vestido, joias, convites, flores, últimos retoques', 'Mostrar styling e fornecedores'],
            ['Cerimónia', 'Altar, troca de olhares, votos', 'Ponto emocional do filme'],
            ['Pôr do sol', 'Sessão dos noivos com luz dourada e vista da ria', 'Momento mais cinematográfico e fecho do filme'],
          ]}
        />
        <Fotos cls="f3" fotos={[[FOTOS.detalhes, 'Detalhes'], [FOTOS.vestido, 'Vestido'], [FOTOS.atar, 'Últimos retoques']]} />
        <p className="formatos rv">Formatos: filme horizontal <em>16:9</em> para site e YouTube da Zankyou, e <em>3 reels verticais 9:16</em> (detalhes, casal, ambiente).</p>
        <Rodape n={4} />
      </section>

      {/* 05 · Filme 2 */}
      <section className="cap" id="filme-2">
        <Cabeca n={5} etiqueta="Filme 2" lead="Conceito: o espaço apresentado através do percurso de um dia de casamento real. Em vez de espaços vazios, o casal vê cada zona decorada e vivida pelo editorial, o que torna a decisão mais fácil.">
          Apresentação da <em>Quinta da Ria</em>
        </Cabeca>
        <div className="grid g4">
          {[
            ['01', 'Chegada', 'Entrada, acessos e primeira impressão do espaço'],
            ['02', 'Preparativos', 'Zonas de preparação dos noivos, luz e interiores'],
            ['03', 'Cerimónia', 'Zona do altar, enquadramento e decoração'],
            ['04', 'Pôr do sol', 'Jardins, vistas para a ria e luz dourada'],
          ].map(([n, t, p]) => (
            <div key={n} className="bloco rv"><div className="n">{n}</div><h4>{t}</h4><p>{p}</p></div>
          ))}
        </div>
        <Fotos cls="f2" fotos={[[FOTOS.pedra, 'O espaço vivido', 'center 30%'], [FOTOS.candeeiros, 'Interiores e acabamentos']]} />
        <div className="grid g2">
          <Cartao k="Planos" titulo={<>Como se filma <em>cada zona</em></>} itens={[
            'Plano aberto aéreo (drone) para escala e localização',
            'Plano médio para circulação e ambiente',
            'Plano de detalhe para materiais e acabamentos',
            'Planos do espaço antes e depois da decoração',
          ]} />
          <Cartao k="No ecrã" titulo={<>Texto discreto <em>e útil</em></>} itens={[
            'Nome de cada zona e momento do dia',
            'Principais características do espaço',
            'Localização: Algarve',
            'Fecho: convite a agendar visita',
          ]} />
        </div>
        <Rodape n={5} />
      </section>

      {/* 06 · Guião */}
      <section className="cap" id="guiao">
        <Cabeca n={6} etiqueta="Filme 2 | Guião" lead="Para dar rosto e proximidade ao espaço, o filme abre com uma pessoa a falar diretamente para a câmara: a Cristiana, da Zankyou, ou um representante da Quinta da Ria. A Zankyou dá credibilidade de quem conhece o setor; um representante do espaço dá calor e a sensação de receber o casal em casa.">
          A abertura do <em>filme</em>
        </Cabeca>
        <Tabela
          largura="40px minmax(0,1.6fr) minmax(0,1.3fr) 76px"
          colunas={[{ nome: '#', cls: 'd' }, { nome: 'Imagem' }, { nome: 'Som / texto', cls: 'f' }, { nome: 'Duração', cls: 'd' }]}
          linhas={[
            ['1', 'Sequência de drone: ria, quinta e envolvente', 'Música a entrar', '3–4 s'],
            ['2', 'Apresentador em câmara, com o espaço atrás', <b key="f">«Vai casar no Algarve? Este é o espaço ideal.»</b>, '3 s'],
            ['3', 'Várias imagens em sequência rápida: drone, detalhes, cerimónia, noivos', 'Música em crescendo', '8–10 s'],
            ['4', 'Apresentador em câmara, de braços abertos ou a caminhar', <b key="f">«Bem-vindos à Quinta da Ria.»</b>, '2 s'],
            ['5', 'Percurso do dia: chegada, preparativos, cerimónia, pôr do sol', 'Música e som ambiente', '40–60 s'],
            ['6', 'Plano final aéreo ao pôr do sol com o logótipo', <b key="f">«Agende a sua visita.»</b>, '4 s'],
          ]}
        />
        <div className="nota rv">
          <b>Nota</b>
          Frases curtas e naturais, microfone de lapela, 3–4 takes de cada frase, gravadas com a mesma luz do resto do filme. A mesma pessoa pode também ter uma breve aparição no editorial, a ligar os dois filmes.
        </div>
        <Rodape n={6} />
      </section>

      {/* 07 · Captação */}
      <section className="cap" id="captacao">
        <Cabeca n={7} etiqueta="Captação" lead="Cronograma indicativo, a ajustar à hora do pôr do sol e ao plano da produção do editorial.">
          Plano do dia de <em>filmagem</em>
        </Cabeca>
        <Tabela
          largura="minmax(0,.8fr) minmax(0,2fr) minmax(0,.7fr)"
          colunas={[{ nome: 'Horário', cls: 'm' }, { nome: 'Captação' }, { nome: 'Filme', cls: 'd' }]}
          linhas={[
            ['Manhã', 'Planos do espaço vazio, acessos, interiores, drone com luz limpa', 'Filme 2'],
            ['Início da tarde', 'Preparativos dos noivos e detalhes de styling', 'Filmes 1 e 2'],
            ['Meio da tarde', 'Montagem da cerimónia em timelapse e cerimónia encenada', 'Filmes 1 e 2'],
            ['Golden hour', 'Sessão dos noivos e planos aéreos ao pôr do sol', 'Filmes 1 e 2'],
          ]}
        />
        <div className="grid g2" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
          <Cartao k="No terreno" titulo={<>Boas <em>práticas</em></>} itens={[
            'Filmagem vertical nativa em paralelo, sem depender só de recortes',
            'Som ambiente e voz off gravados à parte',
            'Planos de transição entre zonas para o Filme 2',
          ]} />
        </div>
        <Rodape n={7} />
      </section>

      <FaixaFoto src={FOTOS.dourada} vertical>Golden <em>hour</em></FaixaFoto>

      {/* 08 · Entregáveis */}
      <section className="cap" id="entregaveis">
        <Cabeca n={8} etiqueta="Entregáveis">
          O que cada parceiro <em>recebe</em>
        </Cabeca>
        <div className="grid g3">
          <Cartao k="Editorial" titulo={<>Zankyou</>} itens={[
            'Filme editorial 16:9 (60–90 s)',
            '3 reels verticais 9:16 (15–30 s)',
            'Teaser vertical para anúncio da publicação',
            'Créditos de todos os fornecedores',
          ]} />
          <Cartao k="Apresentação do espaço" titulo={<>Quinta da <em>Ria</em></>} itens={[
            'Um filme de apresentação do espaço, 16:9 (60–90 s)',
            'Percurso do dia: chegada, preparativos, cerimónia e pôr do sol',
            'Planos aéreos integrados no filme',
            'Fecho com convite a agendar visita',
          ]} />
          <Cartao k="Material partilhável" titulo={<>Fornecedores</>} itens={[
            'Créditos e identificação nas publicações',
            'Acesso às publicações em colaboração',
          ]} />
        </div>
        <Rodape n={8} />
      </section>

      <FaixaFoto src={FOTOS.movimento} vertical>Um dia, <em>dois filmes</em></FaixaFoto>

      {/* 09 · Distribuição */}
      <section className="cap" id="distribuicao">
        <Cabeca n={9} etiqueta="Distribuição">
          Plano de <em>lançamento</em>
        </Cabeca>
        <div className="grid g4">
          {[
            ['Semana 0', 'Teaser', 'Vídeo curto vertical a anunciar o editorial, 2–3 dias antes do lançamento.'],
            ['Semana 1', 'Lançamento', 'Filme editorial publicado em Collab no Instagram: Zankyou, Quinta da Ria e RL Photo Video.'],
            ['Semana 2', 'Espaço', 'Lançamento do filme de apresentação da Quinta da Ria.'],
            ['Semanas 3–4', 'Continuidade', 'Reels do editorial, partilhas dos fornecedores e bastidores da produção.'],
          ].map(([s, t, p]) => (
            <div key={s} className="bloco rv"><div className="t" style={{ marginTop: 0, color: 'var(--g)' }}>{s}</div><h4>{t}</h4><p>{p}</p></div>
          ))}
        </div>
        <div className="grid g2" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
          <Cartao k="Alcance" titulo={<>Para maximizar <em>alcance</em></>} ouro itens={[
            'Publicações em colaboração para aparecer em simultâneo nos três perfis',
            'Libertar o conteúdo ao longo de 3–4 semanas, em vez de tudo de uma vez',
            'Primeiros 2 segundos de cada reel com a imagem mais forte',
            'Legendas e texto no ecrã, porque a maioria vê sem som',
          ]} />
        </div>
        <Rodape n={9} />
      </section>

      {/* 10 · Próximos passos */}
      <section className="cap" id="proximos-passos">
        <Cabeca n={10} etiqueta="Próximos passos">
          Para <em>avançar</em>
        </Cabeca>
        <ol className="passos">
          {[
            'Confirmar data, horários e hora do pôr do sol no dia da produção',
            'Receber o conceito, moodboard e lista de fornecedores do editorial',
            'Visita ou reconhecimento prévio do espaço para definir planos e zonas de drone',
            'Validar a lista de entregáveis com a Zankyou e a Quinta da Ria',
            'Alinhar datas de publicação e contas para as colaborações no Instagram',
          ].map((t, i) => (
            <li key={i} className="rv"><span className="n">{String(i + 1).padStart(2, '0')}</span><span className="t">{t}</span></li>
          ))}
        </ol>
        <Rodape n={10} />
      </section>

      {/* 11 · Entregas */}
      <section className="cap" id="entregas">
        <Cabeca n={11} etiqueta="Entregas" lead="Todo o material de vídeo é entregue aqui. Cada filme aparece como disponível assim que estiver pronto, com o link para ver e descarregar.">
          O material, <em>pronto a usar</em>
        </Cabeca>
        <Entregas />
        <Rodape n={11} />
      </section>

      <FaixaFoto src={FOTOS.maos} vertical>Vamos <em>começar?</em></FaixaFoto>

      <footer className="faixa">
        <p className="eyebrow">Fale connosco</p>
        <h2 style={{ marginTop: 18 }}>RL Photo <em>Video</em></h2>
        <div className="ln" />
        <div className="ct">
          <span>Rui Gonçalves</span>
          <a href={`tel:${TEL}`}>912 923 768</a>
          <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          <a href={SITE} target="_blank" rel="noopener noreferrer">www.rlphotovideo.pt</a>
        </div>
        <div className="acoes">
          <a href={`tel:${TEL}`} className="btn"><span className="fill" />Ligar</a>
          <a href={`mailto:${EMAIL}?subject=${encodeURIComponent('Editorial Zankyou × Quinta da Ria')}`} className="btn-ghost">Enviar email ↗</a>
        </div>
        <img src="/logo_rl_gold.png" alt="RL Photo Video" />
        <div className="hint">Editorial de Casamento | Quinta da Ria, Algarve | RL Photo Video</div>
      </footer>
    </main>
  )
}
