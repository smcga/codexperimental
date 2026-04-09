import { createRequire } from "node:module";

type DbEnv = NodeJS.ProcessEnv;

const require = createRequire(import.meta.url);

const DATABASE_URL_ENV_KEYS = [
  "prisma_postgres_PRISMA_DATABASE_URL",
  "prisma_postgres_POSTGRES_URL",
  "PRISMA_DATABASE_URL",
  "POSTGRES_URL",
  "DATABASE_URL"
] as const;

type FindManyArgs = {
  where: { status: "pending" | "approved" | "rejected" };
  orderBy: { createdAt: "desc" };
  take: number;
};

type DoodleSubmissionRow = {
  id: string;
  imageData: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  moderatedAt: Date | null;
};

type EffectIdeaRow = {
  id: string;
  name: string;
  prompt: string;
  typescriptCode: string;
  runtimeCode: string;
  params: unknown;
  docs: unknown;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  moderatedAt: Date | null;
};

export type DbClient = {
  doodleSubmission: {
    findMany: (args: FindManyArgs) => Promise<DoodleSubmissionRow[]>;
    findUnique: (args: { where: { id: string } }) => Promise<DoodleSubmissionRow | null>;
    update: (args: { where: { id: string }; data: { status: "approved" | "rejected"; moderatedAt: Date } }) => Promise<unknown>;
    create: (args: { data: { id: string; imageData: string; createdAt: Date; status: "pending" } }) => Promise<unknown>;
  };
  effectIdea: {
    findMany: (args: FindManyArgs) => Promise<EffectIdeaRow[]>;
    findUnique: (args: { where: { id: string } }) => Promise<EffectIdeaRow | null>;
    update: (args: { where: { id: string }; data: { status: "approved" | "rejected"; moderatedAt: Date } }) => Promise<unknown>;
    create: (args: {
      data: {
        id: string;
        name: string;
        prompt: string;
        typescriptCode: string;
        runtimeCode: string;
        params?: unknown;
        docs?: unknown;
        createdAt: Date;
        status: "pending";
      };
    }) => Promise<unknown>;
  };
};

function normalizeEnvValue(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const unquoted = trimmed.replace(/^("|')(.*)\1$/s, "$2").trim();
  return unquoted || null;
}

export function getDatabaseUrl(env: DbEnv = process.env): string | null {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = normalizeEnvValue(env[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: DbClient | undefined;
}

export function createDbClient(env: DbEnv = process.env): DbClient | null {
  const url = getDatabaseUrl(env);
  if (!url) {
    return null;
  }

  if (globalThis.__prismaClient) {
    return globalThis.__prismaClient;
  }

  try {
    const prismaModule = require("@prisma/client") as {
      PrismaClient: new (args: { datasources: { db: { url: string } } }) => DbClient;
    };
    const client = new prismaModule.PrismaClient({
      datasources: {
        db: { url }
      }
    });
    globalThis.__prismaClient = client;
    return client;
  } catch (error) {
    console.error("[db] Failed to create Prisma client", error);
    return null;
  }
}
