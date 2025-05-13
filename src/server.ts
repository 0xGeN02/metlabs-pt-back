import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler, fromNodeHeaders  } from "better-auth/node";
import { auth } from "@lib/auth";
import { POST as registerHandler } from "@api/auth/register/route";
import { POST as loginHandler } from "@api/auth/login/route";
import { POST as walletHandler } from "@api/wallet/route";
import { POST as withdrawHandler } from "@api/wallet/withdraw/route";
import { POST as depositHandler } from "@api/wallet/deposit/route";
import { GET as userHandler } from "@api/user/[id]/route";
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

// Middleware para registrar solicitudes y respuestas
app.use((req: Request, res: Response, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });

  next();
});

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
app.post('/api/wallet', (req: Request, res: Response) => {
  walletHandler(req, res);
});

// Register the withdraw route
app.post('/api/wallet/withdraw', (req: Request, res: Response) => {
  withdrawHandler(req, res);
});

// Register the deposit route
app.post('/api/wallet/deposit', (req: Request, res: Response) => {
  depositHandler(req, res);
});

// Register the user route
app.get('/api/user/:id', (req: Request, res: Response) => {
  userHandler(req, res);
});

app.all('/api/auth/{*any}', toNodeHandler(auth));


// Example route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Hello from the server!" });
});


app.listen(port, () => {
  console.log(`Authentication server running on port ${port}`);
});
