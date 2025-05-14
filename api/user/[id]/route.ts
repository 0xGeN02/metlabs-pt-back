import { PrismaClient } from "@prismadb/generated/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

// Define the schema for the request
const requestSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

// Define the schema for the response
const responseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string(),
  sex: z.string(),
  nationality: z.string(),
  birth_date: z.string(),
});

export async function GET(req: Request, res: Response) {
  try {
    // Validate the request using Zod
    const parsedRequest = requestSchema.safeParse({
      params: req.params,
    });

    if (!parsedRequest.success) {
      console.error("Invalid request format", parsedRequest.error);
      return res.status(400).json({ error: "Invalid request format" });
    }

    const userId = parsedRequest.data.params.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Validate the response using Zod
    const parsedResponse = responseSchema.safeParse(user);

    if (!parsedResponse.success) {
      console.error("Invalid response format", parsedResponse.error);
      return res.status(500).json({ error: "Invalid response format" });
    }

    return res.status(201).json(parsedResponse.data);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
