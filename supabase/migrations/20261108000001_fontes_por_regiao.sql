-- Fontes fixas agrupadas só pela origem: Brasil, América Latina ou Mundo. Os documentos primários semeados são todos do Brasil.
update busca_fontes set grupo = 'brasil' where grupo = 'documento';
alter table busca_fontes drop constraint if exists busca_fontes_grupo_check;
alter table busca_fontes add constraint busca_fontes_grupo_check check (grupo in ('brasil', 'america-latina', 'mundo'));
