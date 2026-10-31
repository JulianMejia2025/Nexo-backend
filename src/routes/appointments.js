const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { enviarCorreoConfirmacion } = require('../utils/mailer'); // <--- Importar utilidad de correo

// --- OBTENER TODAS LAS CITAS (Para paneles de control) ---
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT c.*, p.titulo as propiedad_titulo, u.nombre as comprador_nombre, u.correo as comprador_correo 
            FROM citas c
            JOIN propiedades p ON c.propiedad_id = p.id
            JOIN usuarios u ON c.comprador_id = u.id
            ORDER BY c.fecha DESC, c.hora DESC
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el listado de citas.' });
    }
});

// --- AGENDAR UNA NUEVA CITA (RF-03 / Caso de Uso CU-01) ---
router.post('/', async (req, res) => {
    try {
        const { propiedad_id, comprador_id, fecha, hora } = req.body;

        // 1. Validar que el comprador exista y tenga el rol adecuado
        const compradorCheck = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [comprador_id]);
        if (compradorCheck.rows.length === 0) {
            return res.status(404).json({ error: 'El comprador especificado no existe.' });
        }
        // 1. Obtener datos detallados del comprador y de la propiedad para el correo
        const datosComprador = await pool.query('SELECT nombre, correo FROM usuarios WHERE id = $1', [comprador_id]);
        if (datosComprador.rows.length === 0) {
            return res.status(404).json({ error: 'El comprador especificado no existe.' });
        }
        const datosPropiedad = await pool.query('SELECT titulo FROM propiedades WHERE id = $1', [propiedad_id]);
        if (datosPropiedad.rows.length === 0) {
            return res.status(404).json({ error: 'La propiedad especificada no existe.' });
        }
        const { nombre: compradorNombre, correo: compradorCorreo } = datosComprador.rows[0];
        const { titulo: propiedadTitulo } = datosPropiedad.rows[0];
 if (compradorCheck.rows.comprador_id && compradorCheck.rows[0].rol !== 'Comprador' && compradorCheck.rows[0].rol !== 'Administrador') {
            return res.status(403).json({ error: 'Solo los usuarios con rol de Comprador pueden agendar visitas.' });
        }

        // 2. Intentar registrar la cita en la base de datos
        // La restricción SQL unique_propiedad_horario protegerá contra el doble agendamiento automáticamente
        const nuevaCita = await pool.query(
            `INSERT INTO citas (propiedad_id, comprador_id, fecha, hora, estado_confirmacion) 
             VALUES ($1, $2, $3, $4, 'Confirmada') RETURNING *`,
            [propiedad_id, comprador_id, fecha, hora]
        );
         // 3. Disparar el correo electrónico de confirmación asíncronamente (RF-04)[cite: 6]
        enviarCorreoConfirmacion(compradorCorreo, compradorNombre, propiedadTitulo, fecha, hora);


        res.status(201).json({
            mensaje: '¡Cita agendada exitosamente en Nexo!',
            cita: nuevaCita.rows[0]
        });

    } catch (error) {
        // Capturar error específico de violación de restricción única en PostgreSQL (Código 23505)
        if (error.code === '23505') {
            return res.status(409).json({ 
                error: 'Horario no disponible. Este bloque de tiempo ya ha sido reservado para esta propiedad por otro comprador[cite: 6].' 
            });
        }

        console.error(error);
        res.status(500).json({ error: 'Error interno en el servidor al intentar agendar la cita.' });
    }
});

module.exports = router;