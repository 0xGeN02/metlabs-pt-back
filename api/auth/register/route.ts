import { Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prismadb/generated/client";
import bcrypt from "bcrypt";
import { sign, Secret, SignOptions } from 'jsonwebtoken';

const prisma = new PrismaClient();

// Actualizar el esquema de validación para que coincida con el frontend
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
  confirmPassword: z.string(),
  phone: z.coerce.string().min(9, "El teléfono es obligatorio"),
  nationality: z.coerce.string().min(2, "La nacionalidad es obligatoria"),
  sex: z.enum(["male", "female"], { required_error: "El sexo es obligatorio" }),
  birth_date: z.string().refine((date) => {
    const d = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - d.getFullYear();
    return !isNaN(d.getTime()) && age >= 18;
  }, "Debes tener al menos 18 años para registrarte"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Define el esquema para la respuesta
const responseSchema = z.object({
  message: z.string(),
  user: z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    phone: z.string(),
    nationality: z.string(),
    sex: z.enum(["male", "female"], { required_error: "El sexo es obligatorio" }),
    birth_date: z.string(),
    token: z.string(),
  }),
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

    const { name, email, password , phone, nationality, sex, birth_date} = validationResult.data;

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
        sex,
        birth_date,
      }
    });

    // Generar un token JWT y enviarlo al cliente
    const jwtSecret = process.env.JWT_SECRET as Secret;
    const jwtExpiration = process.env.JWT_EXPIRATION as SignOptions['expiresIn'] || '1h';

    if (!jwtSecret) {
      return res.status(500).json({
        error: 'Error interno del servidor: JWT_SECRET no está definido'
      });
    }

    const payload = { userId: newUser.id, email: newUser.email };
    const options: SignOptions = { expiresIn: jwtExpiration };

    const token = sign(payload, jwtSecret, options);

    try {
      await prisma.user.update({
        where: { id: newUser.id },
        data: { jwt: token },
      });
    } catch (error) {
      return res.status(500).json({
        error: "Error al actualizar el token en la base de datos",
      });
    }
    // Excluir la contraseña de la respuesta
    const { password: _, ...userWithoutPassword } = newUser;

    const response = {
      message: "Usuario registrado exitosamente",
      user: {
        ...userWithoutPassword,
        token,
      },
    };

    const parsedResponse = responseSchema.safeParse(response);

    if (!parsedResponse.success) {
      console.error("Formato de respuesta inválido:", parsedResponse.error);
      return res.status(500).json({ error: "Formato de respuesta inválido" });
    }

    return res.status(201).json(parsedResponse.data);
    
  } catch (error) {
    console.error("Error en el registro:", error);
    return res.status(500).json({
      error: "Error interno del servidor"
    });
  }
}
