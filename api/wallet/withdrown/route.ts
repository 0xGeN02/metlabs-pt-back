import { PrismaClient } from "@prisma/client";
import { getContract, getSigner, getWallet } from "@lib/contract";
import { Request, Response } from "express";

const prisma = new PrismaClient();

interface WithdrawRequestBody {
  userId: string;
}

interface WithdrawSuccessResponse {
  message: string;
  transactionHash: string;
}

interface ErrorResponse {
  error: string | object;
}

export async function POST(
  req: Request<{}, {}, WithdrawRequestBody>,
  res: Response<WithdrawSuccessResponse | ErrorResponse>
) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const smartContract = getContract();
    if (!smartContract) {
        return res.status(500).json({ error: "Smart contract is not defined" });
    }

    const signer = getSigner();
    if (!signer) {
        return res.status(500).json({ error: "Signer is not defined" });
    }

    const contractWithSigner = smartContract.connect(signer);
    if (!contractWithSigner) {
        return res.status(500).json({ error: "Contract with signer is not defined" });
    }

    const tx = await contractWithSigner.balanceDecrease();
    await tx.wait();
    if (!tx) {
        return res.status(500).json({ error: "Transaction failed" });
    }

    return res.status(200).json({ message: "Withdrawal successful", transactionHash: tx.hash });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}