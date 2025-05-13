import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prismadb/generated/client";
import bcrypt from 'bcrypt';
import { sign, Secret, SignOptions } from 'jsonwebtoken';
import { id } from "ethers";

const prisma = new PrismaClient();
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

// Define el esquema para la respuesta
const responseSchema = z.object({
  message: z.string(),
  success: z.boolean(),
  user: z.object({
    email: z.string().email(),
    id: z.string(),
  }),
});

export async function POST(req: Request, res: Response) {
  try {
    const body = req.body;
    // Agregar logs para depuración
    console.log("Datos recibidos en el cuerpo:", body);
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      console.error("Error de validación:", validation.error.format());
      return res.status(400).json({
        error: "Datos de inicio de sesión inválidos",
        details: validation.error.format(),
      });
    }

    console.log("Datos validados correctamente:", validation.data);

    const { email, password } = validation.data;

    // Buscar el usuario en la base de datos
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      console.error("Usuario no encontrado para el correo:", email);
      return res.status(401).json({
        error: "Usuario o contraseña incorrectos",
      });
    }

    // Verificar la contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.error("Contraseña incorrecta para el usuario:", email);
      return res.status(401).json({
        error: "Contraseña incorrecta",
      });
    }

    console.log("Usuario autenticado correctamente:", user);

    //  Generar un token JWT y enviarlo al cliente
    const jwtSecret = process.env.JWT_SECRET as Secret;
    const jwtExpiration = process.env.JWT_EXPIRATION as SignOptions['expiresIn'] || '1h';

    if (!jwtSecret) {
      console.error("JWT_SECRET no está definido en las variables de entorno");
      return res.status(500).json({
        error: 'Error interno del servidor: JWT_SECRET no está definido'
      });
    }

    console.log("Generando token JWT para el usuario:", user.id);

    const payload = { userId: user.id, email: user.email };
    const options: SignOptions = { expiresIn: jwtExpiration };

    const token = sign(payload, jwtSecret, options);

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: { jwt: token },
      });
      console.log("Token actualizado en la base de datos para el usuario:", user.id);
    } catch (error) {
      console.error("Error al actualizar el token en la base de datos:", error);
      return res.status(500).json({
        error: "Error al actualizar el token en la base de datos",
      });
    }

    const response = {
      message: "Inicio de sesión exitoso",
      success: true,
      user: {
        email,
        id: user.id,
      },
    };

    const parsedResponse = responseSchema.safeParse(response);

    if (!parsedResponse.success) {
      console.error("Formato de respuesta inválido:", parsedResponse.error);
      return res.status(500).json({ error: "Formato de respuesta inválido" });
    }

    return res.status(201).json(parsedResponse.data);
  } catch (error) {
    console.error("Error en el login:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}