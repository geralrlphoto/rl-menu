-- O estado Cancelado também desliga o portal da reunião
create or replace function public.crm_desliga_portal_trg()
returns trigger
language plpgsql
as $function$
begin
  if new.status in ('NÃO FECHOU', 'Sem resposta', 'Encerrado', 'Cancelado')
     and new.status is distinct from old.status
     and coalesce(new.page_token, '') not in ('85343645-b0d3-4412-ae78-795fd7f8ddf1', 'batizado-maquete') then
    new.page_publicada := false;
  end if;
  return new;
end $function$;
