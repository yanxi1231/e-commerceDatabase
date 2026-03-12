import { useState } from "react";

const ENTITIES = {
  users: {
    label: "users",
    color: "#3B82F6",
    db: "MySQL (Auth DB)",
    note: "Dedicated auth database, horizontally sharded by user_id",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "email", type: "VARCHAR(255)", unique: true },
      { name: "password_hash", type: "VARCHAR(255)" },
      { name: "name", type: "VARCHAR(100)" },
      { name: "role", type: "ENUM('customer','admin')" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  addresses: {
    label: "user_addresses",
    color: "#3B82F6",
    db: "MySQL (Auth DB)",
    note: "Multiple shipping/billing addresses per user",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "user_id", type: "UUID", fk: "users.id" },
      { name: "label", type: "VARCHAR(50)" },
      { name: "street", type: "VARCHAR(255)" },
      { name: "city", type: "VARCHAR(100)" },
      { name: "state", type: "VARCHAR(100)" },
      { name: "zip_code", type: "VARCHAR(20)" },
      { name: "country", type: "VARCHAR(100)" },
      { name: "is_default", type: "BOOLEAN" },
    ],
  },
  categories: {
    label: "categories",
    color: "#10B981",
    db: "MySQL (Product DB)",
    note: "Supports nested categories via parent_id (self-referencing)",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "name", type: "VARCHAR(100)" },
      { name: "parent_id", type: "UUID NULL", fk: "categories.id" },
      { name: "slug", type: "VARCHAR(100)", unique: true },
    ],
  },
  products: {
    label: "products",
    color: "#10B981",
    db: "MySQL (Product DB)",
    note: "Core catalog — synced to Elasticsearch via CDC for search",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "name", type: "VARCHAR(255)" },
      { name: "description", type: "TEXT" },
      { name: "price", type: "DECIMAL(10,2)" },
      { name: "category_id", type: "UUID", fk: "categories.id" },
      { name: "brand", type: "VARCHAR(100)" },
      { name: "sku", type: "VARCHAR(50)", unique: true },
      { name: "is_active", type: "BOOLEAN" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  product_images: {
    label: "product_images",
    color: "#10B981",
    db: "MySQL (Product DB) + S3/CDN",
    note: "Actual files on S3, served via CDN. DB stores metadata only.",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "product_id", type: "UUID", fk: "products.id" },
      { name: "url", type: "VARCHAR(500)" },
      { name: "cdn_url", type: "VARCHAR(500)" },
      { name: "alt_text", type: "VARCHAR(255)" },
      { name: "sort_order", type: "INTEGER" },
      { name: "is_primary", type: "BOOLEAN" },
    ],
  },
  product_variants: {
    label: "product_variants",
    color: "#10B981",
    db: "MySQL (Product DB)",
    note: "Size, color, etc. Each variant has its own price & SKU",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "product_id", type: "UUID", fk: "products.id" },
      { name: "variant_name", type: "VARCHAR(100)" },
      { name: "variant_value", type: "VARCHAR(100)" },
      { name: "price_override", type: "DECIMAL(10,2) NULL" },
      { name: "sku", type: "VARCHAR(50)", unique: true },
    ],
  },
  reviews: {
    label: "reviews",
    color: "#10B981",
    db: "MySQL (Product DB)",
    note: "Separate read replica recommended for high-traffic products",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "product_id", type: "UUID", fk: "products.id" },
      { name: "user_id", type: "UUID", fk: "users.id" },
      { name: "rating", type: "TINYINT(1-5)" },
      { name: "title", type: "VARCHAR(255)" },
      { name: "body", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  inventory: {
    label: "inventory",
    color: "#F59E0B",
    db: "MySQL (Inventory DB) + Redis cache",
    note: "Separate DB for independent scaling. Redis for fast stock checks.",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "product_id", type: "UUID", fk: "products.id" },
      { name: "variant_id", type: "UUID NULL", fk: "product_variants.id" },
      { name: "warehouse_id", type: "UUID", fk: "warehouses.id" },
      { name: "stock_quantity", type: "INTEGER" },
      { name: "reserved_quantity", type: "INTEGER" },
      { name: "last_updated", type: "TIMESTAMP" },
    ],
  },
  warehouses: {
    label: "warehouses",
    color: "#F59E0B",
    db: "MySQL (Inventory DB)",
    note: "Multi-warehouse support for geographic distribution",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "name", type: "VARCHAR(100)" },
      { name: "city", type: "VARCHAR(100)" },
      { name: "country", type: "VARCHAR(100)" },
    ],
  },
  carts: {
    label: "carts",
    color: "#8B5CF6",
    db: "MySQL (Cart DB) or Redis",
    note: "Can be Redis-only for speed; MySQL for persistence",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "user_id", type: "UUID", fk: "users.id", unique: true },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  cart_items: {
    label: "cart_items",
    color: "#8B5CF6",
    db: "MySQL (Cart DB)",
    note: "References product + optional variant",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "cart_id", type: "UUID", fk: "carts.id" },
      { name: "product_id", type: "UUID", fk: "products.id" },
      { name: "variant_id", type: "UUID NULL", fk: "product_variants.id" },
      { name: "quantity", type: "INTEGER" },
    ],
  },
  orders: {
    label: "orders",
    color: "#EF4444",
    db: "MySQL (Order DB)",
    note: "Separate order database, sharded by user_id for scale",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "user_id", type: "UUID", fk: "users.id" },
      { name: "shipping_address_id", type: "UUID", fk: "user_addresses.id" },
      { name: "total_amount", type: "DECIMAL(10,2)" },
      { name: "status", type: "ENUM" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  order_items: {
    label: "order_items",
    color: "#EF4444",
    db: "MySQL (Order DB)",
    note: "Snapshot of price at purchase time",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "order_id", type: "UUID", fk: "orders.id" },
      { name: "product_id", type: "UUID", fk: "products.id" },
      { name: "variant_id", type: "UUID NULL" },
      { name: "quantity", type: "INTEGER" },
      { name: "price_at_time", type: "DECIMAL(10,2)" },
      { name: "product_name_snapshot", type: "VARCHAR(255)" },
    ],
  },
  payments: {
    label: "payments",
    color: "#EF4444",
    db: "MySQL (Payment DB)",
    note: "Isolated payment DB for PCI compliance & security",
    fields: [
      { name: "id", type: "UUID", pk: true },
      { name: "order_id", type: "UUID", fk: "orders.id", unique: true },
      { name: "amount", type: "DECIMAL(10,2)" },
      { name: "method", type: "VARCHAR(50)" },
      { name: "status", type: "ENUM" },
      { name: "transaction_ref", type: "VARCHAR(255)" },
      { name: "idempotency_key", type: "VARCHAR(255)", unique: true },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
};

const DB_GROUPS = [
  { name: "Auth DB", color: "#3B82F6", entities: ["users", "addresses"], icon: "🔐" },
  { name: "Product DB + CDN", color: "#10B981", entities: ["categories", "products", "product_images", "product_variants", "reviews"], icon: "📦" },
  { name: "Inventory DB + Redis", color: "#F59E0B", entities: ["inventory", "warehouses"], icon: "🏭" },
  { name: "Cart DB", color: "#8B5CF6", entities: ["carts", "cart_items"], icon: "🛒" },
  { name: "Order & Payment DB", color: "#EF4444", entities: ["orders", "order_items", "payments"], icon: "💳" },
];

const RELATIONSHIPS = [
  { from: "users", to: "addresses", label: "1 : N" },
  { from: "users", to: "carts", label: "1 : 1" },
  { from: "users", to: "orders", label: "1 : N" },
  { from: "users", to: "reviews", label: "1 : N" },
  { from: "categories", to: "categories", label: "self-ref (parent)" },
  { from: "categories", to: "products", label: "1 : N" },
  { from: "products", to: "product_images", label: "1 : N" },
  { from: "products", to: "product_variants", label: "1 : N" },
  { from: "products", to: "reviews", label: "1 : N" },
  { from: "products", to: "inventory", label: "1 : N" },
  { from: "products", to: "cart_items", label: "1 : N" },
  { from: "products", to: "order_items", label: "1 : N" },
  { from: "product_variants", to: "inventory", label: "1 : N" },
  { from: "warehouses", to: "inventory", label: "1 : N" },
  { from: "carts", to: "cart_items", label: "1 : N" },
  { from: "orders", to: "order_items", label: "1 : N" },
  { from: "orders", to: "payments", label: "1 : 1" },
  { from: "addresses", to: "orders", label: "1 : N (shipping)" },
];

function EntityCard({ id, entity, isSelected, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: isSelected ? `${entity.color}11` : hovered ? "#1a1a2e" : "#12121f",
        border: `2px solid ${isSelected ? entity.color : hovered ? entity.color + "88" : "#2a2a3e"}`,
        borderRadius: 10,
        padding: 0,
        cursor: "pointer",
        transition: "all 0.2s",
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          background: entity.color,
          padding: "8px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 13, fontFamily: "monospace" }}>
          {entity.label}
        </span>
        <span
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "#fff",
            fontSize: 9,
            padding: "2px 6px",
            borderRadius: 4,
            fontWeight: 600,
          }}
        >
          {entity.db.split("(")[0].trim()}
        </span>
      </div>
      <div style={{ padding: "6px 0" }}>
        {entity.fields.map((f, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "3px 12px",
              fontSize: 11,
              fontFamily: "monospace",
              background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.02)",
            }}
          >
            <span style={{ color: "#e2e8f0", display: "flex", alignItems: "center", gap: 4 }}>
              {f.pk && <span style={{ color: "#fbbf24", fontSize: 10 }}>🔑</span>}
              {f.fk && <span style={{ color: "#60a5fa", fontSize: 10 }}>🔗</span>}
              {f.unique && !f.pk && <span style={{ color: "#a78bfa", fontSize: 10 }}>◆</span>}
              {f.name}
            </span>
            <span style={{ color: "#94a3b8", fontSize: 10 }}>{f.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EnhancedERD() {
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("erd");

  const selectedEntity = selected ? ENTITIES[selected] : null;
  const relatedRels = selected
    ? RELATIONSHIPS.filter((r) => r.from === selected || r.to === selected)
    : [];

  return (
    <div style={{ background: "#0a0a14", color: "#e2e8f0", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px 24px 0", borderBottom: "1px solid #1e1e32" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#f1f5f9" }}>
              E-Commerce Platform — Enhanced Data Model
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
              Distributed architecture · 15 tables · 5 database boundaries · CDN-backed media
            </p>
          </div>
          <div style={{ display: "flex", gap: 4, background: "#1a1a2e", borderRadius: 8, padding: 3 }}>
            {["erd", "distribution", "relationships"].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: view === v ? "#3B82F6" : "transparent",
                  color: view === v ? "#fff" : "#94a3b8",
                  border: "none",
                  padding: "6px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {v === "erd" ? "ERD" : v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ display: "flex", height: "calc(100vh - 80px)" }}>
        {/* Left: Entities */}
        <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
          {view === "erd" && (
            <div>
              {DB_GROUPS.map((group) => (
                <div key={group.name} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                      padding: "6px 12px",
                      background: `${group.color}15`,
                      border: `1px solid ${group.color}33`,
                      borderRadius: 8,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{group.icon}</span>
                    <span style={{ color: group.color, fontWeight: 700, fontSize: 13 }}>{group.name}</span>
                    <span style={{ color: "#64748b", fontSize: 11, marginLeft: "auto" }}>
                      {group.entities.length} table{group.entities.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: 10,
                    }}
                  >
                    {group.entities.map((eId) => (
                      <EntityCard
                        key={eId}
                        id={eId}
                        entity={ENTITIES[eId]}
                        isSelected={selected === eId}
                        onClick={setSelected}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === "distribution" && (
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                The model is split across <strong style={{ color: "#f1f5f9" }}>5 independent database boundaries</strong>, each deployable as a separate MySQL instance. This enables independent scaling, failure isolation, and team ownership.
              </p>
              {DB_GROUPS.map((group) => (
                <div
                  key={group.name}
                  style={{
                    background: "#12121f",
                    border: `1px solid ${group.color}44`,
                    borderRadius: 12,
                    padding: 16,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                    <span style={{ fontSize: 24 }}>{group.icon}</span>
                    <div>
                      <div style={{ color: group.color, fontWeight: 700, fontSize: 15 }}>{group.name}</div>
                      <div style={{ color: "#64748b", fontSize: 11 }}>
                        Tables: {group.entities.map((e) => ENTITIES[e].label).join(", ")}
                      </div>
                    </div>
                  </div>
                  {group.entities.map((eId) => (
                    <div
                      key={eId}
                      style={{
                        background: "#0a0a14",
                        borderRadius: 8,
                        padding: "10px 14px",
                        marginBottom: 6,
                        borderLeft: `3px solid ${group.color}`,
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#f1f5f9", fontFamily: "monospace" }}>
                        {ENTITIES[eId].label}
                      </div>
                      <div style={{ color: "#94a3b8", fontSize: 11, marginTop: 2 }}>{ENTITIES[eId].note}</div>
                      <div style={{ color: "#64748b", fontSize: 10, marginTop: 2 }}>{ENTITIES[eId].db}</div>
                    </div>
                  ))}
                  {group.name.includes("CDN") && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "10px 14px",
                        background: "#10B98115",
                        borderRadius: 8,
                        border: "1px dashed #10B98144",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#10B981" }}>☁️ CDN / S3 Storage</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                        Product images stored in S3 buckets, served through CloudFront/CDN. The <code style={{ color: "#10B981" }}>product_images</code> table stores only metadata (URL, alt text, sort order). Actual binary files never touch the database.
                      </div>
                    </div>
                  )}
                  {group.name.includes("Redis") && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: "10px 14px",
                        background: "#F59E0B15",
                        borderRadius: 8,
                        border: "1px dashed #F59E0B44",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#F59E0B" }}>⚡ Redis Cache Layer</div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                        Stock counts cached in Redis for sub-ms reads. Write-through on inventory updates. Redis distributed lock during checkout to prevent overselling.
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {view === "relationships" && (
            <div>
              <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 16 }}>
                All {RELATIONSHIPS.length} relationships with multiplicity constraints. Click any entity in the ERD tab to highlight its connections.
              </p>
              <div style={{ display: "grid", gap: 6 }}>
                {RELATIONSHIPS.map((rel, i) => (
                  <div
                    key={i}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 50px 140px 1fr",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 14px",
                      background: i % 2 === 0 ? "#12121f" : "#0f0f1a",
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "monospace",
                    }}
                  >
                    <span style={{ color: ENTITIES[rel.from]?.color || "#94a3b8", fontWeight: 600 }}>
                      {ENTITIES[rel.from]?.label}
                    </span>
                    <span
                      style={{
                        textAlign: "center",
                        color: "#fbbf24",
                        fontWeight: 700,
                        fontSize: 11,
                        background: "#fbbf2415",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {rel.label}
                    </span>
                    <span style={{ color: ENTITIES[rel.to]?.color || "#94a3b8", fontWeight: 600 }}>
                      {ENTITIES[rel.to]?.label}
                    </span>
                    <span style={{ color: "#64748b", fontSize: 11, fontFamily: "system-ui" }}>
                      {rel.from === rel.to ? "Hierarchical nesting" : "FK constraint"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Detail panel */}
        <div
          style={{
            width: 320,
            borderLeft: "1px solid #1e1e32",
            padding: 20,
            overflowY: "auto",
            background: "#0d0d1a",
          }}
        >
          {selectedEntity ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: selectedEntity.color,
                  }}
                />
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700, fontFamily: "monospace" }}>
                  {selectedEntity.label}
                </h2>
              </div>

              <div
                style={{
                  background: `${selectedEntity.color}10`,
                  border: `1px solid ${selectedEntity.color}33`,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>Storage</div>
                <div style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>{selectedEntity.db}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>{selectedEntity.note}</div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                Fields ({selectedEntity.fields.length})
              </div>
              {selectedEntity.fields.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "8px 10px",
                    background: i % 2 === 0 ? "#12121f" : "transparent",
                    borderRadius: 6,
                    marginBottom: 2,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "monospace", color: "#e2e8f0" }}>
                      {f.name}
                    </span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {f.pk && (
                        <span style={{ background: "#fbbf2422", color: "#fbbf24", fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                          PK
                        </span>
                      )}
                      {f.fk && (
                        <span style={{ background: "#3B82F622", color: "#60a5fa", fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                          FK
                        </span>
                      )}
                      {f.unique && !f.pk && (
                        <span style={{ background: "#a78bfa22", color: "#a78bfa", fontSize: 9, padding: "1px 5px", borderRadius: 3, fontWeight: 700 }}>
                          UK
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace", marginTop: 2 }}>{f.type}</div>
                  {f.fk && <div style={{ fontSize: 10, color: "#60a5fa", marginTop: 2 }}>→ {f.fk}</div>}
                </div>
              ))}

              {relatedRels.length > 0 && (
                <>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b", marginTop: 16, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                    Relationships
                  </div>
                  {relatedRels.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 11,
                        padding: "6px 10px",
                        background: "#12121f",
                        borderRadius: 6,
                        marginBottom: 4,
                        fontFamily: "monospace",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <span style={{ color: ENTITIES[r.from]?.color }}>{r.from}</span>
                      <span style={{ color: "#fbbf24" }}>—{r.label}—</span>
                      <span style={{ color: ENTITIES[r.to]?.color }}>{r.to}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5, textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👆</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Select an entity</div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Click any table card to view its details and relationships</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
