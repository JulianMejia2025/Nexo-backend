const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// --- RUTA DE REGISTRO DE USUARIOS (RF-01) ---
router.post('/register', async (req, res) => {
    try {
        const { nombre, correo, password_hash, telefono, rol } = req.body;

        // 1. Validar si el usuario ya existe en la base de datos
        const usuarioExistente = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (usuarioExistente.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya se encuentra registrado.' });
        }

        // 2. Encriptar la contraseña usando bcrypt (Requerimiento de seguridad RF-01)[cite: 6]
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // 3. Insertar el nuevo usuario en la base de datos PostgreSQL
        const nuevoUsuario = await pool.query(
            `INSERT INTO usuarios (nombre, correo, password_hash, telefono, rol) 
             VALUES ($1, $2, $3, $4, $5) RETURNING id, nombre, correo, rol, fecha_creacion`,
            [nombre, correo, passwordHash, telefono, rol]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado exitosamente en Nexo',
            usuario: nuevoUsuario.rows[0]
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno en el servidor durante el registro.' });
    }
});

// --- RUTA DE INICIO DE SESIÓN (RF-01) ---
router.post('/login', async (req, res) => {
    try {console.log('Petición de login recibida:', req.body);
        const { correo, password } = req.body;

        // 1. Buscar al usuario por su correo
        const resultado = await pool.query('SELECT * FROM usuarios WHERE correo = $1', [correo]);
        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas (correo no encontrado).' });
        }

        const usuario = resultado.rows[0];

        // 2. Comparar la contraseña ingresada con el hash almacenado usando bcrypt
        const passwordValido = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordValido) {
            return res.status(401).json({ error: 'Credenciales inválidas (contraseña incorrecta).' });
        }

        // 3. Generar un Token JWT con tiempo de expiración (RF-01)[cite: 6]
        const token = jwt.sign(
            { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: '8h' } // La sesión expira en 8 horas
        );

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error interno en el servidor durante el inicio de sesión.' });
    }
});

module.exports = router;