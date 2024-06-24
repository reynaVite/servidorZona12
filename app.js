const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmetCSP = require('helmet-csp');
const mysql = require('mysql2/promise');
const app = express();

const routes = require('./routes');

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(helmet());
app.use(helmetCSP());

// Configuración de la conexión a la base de datos
const pool = mysql.createPool({
  host: '162.241.62.202',
  user: 'eduzonac_adminZona',
  password: '.51?^^7mU6$1',
  database: 'eduzonac_012zona',
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});

// Middleware para adjuntar el pool de MySQL a cada solicitud
app.use((req, res, next) => {
  req.mysqlPool = pool;
  next();
});

// Rutas
app.use('/api', routes); // todas las rutas comienzan con /api

// Importar y utilizar el router de conexión
const conexionRouter = require('./routes/conexion');
app.use('/api', conexionRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
