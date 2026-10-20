-- Histórico da ficha do evento (evento_historico) recebe também o que os
-- departamentos registam: fotografia_historico (editor nomeado, seleção recebida,
-- lembretes, sneak peek, álbum…) e video_estado_historico (estados do vídeo).
-- As entregas aos noivos já entram pelo gatilho do portal, por isso não se duplicam.
create or replace function public.historico_departamento_para_ficha() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_tipo text; v_titulo text; v_origem text;
begin
  if TG_TABLE_NAME = 'fotografia_historico' then
    if new.etapa in ('Galeria online enviada', 'Fotos p/ seleção enviadas', 'Fotos editadas entregues') then return new; end if;
    v_tipo := case when new.etapa like 'Álbum%' or new.etapa like 'Editor de álbum%' then 'album' else 'fotografia' end;
    v_titulo := new.etapa;
    v_origem := new.origem;
    insert into evento_historico (referencia, tipo, titulo, detalhe, created_at)
      values (new.referencia, v_tipo, v_titulo, case when coalesce(v_origem, '') <> '' then 'Por ' || v_origem end, new.criado_em);
  else
    v_titulo := case when new.estado = 'Editor nomeado' then 'Editor de vídeo nomeado' else 'Vídeo: ' || new.estado end;
    insert into evento_historico (referencia, tipo, titulo, detalhe, created_at)
      values (new.referencia, 'video', v_titulo, case when coalesce(new.origem, '') <> '' then 'Por ' || new.origem end, new.criado_em);
  end if;
  return new;
end $$;

drop trigger if exists fotografia_historico_para_ficha on public.fotografia_historico;
create trigger fotografia_historico_para_ficha after insert on public.fotografia_historico
  for each row execute function public.historico_departamento_para_ficha();
drop trigger if exists video_estado_historico_para_ficha on public.video_estado_historico;
create trigger video_estado_historico_para_ficha after insert on public.video_estado_historico
  for each row execute function public.historico_departamento_para_ficha();
