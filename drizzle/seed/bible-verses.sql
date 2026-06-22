-- Seed: 7 versículos bíblicos sobre mordomia/colheita/generosidade
-- Idempotente: DELETE garante re-execução sem duplicatas (Phase 3, D-07)
DELETE FROM bible_verses;

INSERT INTO bible_verses (id, reference, text) VALUES
  (gen_random_uuid(), 'Colossenses 3:23', 'Tudo o que fizerem, façam de todo o coração, como para o Senhor.'),
  (gen_random_uuid(), 'Provérbios 3:9', 'Honra ao Senhor com os teus bens e com as primícias de todos os teus frutos.'),
  (gen_random_uuid(), '2 Coríntios 9:7', 'Cada um dê conforme determinou em seu coração, pois Deus ama quem dá com alegria.'),
  (gen_random_uuid(), 'Lucas 6:38', 'Dai, e ser-vos-á dado.'),
  (gen_random_uuid(), 'Provérbios 11:24', 'Há quem dê generosamente e fique mais rico; há quem retenha o que é seu e fique mais pobre.'),
  (gen_random_uuid(), 'Gálatas 6:9', 'Não nos cansemos de fazer o bem, pois a seu tempo colheremos, se não desanimarmos.'),
  (gen_random_uuid(), 'Mateus 6:20', 'Acumulem para si tesouros no céu, onde a traça e a ferrugem não destroem.');
