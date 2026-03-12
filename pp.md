
### SQL DDL (also serves as the ERD source)

```sql
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_addresses (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    label VARCHAR(50) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    zip_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE categories (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_id CHAR(36) NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE products (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category_id CHAR(36) NOT NULL,
    brand VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE product_images (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    url VARCHAR(500) NOT NULL,
    cdn_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE product_variants (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_override DECIMAL(10,2) NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE reviews (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(255),
    body TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE warehouses (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL
);

CREATE TABLE inventory (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    variant_id CHAR(36) NULL,
    warehouse_id CHAR(36) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE RESTRICT
);

CREATE TABLE carts (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cart_items (
    id CHAR(36) PRIMARY KEY,
    cart_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    variant_id CHAR(36) NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE TABLE orders (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    shipping_address_id CHAR(36) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (shipping_address_id) REFERENCES user_addresses(id) ON DELETE RESTRICT
);

CREATE TABLE order_items (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL,
    product_id CHAR(36) NOT NULL,
    variant_id CHAR(36) NULL,
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10,2) NOT NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

CREATE TABLE payments (
    id CHAR(36) PRIMARY KEY,
    order_id CHAR(36) NOT NULL UNIQUE,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(50) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
    transaction_ref VARCHAR(255),
    idempotency_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT
);
```



### Mermaid ERD (for visual rendering)

The following Mermaid diagram can be rendered at [mermaid.live](https://mermaid.live) or pasted into any Mermaid-compatible tool:

```mermaid
erDiagram
    users {
        UUID id PK
        VARCHAR email UK
        VARCHAR password_hash
        VARCHAR name
        ENUM role
        TIMESTAMP created_at
    }

    user_addresses {
        UUID id PK
        UUID user_id FK
        VARCHAR label
        VARCHAR street
        VARCHAR city
        VARCHAR state
        VARCHAR zip_code
        VARCHAR country
        BOOLEAN is_default
    }

    categories {
        UUID id PK
        VARCHAR name
        UUID parent_id FK "nullable self-ref"
        VARCHAR slug UK
    }

    products {
        UUID id PK
        VARCHAR name
        TEXT description
        DECIMAL price
        UUID category_id FK
        VARCHAR brand
        BOOLEAN is_active
        TIMESTAMP created_at
    }

    product_images {
        UUID id PK
        UUID product_id FK
        VARCHAR url "S3 origin"
        VARCHAR cdn_url "CDN delivery"
        VARCHAR alt_text
        INTEGER sort_order
        BOOLEAN is_primary
    }

    product_variants {
        UUID id PK
        UUID product_id FK
        VARCHAR variant_name
        VARCHAR variant_value
        DECIMAL price_override "nullable"
    }

    reviews {
        UUID id PK
        UUID product_id FK
        UUID user_id FK
        TINYINT rating "1-5"
        VARCHAR title
        TEXT body
        TIMESTAMP created_at
    }

    warehouses {
        UUID id PK
        VARCHAR name
        VARCHAR city
        VARCHAR country
    }

    inventory {
        UUID id PK
        UUID product_id FK
        UUID variant_id FK "nullable"
        UUID warehouse_id FK
        INTEGER stock_quantity
        INTEGER reserved_quantity
        TIMESTAMP last_updated
    }

    carts {
        UUID id PK
        UUID user_id FK, UK
        TIMESTAMP created_at
    }

    cart_items {
        UUID id PK
        UUID cart_id FK
        UUID product_id FK
        UUID variant_id FK "nullable"
        INTEGER quantity
    }

    orders {
        UUID id PK
        UUID user_id FK
        UUID shipping_address_id FK
        DECIMAL total_amount
        ENUM status
        TIMESTAMP created_at
    }

    order_items {
        UUID id PK
        UUID order_id FK
        UUID product_id FK
        UUID variant_id "nullable"
        INTEGER quantity
        DECIMAL price_at_time
        VARCHAR product_name_snapshot
    }

    payments {
        UUID id PK
        UUID order_id FK, UK
        DECIMAL amount
        VARCHAR method
        ENUM status
        VARCHAR transaction_ref
        VARCHAR idempotency_key UK
        TIMESTAMP created_at
    }

    users ||--o{ user_addresses : "has many"
    users ||--|| carts : "has one"
    users ||--o{ orders : "places"
    users ||--o{ reviews : "writes"
    categories ||--o{ categories : "parent of"
    categories ||--o{ products : "contains"
    products ||--o{ product_images : "has many"
    products ||--o{ product_variants : "has many"
    products ||--o{ reviews : "receives"
    products ||--o{ inventory : "tracked in"
    products ||--o{ cart_items : "added to"
    products ||--o{ order_items : "ordered as"
    product_variants ||--o{ inventory : "stocked as"
    warehouses ||--o{ inventory : "stores"
    carts ||--o{ cart_items : "contains"
    orders ||--o{ order_items : "contains"
    orders ||--|| payments : "paid via"
    user_addresses ||--o{ orders : "ships to"
```



```mermaid
stateDiagram-v2
    [*] --> Register_or_Login

    Register_or_Login --> Browse_Products : Authenticated
    Register_or_Login --> Register_or_Login : Auth Failed

    Browse_Products --> Search_Products : Search by keyword
    Browse_Products --> View_Product : Select a product
    Search_Products --> View_Product : Select from results
    Search_Products --> Browse_Products : Back

    View_Product --> View_Images_and_Variants : See photos and options
    View_Product --> Read_Reviews : Read user reviews
    View_Product --> Add_to_Cart : Select variant and quantity
    View_Product --> Write_Review : Submit a review
    View_Product --> Browse_Products : Continue shopping

    Write_Review --> View_Product : Review submitted

    Add_to_Cart --> Browse_Products : Continue shopping
    Add_to_Cart --> View_Cart : Go to cart

    View_Cart --> Update_Cart : Change quantity or remove item
    Update_Cart --> View_Cart : Cart updated
    View_Cart --> Browse_Products : Continue shopping
    View_Cart --> Select_Shipping_Address : Proceed to checkout

    Select_Shipping_Address --> Add_New_Address : No suitable address
    Add_New_Address --> Select_Shipping_Address : Address saved
    Select_Shipping_Address --> Checkout : Address confirmed

    state Checkout {
        [*] --> Verify_Stock
        Verify_Stock --> Create_Order : Stock available
        Verify_Stock --> Stock_Error : Insufficient stock
        Stock_Error --> [*]
        Create_Order --> Create_Order_Items
        Create_Order_Items --> Decrement_Inventory
        Decrement_Inventory --> Clear_Cart
        Clear_Cart --> [*]
    }

    Checkout --> Make_Payment : Order created
    Checkout --> View_Cart : Stock issue

    state Make_Payment {
        [*] --> Enter_Payment_Details
        Enter_Payment_Details --> Process_Payment
        Process_Payment --> Payment_Success : Completed
        Process_Payment --> Payment_Failed : Error
        Payment_Failed --> Enter_Payment_Details : Retry
        Payment_Success --> [*]
    }

    Make_Payment --> View_Order_Status : Payment confirmed

    View_Order_Status --> Browse_Products : Continue shopping
    View_Order_Status --> [*] : Done

    state Admin_Operations {
        [*] --> Admin_Dashboard
        Admin_Dashboard --> Manage_Categories : CRUD categories
        Admin_Dashboard --> Manage_Products : CRUD products
        Admin_Dashboard --> Manage_Inventory : Update stock levels
        Admin_Dashboard --> Manage_Warehouses : CRUD warehouses
        Manage_Categories --> Admin_Dashboard : Done
        Manage_Products --> Upload_Images : Add product images
        Upload_Images --> Manage_Products : Images saved
        Manage_Products --> Admin_Dashboard : Done
        Manage_Inventory --> Admin_Dashboard : Done
        Manage_Warehouses --> Admin_Dashboard : Done
    }
```