import { describe, expect, it } from "vitest";

import { getDatabaseUrl } from "./db.js";

describe("getDatabaseUrl", () => {
  it("prefers prisma_postgres_PRISMA_DATABASE_URL when present", () => {
    const url = getDatabaseUrl({
      prisma_postgres_PRISMA_DATABASE_URL: "https://primary.example/db",
      prisma_postgres_POSTGRES_URL: "https://secondary.example/db",
      PRISMA_DATABASE_URL: "https://fallback.example/db"
    } as NodeJS.ProcessEnv);

    expect(url).toBe("https://primary.example/db");
  });

  it("falls back to prisma_postgres_POSTGRES_URL", () => {
    const url = getDatabaseUrl({
      prisma_postgres_POSTGRES_URL: "https://secondary.example/db",
      PRISMA_DATABASE_URL: "https://fallback.example/db"
    } as NodeJS.ProcessEnv);

    expect(url).toBe("https://secondary.example/db");
  });

  it("trims wrapped values", () => {
    const url = getDatabaseUrl({
      prisma_postgres_PRISMA_DATABASE_URL: "  'postgresql://user:pw@host:5432/db' \n"
    } as NodeJS.ProcessEnv);

    expect(url).toBe("postgresql://user:pw@host:5432/db");
  });

  it("returns null when nothing is configured", () => {
    const url = getDatabaseUrl({} as NodeJS.ProcessEnv);
    expect(url).toBeNull();
  });
});
