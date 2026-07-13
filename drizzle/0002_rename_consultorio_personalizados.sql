-- Renomeia "consultorio" para "personalizados" — isso atualiza
-- automaticamente todos os produtos que já estavam cadastrados com essa
-- categoria (sem precisar de UPDATE manual na tabela produtos).
ALTER TYPE "categoria" RENAME VALUE 'consultorio' TO 'personalizados';
