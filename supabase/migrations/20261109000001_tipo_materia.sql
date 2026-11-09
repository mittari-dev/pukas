-- Sozinho na migração: o Postgres não deixa usar um valor novo de enum na mesma transação em que ele nasce.
alter type tipo_peca add value 'materia';
