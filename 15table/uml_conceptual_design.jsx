import { useState, useRef, useEffect } from "react";

const ENTITIES = [
  {
    id: "users",
    x: 60,
    y: 40,
    label: "Users",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "email", type: "VARCHAR", uk: true },
      { name: "password_hash", type: "VARCHAR" },
      { name: "name", type: "VARCHAR" },
      { name: "role", type: "ENUM" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "addresses",
    x: 60,
    y: 310,
    label: "User_Addresses",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "user_id", type: "UUID", fk: true },
      { name: "label", type: "VARCHAR" },
      { name: "street", type: "VARCHAR" },
      { name: "city", type: "VARCHAR" },
      { name: "state", type: "VARCHAR" },
      { name: "zip_code", type: "VARCHAR" },
      { name: "country", type: "VARCHAR" },
      { name: "is_default", type: "BOOLEAN" },
    ],
  },
  {
    id: "categories",
    x: 370,
    y: 40,
    label: "Categories",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "name", type: "VARCHAR" },
      { name: "parent_id", type: "UUID", fk: true },
      { name: "slug", type: "VARCHAR", uk: true },
    ],
  },
  {
    id: "products",
    x: 370,
    y: 230,
    label: "Products",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "name", type: "VARCHAR" },
      { name: "description", type: "TEXT" },
      { name: "price", type: "DECIMAL" },
      { name: "category_id", type: "UUID", fk: true },
      { name: "brand", type: "VARCHAR" },
      { name: "sku", type: "VARCHAR", uk: true },
      { name: "is_active", type: "BOOLEAN" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "product_images",
    x: 680,
    y: 40,
    label: "Product_Images",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "product_id", type: "UUID", fk: true },
      { name: "url", type: "VARCHAR" },
      { name: "cdn_url", type: "VARCHAR" },
      { name: "alt_text", type: "VARCHAR" },
      { name: "sort_order", type: "INTEGER" },
      { name: "is_primary", type: "BOOLEAN" },
    ],
  },
  {
    id: "product_variants",
    x: 680,
    y: 290,
    label: "Product_Variants",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "product_id", type: "UUID", fk: true },
      { name: "variant_name", type: "VARCHAR" },
      { name: "variant_value", type: "VARCHAR" },
      { name: "price_override", type: "DECIMAL" },
      { name: "sku", type: "VARCHAR", uk: true },
    ],
  },
  {
    id: "reviews",
    x: 370,
    y: 530,
    label: "Reviews",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "product_id", type: "UUID", fk: true },
      { name: "user_id", type: "UUID", fk: true },
      { name: "rating", type: "TINYINT" },
      { name: "title", type: "VARCHAR" },
      { name: "body", type: "TEXT" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "warehouses",
    x: 990,
    y: 40,
    label: "Warehouses",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "name", type: "VARCHAR" },
      { name: "city", type: "VARCHAR" },
      { name: "country", type: "VARCHAR" },
    ],
  },
  {
    id: "inventory",
    x: 990,
    y: 220,
    label: "Inventory",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "product_id", type: "UUID", fk: true },
      { name: "variant_id", type: "UUID", fk: true },
      { name: "warehouse_id", type: "UUID", fk: true },
      { name: "stock_quantity", type: "INTEGER" },
      { name: "reserved_qty", type: "INTEGER" },
      { name: "last_updated", type: "TIMESTAMP" },
    ],
  },
  {
    id: "carts",
    x: 60,
    y: 600,
    label: "Carts",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "user_id", type: "UUID", fk: true, uk: true },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "cart_items",
    x: 60,
    y: 770,
    label: "Cart_Items",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "cart_id", type: "UUID", fk: true },
      { name: "product_id", type: "UUID", fk: true },
      { name: "variant_id", type: "UUID", fk: true },
      { name: "quantity", type: "INTEGER" },
    ],
  },
  {
    id: "orders",
    x: 680,
    y: 530,
    label: "Orders",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "user_id", type: "UUID", fk: true },
      { name: "shipping_addr_id", type: "UUID", fk: true },
      { name: "total_amount", type: "DECIMAL" },
      { name: "status", type: "ENUM" },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
  {
    id: "order_items",
    x: 680,
    y: 770,
    label: "Order_Items",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "order_id", type: "UUID", fk: true },
      { name: "product_id", type: "UUID", fk: true },
      { name: "variant_id", type: "UUID" },
      { name: "quantity", type: "INTEGER" },
      { name: "price_at_time", type: "DECIMAL" },
      { name: "name_snapshot", type: "VARCHAR" },
    ],
  },
  {
    id: "payments",
    x: 990,
    y: 530,
    label: "Payments",
    attrs: [
      { name: "id", pk: true, type: "UUID" },
      { name: "order_id", type: "UUID", fk: true, uk: true },
      { name: "amount", type: "DECIMAL" },
      { name: "method", type: "VARCHAR" },
      { name: "status", type: "ENUM" },
      { name: "transaction_ref", type: "VARCHAR" },
      { name: "idempotency_key", type: "VARCHAR", uk: true },
      { name: "created_at", type: "TIMESTAMP" },
    ],
  },
];

const RELATIONSHIPS = [
  { from: "users", to: "addresses", fromCard: "1", toCard: "*", label: "has" },
  { from: "users", to: "carts", fromCard: "1", toCard: "1", label: "owns" },
  { from: "users", to: "orders", fromCard: "1", toCard: "*", label: "places" },
  { from: "users", to: "reviews", fromCard: "1", toCard: "*", label: "writes" },
  { from: "categories", to: "products", fromCard: "1", toCard: "*", label: "contains" },
  { from: "categories", to: "categories", fromCard: "0..1", toCard: "*", label: "parent of", selfRef: true },
  { from: "products", to: "product_images", fromCard: "1", toCard: "*", label: "has" },
  { from: "products", to: "product_variants", fromCard: "1", toCard: "*", label: "has" },
  { from: "products", to: "reviews", fromCard: "1", toCard: "*", label: "receives" },
  { from: "products", to: "inventory", fromCard: "1", toCard: "*", label: "tracked in" },
  { from: "products", to: "cart_items", fromCard: "1", toCard: "*", label: "in" },
  { from: "products", to: "order_items", fromCard: "1", toCard: "*", label: "ordered as" },
  { from: "product_variants", to: "inventory", fromCard: "1", toCard: "*", label: "stocked" },
  { from: "warehouses", to: "inventory", fromCard: "1", toCard: "*", label: "stores" },
  { from: "carts", to: "cart_items", fromCard: "1", toCard: "*", label: "contains" },
  { from: "orders", to: "order_items", fromCard: "1", toCard: "*", label: "contains" },
  { from: "orders", to: "payments", fromCard: "1", toCard: "1", label: "paid via" },
  { from: "addresses", to: "orders", fromCard: "1", toCard: "*", label: "ships to" },
];

const ENTITY_W = 240;
const ROW_H = 20;
const HEADER_H = 32;
const PAD = 12;

function getEntityHeight(e) {
  return HEADER_H + e.attrs.length * ROW_H + PAD;
}

function getEntityCenter(e) {
  const h = getEntityHeight(e);
  return { cx: e.x + ENTITY_W / 2, cy: e.y + h / 2 };
}

function getEdgePoint(e, targetX, targetY) {
  const h = getEntityHeight(e);
  const cx = e.x + ENTITY_W / 2;
  const cy = e.y + h / 2;
  const dx = targetX - cx;
  const dy = targetY - cy;
  const hw = ENTITY_W / 2;
  const hh = h / 2;

  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: cx, y: cy };

  const sX = hw / Math.abs(dx || 0.001);
  const sY = hh / Math.abs(dy || 0.001);
  const s = Math.min(sX, sY);

  return { x: cx + dx * s, y: cy + dy * s };
}

function EntityBox({ entity, isHighlighted, onHover }) {
  const h = getEntityHeight(entity);
  return (
    <g
      onMouseEnter={() => onHover(entity.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "pointer" }}
    >
      <rect
        x={entity.x}
        y={entity.y}
        width={ENTITY_W}
        height={h}
        rx={6}
        fill={isHighlighted ? "#1e293b" : "#0f172a"}
        stroke={isHighlighted ? "#60a5fa" : "#334155"}
        strokeWidth={isHighlighted ? 2 : 1}
      />
      <rect
        x={entity.x}
        y={entity.y}
        width={ENTITY_W}
        height={HEADER_H}
        rx={6}
        fill={isHighlighted ? "#2563eb" : "#1e293b"}
      />
      <rect
        x={entity.x}
        y={entity.y + HEADER_H - 6}
        width={ENTITY_W}
        height={6}
        fill={isHighlighted ? "#2563eb" : "#1e293b"}
      />
      <text
        x={entity.x + ENTITY_W / 2}
        y={entity.y + 21}
        textAnchor="middle"
        fill="#f1f5f9"
        fontSize={13}
        fontWeight={700}
        fontFamily="monospace"
      >
        {entity.label}
      </text>
      {entity.attrs.map((attr, i) => {
        const ay = entity.y + HEADER_H + i * ROW_H + 15;
        return (
          <g key={i}>
            {i % 2 === 1 && (
              <rect
                x={entity.x + 1}
                y={entity.y + HEADER_H + i * ROW_H}
                width={ENTITY_W - 2}
                height={ROW_H}
                fill="rgba(255,255,255,0.03)"
              />
            )}
            {attr.pk && (
              <text x={entity.x + 10} y={ay} fill="#fbbf24" fontSize={10} fontFamily="monospace">
                🔑
              </text>
            )}
            {attr.fk && !attr.pk && (
              <text x={entity.x + 10} y={ay} fill="#60a5fa" fontSize={10} fontFamily="monospace">
                FK
              </text>
            )}
            {attr.uk && !attr.pk && !attr.fk && (
              <text x={entity.x + 10} y={ay} fill="#a78bfa" fontSize={9} fontWeight={700} fontFamily="monospace">
                UK
              </text>
            )}
            <text
              x={entity.x + 32}
              y={ay}
              fill={attr.pk ? "#fbbf24" : attr.fk ? "#93c5fd" : "#cbd5e1"}
              fontSize={11}
              fontFamily="monospace"
              textDecoration={attr.pk ? "underline" : "none"}
            >
              {attr.name}
            </text>
            <text
              x={entity.x + ENTITY_W - 10}
              y={ay}
              textAnchor="end"
              fill="#64748b"
              fontSize={10}
              fontFamily="monospace"
            >
              {attr.type}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function RelLine({ rel, entities, hoveredId }) {
  const fromE = entities.find((e) => e.id === rel.from);
  const toE = entities.find((e) => e.id === rel.to);
  if (!fromE || !toE) return null;

  const isActive = hoveredId === rel.from || hoveredId === rel.to;
  const color = isActive ? "#60a5fa" : "#475569";
  const opacity = hoveredId && !isActive ? 0.15 : 1;

  if (rel.selfRef) {
    const sx = fromE.x + ENTITY_W;
    const sy = fromE.y + 20;
    const r = 25;
    return (
      <g opacity={opacity}>
        <path
          d={`M ${sx} ${sy} C ${sx + 40} ${sy - 10}, ${sx + 40} ${sy - 50}, ${sx - 10} ${sy - 50} L ${sx - 10} ${fromE.y}`}
          fill="none"
          stroke={color}
          strokeWidth={isActive ? 2 : 1}
          markerEnd="url(#arrowhead)"
        />
        <text x={sx + 30} y={sy - 30} fill={color} fontSize={9} fontFamily="sans-serif" fontWeight={600}>
          {rel.label}
        </text>
        <text x={sx + 5} y={sy + 3} fill={color} fontSize={9} fontFamily="monospace" fontWeight={700}>
          {rel.fromCard}
        </text>
        <text x={sx - 15} y={fromE.y - 5} fill={color} fontSize={9} fontFamily="monospace" fontWeight={700}>
          {rel.toCard}
        </text>
      </g>
    );
  }

  const fromC = getEntityCenter(fromE);
  const toC = getEntityCenter(toE);
  const p1 = getEdgePoint(fromE, toC.cx, toC.cy);
  const p2 = getEdgePoint(toE, fromC.cx, fromC.cy);

  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;

  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const nx = len > 0 ? -dy / len : 0;
  const ny = len > 0 ? dx / len : 0;

  return (
    <g opacity={opacity}>
      <line
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke={color}
        strokeWidth={isActive ? 2 : 1}
      />
      <text
        x={p1.x + dx * 0.15}
        y={p1.y + dy * 0.15 + (nx > 0 ? -6 : 12)}
        fill={isActive ? "#fbbf24" : "#94a3b8"}
        fontSize={10}
        fontFamily="monospace"
        fontWeight={700}
        textAnchor="middle"
      >
        {rel.fromCard}
      </text>
      <text
        x={p2.x - dx * 0.15}
        y={p2.y - dy * 0.15 + (nx > 0 ? -6 : 12)}
        fill={isActive ? "#fbbf24" : "#94a3b8"}
        fontSize={10}
        fontFamily="monospace"
        fontWeight={700}
        textAnchor="middle"
      >
        {rel.toCard}
      </text>
      <rect
        x={mx - 28}
        y={my + nx * 12 - 8}
        width={56}
        height={16}
        rx={3}
        fill="#0f172a"
        stroke={color}
        strokeWidth={0.5}
        opacity={0.9}
      />
      <text
        x={mx}
        y={my + nx * 12 + 4}
        textAnchor="middle"
        fill={isActive ? "#93c5fd" : "#94a3b8"}
        fontSize={9}
        fontFamily="sans-serif"
        fontWeight={600}
      >
        {rel.label}
      </text>
    </g>
  );
}

export default function UMLDiagram() {
  const [hovered, setHovered] = useState(null);
  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 10, y: 10 });
  const [dragging, setDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
  };

  const handleMouseDown = (e) => {
    if (e.button === 0) {
      setDragging(true);
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPan((p) => ({
        x: p.x + (e.clientX - lastPos.current.x),
        y: p.y + (e.clientY - lastPos.current.y),
      }));
      lastPos.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handleMouseUp = () => setDragging(false);

  return (
    <div style={{ background: "#020617", width: "100%", height: "100vh", overflow: "hidden", position: "relative", fontFamily: "system-ui" }}>
      {/* Title bar */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        background: "linear-gradient(180deg, #020617 60%, transparent)",
        padding: "16px 24px 30px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f1f5f9" }}>
              UML Conceptual Design — E-Commerce Platform
            </h1>
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b" }}>
              15 entities · 18 relationships · Primary keys underlined · FK in blue · Multiplicity on lines
            </p>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>−</button>
            <span style={{ color: "#94a3b8", fontSize: 12, fontFamily: "monospace", minWidth: 40, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, width: 32, height: 32, cursor: "pointer", fontSize: 16 }}>+</button>
            <button onClick={() => { setZoom(0.82); setPan({ x: 10, y: 10 }); }} style={{ background: "#1e293b", color: "#94a3b8", border: "1px solid #334155", borderRadius: 6, height: 32, padding: "0 10px", cursor: "pointer", fontSize: 11, marginLeft: 4 }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        position: "absolute", bottom: 16, left: 16, zIndex: 10,
        background: "#0f172aee", border: "1px solid #334155", borderRadius: 10, padding: "10px 16px",
        display: "flex", gap: 16, alignItems: "center", fontSize: 11,
      }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#fbbf24" }}>🔑</span> <span style={{ color: "#94a3b8" }}>Primary Key (underlined)</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#60a5fa", fontFamily: "monospace", fontWeight: 700, fontSize: 10 }}>FK</span> <span style={{ color: "#94a3b8" }}>Foreign Key</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ color: "#a78bfa", fontFamily: "monospace", fontWeight: 700, fontSize: 10 }}>UK</span> <span style={{ color: "#94a3b8" }}>Unique</span>
        </span>
        <span style={{ color: "#64748b" }}>|</span>
        <span style={{ color: "#94a3b8" }}><strong style={{ color: "#f1f5f9" }}>1</strong> = exactly one</span>
        <span style={{ color: "#94a3b8" }}><strong style={{ color: "#f1f5f9" }}>*</strong> = many</span>
        <span style={{ color: "#94a3b8" }}><strong style={{ color: "#f1f5f9" }}>0..1</strong> = optional</span>
        <span style={{ color: "#64748b" }}>| Drag to pan · Scroll to zoom</span>
      </div>

      {/* SVG Canvas */}
      <svg
        width="100%"
        height="100%"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: dragging ? "grabbing" : "grab" }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
        </defs>
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Grid dots */}
          <pattern id="dots" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.8" fill="#1e293b" />
          </pattern>
          <rect x="-500" y="-500" width="3000" height="2000" fill="url(#dots)" />

          {/* DB group backgrounds */}
          {[
            { x: 40, y: 20, w: 270, h: 580, label: "Auth DB", color: "#3B82F6" },
            { x: 350, y: 20, w: 270, h: 490, label: "Product DB", color: "#10B981" },
            { x: 660, y: 20, w: 270, h: 470, label: "Media + Variants", color: "#10B981" },
            { x: 970, y: 20, w: 270, h: 390, label: "Inventory DB", color: "#F59E0B" },
            { x: 40, y: 580, w: 270, h: 360, label: "Cart DB", color: "#8B5CF6" },
            { x: 660, y: 510, w: 580, h: 440, label: "Order & Payment DB", color: "#EF4444" },
          ].map((g, i) => (
            <g key={i}>
              <rect x={g.x - 15} y={g.y - 15} width={g.w} height={g.h} rx={12}
                fill={`${g.color}08`} stroke={`${g.color}22`} strokeWidth={1} strokeDasharray="6 4" />
              <text x={g.x - 5} y={g.y + g.h - 25} fill={`${g.color}55`} fontSize={11} fontWeight={700} fontFamily="sans-serif">
                {g.label}
              </text>
            </g>
          ))}

          {/* Relationships */}
          {RELATIONSHIPS.map((rel, i) => (
            <RelLine key={i} rel={rel} entities={ENTITIES} hoveredId={hovered} />
          ))}

          {/* Entities */}
          {ENTITIES.map((e) => (
            <EntityBox
              key={e.id}
              entity={e}
              isHighlighted={hovered === e.id || RELATIONSHIPS.some(
                (r) => (r.from === e.id && r.to === hovered) || (r.to === e.id && r.from === hovered)
              )}
              onHover={setHovered}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
