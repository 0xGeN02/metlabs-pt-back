import { Request, Response } from "express";
import { z } from "zod";
import { signInEmail } from "better-auth/api";

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



    // Puedes devolver el usuario, token, etc. según tu flujo
    return res.status(200).json({
      message: "Inicio de sesión exitoso",
        user: {
            email,
        },
    });
  } catch (error) {
    console.error("Error en el login:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}