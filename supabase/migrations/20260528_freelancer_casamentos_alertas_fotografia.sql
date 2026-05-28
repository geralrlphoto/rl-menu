-- Adiciona toggle de alertas de fotografia por casamento.
-- Quando false, o card do casamento NÃO entra nos PRAZOS FOTOS do /photo
-- nem nos cards Crítico · Entrega de /freelancers/[id]. Útil para eventos
-- onde a RL Photo.Video NÃO é responsável pela parte fotográfica.

alter table public.freelancer_casamentos
  add column if not exists alertas_fotografia_ativos boolean not null default true;

comment on column public.freelancer_casamentos.alertas_fotografia_ativos is
  'Quando false, este casamento é ignorado pelos alertas/prazos de fotografia (RL não é responsável pela foto).';
