import { PrismaClient } from "@prismadb/generated/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export async function GET(req: Request, res: Response) {
  try {
    const userId = req.query.id as string;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
