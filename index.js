const express = require('express');
const helmet = require('helmet'); 
const path = require('path'); 
const fs = require('fs');
const util = require('util'); 
const bcrypt = require('bcrypt');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const uuid = require('uuid');
const { Typography } = require('antd');
const { Paragraph } = Typography;
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(helmet());
const moment = require('moment'); 
const routes = require('./routes');  

//rutas de las apis
const inicioSesion = require('./apis/inicioSesion'); 
const RecuperarContrasena = require('./apis/RecuperarContrasena'); 
const PreRegistro = require('./apis/PreRegistro'); 
const RegistroFinal = require('./apis/RegistroFinal');
const usuariosAdmin = require('./apis/usuariosAdmin');
const AsignarAgenda = require('./apis/AsignarAgenda');
const AgendaEntregados = require('./AgendaEntregados');
const ExamenElaboracion = require('./apis/ExamenElaboracion'); 
const Foro = require('./Foro'); 
const asignarGrupo  = require('./apis/asignarGrupo');
const consultarAgenda = require('./apis/agenda')
const AdminSol = require('./apis/AdminSol')
const RegAlumnos = require('./apis/RegAlumnos')
const Asignados = require('./apis/Asignados')
const Misalumnos = require('./apis/Misalumnos')
const SaludDatos = require('./apis/SaludDatos')
const CambiosEvidencia = require('./apis/CambiosEvidencia')
const RezagoAcademico= require('./apis/RezagoAcademico')
const admin = require('./apis/firebaseAdmin')

app.use(cors());


const pool = mysql.createPool({
  host: 'srv1578.hstgr.io',
  user: 'u549185319_eduzona',
  password: 'R]|!u4Nt$4',
  database: 'u549185319_eduzona',
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});
 

/*
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'eduzonac_adminzona',
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});

*/




module.exports = pool;
// Middleware para adjuntar el pool de MySQL a cada solicitud
app.use((req, res, next) => {
  req.mysqlPool = pool;
  next();
});

// Rutas
app.use(routes);
app.use(inicioSesion);
app.use(RecuperarContrasena);
app.use(PreRegistro);
app.use(RegistroFinal);
app.use(usuariosAdmin);
app.use(AsignarAgenda);
app.use(AgendaEntregados);
app.use(ExamenElaboracion);
app.use(Foro);
app.use(asignarGrupo);
app.use(consultarAgenda);
app.use(AdminSol);
//app.use(RegAlumnos);
app.use(Asignados);
app.use(Misalumnos);
app.use(SaludDatos);
app.use(CambiosEvidencia);
app.use(RezagoAcademico);
app.use(express.json());

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




// Endpoint para enviar notificaciones
app.post('/send-notification', async (req, res) => {
  const { token } = req.body; // Recibe el token del dispositivo desde el cuerpo de la solicitud

  const message = {
    notification: {
      title: 'Notificación de Prueba', // Título de la notificación
      body: 'Hola, es una prueba', // Cuerpo de la notificación
    },
    token: token, // El token del dispositivo que recibirá la notificación
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notificación enviada:', response);
    res.status(200).send('Notificación enviada con éxito');
  } catch (error) {
    console.error('Error al enviar notificación:', error);
    res.status(500).send('Error al enviar notificación');
  }
});























 
//REVISAR
app.get('/verificar_asignacionGG', async (req, res) => {
  let connection;

  try {
    const plantel = req.app.locals.plantel;
    const { grupo, grado } = req.query;

    // Mostrar los datos recibidos en la consola
    console.log("Datos recibidos:");
    console.log("Grado:", grado);
    console.log("Grupo:", grupo);
    console.log("Plantel ID:", plantel);

    // Obtener una conexión del pool de conexiones MySQL
    connection = await req.mysqlPool.getConnection();

    // Consulta SQL para verificar la asignación
    const query = `
        SELECT COUNT(*) AS count
        FROM asignacion_g
        WHERE grado_id = ? AND grupo_id = ? AND docente_plantel = ?
    `;
    const [results] = await connection.execute(query, [grado, grupo, plantel]);

    // Devolver el resultado al cliente
    res.json({ count: results[0].count });
  } catch (error) {
    console.error("Error al verificar la asignación de grado y grupo:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión al pool
    }
  }
});
app.get('/saludAlumRe', async (req, res) => {
  let connection; // Declarar la variable de conexión aquí para que esté disponible en el bloque `finally`
  try {
    const query = 'SELECT * FROM saludAlum'; // Seleccionar todos los campos de la tabla saludAlum
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener datos de saludAlum:', error);
    res.status(500).json({ error: 'Error al obtener datos de saludAlum' });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión a la base de datos incluso si ocurre un error
    }
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




app.get('/ObtenerGruGra', async (req, res) => {
  const plantel = req.app.locals.plantel;
  const curp = req.app.locals.curp;
  let connection;
  let vacios = 0;
  let conDatos = 0;

  try {
    // Obtener una conexión del pool
    connection = await pool.getConnection();

    // Ejecutar la consulta SQL utilizando JOIN para unir las tablas
    const consulta = `
      SELECT asignacion_g.grado_id, asignacion_g.grupo_id, grupo.grupo, 
             (SELECT nombre FROM plantel WHERE id = ?) AS plantel_nombre
      FROM asignacion_g 
      INNER JOIN grupo ON asignacion_g.grupo_id = grupo.id 
      WHERE asignacion_g.docente_curp = ?
    `;
    const [resultado] = await connection.query(consulta, [plantel, curp]);

    // Mapear los resultados para incluir la curp en cada objeto
    const resultadosConCurp = resultado.map(item => ({
      curp: curp,
      grado_id: item.grado_id,
      grupo_id: item.grupo_id,
      grupo: item.grupo,
      plantel_nombre: item.plantel_nombre
    }));

    // Almacenar todos los datos de alumnos y salud
    const datosCompletos = [];

    // Iterar sobre los resultados para ejecutar las consultas para cada uno
    for (const resultado of resultadosConCurp) {
      const consultaAlumnos = `
        SELECT idAlumnos, sexo
        FROM alumnos
        WHERE docente_curp = ? AND grado_id = ? AND grupo_id = ?
      `;
      const [alumnos] = await connection.query(consultaAlumnos, [curp, resultado.grado_id, resultado.grupo_id]);
      console.log(`Datos de alumnos para curp ${curp}, grado_id ${resultado.grado_id} y grupo_id ${resultado.grupo_id}:`, alumnos);

      // Almacenar datos de alumnos
      datosCompletos.push({

        resultadosConCurp: {
          curp: curp,
          grado_id: resultado.grado_id,
          grupo_id: resultado.grupo_id,
          grupo: resultado.grupo,
          plantel_nombre: resultado.plantel_nombre
        },
        alumnos: alumnos,
      });

      // Consultar la tabla unicoAlergias para obtener los valores reales de las alergias
      for (const alumno of alumnos) {
        const consultaAlergias = `
    SELECT alergias.alergia
    FROM unicoAlergias
    INNER JOIN alergias ON unicoAlergias.valor = alergias.id
    WHERE unicoAlergias.idAlumno = ?
  `;
        const [alergias] = await connection.query(consultaAlergias, [alumno.idAlumnos]);
        console.log(`Alergias para idAlumnos ${alumno.idAlumnos}:`, alergias);

        // Almacenar datos de alergias
        datosCompletos.push({
          alumno: alumno,
          alergias: alergias
        });
      }



      // Consultar la tabla unicoDiscapacidad para obtener los valores reales de las discapacidades
      for (const alumno of alumnos) {
        const consultaDiscapacidad = `
    SELECT discapacidad.nombre
    FROM unicoDiscapa
    INNER JOIN discapacidad ON unicoDiscapa.valor = discapacidad.id
    WHERE unicoDiscapa.idAlumno = ?
  `;
        const [discapacidad] = await connection.query(consultaDiscapacidad, [alumno.idAlumnos]);
        console.log(`Discapacidad para idAlumnos ${alumno.idAlumnos}:`, discapacidad);

        // Almacenar datos de discapacidad
        datosCompletos.push({
          alumno: alumno,
          discapacidad: discapacidad
        });
      }


      // Consultar la tabla unicoVacuna para obtener los valores reales de las vacunas
      for (const alumno of alumnos) {
        const consultaVacunas = `
    SELECT vacunas.nombre
    FROM unicoVacuna
    INNER JOIN vacunas ON unicoVacuna.valor = vacunas.id
    WHERE unicoVacuna.idAlumno = ?
  `;
        const [vacunas] = await connection.query(consultaVacunas, [alumno.idAlumnos]);
        console.log(`Vacunas para idAlumnos ${alumno.idAlumnos}:`, vacunas);

        // Almacenar datos de vacunas
        datosCompletos.push({
          alumno: alumno,
          vacunas: vacunas
        });
      }

      // Consulta en la tabla saludAlum
      for (const alumno of alumnos) {
        const consultaSalud = `
          SELECT Categorias.nombre AS categoria, saludAlum.valor
          FROM saludAlum
          INNER JOIN Categorias ON saludAlum.idCategoria = Categorias.id
          WHERE saludAlum.idAlumno = ?
        `;
        const [salud] = await connection.query(consultaSalud, [alumno.idAlumnos]);
        console.log(`Datos de salud para idAlumnos ${alumno.idAlumnos}:`, salud);

        // Almacenar datos de salud
        datosCompletos.push({ salud: salud });

        // Verificar si los datos de salud están vacíos o no
        if (salud.length === 0) {
          vacios++;
        } else {
          conDatos++;
        }
      }
    }

    // Enviar todos los datos como respuesta
    res.json(datosCompletos);

    // Enviar la cuenta de datos de salud vacíos y con datos
    console.log(`Datos de salud vacíos: ${vacios}`);
    console.log(`Datos de salud con información: ${conDatos}`);

  } catch (error) {
    // Manejar cualquier error
    console.error('Error al ejecutar la consulta:', error);
    res.status(500).send('Error interno del servidor');

  } finally {
    // Asegurarse de liberar la conexión después de su uso
    if (connection) {
      connection.release();
    }
  }
});


app.get('/rezagoAlumno', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rezagoRows] = await connection.execute(`
      SELECT *
      FROM rezagoAlumno
    `);
    if (rezagoRows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron datos en la tabla rezagoAlumno' });
    } 
    res.json(rezagoRows);
  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    res.status(500).json({ error: 'Error en la consulta SQL' });
  } finally { 
    if (connection) {
      connection.release();
    }
  }
});

 

app.put('/rezagoAlumno/:idAlumnos', async (req, res) => {
  let connection;
  const { idAlumnos } = req.params;
  const { habilidad_lectura, habilidad_escritura, habilidad_matematica, participacion, comportamiento } = req.body;

  try {
    connection = await pool.getConnection();

    const query = `
      UPDATE rezagoAlumno
      SET habilidad_lectura = ?, habilidad_escritura = ?, habilidad_matematica = ?, participacion = ?, comportamiento = ?
      WHERE idAlumnos = ?`;

    await connection.execute(query, [habilidad_lectura, habilidad_escritura, habilidad_matematica, participacion, comportamiento, idAlumnos]);

    res.status(200).json({ message: 'Registro actualizado correctamente' });

  } catch (error) {
    console.error('Error al actualizar el registro:', error);
    res.status(500).json({ error: 'Error al actualizar el registro' });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});


app.delete('/rezagoAlumno/:idAlumnos', async (req, res) => {
  let connection;
  const { idAlumnos } = req.params;

  try {
    connection = await pool.getConnection();

    const query = `DELETE FROM rezagoAlumno WHERE idAlumnos = ?`;

    await connection.execute(query, [idAlumnos]);

    res.status(200).json({ message: 'Registro eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar el registro:', error);
    res.status(500).json({ error: 'Error al eliminar el registro' });

  } finally {
    if (connection) {
      connection.release();
    }
  }
});



 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
 

/* Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
*/

//510
//616
//1643

//1721

//3126