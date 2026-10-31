const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas de autenticación
const authRoutes = require('./routes/auth');
const propertyRoutes = require('./routes/properties'); // <--- Importar rutas
const appointmentRoutes = require('./routes/appointments'); // <--- Importar rutas de citas
const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/appointments', appointmentRoutes); // <--- Registrar endpoint

app.get('/', (req, res) => {
    res.json({ 
        estado: 'success', 
        mensaje: '¡Bienvenido a la API de Nexo (PropTech Backend)! El servidor se encuentra operando correctamente[cite: 6].' 
    });
});

app.listen(PORT, () => {
    console.log(`Servidor de Nexo ejecutándose exitosamente en el puerto ${PORT}`);
});