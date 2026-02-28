-- Add is_disabled field to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false;

-- Add is_disabled field to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false;

-- Add is_disabled field to sim_products table
ALTER TABLE sim_products 
ADD COLUMN IF NOT EXISTS is_disabled BOOLEAN DEFAULT false;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_products_is_disabled ON products(is_disabled);
CREATE INDEX IF NOT EXISTS idx_services_is_disabled ON services(is_disabled);
CREATE INDEX IF NOT EXISTS idx_sim_products_is_disabled ON sim_products(is_disabled);

-- Add comments for documentation
COMMENT ON COLUMN products.is_disabled IS 'Indicates if the product is disabled (soft delete for products with order history)';
COMMENT ON COLUMN services.is_disabled IS 'Indicates if the service is disabled (soft delete for services with booking history)';
COMMENT ON COLUMN sim_products.is_disabled IS 'Indicates if the sim product is disabled (soft delete for products with order history)';
