import {
  jsonb,
  pgTable,
  varchar,
  text,
  numeric,
  integer,
} from "drizzle-orm/pg-core";

// ============== types & interfaces ==============
export const IDS = {
  tenants: "TEN_",
  sessions: "SES_",
  products: "PRO_",
  orders: "ORD_",
  orderItems: "ORI_",
  transactions: "TXN_",
  requestLogs: "LOG_",
} as const;

export const features = [
  "customer_track",
  "order_history",
  "delivery_processing",
  "purchase_requests",
  "quotations_estimates",
  "self_hosted_payment",
  "automated_receipting",
] as const;
export type Feature = (typeof features)[number];

export const paymentStatus = [
  "pending",
  "success",
  "refunded",
  "failed",
] as const;
export type PaymentStatus = (typeof paymentStatus)[number];

export type EnabledPaymentChannel =
  | {
      method: "momo" | "airtel_money";
      archType: "async_push";
      providerService: "mtn_rwanda_v2" | "airtel_rw_v1" | "flutterwave_momo";
    }
  | {
      method: "stripe" | "paypal";
      archType: "hosted_redirect";
      providerService: "stripe_checkout_v3" | "paypal_v2_standard";
    }
  | {
      method: "stripe";
      archType: "token_inline";
      providerService: "stripe_elements_custom";
    }
  | {
      method: "bank";
      archType: "direct_custody";
      providerService: "bk_rwanda_transfer" | "i_m_bank_ledger";
    };

// Extract runtime helper strings out of the union matrix if needed
export type PaymentMethod = EnabledPaymentChannel["method"];
export type PaymentArchitecture = EnabledPaymentChannel["archType"];
export type PaymentProviderService = EnabledPaymentChannel["providerService"];

// ============= tables ==============

export const tenants = pgTable("tenants", {
  id: varchar("id", { length: 255 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  features: jsonb("features")
    .$type<Feature[]>()
    .notNull()
    .default(["customer_track", "purchase_requests"]),
  payments: jsonb("payments")
    .$type<EnabledPaymentChannel[]>()
    .notNull()
    .default([
      {
        method: "bank",
        archType: "direct_custody",
        providerService: "bk_rwanda_transfer",
      },
      {
        method: "momo",
        archType: "async_push",
        providerService: "mtn_rwanda_v2",
      },
    ]),
  createdAt: varchar("created_at", { length: 255 }).notNull().default("now()"),
  updatedAt: varchar("updated_at", { length: 255 }).notNull().default("now()"),
});

export const products = pgTable("products", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 })
    .notNull()
    .references(() => tenants.id),
  name: varchar("name", { length: 255 }).notNull(),
  detail: text("detail").default(""),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  createdAt: varchar("created_at", { length: 255 }).notNull().default("now()"),
});

export const sessions = pgTable("sessions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  deviceFingerprint: varchar("device_fingerprint", { length: 255 }),
  createdAt: varchar("created_at", { length: 255 }).notNull().default("now()"),
});

export const orders = pgTable("orders", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 })
    .notNull()
    .references(() => tenants.id),
  guestSessionId: varchar("guest_session_id", { length: 255 }).references(
    () => sessions.id,
  ),
  customerEmail: varchar("customer_email", { length: 255 }).notNull(),
  customerName: varchar("customer_name", { length: 255 }),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 50 })
    .notNull()
    .$type<PaymentStatus>()
    .default("pending"),
  paymentIntentId: varchar("payment_intent_id", { length: 255 }),
  receiptUrl: text("receipt_url"),
  createdAt: varchar("created_at", { length: 255 }).notNull().default("now()"),
});

export const orderItems = pgTable("order_items", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 })
    .notNull()
    .references(() => orders.id),
  productId: varchar("product_id", { length: 255 }).references(
    () => products.id,
  ),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: numeric("price_at_purchase", {
    precision: 10,
    scale: 2,
  }).notNull(),
  deliveryStatus: varchar("delivery_status", { length: 100 })
    .notNull()
    .default("pending"),
});

export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 255 }).primaryKey(),
  orderId: varchar("order_id", { length: 255 })
    .notNull()
    .references(() => orders.id),
  customerContact: varchar("customer_contact", { length: 255 }).notNull(),
  amountCents: integer("amount_cents").notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("RWF"),

  archType: varchar("arch_type", { length: 50 })
    .notNull()
    .$type<PaymentArchitecture>(),
  processedMethod: varchar("processed_method", { length: 50 })
    .notNull()
    .$type<PaymentMethod>(),
  serviceUsed: varchar("service_used", { length: 100 })
    .notNull()
    .$type<PaymentProviderService>(),

  status: varchar("status", { length: 50 })
    .notNull()
    .$type<PaymentStatus>()
    .default("pending"),
  referenceId: varchar("reference_id", { length: 255 }).notNull().unique(),
  processorTrackerId: varchar("processor_tracker_id", { length: 255 }).unique(),
  accountMask: varchar("account_mask", { length: 4 }),
  metadata: jsonb("metadata").default({}),
  createdAt: varchar("created_at", { length: 255 }).notNull().default("now()"),
  updatedAt: varchar("updated_at", { length: 255 }).notNull().default("now()"),
});

export const requestLogs = pgTable("request_logs", {
  id: varchar("id", { length: 255 }).primaryKey(),
  tenantId: varchar("tenant_id", { length: 255 })
    .notNull()
    .references(() => tenants.id),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }),
  statusCode: integer("status_code"),
  createdAt: varchar("created_at", { length: 255 }).notNull().default("now()"),
});

// ============== inference types ==============
export type Tenant = typeof tenants.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type RequestLog = typeof requestLogs.$inferSelect;

export type TenantInsert = typeof tenants.$inferInsert;
export type ProductInsert = typeof products.$inferInsert;
export type SessionInsert = typeof sessions.$inferInsert;
export type OrderInsert = typeof orders.$inferInsert;
export type OrderItemInsert = typeof orderItems.$inferInsert;
export type TransactionInsert = typeof transactions.$inferInsert;
export type RequestLogInsert = typeof requestLogs.$inferInsert;
