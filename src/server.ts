// filepath: /home/xgen0/metlabs-pt/metlabs-pt-back/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

const app = express();
const port = process.env.PORT || 3010;

// Configure CORS first
app.use(
  cors({
    origin: process.env.NEXT_APP_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Mount Better Auth handler for all auth routes
// Important: Place this BEFORE express.json() middleware
app.all("/api/auth/*splat", toNodeHandler(auth)); // For ExpressJS v5

// Mount express.json middleware AFTER Better Auth handler
// Only for routes that don't interact with Better Auth
app.use(express.json());

// Example protected route to get user session
app.get("/api/test/session", async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    
    if (!session.user)
      res.status(401).json({ error: "Not authenticated" });
    
    res.json(session);
  } catch (error){ 
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
  console.log(`Authentication server running on port ${port}`);
});
