export const seedSql = String.raw`
INSERT INTO items (id, name, category, buy_price, sell_price, alert_threshold, sort) VALUES
  ('riz_sac', 'Riz japonais (sac)', 'brut', 20, NULL, 2, 10),
  ('vinaigre', 'Vinaigre de riz', 'brut', 15, NULL, 4, 20),
  ('nori', 'Feuilles de nori', 'brut', 5, NULL, 5, 30),
  ('avocat', 'Avocat', 'brut', 10, NULL, 3, 40),
  ('wasabi', 'Wasabi', 'brut', 8, NULL, 2, 50),
  ('soja', 'Sauce soja', 'brut', 8, NULL, 2, 60),
  ('saumon', 'Saumon', 'brut', NULL, NULL, 2, 70),
  ('thon', 'Thon', 'brut', NULL, NULL, 2, 80),
  ('riz_cuit', 'Riz cuit', 'intermediaire', NULL, NULL, 0, 110),
  ('riz_sushi', 'Riz à sushi', 'intermediaire', NULL, NULL, 4, 120),
  ('filet_saumon', 'Filet de saumon', 'intermediaire', NULL, NULL, 3, 130),
  ('filet_thon', 'Filet de thon', 'intermediaire', NULL, NULL, 3, 140),
  ('plateau', 'Plateau de sushis', 'fini', NULL, 220, 2, 210),
  ('california', 'California rolls', 'fini', NULL, 60, 3, 220),
  ('makis_saumon', 'Makis saumon', 'fini', NULL, 45, 3, 230),
  ('makis_thon', 'Makis thon', 'fini', NULL, 50, 3, 240),
  ('nigiris_saumon', 'Nigiris saumon', 'fini', NULL, 40, 3, 250),
  ('nigiris_thon', 'Nigiris thon', 'fini', NULL, 45, 3, 260),
  ('sashimis', 'Assiette de sashimis', 'fini', NULL, 85, 2, 270),
  ('eau', 'Eau', 'boisson', 2, NULL, 5, 310),
  ('cola', 'Cola', 'boisson', 2, NULL, 5, 320),
  ('sprunk', 'Sprunk', 'boisson', 2, NULL, 5, 330)
ON CONFLICT (id) DO NOTHING;

UPDATE items i SET sell_price = v.p FROM (VALUES ('plateau', 220), ('california', 60), ('makis_saumon', 45), ('makis_thon', 50), ('nigiris_saumon', 40), ('nigiris_thon', 45), ('sashimis', 85)) AS v(id, p) WHERE i.id = v.id AND i.sell_price IS NULL;

INSERT INTO recipes (id, name, station, output_item, output_qty, sort) VALUES
  ('cuire_riz', 'Laver et cuire le riz', 'riz', 'riz_cuit', 4, 10),
  ('assaisonner_riz', 'Assaisonner le riz', 'riz', 'riz_sushi', 2, 20),
  ('filets_saumon', 'Lever des filets de saumon', 'poisson', 'filet_saumon', 3, 30),
  ('filets_thon', 'Lever des filets de thon', 'poisson', 'filet_thon', 3, 40),
  ('sashimis', 'Assiette de sashimis', 'poisson', 'sashimis', 1, 50),
  ('california', 'California rolls', 'montage', 'california', 1, 60),
  ('makis_saumon', 'Makis saumon', 'montage', 'makis_saumon', 1, 70),
  ('makis_thon', 'Makis thon', 'montage', 'makis_thon', 1, 80),
  ('nigiris_saumon', 'Nigiris saumon', 'montage', 'nigiris_saumon', 1, 90),
  ('nigiris_thon', 'Nigiris thon', 'montage', 'nigiris_thon', 1, 100),
  ('plateau', 'Plateau de sushis', 'montage', 'plateau', 1, 110)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, station = EXCLUDED.station,
  output_item = EXCLUDED.output_item, output_qty = EXCLUDED.output_qty, sort = EXCLUDED.sort;

DELETE FROM recipe_inputs WHERE recipe_id IN ('cuire_riz','assaisonner_riz','filets_saumon','filets_thon','sashimis','california','makis_saumon','makis_thon','nigiris_saumon','nigiris_thon','plateau');

INSERT INTO recipe_inputs (recipe_id, item_id, qty) VALUES
  ('cuire_riz', 'riz_sac', 1),
  ('assaisonner_riz', 'vinaigre', 1),
  ('assaisonner_riz', 'riz_cuit', 2),
  ('filets_saumon', 'saumon', 1),
  ('filets_thon', 'thon', 1),
  ('sashimis', 'filet_saumon', 2),
  ('sashimis', 'filet_thon', 1),
  ('california', 'filet_saumon', 1),
  ('california', 'avocat', 1),
  ('california', 'riz_sushi', 1),
  ('california', 'nori', 1),
  ('makis_saumon', 'filet_saumon', 1),
  ('makis_saumon', 'riz_sushi', 1),
  ('makis_saumon', 'nori', 1),
  ('makis_thon', 'filet_thon', 1),
  ('makis_thon', 'riz_sushi', 1),
  ('makis_thon', 'nori', 1),
  ('nigiris_saumon', 'riz_sushi', 1),
  ('nigiris_saumon', 'filet_saumon', 1),
  ('nigiris_thon', 'riz_sushi', 1),
  ('nigiris_thon', 'filet_thon', 1),
  ('plateau', 'soja', 1),
  ('plateau', 'makis_saumon', 1),
  ('plateau', 'nigiris_thon', 1),
  ('plateau', 'wasabi', 1),
  ('plateau', 'nigiris_saumon', 1),
  ('plateau', 'california', 1);
`
