# BACKEND checklist (`platform-backend`)

Stack: Node 20, Express, TypeScript, Drizzle, Supabase Postgres, Jest + ts-jest + supertest.
Sprints are global numbers shared with FRONTEND.md. Backend owns sprints 00, 01, 02, 04, 06, 08.

## Workflow rules

- One branch per milestone: `milestone/NN-name`, created from `develop`.
- One commit per task: `sprint 01: task 1.2 - added jest harness and health test`
- Milestone closing commit: `ml 01: end of backend foundation - SAFE` (or `NOT SAFE`)
- One PR per milestone into `develop`, merged with a merge commit. Then `git tag ml-NN`.
- Only open a `develop -> main` PR when the milestone is SAFE on staging.
- Test levels: **unit** (one function, no DB), **integration** (supertest + test DB), **global** (whole flow, cart to payout).

## Milestone gate (copy into every milestone PR)

- [ ] `npm test` green locally (unit + integration + global)
- [ ] CI green on the PR
- [ ] `npx tsc --noEmit` and lint clean
- [ ] Migrations applied to staging, app boots there
- [ ] Smoke test on staging with curl passed
- [ ] No secrets in the diff, `.env.example` updated
- [ ] Every new admin route is behind requireAuth + requireFeature (where needed)
- [ ] All sprint commits of this milestone are on the branch
- Verdict: SAFE / NOT SAFE

---

# ML 00: Pipeline

## Sprint 00: Repo, CI, deploy
- [x] **Task 0.1: repo, protection, CI, deploys**
  - Starts from: empty folder
  - Use: Git, GitHub (public), Actions, Render
  - Create: repo, `develop` + `main`, rulesets, `ci.yml`, CODEOWNERS, `/health`, Render staging + prod
  - Ends with: hello-world API on staging and prod, direct pushes blocked
- [x] **ML 00 close:** gate checked, commit `ml 00: end of pipeline - SAFE`, tag `ml-00`

---

# ML 01: Backend foundation

## Sprint 01: Database, tests, tenants, auth, gates
- [ ] **Task 1.1: database and schema**
  - Starts from: stub server, no DB
  - Use: Supabase x2 (pooler URL), Drizzle, drizzle-kit
  - Create: `src/db/schema.ts` (tenants, users, products, guest_sessions, carts, cart_items, orders, order_items, payments, payouts, webhook_events), `drizzle.config.ts`, `src/db/index.ts`, Migrate workflow, GitHub Environments `staging` / `production` with `DATABASE_URL`
  - Ends with: migrations on staging, `.env.example` complete
- [ ] **Task 1.2: Jest harness**
  - Starts from: schema, no tests
  - Use: Jest, ts-jest, supertest, test schema/DB
  - Create: `jest.config.ts`, split `app.ts` / `server.ts`, `tests/helpers/db.ts` (reset + seed), CI test step
  - Tests: `/health` returns 200
  - Ends with: `npm test` green locally and in CI
- [ ] **Task 1.3: tenant resolver and config**
  - Starts from: stub config endpoint
  - Use: Express middleware, Drizzle
  - Create: `tenantResolver` (x-tenant header, subdomain fallback), real `GET /api/tenant/config`, `GET /api/tenants/public`
  - Tests: known tenant returns flags, unknown 404, missing header 400
  - Ends with: config from the real DB
- [ ] **Task 1.4: auth with cookies**
  - Starts from: no users
  - Use: bcryptjs, jsonwebtoken, cookie-parser, zod
  - Create: register-tenant, login, logout, me, `requireAuth`, httpOnly+Secure+SameSite=Lax cookie, `COOKIE_DOMAIN` env
  - Tests: register then login sets cookie, wrong password 401, `me` without cookie 401, tenant A user cannot log in to tenant B
  - Ends with: working auth API
- [ ] **Task 1.5: feature-flag gate**
  - Starts from: auth exists
  - Create: `requireFeature(flag)` (403 when off), chain `requireAuth -> tenantFromUser -> requireFeature`
  - Tests: enabled 200, disabled 403, tenant A never sees tenant B data
  - Ends with: reusable gate used by all admin routes
- [ ] **ML 01 close:** run unit + integration, push, PR into `develop`, verdict, commit `ml 01: end of backend foundation - SAFE`, tag `ml-01`

---

# ML 02: Tenant admin and storefront API

## Sprint 02: Products, feed, guest, cart, orders
- [ ] **Task 2.1: product management API**
  - Starts from: auth + gates, no products API
  - Use: Drizzle, zod
  - Create: `GET/POST/PATCH/DELETE /api/admin/products` scoped to the logged-in tenant
  - Tests: tenant lists only its own products, cannot edit another tenant's (403/404)
  - Ends with: shops can manage products with their own prices; seed script makes two shops with the same product name
- [ ] **Task 2.2: public marketplace feed**
  - Create: `GET /api/products` (active tenants only, `?q=` search, shop name included)
  - Tests: suspended tenant hidden, search filters
  - Ends with: combined feed from all shops
- [ ] **Task 2.3: guest session**
  - Use: cookie-parser signed cookies (`COOKIE_SECRET`)
  - Create: `guestSession` middleware, signed httpOnly cookie, `req.guestId`
  - Tests: first request sets cookie, tampered cookie replaced, two guests differ
  - Ends with: trustworthy guest identity
- [ ] **Task 2.4: cart API**
  - Create: `GET/POST/PATCH/DELETE /api/cart`, price read from DB, stock checked
  - Tests: client price ignored, over-stock rejected, cart private to its guest
  - Ends with: multi-shop cart stored server-side
- [ ] **Task 2.5: order creation (unpaid)**
  - Use: Drizzle transaction
  - Create: `POST /api/checkout/start` (pending order, order_items with tenant_id and price_at_purchase, no stock change yet), `GET /api/orders/:id` for cookie owner only
  - Tests: totals across two shops, empty cart 400, other guest cannot read
  - Ends with: pending order split by shop
- [ ] **ML 02 (backend part) close:** run tests, push, commit `ml 02: end of tenant admin + storefront API - SAFE`, tag. (Close it together with Sprint 03 in FRONTEND.md, see note there.)

---

# ML 03: Payments

## Sprint 04: Adapter, Stripe, PayPal, Flutterwave, payouts
- [ ] **Task 4.1: adapter and webhook plumbing**
  - Use: TS interfaces, `express.raw()` on webhook routes
  - Create: `payments/types.ts`, `registry.ts`, `services/markOrderPaid.ts` (transaction: paid, reduce stock, write payouts, idempotent by `webhook_events`), `POST /api/checkout/pay`
  - Tests: idempotent, payout per shop, fee deducted, unknown provider 400, gateway not enabled by tenant 400 (use a fake provider)
  - Ends with: one tested code path for all providers
- [ ] **Task 4.2: Stripe**
  - Use: `stripe` SDK test keys, Stripe CLI
  - Create: `payments/stripe.ts`, `POST /api/webhooks/stripe` (signature check, `checkout.session.completed`)
  - Tests: signed payload marks paid, bad signature 400, duplicate event no change
  - Ends with: test card 4242 completes on staging
- [ ] **Task 4.3: PayPal**
  - Use: PayPal Sandbox, Orders v2 via fetch
  - Create: `payments/paypal.ts` (create order, capture on return, verify webhook), `POST /api/webhooks/paypal`
  - Tests: HTTP mocked, capture marks paid, failed verification rejected
  - Ends with: sandbox buyer pays
- [ ] **Task 4.4: Flutterwave (or Paystack)**
  - Use: test keys, `verif-hash` header
  - Create: `payments/flutterwave.ts`, webhook that re-verifies the transaction via API before marking paid
  - Tests: valid hash + verified marks paid, amount mismatch rejected
  - Ends with: three providers share `markOrderPaid`
- [ ] **Task 4.5: payout ledger API**
  - Create: `GET /api/admin/payouts` (own rows: gross, fee, net)
  - Tests: own rows only, sums correct
  - Ends with: each shop sees its own cut
- [ ] **ML 03 (backend part) close:** run all tests incl. global flow (cart to paid to payout), push, commit `ml 03: end of payments - SAFE`, tag

---

# ML 04: Optional modules

## Sprint 06: Order history, customer analytics, delivery (+ stretch)
- [ ] **Task 6.1: order history (`hasOrderHistory`)**
  - Create: `GET /api/admin/orders` (tenant's items grouped by order, filters, pagination)
  - Tests: only own items, pagination, disabled 403
- [ ] **Task 6.2: customer tracking and analytics (`hasCustomerTracking`)**
  - Use: SQL GROUP BY / COUNT / SUM
  - Create: `GET /api/admin/customers`, `GET /api/admin/analytics/summary` (revenue by day, top products, new vs returning, avg order value)
  - Tests: metrics match hand-computed seed values, no leak, disabled 403
- [ ] **Task 6.3: delivery processing (`hasDeliveryProcessing`)**
  - Create: `markOrderPaid` sets `pending_dispatch` only when flag is on, `PATCH /api/admin/order-items/:id/delivery` (`pending_dispatch -> shipped -> delivered` only)
  - Tests: invalid transition 400, flag off never gets statuses, cross-tenant update blocked
- [ ] **Task 6.4 (stretch): quotations and purchase requests**
  - Create: tables + routes behind `hasQuotations` / `hasPurchaseRequests`
  - Tests: flag off 403, own requests only
- [ ] **ML 04 (backend part) close:** commit `ml 04: end of optional modules - SAFE`, tag

---

# ML 05: Hardening and release

## Sprint 08: Security, flow tests, release
- [ ] **Task 8.1: cross-tenant security suite**
  - Create: `tests/security/isolation.test.ts` looping over every `/api/admin/*` route as tenant B, plus unauthenticated and disabled-feature matrix
  - Ends with: build fails if a new admin route forgets the gates
- [ ] **Task 8.2: hardening**
  - Use: helmet, express-rate-limit
  - Create: rate limits on auth and checkout, body size limit, CORS allowlist from env, error handler hiding stacks in production, env variable list per environment
- [ ] **Task 8.3: production release**
  - Create: production env vars (test-mode payment keys), webhook URLs registered in each provider dashboard, seed script for two demo shops, PR `develop -> main`
- [ ] **Task 8.4: README**
  - Create: setup, env, branch workflow, how to run tests
- [ ] **ML 05 close:** commit `ml 05: end of hardening and release - SAFE`, tag `ml-05`, PR to `main`
