-- Database triggers for product notifications (restock and price drop)
-- This migration creates notifications when products are restocked or prices drop

-- Function to notify users when a product is restocked (inventory goes from 0 to >0)
CREATE OR REPLACE FUNCTION notify_on_product_restock()
RETURNS TRIGGER AS $$
DECLARE
  wishlist_user RECORD;
BEGIN
  -- Only trigger if inventory changed from 0 or less to greater than 0
  IF (OLD.inventory IS NULL OR OLD.inventory <= 0) AND NEW.inventory > 0 THEN
    -- Notify all users who have this product in their wishlist
    FOR wishlist_user IN
      SELECT DISTINCT w.user_id
      FROM wishlist w
      WHERE w.item_id = NEW.id
        AND w.item_type = 'product'
    LOOP
      PERFORM send_notification_to_user(
        wishlist_user.user_id,
        'product_restock',
        NEW.name || ' is back in stock!',
        NEW.name || ' is now available. ' || NEW.inventory || ' items in stock.',
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.name,
          'inventory', NEW.inventory,
          'price', NEW.price,
          'image', CASE WHEN NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 THEN NEW.images[1] ELSE NULL END
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product restock
DROP TRIGGER IF EXISTS trigger_notify_on_product_restock ON products;
CREATE TRIGGER trigger_notify_on_product_restock
  AFTER UPDATE OF inventory ON products
  FOR EACH ROW
  WHEN ((OLD.inventory IS NULL OR OLD.inventory <= 0) AND NEW.inventory > 0)
  EXECUTE FUNCTION notify_on_product_restock();

-- Function to notify users when a product price drops
CREATE OR REPLACE FUNCTION notify_on_product_price_drop()
RETURNS TRIGGER AS $$
DECLARE
  wishlist_user RECORD;
  price_drop_percentage NUMERIC;
  price_drop_amount NUMERIC;
BEGIN
  -- Only trigger if price decreased and old price was greater than 0
  IF OLD.price > 0 AND NEW.price < OLD.price THEN
    -- Calculate price drop
    price_drop_amount := OLD.price - NEW.price;
    price_drop_percentage := ROUND((price_drop_amount / OLD.price) * 100, 2);
    
    -- Only notify if price drop is significant (more than 5% or more than ₹100)
    IF price_drop_percentage >= 5 OR price_drop_amount >= 100 THEN
      -- Notify all users who have this product in their wishlist
      FOR wishlist_user IN
        SELECT DISTINCT w.user_id
        FROM wishlist w
        WHERE w.item_id = NEW.id
          AND w.item_type = 'product'
      LOOP
        PERFORM send_notification_to_user(
          wishlist_user.user_id,
          'price_drop',
          NEW.name || ' price dropped!',
          NEW.name || ' price dropped by ' || price_drop_percentage || '% (₹' || price_drop_amount || '). New price: ₹' || NEW.price,
          jsonb_build_object(
            'product_id', NEW.id,
            'product_name', NEW.name,
            'old_price', OLD.price,
            'new_price', NEW.price,
            'price_drop_amount', price_drop_amount,
            'price_drop_percentage', price_drop_percentage,
            'image', CASE WHEN NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 THEN NEW.images[1] ELSE NULL END
          )
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for product price drop
DROP TRIGGER IF EXISTS trigger_notify_on_product_price_drop ON products;
CREATE TRIGGER trigger_notify_on_product_price_drop
  AFTER UPDATE OF price ON products
  FOR EACH ROW
  WHEN (OLD.price > 0 AND NEW.price < OLD.price)
  EXECUTE FUNCTION notify_on_product_price_drop();

-- Function to notify users when a new product is created (for users following the vendor)
CREATE OR REPLACE FUNCTION notify_on_new_product()
RETURNS TRIGGER AS $$
DECLARE
  follower_record RECORD;
BEGIN
  -- Only notify if product is published/on sale
  IF NEW.status = 'on sale' AND NEW.seller_id IS NOT NULL THEN
    -- Notify users who follow the vendor
    FOR follower_record IN
      SELECT follower_id
      FROM user_follows
      WHERE following_id = NEW.seller_id
    LOOP
      PERFORM send_notification_to_user(
        follower_record.follower_id,
        'new_product',
        'New product: ' || NEW.name,
        NEW.seller_id || ' added a new product: ' || NEW.name,
        jsonb_build_object(
          'product_id', NEW.id,
          'product_name', NEW.name,
          'price', NEW.price,
          'category', NEW.category,
          'vendor_id', NEW.seller_id,
          'image', CASE WHEN NEW.images IS NOT NULL AND array_length(NEW.images, 1) > 0 THEN NEW.images[1] ELSE NULL END
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new product creation
DROP TRIGGER IF EXISTS trigger_notify_on_new_product ON products;
CREATE TRIGGER trigger_notify_on_new_product
  AFTER INSERT ON products
  FOR EACH ROW
  WHEN (NEW.status = 'on sale' AND NEW.seller_id IS NOT NULL)
  EXECUTE FUNCTION notify_on_new_product();




