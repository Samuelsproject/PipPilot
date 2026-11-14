// @vitest-environment node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const applicationRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/reset-password",
  "/app",
  "/app/trading",
  "/app/strategies",
  "/app/news",
  "/app/risk",
  "/app/mt5",
  "/app/signals",
  "/app/backtesting",
  "/app/settings",
  "/app/support",
  "/app/admin",
];

describe("integrated production routing", () => {
  let webDistDirectory: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    webDistDirectory = mkdtempSync(path.join(os.tmpdir(), "pippilot-web-dist-"));
    mkdirSync(path.join(webDistDirectory, "assets"));
    writeFileSync(
      path.join(webDistDirectory, "index.html"),
      "<!doctype html><html><body><div id=\"root\">PipPilotAi SPA</div></body></html>",
    );
    writeFileSync(
      path.join(webDistDirectory, "assets", "app.js"),
      "window.pippilot = true;",
    );
    app = createApp(webDistDirectory);
  });

  afterEach(() => {
    rmSync(webDistDirectory, { recursive: true, force: true });
  });

  it.each(applicationRoutes)("serves the SPA for direct route %s", async (route) => {
    const response = await request(app).get(route).set("Accept", "text/html").expect(200);
    expect(response.text).toContain("PipPilotAi SPA");
  });

  it("serves built assets without replacing them with the SPA", async () => {
    const response = await request(app)
      .get("/assets/app.js")
      .expect(200)
      .expect("Content-Type", /javascript/);
    expect(response.text).toBe("window.pippilot = true;");
  });

  it("keeps API health and unknown routes out of the SPA fallback", async () => {
    await request(app)
      .get("/api/healthz")
      .expect(200)
      .expect("Content-Type", /json/)
      .expect({ status: "ok" });

    const response = await request(app)
      .get("/api/not-a-route")
      .set("Accept", "text/html")
      .expect(404)
      .expect("Content-Type", /json/);
    expect(response.body).toEqual({ error: "API route not found." });
    expect(response.text).not.toContain("PipPilotAi SPA");
  });

  it("preserves protected administrator access checks", async () => {
    await request(app)
      .get("/api/admin/users")
      .set("Accept", "text/html")
      .expect(401)
      .expect("Content-Type", /json/);
  });
});
