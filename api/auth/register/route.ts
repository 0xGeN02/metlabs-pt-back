import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "../../../prisma/generated/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Esquema de validación que coincide con el del frontend
const registerSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio"),
  email: z.string().email("Correo electrónico inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
      "La contraseña debe contener mayúscula, minúscula, número y un caracter especial"
    ),
    phone: z.coerce.string().min(9, "El teléfono es obligatorio"),
    nationality: z.coerce.string().min(2, "La nacionalidad es obligatoria"),
    birth_date: z.coerce.date().refine((date) => {
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 18;
    }
    , "Debes tener al menos 18 años para registrarte"),
});

export async function POST(req: Request, res: Response) {
  try {
    const body = req.body;
    
    // Validar datos de entrada
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Datos de registro inválidos",
        details: validationResult.error.format()
      });
    }

    const { name, email, password , phone, nationality, birth_date} = validationResult.data;

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: "El correo electrónico ya está registrado"
      });
    }

    // Generar hash de la contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el nuevo usuario
    const newUser = await prisma.user.create({
    data: {
        name,
        email,
        password: hashedPassword,
        phone,
        nationality,
        birth_date,
      }
    });

    // Excluir la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: "Usuario registrado exitosamente",
      user: userWithoutPassword
    });
    
  } catch (error) {
    console.error("Error en el registro:", error);
    return res.status(500).json({
      error: "Error interno del servidor"
    });
  }
}
