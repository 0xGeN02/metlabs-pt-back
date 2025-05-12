import { PrismaClient } from "@prisma/client";

declare global {
  var prima: PrismaClient | undefined;
}

const prisma = globalThis.prima || new PrismaClient();
if (process.env.NODE_ENV != "production") globalThis.prima = prisma;

export default prisma;
