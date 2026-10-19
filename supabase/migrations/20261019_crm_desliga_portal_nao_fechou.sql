-- Quando uma lead passa a NÃO FECHOU, Sem resposta ou Encerrado, o portal da
-- reunião (/r ou /b) deixa de estar publicado. O link fica guardado: volta a
-- funcionar se o portal for ligado outra vez no CRM.
create or replace function public.crm_desliga_portal_trg() returns trigger
language plpgsql as $$
begin
  if new.status in ('NÃO FECHOU', 'Sem resposta', 'Encerrado')
     and new.status is distinct from old.status
     and coalesce(new.page_token, '') not in ('85343645-b0d3-4412-ae78-795fd7f8ddf1', 'batizado-maquete') then
    new.page_publicada := false;
  end if;
  return new;
end $$;

drop trigger if exists crm_desliga_portal on public.crm_contacts;
create trigger crm_desliga_portal before update of status on public.crm_contacts
for each row execute function public.crm_desliga_portal_trg();
