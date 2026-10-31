const { Pool } = require('pg');
require('dotenv').config();

// Configuramos el pool de conexiones utilizando las variables de entorno
const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

// Verificamos el estado de la conexión a PostgreSQL
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error al conectar a la base de datos PostgreSQL:', err.stack);
    }
    console.log('Conexión exitosa a la base de datos PostgreSQL (nexo_db)');
    release();
});

module.exports = pool;