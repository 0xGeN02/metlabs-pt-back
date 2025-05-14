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
import { GET as jwtHandler } from "@api/user/jwt/route";
import { GET as walletUserIdHandler } from "@api/wallet/[userId]/route";

const app = express();
const port = process.env.PORT || 3000;
const appURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

// Configure CORS first
app.use(
  cors({
    origin: appURL,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Type", "Authorization"],
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

app.use(express.json());

// Registration endpoint
app.post('/api/auth/register', (req: Request, res: Response) => {
  registerHandler(req, res);
});

app.post('/api/auth/login', (req: Request, res: Response) => {
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

// Register the wallet route
app.get('/api/wallet/:userId', (req: Request, res: Response) => {
  walletUserIdHandler(req, res);
});

// Register the user route
app.get('/api/user/:id', (req: Request, res: Response) => {
  userHandler(req, res);
});

// Register the JWT user route
app.get('/api/user/jwt', (req: Request, res: Response) => {
  jwtHandler(req, res);
});


app.all('/api/auth/{*any}', toNodeHandler(auth));


// Example route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: "Hello from the server!" });
});


app.listen(port, () => {
  console.log(`Authentication server running on port ${port}`);
});
