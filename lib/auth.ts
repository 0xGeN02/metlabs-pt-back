// filepath: /home/xgen0/metlabs-pt/metlabs-pt-back/lib/auth.ts
// Configuración de autenticación con Better Auth
import { betterAuth } from "better-auth";
import { PrismaClient } from "@prismadb/generated/client";
import { prismaAdapter } from "better-auth/adapters/prisma";

// Inicializar el cliente Prisma
const prisma = new PrismaClient();

export const auth = betterAuth({
  // Adaptador prisma
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  
  // Clave secreta compartida (debe ser la misma en ambos lados)
  secret: process.env.BETTER_AUTH_SECRET,

  // email+password
  emailAndPassword: { enabled: true },

  // Google OAuth
  socialProviders: {
    google: {
      prompt: "select_account+consent",
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/sign-in/social`,
    },
  },

  // trusted origins
  trustedOrigins: [
    process.env.NEXT_APP_URL!,
    process.env.NEXT_PUBLIC_API_URL!,
  ],
});