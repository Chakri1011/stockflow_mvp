import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis;

let dbInstance;

if (typeof window === "undefined") {
  const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  dbInstance = globalForPrisma.prisma || new PrismaClient({ adapter });
  
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = dbInstance;
  }
} else {
  dbInstance = null;
}

export const db = dbInstance;
