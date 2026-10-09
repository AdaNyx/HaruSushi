export const schemaSql = String.raw`
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patron','copatron','manager','employe')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('brut','intermediaire','fini','boisson')),
  buy_price NUMERIC(12,2),
  sell_price NUMERIC(12,2),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  alert_threshold INTEGER NOT NULL DEFAULT 0,
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  station TEXT NOT NULL CHECK (station IN ('riz','poisson','montage')),
  output_item TEXT NOT NULL REFERENCES items(id),
  output_qty INTEGER NOT NULL CHECK (output_qty > 0),
  sort INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS recipe_inputs (
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id),
  qty INTEGER NOT NULL CHECK (qty > 0),
  PRIMARY KEY (recipe_id, item_id)
);

CREATE TABLE IF NOT EXISTS operations (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id INTEGER REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('preparation','achat','vente','ajustement','depense','recette')),
  label TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  note TEXT
);
CREATE INDEX IF NOT EXISTS operations_created_idx ON operations (created_at DESC);

CREATE TABLE IF NOT EXISTS movements (
  id BIGSERIAL PRIMARY KEY,
  operation_id BIGINT NOT NULL REFERENCES operations(id) ON DELETE CASCADE,
  item_id TEXT NOT NULL REFERENCES items(id),
  delta INTEGER NOT NULL,
  unit_price NUMERIC(12,2)
);
CREATE INDEX IF NOT EXISTS movements_op_idx ON movements (operation_id);

CREATE OR REPLACE FUNCTION hs_craft(p_user INTEGER, p_recipe TEXT, p_times INTEGER)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  r recipes%ROWTYPE;
  i RECORD;
  op BIGINT;
BEGIN
  IF p_times IS NULL OR p_times < 1 OR p_times > 1000 THEN
    RAISE EXCEPTION 'HS:Nombre de préparations invalide';
  END IF;
  SELECT * INTO r FROM recipes WHERE id = p_recipe;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'HS:Recette inconnue';
  END IF;
  FOR i IN
    SELECT it.id, it.name, it.quantity, ri.qty * p_times AS need
    FROM recipe_inputs ri JOIN items it ON it.id = ri.item_id
    WHERE ri.recipe_id = p_recipe
    ORDER BY it.id
    FOR UPDATE OF it
  LOOP
    IF i.quantity < i.need THEN
      RAISE EXCEPTION 'HS:Stock insuffisant : % (il faut %, il y en a %)', i.name, i.need, i.quantity;
    END IF;
  END LOOP;
  INSERT INTO operations (user_id, kind, label)
  VALUES (p_user, 'preparation', r.name || ' ×' || p_times)
  RETURNING id INTO op;
  INSERT INTO movements (operation_id, item_id, delta)
  SELECT op, ri.item_id, -ri.qty * p_times FROM recipe_inputs ri WHERE ri.recipe_id = p_recipe;
  UPDATE items it SET quantity = it.quantity - ri.qty * p_times
  FROM recipe_inputs ri WHERE ri.recipe_id = p_recipe AND it.id = ri.item_id;
  INSERT INTO movements (operation_id, item_id, delta) VALUES (op, r.output_item, r.output_qty * p_times);
  UPDATE items SET quantity = quantity + r.output_qty * p_times WHERE id = r.output_item;
  RETURN op;
END $$;

CREATE OR REPLACE FUNCTION hs_purchase(p_user INTEGER, p_lines JSONB, p_note TEXT)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  l RECORD;
  op BIGINT;
  total NUMERIC(12,2) := 0;
  n INTEGER := 0;
BEGIN
  INSERT INTO operations (user_id, kind, label, note) VALUES (p_user, 'achat', 'Achat', p_note) RETURNING id INTO op;
  FOR l IN
    SELECT x.item, x.qty, x.price, it.name
    FROM jsonb_to_recordset(p_lines) AS x(item TEXT, qty INTEGER, price NUMERIC)
    LEFT JOIN items it ON it.id = x.item
    ORDER BY x.item
  LOOP
    IF l.name IS NULL THEN RAISE EXCEPTION 'HS:Produit inconnu'; END IF;
    IF l.qty IS NULL OR l.qty < 1 THEN RAISE EXCEPTION 'HS:Quantité invalide pour %', l.name; END IF;
    IF l.price IS NULL OR l.price < 0 THEN RAISE EXCEPTION 'HS:Prix invalide pour %', l.name; END IF;
    PERFORM 1 FROM items WHERE id = l.item FOR UPDATE;
    UPDATE items SET quantity = quantity + l.qty WHERE id = l.item;
    INSERT INTO movements (operation_id, item_id, delta, unit_price) VALUES (op, l.item, l.qty, l.price);
    total := total + l.qty * l.price;
    n := n + 1;
  END LOOP;
  IF n = 0 THEN RAISE EXCEPTION 'HS:Aucun produit dans l''achat'; END IF;
  UPDATE operations SET amount = -total, label = 'Achat (' || n || ' produit' || CASE WHEN n > 1 THEN 's' ELSE '' END || ')' WHERE id = op;
  RETURN op;
END $$;

CREATE OR REPLACE FUNCTION hs_sale(p_user INTEGER, p_lines JSONB, p_note TEXT)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  l RECORD;
  op BIGINT;
  total NUMERIC(12,2) := 0;
  n INTEGER := 0;
BEGIN
  INSERT INTO operations (user_id, kind, label, note) VALUES (p_user, 'vente', 'Vente', p_note) RETURNING id INTO op;
  FOR l IN
    SELECT x.item, x.qty, x.price, it.name
    FROM jsonb_to_recordset(p_lines) AS x(item TEXT, qty INTEGER, price NUMERIC)
    LEFT JOIN items it ON it.id = x.item
    ORDER BY x.item
  LOOP
    IF l.name IS NULL THEN RAISE EXCEPTION 'HS:Produit inconnu'; END IF;
    IF l.qty IS NULL OR l.qty < 1 THEN RAISE EXCEPTION 'HS:Quantité invalide pour %', l.name; END IF;
    IF l.price IS NULL OR l.price < 0 THEN RAISE EXCEPTION 'HS:Prix invalide pour %', l.name; END IF;
    PERFORM 1 FROM items WHERE id = l.item FOR UPDATE;
    IF (SELECT quantity FROM items WHERE id = l.item) < l.qty THEN
      RAISE EXCEPTION 'HS:Stock insuffisant : % (il en reste %)', l.name, (SELECT quantity FROM items WHERE id = l.item);
    END IF;
    UPDATE items SET quantity = quantity - l.qty WHERE id = l.item;
    INSERT INTO movements (operation_id, item_id, delta, unit_price) VALUES (op, l.item, -l.qty, l.price);
    total := total + l.qty * l.price;
    n := n + 1;
  END LOOP;
  IF n = 0 THEN RAISE EXCEPTION 'HS:Aucun produit dans la vente'; END IF;
  UPDATE operations SET amount = total, label = 'Vente (' || n || ' produit' || CASE WHEN n > 1 THEN 's' ELSE '' END || ')' WHERE id = op;
  RETURN op;
END $$;

CREATE OR REPLACE FUNCTION hs_adjust(p_user INTEGER, p_item TEXT, p_new_qty INTEGER, p_note TEXT)
RETURNS BIGINT LANGUAGE plpgsql AS $$
DECLARE
  cur INTEGER;
  nm TEXT;
  op BIGINT;
BEGIN
  IF p_new_qty IS NULL OR p_new_qty < 0 THEN RAISE EXCEPTION 'HS:Quantité invalide'; END IF;
  SELECT quantity, name INTO cur, nm FROM items WHERE id = p_item FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'HS:Produit inconnu'; END IF;
  IF cur = p_new_qty THEN RAISE EXCEPTION 'HS:La quantité est déjà de %', cur; END IF;
  INSERT INTO operations (user_id, kind, label, note)
  VALUES (p_user, 'ajustement', 'Ajustement ' || nm || ' : ' || cur || ' → ' || p_new_qty, p_note)
  RETURNING id INTO op;
  INSERT INTO movements (operation_id, item_id, delta) VALUES (op, p_item, p_new_qty - cur);
  UPDATE items SET quantity = p_new_qty WHERE id = p_item;
  RETURN op;
END $$;
`
