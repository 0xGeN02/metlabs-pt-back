// filepath: /home/xgen0/metlabs-pt/metlabs-pt-back/server.ts
import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders  } from "better-auth/node";
import { auth } from "@lib/auth";
import { POST as registerHandler } from "@api/auth/register/route";
import { POST as loginHandler } from "@api/auth/login/route";
import { POST as walletHandler } from "@api/wallet/route";
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

// Mount express.json middleware AFTER Better Auth handler
// Only for routes that don't interact with Better Auth
app.use(express.json());

// Registration endpoint
app.post('/api/auth/register', (req: Request, res: Response) => {
  registerHandler(req, res);
});

app.post('/api/auth/sign-in/email', (req: Request, res: Response) => {
  loginHandler(req, res);
});

// Register the wallet route
app.post('/api/user/wallet', (req: Request, res: Response) => {
  walletHandler(req, res);
});

app.all('/api/auth/{*any}', toNodeHandler(auth));


// Example route
app.get('/api/hello', (req: Request, res: Response) => {
  res.json({ message: "Hello from the server!" });
});


app.listen(port, () => {
  console.log(`Authentication server running on port ${port}`);
});
