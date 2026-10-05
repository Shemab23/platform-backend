import request from "supertest";
import app from "../app"; // Adjust this path if your app.ts is in a different directory

describe("Global baseline test", () => {
  it("should return 200 ok from /health endpoint", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      ok: true,
      env: "local",
      status: "healthy",
    });
  });
});
