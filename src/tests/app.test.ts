import request from "supertest";
import app from "../app";

jest.mock("../db/index", () => ({
  db: {
    execute: jest.fn().mockResolvedValue({
      rows: [{ now: new Date().toISOString() }],
    }),
  },
}));

describe("Core Platform API Endpoints", () => {
  // Test 1: The Base Health Validation Endpoint
  describe("GET /health", () => {
    it("should process structural routing rules and return 200 OK", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        ok: true,
        env: "local",
        status: "healthy",
        database: "connected",
        timestamp: expect.any(String),
      });
    });
  });

  // Example Test 2: Standard Error/Fallback Endpoint Validation
  describe("GET /invalid-route-exception", () => {
    it("should return a clean 404 for unknown endpoints without hanging", async () => {
      const response = await request(app).get("/invalid-route-exception");
      expect(response.status).toBe(404);
    });
  });

  describe("GET /api/tenant/config", () => {
    it("should reutrn tenant name", async () => {
      const response = await request(app).get("/api/tenant/config");
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        slug: expect.any(String),
        hasOrderHistory: true,
        hasDeliveryProcessing: false,
      });
    });
  });
});
