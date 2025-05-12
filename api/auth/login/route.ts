import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "../../../prisma/generated/client";
import bcrypt from 'bcrypt';
import { sign, Secret, SignOptions } from 'jsonwebtoken';

const prisma = new PrismaClient();
// Esquema de validación
const loginSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      "La contraseña debe contener mayúscula, minúscula, número y un caracter especial"
    ),
});

export async function POST(req: Request, res: Response) {
  try {
    const body = req.body;
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return res.status(400).json({
        error: "Datos de inicio de sesión inválidos",
        details: validation.error.format(),
      });
    }

    const { email, password } = validation.data;

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(401).json({
        error: "Usuario o contraseña incorrectos",
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Contraseña incorrecta",
      });
    }
    //  Generar un token JWT y enviarlo al cliente
    const jwtSecret = process.env.JWT_SECRET as Secret;
    const jwtExpiration = process.env.JWT_EXPIRATION as SignOptions['expiresIn'] || '1h';

    if (!jwtSecret) {
    return res.status(500).json({
        error: 'Error interno del servidor: JWT_SECRET no está definido'
    });
    }

    const payload = { userId: user.id, email: user.email };
    const options: SignOptions = { expiresIn: jwtExpiration };

    const token = sign(payload, jwtSecret, options);
    
    return res.status(200).json({
      message: "Inicio de sesión exitoso",
        user: {
            email,
            token
        },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}