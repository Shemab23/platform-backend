describe("Gloabal baseline test", () => {
  it("should return 200 ok from /health endpoint", async () => {
    const response = await fetch("http://localhost:3001/health");
    // { status: 200, body: { status: "healthy" } }
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      ok: true,
      env: "local",
      status: "healthy",
    });
  });
});
