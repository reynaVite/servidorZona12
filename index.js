const express = require('express');  
const mysql = require('mysql2/promise');
 
const app = express();

const PORT = process.env.PORT || 3000;


const pool = mysql.createPool({
  host: '162.241.62.202',
  user: 'eduzonac_adminZona',
  password: '.51?^^7mU6$1',
  database: 'eduzonac_012zona',
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});

app.use((req, res, next) => {
  req.mysqlPool = pool;
  next();
});

app.get('/', async (req, res) => {
  try {
    const connection = await req.mysqlPool.getConnection();
    console.log('Conexión exitosa a la base de datos');
    connection.release();
    res.send('Conexión exitosa a la base de datos');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    res.status(500).send('Error al conectar a la base de datos');
  }
});

app.get('/consultarActividades', async (req, res) => {
  let connection;
  try {
    const query = 'SELECT * FROM agenda';
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener actividades:', error);
    res.status(500).json({ error: 'Error al obtener actividades' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

 

 


app.post('/guardarAgenda', async (req, res) => {
  let connection;

  try {
    // Mostrar cada dato individualmente
    console.log('Datos recibidos para la agenda - Título:', req.body.titulo);
    console.log('Descripción:', req.body.descripcion);
    console.log('Asignación:', req.body.asignacion);
    console.log('Fecha:', req.body.fecha);
    console.log('Hora:', req.body.hora);

    // Asignación de valores para la consulta SQL
    const titulo = req.body.titulo;
    const descripcion = req.body.descripcion;
    const asignacion = req.body.asignacion;
    const fecha = req.body.fecha;
    const hora = req.body.hora;

    connection = await req.mysqlPool.getConnection();
    const query = 'INSERT INTO agenda (titulo, descripcion, tipo_asig, fecha_sol, hora_sol, fecha_creacion) VALUES (?,?,?,?,?, NOW())'; 
    await connection.query(query, [titulo, descripcion, asignacion, fecha, hora]);
    console.log('Datos insertados correctamente a la agenda'); 
    res.json({ success: true, message: 'Datos insertados correctamente a la agenda' });
  } catch (error) {
    console.error('Error al procesar la solicitud: ', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  } finally {
    if (connection) {
      connection.release(); 
    }
  }
});



 
 
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
