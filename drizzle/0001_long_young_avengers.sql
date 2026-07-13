-- Adiciona a categoria nova "pronta-entrega". Fica em migration separada
-- da renomeação de "consultorio" porque o Postgres não permite usar um
-- valor de enum recém-adicionado na mesma transação em que foi criado.
ALTER TYPE "categoria" ADD VALUE 'pronta-entrega';
