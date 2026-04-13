-- ============================================================
-- E-Commerce Platform Database Schema
-- Group: LiFNaY
-- ============================================================
SET GLOBAL event_scheduler = ON;
DROP DATABASE IF EXISTS ecommerce_db;
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ecommerce_db;

-- ============================================================
-- 1. TABLES (in dependency order)
-- ============================================================

-- Users
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB;

-- User Addresses
CREATE TABLE user_addresses (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    label VARCHAR(50) NOT NULL DEFAULT 'Home',
    recipient_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    is_default TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_addr_user (user_id)
) ENGINE=InnoDB;

-- Categories (self-referencing hierarchy)
CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    parent_id CHAR(36) DEFAULT NULL,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_cat_parent (parent_id),
    INDEX idx_cat_slug (slug)
) ENGINE=InnoDB;

-- Products
CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL CHECK (base_price >= 0),
    category_id CHAR(36) NOT NULL,
    brand VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_prod_category (category_id),
    INDEX idx_prod_active (is_active),
    INDEX idx_prod_name (name),
    FULLTEXT INDEX idx_prod_search (name, description)
) ENGINE=InnoDB;

-- Product Images
CREATE TABLE product_images (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    url VARCHAR(500) NOT NULL,
    cdn_url VARCHAR(500) DEFAULT NULL,
    alt_text VARCHAR(255) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_primary TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_img_product (product_id)
) ENGINE=InnoDB;

-- Product Variants
CREATE TABLE product_variants (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    variant_name VARCHAR(50) NOT NULL,
    variant_value VARCHAR(50) NOT NULL,
    price_override DECIMAL(10,2) DEFAULT NULL CHECK (price_override IS NULL OR price_override >= 0),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_var_product (product_id)
) ENGINE=InnoDB;

-- Reviews
CREATE TABLE reviews (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(200) DEFAULT NULL,
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_rev_product (product_id),
    INDEX idx_rev_user (user_id)
) ENGINE=InnoDB;

-- Warehouses
CREATE TABLE warehouses (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States'
) ENGINE=InnoDB;

-- Inventory
CREATE TABLE inventory (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    variant_id CHAR(36) DEFAULT NULL,
    warehouse_id CHAR(36) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_quantity INT NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_inv_product (product_id),
    INDEX idx_inv_variant (variant_id),
    INDEX idx_inv_warehouse (warehouse_id),
    UNIQUE KEY uq_inv_product_variant_wh (product_id, variant_id, warehouse_id)
) ENGINE=InnoDB;

-- Carts (one per user)
CREATE TABLE carts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- Cart Items
CREATE TABLE cart_items (
    id CHAR(36) PRIMARY KEY,
    cart_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    variant_id CHAR(36) DEFAULT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL ON UPDATE CASCADE,
    INDEX idx_ci_cart (cart_id),
    UNIQUE KEY uq_cart_product_variant (cart_id, product_id, variant_id)
) ENGINE=InnoDB;

-- Orders
CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    shipping_address_id CHAR(36) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    status ENUM('pending','paid','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_ord_user (user_id),
    INDEX idx_ord_status (status)
) ENGINE=InnoDB;

-- Order Items
CREATE TABLE order_items (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    variant_id CHAR(36) DEFAULT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_at_time DECIMAL(10,2) NOT NULL CHECK (price_at_time >= 0),
    product_name_snapshot VARCHAR(255) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_oi_order (order_id)
) ENGINE=InnoDB;

-- Payments
CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL UNIQUE,
    amount DECIMAL(12,2) NOT NULL CHECK (amount >= 0),
    method ENUM('credit_card','debit_card','paypal','bank_transfer') NOT NULL DEFAULT 'credit_card',
    status ENUM('pending','completed','failed','refunded') NOT NULL DEFAULT 'pending',
    transaction_ref VARCHAR(100) DEFAULT NULL,
    idempotency_key VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- 2. TRIGGERS
-- ============================================================

-- Auto-create a cart when a new user is inserted
DELIMITER //
CREATE TRIGGER trg_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO carts (id, user_id, created_at)
    VALUES (UUID(), NEW.id, NOW());
END //
DELIMITER ;

-- Prevent deleting a user who has non-cancelled orders
DELIMITER //
CREATE TRIGGER trg_before_user_delete
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    DECLARE active_orders INT;
    SELECT COUNT(*) INTO active_orders
    FROM orders
    WHERE user_id = OLD.id AND status NOT IN ('cancelled', 'delivered');
    IF active_orders > 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot delete user with active orders';
    END IF;
END //
DELIMITER ;

-- Update inventory last_updated on stock change
DELIMITER //
CREATE TRIGGER trg_inventory_update_timestamp
BEFORE UPDATE ON inventory
FOR EACH ROW
BEGIN
    SET NEW.last_updated = NOW();
END //
DELIMITER ;


-- ============================================================
-- 3. USER-DEFINED FUNCTIONS
-- ============================================================

-- Get total available stock for a product across all warehouses
DELIMITER //
CREATE FUNCTION fn_available_stock(p_product_id CHAR(36), p_variant_id CHAR(36))
RETURNS INT
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE total_stock INT DEFAULT 0;
    IF p_variant_id IS NULL THEN
        SELECT COALESCE(SUM(stock_quantity - reserved_quantity), 0)
        INTO total_stock
        FROM inventory
        WHERE product_id = p_product_id AND variant_id IS NULL;
    ELSE
        SELECT COALESCE(SUM(stock_quantity - reserved_quantity), 0)
        INTO total_stock
        FROM inventory
        WHERE product_id = p_product_id AND variant_id = p_variant_id;
    END IF;
    RETURN total_stock;
END //
DELIMITER ;

-- Calculate the effective price for a product/variant
DELIMITER //
CREATE FUNCTION fn_effective_price(p_product_id CHAR(36), p_variant_id CHAR(36))
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE eff_price DECIMAL(10,2);
    DECLARE var_price DECIMAL(10,2);

    SELECT base_price INTO eff_price FROM products WHERE id = p_product_id;

    IF p_variant_id IS NOT NULL THEN
        SELECT price_override INTO var_price
        FROM product_variants WHERE id = p_variant_id;
        IF var_price IS NOT NULL THEN
            SET eff_price = var_price;
        END IF;
    END IF;

    RETURN eff_price;
END //
DELIMITER ;

-- Calculate average rating for a product
DELIMITER //
CREATE FUNCTION fn_avg_rating(p_product_id CHAR(36))
RETURNS DECIMAL(3,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE avg_r DECIMAL(3,2);
    SELECT COALESCE(AVG(rating), 0) INTO avg_r
    FROM reviews WHERE product_id = p_product_id;
    RETURN avg_r;
END //
DELIMITER ;


-- ============================================================
-- 4. STORED PROCEDURES
-- ============================================================

-- Checkout procedure: atomic order creation
DELIMITER //
CREATE PROCEDURE sp_checkout(
    IN p_user_id CHAR(36),
    IN p_address_id CHAR(36),
    IN p_payment_method VARCHAR(20),
    OUT p_order_id CHAR(36),
    OUT p_result_msg VARCHAR(255)
)
proc: BEGIN
    DECLARE v_cart_id CHAR(36);
    DECLARE v_total DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_count INT DEFAULT 0;
    DECLARE v_order_id CHAR(36);
    DECLARE v_payment_id CHAR(36);
    DECLARE v_idemp_key VARCHAR(100);

    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_order_id = NULL;
        SET p_result_msg = 'Checkout failed due to a database error';
    END;

    START TRANSACTION;

    -- 1. Get user's cart
    SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id;
    IF v_cart_id IS NULL THEN
        ROLLBACK;
        SET p_order_id = NULL;
        SET p_result_msg = 'No cart found for user';
        LEAVE proc;
    END IF;

    -- 2. Check cart is not empty
    SELECT COUNT(*) INTO v_item_count FROM cart_items WHERE cart_id = v_cart_id;
    IF v_item_count = 0 THEN
        ROLLBACK;
        SET p_order_id = NULL;
        SET p_result_msg = 'Cart is empty';
    ELSE
        -- 3. Verify stock for all items and calculate total
        -- If any item has insufficient stock, abort
        IF EXISTS (
            SELECT 1 FROM cart_items ci
            WHERE ci.cart_id = v_cart_id
              AND ci.quantity > fn_available_stock(ci.product_id, ci.variant_id)
        ) THEN
            ROLLBACK;
            SET p_order_id = NULL;
            SET p_result_msg = 'Insufficient stock for one or more items';
        ELSE
            -- Calculate total
            SELECT SUM(ci.quantity * fn_effective_price(ci.product_id, ci.variant_id))
            INTO v_total
            FROM cart_items ci
            WHERE ci.cart_id = v_cart_id;

            -- 4. Create order
            SET v_order_id = UUID();
            INSERT INTO orders (id, user_id, shipping_address_id, total_amount, status)
            VALUES (v_order_id, p_user_id, p_address_id, v_total, 'pending');

            -- 5. Copy cart items to order items
            INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price_at_time, product_name_snapshot)
            SELECT UUID(), v_order_id, ci.product_id, ci.variant_id, ci.quantity,
                   fn_effective_price(ci.product_id, ci.variant_id),
                   p.name
            FROM cart_items ci
            JOIN products p ON p.id = ci.product_id
            WHERE ci.cart_id = v_cart_id;

            -- 6. Decrement inventory (from the first warehouse that has stock)
            UPDATE inventory inv
            INNER JOIN cart_items ci ON ci.cart_id = v_cart_id
                AND inv.product_id = ci.product_id
                AND (inv.variant_id <=> ci.variant_id)
            SET inv.stock_quantity = inv.stock_quantity - ci.quantity
            WHERE inv.stock_quantity >= ci.quantity;

            -- 7. Create payment record
            SET v_payment_id = UUID();
            SET v_idemp_key = CONCAT('pay-', v_order_id, '-', UNIX_TIMESTAMP());
            INSERT INTO payments (id, order_id, amount, method, status, idempotency_key)
            VALUES (v_payment_id, v_order_id, v_total, p_payment_method, 'completed', v_idemp_key);

            -- 8. Update order status to paid
            UPDATE orders SET status = 'paid' WHERE id = v_order_id;

            -- 9. Clear the cart
            DELETE FROM cart_items WHERE cart_id = v_cart_id;

            COMMIT;
            SET p_order_id = v_order_id;
            SET p_result_msg = 'Order placed successfully';
        END IF;
    END IF;
END //
DELIMITER ;

-- Procedure to add item to cart (insert or update quantity)
DELIMITER //
CREATE PROCEDURE sp_add_to_cart(
    IN p_user_id CHAR(36),
    IN p_product_id CHAR(36),
    IN p_variant_id CHAR(36),
    IN p_quantity INT,
    OUT p_result_msg VARCHAR(255)
)
BEGIN
    DECLARE v_cart_id CHAR(36);
    DECLARE v_existing_id CHAR(36);
    DECLARE v_stock INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_msg = 'Failed to add item to cart';
    END;

    -- Get cart
    SELECT id INTO v_cart_id FROM carts WHERE user_id = p_user_id;
    IF v_cart_id IS NULL THEN
        SET p_result_msg = 'No cart found';
    ELSE
        -- Check stock
        SET v_stock = fn_available_stock(p_product_id, p_variant_id);
        IF v_stock < p_quantity THEN
            SET p_result_msg = CONCAT('Only ', v_stock, ' units available');
        ELSE
            -- Check if item already in cart
            SELECT id INTO v_existing_id
            FROM cart_items
            WHERE cart_id = v_cart_id
              AND product_id = p_product_id
              AND (variant_id <=> p_variant_id)
            LIMIT 1;

            IF v_existing_id IS NOT NULL THEN
                UPDATE cart_items
                SET quantity = quantity + p_quantity
                WHERE id = v_existing_id;
                SET p_result_msg = 'Cart updated';
            ELSE
                INSERT INTO cart_items (id, cart_id, product_id, variant_id, quantity)
                VALUES (UUID(), v_cart_id, p_product_id, p_variant_id, p_quantity);
                SET p_result_msg = 'Item added to cart';
            END IF;
        END IF;
    END IF;
END //
DELIMITER ;


-- ============================================================
-- 5. EVENTS
-- ============================================================

-- Cancel orders that remain 'pending' for more than 30 minutes
DELIMITER //
CREATE EVENT IF NOT EXISTS evt_cancel_stale_orders
ON SCHEDULE EVERY 5 MINUTE
STARTS CURRENT_TIMESTAMP
DO
BEGIN
    UPDATE orders
    SET status = 'cancelled'
    WHERE status = 'pending'
      AND created_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE);
END //
DELIMITER ;


-- ============================================================
-- 6. SEED DATA
-- ============================================================

-- Users (password is 'password123' hashed with bcrypt)
INSERT INTO users (id, email, password_hash, name, role) VALUES
('u001', 'alice@example.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Alice Johnson', 'customer'),
('u002', 'bob@example.com',     '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Bob Smith',     'customer'),
('u003', 'carol@example.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Carol Lee',     'customer'),
('u004', 'admin@example.com',   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Admin User',    'admin'),
('u005', 'dave@example.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'Dave Kim',      'customer');

-- Addresses
INSERT INTO user_addresses (id, user_id, label, recipient_name, phone, street, city, state, zip_code, country, is_default) VALUES
('a001', 'u001', 'Home',   'Alice Johnson', '555-0101', '123 Maple St',   'Boston',      'MA', '02101', 'United States', 1),
('a002', 'u001', 'Work',   'Alice Johnson', '555-0102', '456 Oak Ave',    'Cambridge',   'MA', '02139', 'United States', 0),
('a003', 'u002', 'Home',   'Bob Smith',     '555-0201', '789 Pine Rd',    'New York',    'NY', '10001', 'United States', 1),
('a004', 'u003', 'Home',   'Carol Lee',     '555-0301', '321 Elm Blvd',   'San Francisco','CA','94102', 'United States', 1),
('a005', 'u005', 'Home',   'Dave Kim',      '555-0501', '654 Birch Ln',   'Chicago',     'IL', '60601', 'United States', 1);

-- Categories
INSERT INTO categories (id, name, slug, parent_id) VALUES
('c001', 'Electronics',  'electronics',  NULL),
('c002', 'Phones',       'phones',       'c001'),
('c003', 'Laptops',      'laptops',      'c001'),
('c004', 'Accessories',  'accessories',  'c001'),
('c005', 'Clothing',     'clothing',     NULL),
('c006', 'Men',          'men',          'c005'),
('c007', 'Women',        'women',        'c005'),
('c008', 'Books',        'books',        NULL),
('c009', 'Home & Garden','home-garden',  NULL);

-- Products
INSERT INTO products (id, name, description, base_price, category_id, brand, is_active) VALUES
('p001', 'Galaxy S24 Ultra',       'Latest Samsung flagship smartphone with S Pen and 200MP camera.',        1199.99, 'c002', 'Samsung',   1),
('p002', 'iPhone 16 Pro',          'Apple flagship with A18 Pro chip and titanium design.',                  1099.99, 'c002', 'Apple',     1),
('p003', 'MacBook Pro 16"',        'M3 Max chip, 36GB RAM, 1TB SSD. The ultimate pro laptop.',              2499.99, 'c003', 'Apple',     1),
('p004', 'ThinkPad X1 Carbon',     'Ultra-light business laptop with Intel Core Ultra processor.',           1449.99, 'c003', 'Lenovo',    1),
('p005', 'AirPods Pro 3',          'Active noise cancellation with adaptive audio and USB-C charging.',       249.99, 'c004', 'Apple',     1),
('p006', 'USB-C Hub 10-in-1',      'Multi-port adapter with HDMI, ethernet, SD card, and USB-A ports.',       49.99, 'c004', 'Anker',     1),
('p007', 'Classic Crew T-Shirt',   '100% organic cotton crew neck tee. Available in multiple colors.',        29.99, 'c006', 'Uniqlo',    1),
('p008', 'Slim Fit Jeans',         'Stretch denim slim fit jeans with modern cut.',                           59.99, 'c006', 'Levi''s',   1),
('p009', 'Floral Summer Dress',    'Lightweight floral print dress perfect for warm weather.',                74.99, 'c007', 'Zara',      1),
('p010', 'Dune by Frank Herbert',  'The classic sci-fi novel. A masterpiece of world-building.',              15.99, 'c008', NULL,        1),
('p011', 'Clean Code',             'A handbook of agile software craftsmanship by Robert C. Martin.',         39.99, 'c008', NULL,        1),
('p012', 'Ceramic Plant Pot Set',  'Set of 3 minimalist ceramic pots in matte white.',                       34.99, 'c009', 'Mkono',     1),
('p013', 'LED Desk Lamp',          'Adjustable LED lamp with 5 brightness levels and USB charging port.',     42.99, 'c009', 'TaoTronics',1),
('p014', 'Pixel 9 Pro',            'Google flagship with Tensor G4 chip and advanced AI features.',          999.99, 'c002', 'Google',    1),
('p015', 'Wireless Charging Pad',  'Qi-compatible 15W fast wireless charger. Slim profile.',                  24.99, 'c004', 'Anker',     1);

-- Product Images (using placeholder URLs)
INSERT INTO product_images (id, product_id, url, cdn_url, alt_text, sort_order, is_primary) VALUES
('img001', 'p001', 'https://placehold.co/600x400/1a1a2e/eaeaea?text=Galaxy+S24', NULL, 'Galaxy S24 Ultra front view', 1, 1),
('img002', 'p002', 'https://placehold.co/600x400/2d2d44/eaeaea?text=iPhone+16+Pro', NULL, 'iPhone 16 Pro front view', 1, 1),
('img003', 'p003', 'https://placehold.co/600x400/333355/eaeaea?text=MacBook+Pro', NULL, 'MacBook Pro 16 open view', 1, 1),
('img004', 'p004', 'https://placehold.co/600x400/3a3a5c/eaeaea?text=ThinkPad+X1', NULL, 'ThinkPad X1 Carbon front', 1, 1),
('img005', 'p005', 'https://placehold.co/600x400/444466/eaeaea?text=AirPods+Pro', NULL, 'AirPods Pro 3 with case', 1, 1),
('img006', 'p006', 'https://placehold.co/600x400/4a4a6a/eaeaea?text=USB-C+Hub', NULL, 'USB-C Hub overview', 1, 1),
('img007', 'p007', 'https://placehold.co/600x400/556677/eaeaea?text=Crew+T-Shirt', NULL, 'Classic Crew T-Shirt', 1, 1),
('img008', 'p008', 'https://placehold.co/600x400/667788/eaeaea?text=Slim+Jeans', NULL, 'Slim Fit Jeans', 1, 1),
('img009', 'p009', 'https://placehold.co/600x400/778899/eaeaea?text=Summer+Dress', NULL, 'Floral Summer Dress', 1, 1),
('img010', 'p010', 'https://placehold.co/600x400/886644/eaeaea?text=Dune', NULL, 'Dune book cover', 1, 1),
('img011', 'p011', 'https://placehold.co/600x400/446688/eaeaea?text=Clean+Code', NULL, 'Clean Code book cover', 1, 1),
('img012', 'p012', 'https://placehold.co/600x400/668844/eaeaea?text=Plant+Pots', NULL, 'Ceramic pot set', 1, 1),
('img013', 'p013', 'https://placehold.co/600x400/448866/eaeaea?text=Desk+Lamp', NULL, 'LED Desk Lamp', 1, 1),
('img014', 'p014', 'https://placehold.co/600x400/2a2a4e/eaeaea?text=Pixel+9+Pro', NULL, 'Pixel 9 Pro front view', 1, 1),
('img015', 'p015', 'https://placehold.co/600x400/4e4e6e/eaeaea?text=Wireless+Charger', NULL, 'Wireless Charging Pad', 1, 1);

-- Product Variants
INSERT INTO product_variants (id, product_id, variant_name, variant_value, price_override) VALUES
('v001', 'p001', 'Storage', '256GB', NULL),
('v002', 'p001', 'Storage', '512GB', 1319.99),
('v003', 'p001', 'Storage', '1TB',   1459.99),
('v004', 'p002', 'Storage', '256GB', NULL),
('v005', 'p002', 'Storage', '512GB', 1199.99),
('v006', 'p003', 'RAM',     '36GB',  NULL),
('v007', 'p003', 'RAM',     '64GB',  2899.99),
('v008', 'p007', 'Size',    'S',     NULL),
('v009', 'p007', 'Size',    'M',     NULL),
('v010', 'p007', 'Size',    'L',     NULL),
('v011', 'p007', 'Size',    'XL',    NULL),
('v012', 'p008', 'Size',    '30x30', NULL),
('v013', 'p008', 'Size',    '32x32', NULL),
('v014', 'p008', 'Size',    '34x32', NULL),
('v015', 'p009', 'Size',    'S',     NULL),
('v016', 'p009', 'Size',    'M',     NULL),
('v017', 'p009', 'Size',    'L',     NULL);

-- Warehouses
INSERT INTO warehouses (id, name, city, country) VALUES
('w001', 'East Coast Hub',   'Newark',       'United States'),
('w002', 'West Coast Hub',   'Los Angeles',  'United States'),
('w003', 'Central Warehouse','Dallas',       'United States');

-- Inventory
INSERT INTO inventory (id, product_id, variant_id, warehouse_id, stock_quantity, reserved_quantity) VALUES
-- Galaxy S24 variants
('inv001', 'p001', 'v001', 'w001', 50, 0),
('inv002', 'p001', 'v002', 'w001', 30, 0),
('inv003', 'p001', 'v003', 'w001', 15, 0),
-- iPhone 16 Pro variants
('inv004', 'p002', 'v004', 'w001', 40, 0),
('inv005', 'p002', 'v005', 'w002', 25, 0),
-- MacBook Pro variants
('inv006', 'p003', 'v006', 'w002', 20, 0),
('inv007', 'p003', 'v007', 'w002', 10, 0),
-- ThinkPad (no variants)
('inv008', 'p004', NULL,   'w001', 35, 0),
-- AirPods
('inv009', 'p005', NULL,   'w001', 100, 0),
('inv010', 'p005', NULL,   'w002', 80,  0),
-- USB-C Hub
('inv011', 'p006', NULL,   'w003', 200, 0),
-- T-Shirt variants
('inv012', 'p007', 'v008', 'w003', 60, 0),
('inv013', 'p007', 'v009', 'w003', 80, 0),
('inv014', 'p007', 'v010', 'w003', 70, 0),
('inv015', 'p007', 'v011', 'w003', 40, 0),
-- Jeans variants
('inv016', 'p008', 'v012', 'w003', 45, 0),
('inv017', 'p008', 'v013', 'w003', 55, 0),
('inv018', 'p008', 'v014', 'w003', 35, 0),
-- Dress variants
('inv019', 'p009', 'v015', 'w003', 30, 0),
('inv020', 'p009', 'v016', 'w003', 40, 0),
('inv021', 'p009', 'v017', 'w003', 25, 0),
-- Books
('inv022', 'p010', NULL,   'w001', 150, 0),
('inv023', 'p011', NULL,   'w001', 120, 0),
-- Home items
('inv024', 'p012', NULL,   'w002', 75,  0),
('inv025', 'p013', NULL,   'w002', 60,  0),
-- Pixel 9 Pro
('inv026', 'p014', NULL,   'w001', 30,  0),
-- Wireless charger
('inv027', 'p015', NULL,   'w003', 180, 0);

-- Reviews
INSERT INTO reviews (id, product_id, user_id, rating, title, body) VALUES
('r001', 'p001', 'u001', 5, 'Best phone ever',      'The camera is incredible and the S Pen is so useful for notes.'),
('r002', 'p001', 'u002', 4, 'Great but pricey',     'Amazing specs but I wish it was a bit cheaper.'),
('r003', 'p002', 'u003', 5, 'Love it',              'Smooth performance and the titanium feels premium.'),
('r004', 'p003', 'u001', 5, 'Powerhouse',           'Handles everything I throw at it. Best laptop I have owned.'),
('r005', 'p005', 'u002', 4, 'Good sound quality',   'Great ANC and the fit is comfortable for long listening sessions.'),
('r006', 'p010', 'u003', 5, 'A must-read classic',  'One of the greatest science fiction novels ever written.'),
('r007', 'p011', 'u001', 4, 'Essential for devs',   'Every programmer should read this at least once.'),
('r008', 'p013', 'u005', 5, 'Perfect desk lamp',    'Great brightness levels and the USB port is a nice bonus.');

-- Sample orders (to show order history)
INSERT INTO orders (id, user_id, shipping_address_id, total_amount, status, created_at) VALUES
('o001', 'u001', 'a001', 1199.99, 'delivered',  '2026-02-15 10:30:00'),
('o002', 'u001', 'a002',  289.98, 'shipped',    '2026-03-20 14:00:00'),
('o003', 'u002', 'a003', 2499.99, 'paid',       '2026-04-01 09:15:00');

INSERT INTO order_items (id, order_id, product_id, variant_id, quantity, price_at_time, product_name_snapshot) VALUES
('oi001', 'o001', 'p001', 'v001', 1, 1199.99, 'Galaxy S24 Ultra'),
('oi002', 'o002', 'p005', NULL,   1,  249.99, 'AirPods Pro 3'),
('oi003', 'o002', 'p011', NULL,   1,   39.99, 'Clean Code'),
('oi004', 'o003', 'p003', 'v006', 1, 2499.99, 'MacBook Pro 16"');

INSERT INTO payments (id, order_id, amount, method, status, transaction_ref, idempotency_key) VALUES
('pay001', 'o001', 1199.99, 'credit_card', 'completed', 'TXN-20260215-001', 'idem-o001'),
('pay002', 'o002',  289.98, 'paypal',      'completed', 'TXN-20260320-002', 'idem-o002'),
('pay003', 'o003', 2499.99, 'credit_card', 'completed', 'TXN-20260401-003', 'idem-o003');
