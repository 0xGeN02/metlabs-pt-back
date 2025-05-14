import React from 'react';
import { Html, Head, Body, Container, Button, Text } from '@react-email/components';

interface Props { resetUrl: string; }

export default function ForgotPasswordEmail({ resetUrl }: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#F5F5F5', margin: 0, padding: 0 }}>
        <Container style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '24px' }}>
          <Text style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>
            Restablece tu contraseña
          </Text>
          <Text style={{ fontSize: '16px', marginBottom: '24px' }}>
            Haz click en el siguiente botón para cambiar tu contraseña. Este enlace expirará en 1 hora.
          </Text>
          <Button
            style={{
              backgroundColor: '#1E1E3E',
              color: '#FFFFFF',
              borderRadius: '6px',
              textDecoration: 'none',
              padding: '12px 20px',
            }}
            href={resetUrl}
          >
            Restablecer contraseña
          </Button>
          <Text style={{ fontSize: '14px', marginTop: '24px', color: '#666666' }}>
            Si no solicitaste este correo, ignóralo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}