const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// --- OBTENER TODAS LAS PROPIEDADES (Catálogo Público) ---
router.get('/', async (req, res) => {
    try {
        const resultado = await pool.query(`
            SELECT p.*, u.nombre as vendedor_nombre, u.correo as vendedor_correo, u.telefono as vendedor_telefono 
            FROM propiedades p
            JOIN usuarios u ON p.vendedor_id = u.id
            ORDER BY p.fecha_publicacion DESC
        `);
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al obtener el catálogo de propiedades.' });
    }
});

// --- CREAR UNA NUEVA PROPIEDAD (Solo Vendedores) ---
router.post('/', async (req, res) => {
    try {
        const { vendedor_id, titulo, descripcion, precio, ubicacion, estado_comercial } = req.body;

        // Validar que el usuario exista y sea Vendedor
        const userCheck = await pool.query('SELECT rol FROM usuarios WHERE id = $1', [vendedor_id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'El vendedor especificado no existe.' });
        }

        if (userCheck.rows[0].rol !== 'Vendedor' && userCheck.rows[0].rol !== 'Administrador') {
            return res.status(403).json({ error: 'Acceso denegado. Solo los vendedores pueden publicar propiedades.' });
        }

        // Insertar la propiedad en PostgreSQL
        const nuevaPropiedad = await pool.query(
            `INSERT INTO propiedades (vendedor_id, titulo, descripcion, precio, ubicacion, estado_comercial) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [vendedor_id, titulo, descripcion, precio, ubicacion, estado_comercial || 'Disponible']
        );

        res.status(201).json({
            mensaje: 'Propiedad publicada exitosamente en Nexo',
            propiedad: nuevaPropiedad.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno en el servidor al registrar la propiedad.' });
    }
});

module.exports = router;