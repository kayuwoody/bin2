-- Vercel Postgres Schema for Product Combos/Recipes
-- This is a read-only copy of the data from the POS SQLite database

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  wc_id INTEGER UNIQUE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'uncategorized',
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  manage_stock BOOLEAN NOT NULL DEFAULT false,
  combo_price_override DECIMAL(10,2),
  image_url TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  purchase_unit TEXT NOT NULL,
  purchase_quantity DECIMAL(10,2) NOT NULL,
  purchase_cost DECIMAL(10,2) NOT NULL,
  cost_per_unit DECIMAL(10,2) NOT NULL,
  stock_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  low_stock_threshold DECIMAL(10,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  last_purchase_date TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Product Recipe (ingredients/components for each product)
CREATE TABLE IF NOT EXISTS product_recipes (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'material',
  material_id TEXT,
  linked_product_id TEXT,
  quantity DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL,
  calculated_cost DECIMAL(10,2) NOT NULL,
  is_optional BOOLEAN NOT NULL DEFAULT false,
  selection_group TEXT,
  price_adjustment DECIMAL(10,2) NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (material_id) REFERENCES materials(id),
  FOREIGN KEY (linked_product_id) REFERENCES products(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_wc_id ON products(wc_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_materials_category ON materials(category);
CREATE INDEX IF NOT EXISTS idx_recipe_product ON product_recipes(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_material ON product_recipes(material_id);
CREATE INDEX IF NOT EXISTS idx_recipe_linked_product ON product_recipes(linked_product_id);

-- Metadata table to track sync status
CREATE TABLE IF NOT EXISTS sync_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
