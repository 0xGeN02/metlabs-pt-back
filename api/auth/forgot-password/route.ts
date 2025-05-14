import { Request, Response } from 'express';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import ForgotPasswordEmail from '@email/templates/ForgotPasswordEmail';
import { z } from 'zod';
import { PrismaClient } from '@prismadb/generated/client'
import crypto from 'crypto';

const prisma = new PrismaClient();
const resendAPI = process.env.RESEND_API_KEY! as string;
if(!resendAPI) {
    throw new Error('RESEND_API_KEY is not defined');
}
const resend = new Resend(resendAPI);

const bodySchema = z.object({
  email: z.string().email(),
});

export const forgotPasswordHandler = async (req: Request, res: Response) => {
  try {
    const { email } = bodySchema.parse(req.body);

    // 1. Verificar usuario en BD
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Para no revelar existencia
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    // 2. Generar token y guardarlo
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
    await prisma.passwordReset.create({ data: { userId: user.id, token, expires } });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

    const html = await render(ForgotPasswordEmail({ resetUrl }));

    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Restablece tu contraseña',
      html,
    });

    return res.status(200).json({ message: 'Email enviado' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error interno' });
  }
};
