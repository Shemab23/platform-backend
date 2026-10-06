import { db } from "./index";
import {
  tenants,
  products,
  sessions,
  orders,
  orderItems,
  transactions,
  requestLogs,
  EnabledPaymentChannel,
} from "./schema";
import bcrypt from "bcrypt"; // Fixed typo and structural import syntax

async function main() {
  console.log("🚀 ---- GENERATING SEED DATA LEDGER ----");

  try {
    console.log("🧹 Flushing table records sequentially...");
    await db.delete(requestLogs);
    await db.delete(transactions);
    await db.delete(orderItems);
    await db.delete(orders);
    await db.delete(sessions);
    await db.delete(products);
    await db.delete(tenants);

    console.log("🌱 Creating isolated merchant partition space...");
    const targetTenantSlug = "kigali-crafts";
    const configuredChannels: EnabledPaymentChannel[] = [
      {
        method: "momo",
        archType: "async_push",
        providerService: "mtn_rwanda_v2",
      },
      {
        method: "bank",
        archType: "direct_custody",
        providerService: "bk_rwanda_transfer",
      },
    ];

    const tenantId = `TEN_kigaliCrafts`;

    const passwordHash = await bcrypt.hash("pass12345", 12);

    await db.insert(tenants).values({
      id: tenantId,
      name: "Kigali Authentic Crafts Ltd",
      slug: targetTenantSlug,
      passwordHash: passwordHash,
      features: ["customer_track", "purchase_requests", "automated_receipting"],
      payments: configuredChannels,
    });

    // 3. Type-Guided Product Catalog Insertion
    console.log("🌱 Injecting storefront item assets descriptions...");
    const productId = `PRO_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(products).values({
      id: productId,
      tenantId: tenantId,
      name: "Premium Imigongo Wall Art (Medium)",
      detail:
        "Traditional Rwandan geometric design painted using natural clay layers.",
      price: "45000.00",
      stockQuantity: 25,
    });

    // 4. Type-Guided Session Tracker Insertion
    console.log("🌱 Logging client digital signature environment...");
    const sessionId = `SES_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(sessions).values({
      id: sessionId,
      deviceFingerprint: "sig_crypto_hash_brave_linux_rw_2026",
    });

    // 5. Type-Guided Order Summary Insertion
    console.log("🌱 Launching processing consumer checkout ledger rows...");
    const orderId = `ORD_${Math.random().toString(36).substring(2, 11)}`;
    await db.insert(orders).values({
      id: orderId,
      tenantId: tenantId,
      guestSessionId: sessionId,
      customerEmail: "buyer.office@domain.rw",
      customerName: "Keza Diane",
      totalAmount: "45000.00",
      paymentStatus: "pending",
    });

    // 6. Type-Guided Order Line Item Insertion
    console.log("🌱 Linking structural checkout row item units...");
    await db.insert(orderItems).values({
      id: `ORI_${Math.random().toString(36).substring(2, 11)}`,
      orderId: orderId,
      productId: productId,
      quantity: 1,
      priceAtPurchase: "45000.00",
      deliveryStatus: "pending",
    });

    // 7. Type-Guided Safe Matrix Transaction Ledger Insertion
    console.log("🌱 Recording verified transaction gateway logs...");
    await db.insert(transactions).values({
      id: `TXN_${Math.random().toString(36).substring(2, 11)}`,
      orderId: orderId,
      customerContact: "+250788765432",
      amountCents: 4500000, // Coerced safely to integer cents
      currency: "RWF",

      archType: "async_push",
      processedMethod: "momo",
      serviceUsed: "mtn_rwanda_v2",

      status: "pending",
      referenceId: "ref-token-uuid-mtn-push-8833211",
      processorTrackerId: "tracker-gateway-callback-poll-99x",
      accountMask: "5432",
      metadata: {
        client_ip: "197.243.22.10",
        ussd_pushed_instantly: true,
      },
    });

    // 8. Type-Guided Request Audit Log Insertion
    console.log("🌱 Auditing initialization endpoint trace lines...");
    await db.insert(requestLogs).values({
      id: `LOG_${Math.random().toString(36).substring(2, 11)}`,
      tenantId: tenantId,
      endpoint: "/api/v1/checkout/momo-push",
      ipAddress: "197.243.22.10",
      statusCode: 202,
    });

    console.log("✅ ---- RELATIONAL MULTI-TENANT SEEDING COMPLETE ----");
  } catch (error) {
    console.error(
      "❌ Fatal error occurred during seed phase processing:",
      error,
    );
    process.exit(1);
  }
}

main();
