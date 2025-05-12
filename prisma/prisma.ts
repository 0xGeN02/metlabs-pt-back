import { PrismaClient } from "./generated/client";

declare global {
  var prsima: PrismaClient | undefined;
}

const prisma = globalThis.prsima || new PrismaClient();
if (process.env.NODE_ENV != "production") globalThis.prsima = prisma;

export default prisma;
