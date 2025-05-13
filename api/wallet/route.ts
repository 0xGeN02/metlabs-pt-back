import { Request, Response } from "express";
import { PrismaClient } from "@prismadb/generated/client";
import jwt from "jsonwebtoken";
import { z } from "zod";

const prisma = new PrismaClient();

// Define el esquema de validación para req.body
const reqSchema = z.object({
  address: z.string().nonempty("La dirección es requerida"),
  userId: z.string().nonempty("El ID de usuario es requerido"),
});

// Define el esquema para la respuesta de POST
const postResponseSchema = z.object({
  ok: z.boolean(),
});

// Define el esquema para la respuesta de GET
const getResponseSchema = z.object({
  public_key: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
});

export async function POST(req: Request, res: Response) {
  try {
    // Valida el cuerpo de la solicitud
    const parsedBody = reqSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: parsedBody.error.errors,
      });
    }

    const { address, userId } = parsedBody.data;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return res.status(401).json({ error: "No autenticado" });

    try {
      const userId = user?.id;
      if (!userId) return res.status(401).json({ error: "No autenticado." });

      if (!userId || !address) return res.status(400).json({ error: "Datos faltantes" });

      // Actualiza el usuario con el walletId antes de crear la wallet
      await prisma.user.update({
        where: { id: userId },
        data: { walletId: address },
      });

      // Crea la wallet si no existe
      await prisma.wallet.create({
        data: {
          public_key: address,
          userId: userId,
        }
      });

      res.status(201).json(postResponseSchema.parse({ ok: true }));
    } catch (err) {
      return res.status(401).json({ error: "Error in request" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function GET(req: Request, res: Response) {
  try {
    // Obtenemos el jwt del request
    const parseBody = reqSchema.safeParse(req.body);
    if (!parseBody.success) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: parseBody.error.errors,
      });
    }
    const { userId } = parseBody.data;
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) return res.status(401).json({ error: "No autenticado" });

    try {

      const userId = user?.id;
      if (!userId) return res.status(401).json({ error: "No autenticado." });

      if (!userId) return res.status(400).json({ error: "Usuario no encontrado" });

      // Obtén la wallet asociada al usuario
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!wallet) return res.status(404).json({ error: "Wallet no encontrada" });

      res.status(200).json(getResponseSchema.parse(wallet));
    } catch (err) {
      return res.status(401).json({ error: "Token inválido o malformado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

