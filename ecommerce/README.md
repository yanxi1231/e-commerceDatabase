# LiFNaY E-Commerce Platform

A full-stack e-commerce application built with Spring Boot, Thymeleaf, and MySQL.

## Prerequisites

- **Java 17+** — [Download](https://adoptium.net/temurin/releases/)
- **Maven 3.8+** — [Download](https://maven.apache.org/download.cgi)
- **MySQL 8.0** — [Download](https://dev.mysql.com/downloads/mysql/)

## Setup Instructions

### 1. Create the Database

Open MySQL Workbench (or any MySQL client) and run the dump file:

```bash
mysql -u root -p < sql/schema.sql
```

This creates the `ecommerce_db` database with all 14 tables, stored procedures,
triggers, functions, events, and sample data.

### 2. Configure Database Connection

Edit `src/main/resources/application.properties` if your MySQL credentials
differ from the defaults:

```properties
spring.datasource.username=root
spring.datasource.password=root
```

### 3. Build and Run

```bash
# From the project root directory:
mvn clean install
mvn spring-boot:run
```

The application starts at **http://localhost:8080**

### 4. Demo Accounts

| Email                  | Password      | Role     |
|------------------------|---------------|----------|
| test1@example.com      | passwordtest1 | Customer |

You can also register a new account through the UI.

## End-to-End User Flow

1. **Register** — Create a new account at `/register`
2. **Browse** — View product catalog at `/products`, search by keyword or filter by category
3. **Product Details** — Click a product to see images, variants, reviews
4. **Add to Cart** — Select a variant (if applicable) and quantity, then add to cart
5. **View Cart** — Review items, update quantities, or remove items at `/cart`
6. **Checkout** — Select a shipping address (or add a new one), choose payment method
7. **Order Confirmation** — See order details, payment status, and transaction reference
8. **Order History** — View all past orders at `/orders`

## Project Structure

```
ecommerce/
├── sql/
│   └── schema.sql              # Complete database dump (DDL + DML + procedures)
├── pom.xml                     # Maven dependencies
└── src/main/
    ├── java/com/lifnay/ecommerce/
    │   ├── EcommerceApplication.java
    │   ├── config/              # Security config, global controller advice
    │   ├── model/               # 14 JPA entity classes
    │   ├── repository/          # 14 Spring Data JPA repositories
    │   ├── service/             # Business logic (Cart, Checkout, Order, Product, User)
    │   └── controller/          # HTTP controllers (Auth, Product, Cart, Checkout, Order)
    └── resources/
        ├── application.properties
        ├── static/css/style.css
        └── templates/           # Thymeleaf HTML templates
```

## Database Programming Objects

- **Triggers:** `trg_after_user_insert` (auto-create cart), `trg_before_user_delete` (prevent delete with active orders), `trg_inventory_update_timestamp`
- **Functions:** `fn_available_stock()`, `fn_effective_price()`, `fn_avg_rating()`
- **Procedures:** `sp_checkout()` (atomic order creation), `sp_add_to_cart()`
- **Event:** `evt_cancel_stale_orders` (cancels pending orders after 30 minutes)

## Technical Stack

| Component          | Technology                        |
|--------------------|-----------------------------------|
| Database           | MySQL 8.0                         |
| Language           | Java 17                           |
| Framework          | Spring Boot 3.2.5                 |
| ORM                | Spring Data JPA + Hibernate       |
| Templates          | Thymeleaf                         |
| Authentication     | Spring Security + BCrypt          |
| Build Tool         | Maven                             |
