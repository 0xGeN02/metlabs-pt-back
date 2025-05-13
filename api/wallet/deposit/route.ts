import { z } from "zod";
import { PrismaClient } from "@prismadb/generated/client";
import { getContract, getSigner } from "@lib/contract";
import { Request, Response } from "express";

const prisma = new PrismaClient();

// Define a schema for request validation
const depositSchema = z.object({
  userId: z.string().nonempty("User ID is required"),
});

// Define the schema for the success response
const depositResponseSchema = z.object({
  message: z.string(),
  transactionHash: z.string(),
});

interface DepositRequestBody {
  userId: string;
  amount: number;
}

interface DepositSuccessResponse {
  message: string;
  transactionHash: string;
}

interface ErrorResponse {
  error: string | object;
}

export async function POST(
  req: Request<{}, {}, DepositRequestBody>,
  res: Response<DepositSuccessResponse | ErrorResponse>
) {
  try {
    // Parse and validate the request body
    const { userId} = depositSchema.parse(req.body);

    // Check if the user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Connect the contract with the signer
    const signer = getSigner();
    if (!signer) {
      return res.status(500).json({ error: "Signer is not defined" });
    }

    const contract = getContract().connect(signer);
    if (!contract) {
      return res.status(500).json({ error: "Contract is not defined" });
    }

    // Perform the transaction
    const tx = await contract.increaseBalance(); // No parameters as per ABI
    await tx.wait();
    if (!tx) {
      return res.status(500).json({ error: "Transaction failed" });
    }

    const message = `Deposit of ETH successful`;
    const response = {
      message: message,
      transactionHash: tx.hash,
    };

    const pasedSchema = depositResponseSchema.safeParse(response);
    if(!pasedSchema.success) {
      return res.status(500).json({ error: "Invalid response format" });
    }
    res.status(200).json(response);
  } catch (error) {
    console.error("Error processing deposit:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}