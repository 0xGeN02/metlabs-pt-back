import { PrismaClient } from "@prismadb/generated/client";
import { Request, Response } from "express";
import { z } from "zod";

const prisma = new PrismaClient();

// Define the schema for the request
const requestSchema = z.object({
  cookies: z.object({
    auth_token: z.string().optional(),
  }).optional(),
  headers: z.object({
    authorization: z.string().optional(),
  }).optional(),
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
  wallet: z.array(
    z.object({
      public_key: z.string(),
    })
  ),
});

export async function GET(req: Request, res: Response) {
  try {
    console.log("Incoming request to /api/user/jwt");

    // Validate the request using Zod
    const parsedRequest = requestSchema.safeParse({
      cookies: req.cookies,
      headers: req.headers,
    });

    if (!parsedRequest.success) {
      console.error("Invalid request format", parsedRequest.error);
      return res.status(400).json({ error: "Invalid request format" });
    }

    const token = parsedRequest.data.cookies?.auth_token || parsedRequest.data.headers?.authorization?.split(" ")[1];

    if (!token) {
      console.error("No authentication token provided");
      return res.status(401).json({ error: "No authentication token provided" });
    }

    console.log("Fetching user with JWT token:", token);
    const user = await prisma.user.findFirst({
      where: {
        jwt: token, // Directly match the JWT token in the database
      },
      include: {
        wallet: {
          select: {
            public_key: true,
          },
        },
      },
    });

    if (!user) {
      console.error("User not found for JWT token:", token);
      return res.status(404).json({ error: "User not found" });
    }

    console.log("User found:", user);

    // Validate the response using Zod
    const parsedResponse = responseSchema.safeParse(user);

    if (!parsedResponse.success) {
      console.error("Invalid response format", parsedResponse.error);
      return res.status(500).json({ error: "Invalid response format" });
    }

    return res.status(200).json(parsedResponse.data);
  } catch (err) {
    console.error("Internal server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}