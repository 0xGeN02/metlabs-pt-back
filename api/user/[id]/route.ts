import { PrismaClient } from "@prismadb/generated/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

// Define the schema for the response
const responseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  sex: z.string(),
  nationality: z.string(),
  birth_date: z.date(),
});

export async function GET(req: Request, res: Response) {
  try {
    // Obtener el id directamente de los parámetros de la URL
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validar la respuesta usando Zod
    const parsedResponse = responseSchema.safeParse(user);

    if (!parsedResponse.success) {
      console.error("Invalid response format", parsedResponse.error);
      return res.status(500).json({ error: "Invalid response format" });
    }

    return res.status(200).json(parsedResponse.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
