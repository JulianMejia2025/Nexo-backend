const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuración del transporte de correo utilizando Nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Función para enviar confirmación de cita (RF-04)
const enviarCorreoConfirmacion = async (destinatario, nombreComprador, propiedadTitulo, fecha, hora) => {
    try {
        const info = await transporter.sendMail({
            from: '"Plataforma Nexo 🏢" <no-reply@nexo.com>',
            to: destinatario,
            subject: `Confirmación de Visita Inmobiliaria - ${propiedadTitulo}`,
            html: `
                <div style="font-family: Arial, sans-serif; color: #333; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
                    <h2 style="color: #2c3e50;">¡Hola, ${nombreComprador}!</h2>
                    <p>Tu solicitud de agendamiento para la propiedad <strong>${propiedadTitulo}</strong> ha sido confirmada exitosamente.</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <p style="margin: 5px 0;"><strong>📅 Fecha:</strong> ${fecha}</p>
                        <p style="margin: 5px 0;"><strong>⏰ Hora:</strong> ${hora}</p>
                    </div>
                    <p>Te recordamos presentarte puntualmente en la ubicación del inmueble.</p>
                    <p style="color: #888; font-size: 12px; margin-top: 20px;">Este es un mensaje automático generado por la plataforma Nexo (PropTech)[cite: 6].</p>
                </div>
            `,
        });

        console.log('Correo de confirmación enviado exitosamente: %s', info.messageId);
        return true;
    } catch (error) {
        console.error('Error al enviar el correo electrónico:', error);
        return false;
    }
};

module.exports = { enviarCorreoConfirmacion };