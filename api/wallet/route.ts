import { Request, Response } from "express";
import { PrismaClient } from "@prismadb/generated/client";
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

      //Revisa si existe la wallet
      const existingWallet = await prisma.wallet.findUnique({
        where: { public_key: address },
      });
      if (!existingWallet) {
        // Crea la wallet si no existe
        await prisma.wallet.create({
          data: {
            public_key: address,
            userId: userId,
          }
        });
      }
      res.status(201).json(postResponseSchema.parse({ ok: true }));
    } catch (err) {
      return res.status(401).json({ error: "Error in request" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}


