import { Request, Response } from "express";
import { PrismaClient } from "@prismadb/generated/client";
import jwt from "jsonwebtoken";
import { z } from "zod";

const prisma = new PrismaClient();

// Define el esquema de validación para req.body
const walletSchema = z.object({
  address: z.string().nonempty("La dirección es requerida"),
  balance: z.number().optional(),
});

export async function POST(req: Request, res: Response) {
  try {
    // Valida el cuerpo de la solicitud
    const parsedBody = walletSchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: parsedBody.error.errors,
      });
    }

    const { address, balance } = parsedBody.data;
    const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No autenticado" });

    try {
      // Decodifica el JWT para obtener el userId
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userId = decoded?.userId;

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
          balance: balance || undefined,
          userId: userId,
        }
      });

      res.status(201).json({ ok: true });
    } catch (err) {
      return res.status(401).json({ error: "Token inválido o malformado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

export async function GET(req: Request, res: Response) {
  try {
    const token = req.cookies?.auth_token || req.headers.authorization?.split(" ")[1];

    if (!token) return res.status(401).json({ error: "No autenticado" });

    try {
      // Decodifica el JWT para obtener el userId
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      const userId = decoded?.userId;

      if (!userId) return res.status(400).json({ error: "Usuario no encontrado" });

      // Obtén la wallet asociada al usuario
      const wallet = await prisma.wallet.findUnique({
        where: { userId },
        include: { user: true }, // Incluye los datos del usuario asociado
      });

      if (!wallet) return res.status(404).json({ error: "Wallet no encontrada" });

      res.status(200).json(wallet);
    } catch (err) {
      return res.status(401).json({ error: "Token inválido o malformado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

