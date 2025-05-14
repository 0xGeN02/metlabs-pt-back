import { PrismaClient } from "@prismadb/generated/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

// Define el esquema para la respuesta de GET
const getResponseSchema = z.object({
  public_key: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
  }),
});

export async function GET(req: Request, res: Response) {
  try {
    // Obtener el userId directamente de los parámetros de la URL
    const userId = req.params.userId;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: "No autenticado" });
    }

    // Obtén la wallet asociada al usuario
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!wallet) {
      return res.status(404).json({ error: "Wallet no encontrada" });
    }

    // Validar la respuesta usando Zod
    const parsedResponse = getResponseSchema.safeParse(wallet);

    if (!parsedResponse.success) {
      console.error("Invalid response format", parsedResponse.error);
      return res.status(500).json({ error: "Invalid response format" });
    }

    return res.status(200).json(parsedResponse.data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
