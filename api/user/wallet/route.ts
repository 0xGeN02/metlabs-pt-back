import { Request, Response } from "express";
import { PrismaClient } from "../../../prisma/generated/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function POST(req: Request, res: Response) {
  try {
    const { address } = req.body;
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
      await prisma.wallet.upsert({
        where: { public_key: address },
        update: {},
        create: { public_key: address },
      });

      res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(401).json({ error: "Token inválido o malformado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}