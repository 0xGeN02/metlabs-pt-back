// Código para tu servidor Node.js separado
import { betterAuth } from "better-auth";
import { PrismaClient } from "@prisma/client";
import { prismaAdapter } from "better-auth/adapters/prisma";
import cors from "cors";
import express from "express";

const app = express();
const prisma = new PrismaClient();

// Configurar CORS para permitir solicitudes desde tu frontend
app.use(cors({
  origin: process.env.NEXT_APP_URL,
  credentials: true
}));

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
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Añadir redirectUri apuntando a tu frontend
      redirectUri: `${process.env.FRONTEND_URL}/api/auth/callback/google`
    },
  },
});

// Montar las rutas de autenticación
app.use("/api/auth");

app.listen(process.env.PORT, () => {
  console.log(`Servidor de autenticación ejecutándose en el puerto ${process.env.PORT}`);
});