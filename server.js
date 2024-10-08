const express = require('express');
const helmet = require('helmet');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' },{ storage: multer.memoryStorage() });
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

 



//Política de CSP: Solo scripts internos
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
    },
  })
);

// Configuración de la conexión a la base de datos
/*
const pool = mysql.createPool({
  host: '162.241.62.202',
  user: 'eduzonac_adminZona',
  password: '.51?^^7mU6$1',
  database: 'eduzonac_012zona',
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});
*/


const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'eduzonac_adminzona',
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});



 

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
app.use(RegAlumnos);


app.get('/conexionBaseDatos', async (req, res) => {
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

app.post('/insertar-datossss', async (req, res) => {
  let connection;
  try {
    const { dato } = req.body;
    connection = await req.mysqlPool.getConnection();
    await connection.query('INSERT INTO yo (dato) VALUES (?)', [dato]);
    res.status(200).send('Dato insertado correctamente en la base de datos');
  } catch (error) {
    console.error('Error al insertar dato en la base de datos:', error);
    res.status(500).send('Error al insertar dato en la base de datos');
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

 

 


 
 
 
 


const enviarMailBloAdmin = async (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  const mensajee = {
    from: 'zona012huazalingo@gmail.com',
    to: 'zona012huazalingo@gmail.com',
    subject: 'Usuario bloqueado en EduZona012',
    html: `
      <p>Usuario bloqueado debido a múltiples intentos fallidos de inicio de sesión:</p>
      <ul>
        <li>CURP: ${curp}</li>
        <li>Plantel: ${plantel}</li>
        <li>Sesión: ${sesion}</li>
        <li>Nombre: ${nombre} ${aPaterno} ${aMaterno}</li>
        <li>Correo: ${correo}</li>
      </ul>
    `
  };
  const transportt = nodemailer.createTransport(config);
  const infoo = await transportt.sendMail(mensajee);
  console.log(infoo);
};
const enviarMailBloClie = async (correo, nombre) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  const mensaje = {
    from: 'EduZona012 <zona012huazalingo@gmail.com>',
    to: correo,
    subject: 'Cuenta bloqueada en EduZona012',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #00314A; padding: 20px;">
          <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
        </div>
        <div style="background-color: #fff; padding: 20px;">
          <h3 style="margin-bottom: 20px;">Hola ${nombre},</h3>
          <p>Su cuenta en EduZona012 ha sido bloqueada debido a múltiples intentos fallidos de inicio de sesión.</p>
          <p>Para recuperar su cuenta, por favor diríjase a la página oficial y restablezca su contraseña.</p>
        </div>
        <div style="background-color: #00314A; padding: 20px; text-align: center;">
          <p style="margin-bottom: 0; color: #fff;">© 2024 EduZona012. Todos los derechos reservados.</p>
        </div>
      </div>
    `
  };
  const transport = nodemailer.createTransport(config);
  const info = await transport.sendMail(mensaje);
  console.log(info);
};


//YAAAA
app.get('/asignaciong', async (req, res) => {
  const plantel = req.app.locals.plantel;
  let connection;
  try {
    connection = await req.mysqlPool.getConnection();
    const query = `
      SELECT ag.*, r.nombre, r.aPaterno, r.aMaterno
      FROM asignacion_g AS ag
      JOIN registro AS r ON ag.docente_curp = r.curp
      WHERE ag.docente_plantel = ?
    `;
    const [results] = await connection.execute(query, [plantel]);
    console.log(`Se encontraron ${results.length} registros para el plantel ${plantel}`);
    results.forEach(docente => {
      console.log("ID:", docente.id);
      console.log("Nombre:", docente.nombre);
      console.log("Apellido Paterno:", docente.aPaterno);
      console.log("Apellido Materno:", docente.aMaterno);
    });
    res.json({ success: true, docentes: results });
  } catch (error) {
    console.error('Error al obtener registros de docentes:', error);
    res.status(500).json({ success: false, message: 'Error al obtener registros de docentes' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});



const enviarCorreoActAsig = async (correo, nombre, grupo, grado, plantel) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  let letraGrupo;
  switch (grupo) {
    case 1:
      letraGrupo = 'A';
      break;
    case 2:
      letraGrupo = 'B';
      break;
    default:
      letraGrupo = 'No definido';
      break;
  }
  let nombrePlantel;
  switch (plantel) {
    case 1:
      nombrePlantel = 'Zona 012';
      break;
    case 2:
      nombrePlantel = 'Benito Juárez';
      break;
    case 3:
      nombrePlantel = 'Héroe Agustín';
      break;
    default:
      nombrePlantel = 'No definido';
      break;
  }
  const mensaje = {
    from: 'EduZona012 <zona012huazalingo@gmail.com>',
    to: correo,
    subject: 'Actualización de Asignación de Grupo y Grado - EduZona012',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #00314A; padding: 20px;">
          <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
        </div>
        <div style="background-color: #fff; padding: 20px;">
          <h3 style="margin-bottom: 20px;">Hola ${nombre},</h3>
          <p>Te informamos que tu asignación de grupo y grado ha sido actualizada en el plantel ${nombrePlantel} de EduZona012.</p>
          <p>Ahora estás asignado al grupo ${letraGrupo} con grado ${grado}.</p>
          <p>Por favor, toma nota de esta actualización y asegúrate de dirigirte a tus clases correspondientes según tu nuevo grupo y grado.</p>
        </div>
        <div style="background-color: #00314A; padding: 20px; text-align: center;">
          <p style="margin-bottom: 0; color: #fff;">© 2024 EduZona012. Todos los derechos reservados.</p>
        </div>
      </div>
    `
  };
  const transport = nodemailer.createTransport(config);
  try {
    const info = await transport.sendMail(mensaje);
    console.log('Correo electrónico enviado:', info);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw error;
  }
};

//YAAAAAAAAA
app.post('/actualizar_asignacion', async (req, res) => {
  let connection;
  try {
    const { docenteId, grupo, grado } = req.body;
    console.log('Datos recibidos:', { docenteId, grupo, grado }); // Imprimir datos recibidos en la consola del servidor
    const sql = 'UPDATE asignacion_g SET grado_id = ?, grupo_id = ? WHERE id = ?';
    connection = await req.mysqlPool.getConnection();
    await connection.query(sql, [grado, grupo, docenteId]);
    console.log('Asignación actualizada correctamente');
    // Obtener el docente_curp de la tabla asignacion_g
    const docenteCurpQuery = `SELECT docente_curp FROM asignacion_g WHERE id = ?`;
    const [docenteCurpRows] = await connection.query(docenteCurpQuery, [docenteId]);
    const docenteCurp = docenteCurpRows[0].docente_curp;
    // Obtener el correo asociado a la CURP desde la tabla registro
    const emailQuery = `SELECT correo, nombre, plantel FROM registro WHERE curp = ?`;
    const [rows] = await connection.query(emailQuery, [docenteCurp]);
    if (rows.length === 0) {
      throw new Error('No se encontró ningún registro con la CURP proporcionada');
    }
    const { correo, nombre, plantel } = rows[0];
    await enviarCorreoActAsig(correo, nombre, grupo, grado, plantel);
    res.json({ success: true, message: 'Asignación actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la asignación: ', error);
    res.status(500).json({ success: false, message: 'Error al actualizar la asignación' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


const enviarCorreoBorraAsig = async (correo, nombre, grupo_id, grado_id, plantel) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    },
    tls: {
      rejectUnauthorized: false
    }
  };
  let letraGrupo;
  switch (grupo_id) {
    case 1:
      letraGrupo = 'A';
      break;
    case 2:
      letraGrupo = 'B';
      break;
    default:
      letraGrupo = 'No definido';
      break;
  }
  let nombrePlantel;
  switch (plantel) {
    case 1:
      nombrePlantel = 'Zona 012';
      break;
    case 2:
      nombrePlantel = 'Benito Juárez';
      break;
    case 3:
      nombrePlantel = 'Héroe Agustín';
      break;
    default:
      nombrePlantel = 'No definido';
      break;
  }
  const mensaje = {
    from: 'EduZona012 <zona012huazalingo@gmail.com>',
    to: correo,
    subject: 'Eliminación de Asignación de Grupo y Grado - EduZona012',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #00314A; padding: 20px;">
          <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
        </div>
        <div style="background-color: #fff; padding: 20px;">
          <h3 style="margin-bottom: 20px;">Hola ${nombre},</h3>
          <p>Te informamos que tu asignación de grupo y grado ha sido eliminada en el plantel ${nombrePlantel} de EduZona012.</p>
          <p>Anteriormente estabas asignado al grupo ${letraGrupo} con grado ${grado_id}.</p>
          <p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
        </div>
        <div style="background-color: #00314A; padding: 20px; text-align: center;">
          <p style="margin-bottom: 0; color: #fff;">© 2024 EduZona012. Todos los derechos reservados.</p>
        </div>
      </div>
    `
  };



  const transport = nodemailer.createTransport(config);
  try {
    const info = await transport.sendMail(mensaje);
    console.log('Correo electrónico enviado:', info);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw error;
  }
};

//YAAA
app.post('/borrar_asignacion', async (req, res) => {
  let connection;
  try {
    const { docenteId } = req.body;

    // Obtener datos de la asignación a eliminar
    const selectCurpSql = 'SELECT docente_curp, grado_id, grupo_id FROM asignacion_g WHERE id = ?';
    connection = await req.mysqlPool.getConnection();
    const [rows] = await connection.query(selectCurpSql, [docenteId]);
    const { docente_curp, grado_id, grupo_id } = rows[0];

    // Vaciar el campo docente_curp en la tabla alumnos
    const updateAlumnosSql = 'UPDATE alumnos SET docente_curp = NULL WHERE docente_curp = ? AND grado_id = ? AND grupo_id = ?';
    await connection.query(updateAlumnosSql, [docente_curp, grado_id, grupo_id]);

    // Borrar la asignación de la tabla asignacion_g
    const deleteSql = 'DELETE FROM asignacion_g WHERE id = ?';
    await connection.query(deleteSql, [docenteId]);
    console.log('Asignación borrada correctamente');

    // Obtener datos del docente para enviar el correo de notificación
    const selectCorreoSql = 'SELECT correo, nombre, plantel FROM registro WHERE curp = ?';
    const [docenteRows] = await connection.query(selectCorreoSql, [docente_curp]);
    const { correo, nombre, plantel } = docenteRows[0];

    // Enviar correo de notificación
    await enviarCorreoBorraAsig(correo, nombre, grupo_id, grado_id, plantel);

    // Obtener la dirección IP del cliente
    const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, '');

    // Insertar registro de eliminación en la tabla logs_eliasig
    const insertQuery = 'INSERT INTO logs_eliasig (IP, fecha_hora, curp, descripcion) VALUES (?, NOW(), ?, ?)';
    await connection.execute(insertQuery, [ipAddress, docente_curp, 'Se eliminó una asignación de grupo y grado a un docente']);

    res.json({ success: true, message: 'Asignación borrada correctamente' });
  } catch (error) {
    console.error('Error al borrar la asignación: ', error);
    res.status(500).json({ success: false, message: 'Error al borrar la asignación' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

 

 

 

 
//------------------------------------
//YAAAAAAAAAAAA
app.get('/alumnos', async (req, res) => {
  const curp = req.app.locals.curp;
  let connection;

  try {
    // Intentamos obtener una conexión del pool
    connection = await pool.getConnection();

    // Consulta para obtener grado_id y grupo_id del docente
    const [asignacionRows] = await connection.execute(`
      SELECT grado_id, grupo_id
      FROM asignacion_g
      WHERE docente_curp = ?
    `, [curp]);

    // Verificar si se encontraron resultados en la tabla asignacion_g
    if (asignacionRows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron asignaciones para el docente' });
    }

    const { grado_id, grupo_id } = asignacionRows[0]; // Tomar el primer resultado

    // Consulta para obtener los datos de los alumnos
    const [alumnosRows] = await connection.execute(`
      SELECT alumnos.*, 
             CONCAT(alumnos.nombre, ' ', alumnos.aPaterno, ' ', alumnos.aMaterno) AS nombre_completo,
             grupo.grupo AS nombre_grupo 
      FROM alumnos 
      INNER JOIN grupo ON alumnos.grupo_id = grupo.id 
      WHERE docente_curp = ? AND grado_id = ? AND grupo_id = ?
    `, [curp, grado_id, grupo_id]);

    // Verificar si se encontraron resultados en la tabla alumnos
    if (alumnosRows.length === 0) {
      return res.status(404).json({ error: 'No se encontraron alumnos para el docente en este grado y grupo' });
    }

    // Enviamos los resultados al cliente
    res.json(alumnosRows);
  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    res.status(500).json({ error: 'Error en la consulta SQL' });
  } finally {
    // Liberamos la conexión de vuelta al pool en cualquier caso
    if (connection) {
      connection.release();
    }
  }
});

//YAAAA
app.post('/borrarAlumnos', async (req, res) => {
  let connection;

  try {
    const { docenteId } = req.body;
    connection = await req.mysqlPool.getConnection();
    const deleteSql = 'DELETE FROM alumnos WHERE idAlumnos = ?';
    await connection.query(deleteSql, [docenteId]);
    console.log('Alumno borrado correctamente');
    res.json({ success: true, message: 'Alumno borrado correctamente' });
  } catch (error) {
    console.error('Error al borrar alumno: ', error);
    res.status(500).json({ success: false, message: 'Error al borrar alumno' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

//YAAAAAAAAA
app.post('/actualizarAlumno', async (req, res) => {
  let connection;

  try {
    const { idAlumnos, nombre, aPaterno, aMaterno } = req.body;
    console.log('Datos recibidos:', { idAlumnos, nombre, aPaterno, aMaterno }); // Imprimir datos recibidos en la consola del servidor
    const sql = 'UPDATE alumnos SET nombre = ?, aPaterno = ?, aMaterno = ? WHERE idAlumnos = ?';
    connection = await req.mysqlPool.getConnection();
    await connection.query(sql, [nombre, aPaterno, aMaterno, idAlumnos]);
    console.log('Alumno actualizado correctamente');
    res.json({ success: true, message: 'Alumno actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar alumno: ', error);
    res.status(500).json({ success: false, message: 'Error al actualizar alumno' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
 

//YAAAAAAAA
app.post('/Insercategorias', async (req, res) => {
  let connection;

  try {
    const { categoria, valor } = req.body;
    console.log('Datos recibidos:', { categoria, valor }); // Imprimir datos recibidos en la consola del servidor
    const sql = 'INSERT INTO Categorias (nombre, valor_id) VALUES (?, ?)'; // Sentencia SQL de inserción
    connection = await req.mysqlPool.getConnection();
    await connection.query(sql, [categoria, valor]); // Insertar la categoría en la tabla Categorias junto con su valor
    console.log('Categoría insertada correctamente');
    res.json({ success: true, message: 'Categoría insertada correctamente' });
  } catch (error) {
    console.error('Error al insertar categoría: ', error);
    res.status(500).json({ success: false, message: 'Error al insertar categoría:' });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión de vuelta al pool
    }
  }
});


//YAAAAAAAAAAAAA
app.get('/categoria', async (req, res) => {
  let connection;

  try {
    const query = 'SELECT id, nombre, valor_id FROM Categorias'; // Modificación para incluir valor_id
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.nombre,
      valor_id: result.valor_id // Incluir valor_id en el objeto retornado
    }));
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos de las categorias:', error);
    res.status(500).json({ error: 'Error al obtener datos de las categorias' });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión de vuelta al pool
    }
  }
});


//YAAAAAAAA
app.post("/verificarSalAlumn", async (req, res) => {
  let connection;

  try {
    console.log("Recibiendo datos:", req.body); // Agregar este log para mostrar los datos recibidos

    const { idAlumnos, categoria } = req.body;

    // Obtener una conexión del pool de conexiones MySQL
    connection = await req.mysqlPool.getConnection();

    // Consulta SQL para verificar la existencia de idAlumnos y categoria en la tabla saludAlum
    const query = "SELECT COUNT(*) AS count FROM saludAlum WHERE idAlumno = ? AND idCategoria = ?";
    const [results] = await connection.execute(query, [idAlumnos, categoria]);

    const count = results[0].count;
    console.log("Cantidad de datos encontrados:", count);
    // Enviar respuesta indicando si los datos existen o no en la base de datos
    res.json({ exists: count > 0 });
  } catch (error) {
    console.error("Error al verificar los datos en la base de datos:", error);
    res.status(500).json({ error: "Error al verificar los datos en la base de datos" });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión al pool
    }
  }
});




//YAAA
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

//YAAA
app.get('/valorCategoria', async (req, res) => {
  let connection;

  try {
    const query = 'SELECT id, valor FROM valorCate';
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.valor
    }));
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos de las categorias:', error);
    res.status(500).json({ error: 'Error al obtener datos de las categorias' });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión al pool
    }
  }
});


//YAAAA
app.post('/guardarDatosSalud', async (req, res) => {
  let connection;

  try {
    const { idAlumnos, categoria, valor } = req.body;
    console.log('Datos recibidos:', { idAlumnos, categoria, valor });
    connection = await req.mysqlPool.getConnection();
    const query = 'INSERT INTO saludAlum (idAlumno, idCategoria, valor, fecha_hora) VALUES (?, ?, ?, NOW())';
    await connection.query(query, [idAlumnos, categoria, valor]);
    console.log('Datos insertados correctamente en la tabla saludAlum');
    res.json({ success: true, message: 'Datos insertados correctamente en la tabla saludAlum' });
  } catch (error) {
    console.error('Error al procesar la solicitud: ', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión al pool
    }
  }
});


//YAAAAAAAA
app.get('/saludAlum', async (req, res) => {
  let connection;

  try {
    // Suponiendo que recibes la CURP del docente en el parámetro de consulta 'curpDocente'
    const curpDocente = req.app.locals.curp;

    connection = await pool.getConnection();

    // Paso 1: Obtener la información de asignación del docente
    const [asignacionRows] = await connection.execute(`
      SELECT grado_id, grupo_id, docente_plantel
      FROM asignacion_g
      WHERE docente_curp = ?;
    `, [curpDocente]);

    // Paso 2: Obtener los alumnos que cumplen con las condiciones de grado, grupo y plantel
    const alumnosQuery = `
      SELECT idAlumnos
      FROM alumnos
      WHERE grado_id = ? AND grupo_id = ? AND plantel_id = ?;
    `;
    const [alumnosRows] = await connection.execute(alumnosQuery, [
      asignacionRows[0].grado_id,
      asignacionRows[0].grupo_id,
      asignacionRows[0].docente_plantel
    ]);

    // Paso 3: Obtener los datos de saludAlum para los alumnos obtenidos en el Paso 2
    const idAlumnos = alumnosRows.map(row => row.idAlumnos).join(',');
    const saludAlumQuery = `
    SELECT saludAlum.*, 
           Categorias.valor_id AS valor_id,
           Categorias.nombre AS nombreCategoria,
           alumnos.nombre AS nombreAlumno,
           alumnos.aPaterno AS aPaternoAlumno,
           alumnos.aMaterno AS aMaternoAlumno
    FROM saludAlum
    INNER JOIN Categorias ON saludAlum.idCategoria = Categorias.id
    INNER JOIN alumnos ON saludAlum.idAlumno = alumnos.idAlumnos
    WHERE saludAlum.idAlumno IN (${idAlumnos});
  `;

    const [saludAlumRows] = await connection.execute(saludAlumQuery);

    res.json(saludAlumRows);
  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    res.status(500).json({ error: 'Error en la consulta SQL' });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión al pool
    }
  }
});


//YAAAA
app.post('/actualizarSalud', async (req, res) => {
  let connection;
  try {
    const { id, valor } = req.body;
    console.log('Datos recibidos:', { id, valor }); // Imprimir datos recibidos en la consola del servidor
    const sql = 'UPDATE saludAlum SET valor = ? WHERE id = ?';
    connection = await req.mysqlPool.getConnection();
    await connection.query(sql, [valor, id]);
    console.log('Datos actualizados correctamente en la tabla saludAlum');
    res.json({ success: true, message: 'Datos actualizados correctamente en la tabla saludAlum' });
  } catch (error) {
    console.error('Error al actualizar alumno: ', error);
    res.status(500).json({ success: false, message: 'Error al actualizar alumno' });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión al pool
    }
  }
});

//YAAA
app.delete('/saludAlumBorrar', async (req, res) => {
  let connection;
  try {
    const { id } = req.body;
    connection = await req.mysqlPool.getConnection();
    const deleteSql = 'DELETE FROM saludAlum WHERE id = ?';
    await connection.query(deleteSql, [id]);
    console.log('Alumno borrado correctamente');
    res.json({ success: true, message: 'Alumno borrado correctamente' });
  } catch (error) {
    console.error('Error al borrar alumno: ', error);
    res.status(500).json({ success: false, message: 'Error al borrar alumno' });
  } finally {
    if (connection) {
      connection.release(); // Liberar la conexión al pool
    }
  }
});
 

//YAAAAAAAAA
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




//YAAA
app.get('/vacunas', async (req, res) => {
  let connection;
  try {
    const query = 'SELECT id, nombre FROM vacunas';
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.nombre
    }));
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos de vacunas:', error);
    res.status(500).json({ error: 'Error al obtener datos de vacunas' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


//YAAA
app.get('/alergias', async (req, res) => {
  let connection;
  try {
    const query = 'SELECT id, alergia FROM alergias';
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.alergia
    }));
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos de alergias:', error);
    res.status(500).json({ error: 'Error al obtener datos de alergias' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

//YAAA
app.get('/discapacidad', async (req, res) => {
  let connection;
  try {
    const query = 'SELECT id, nombre FROM discapacidad';
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.nombre
    }));
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos de discapacidades:', error);
    res.status(500).json({ error: 'Error al obtener datos de discapacidades' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


app.post('/guardarAlergias', async (req, res) => {
  const { idAlumnos, opcionesAlergias } = req.body; // Recibir cicloEscolar y alumnos del cuerpo de la solicitud

  let connection;

  try {
    // Establecer conexión a la base de datos
    connection = await pool.getConnection();

    for (let i = 0; i < opcionesAlergias.length; i++) {
      const valor = opcionesAlergias[i];

      // Realizar la inserción en la tabla unicoAlergias
      const insertQuery = 'INSERT INTO unicoAlergias (idAlumno, valor,fecha_hora) VALUES (?, ?,NOW())';
      await connection.execute(insertQuery, [idAlumnos, valor]);

      console.log('Alergia', valor);
    }
  } catch (error) {
    console.error('Error al insertar valores en la tabla unicoAlergias:', error);
    res.status(500).send('Error al insertar valores en la tabla unicoAlergias');
    return;
  } finally {
    if (connection) {
      connection.release();
    }
  }

  res.status(200).send('Datos recibidos correctamente y alergias registrados en la base de datos');
});
app.post('/verificarAlergias', async (req, res) => {
  const { idAlumnos, opcionesAlergias } = req.body;
  let connection;
  let alergiasRegistradas = [];

  try {
    // Establecer conexión a la base de datos (asegúrate de tener pool definido)
    connection = await pool.getConnection();

    for (let i = 0; i < opcionesAlergias.length; i++) {
      const valor = opcionesAlergias[i];

      const existingDataQuery = `
          SELECT a.alergia AS nombre_alergia
          FROM unicoAlergias ua
          JOIN alergias a ON ua.valor = a.id
          WHERE ua.idAlumno = ? AND ua.valor = ?
      `;

      const [existingDataRows] = await connection.execute(existingDataQuery, [idAlumnos, valor]);

      if (existingDataRows.length > 0) {
        const nombreAlergia = existingDataRows[0].nombre_alergia; // Utilizar nombre_alergia en lugar de nombre
        console.log(`La alergia ${nombreAlergia} ya está registrada para el alumno ${idAlumnos}`);
        alergiasRegistradas.push(nombreAlergia);
      } else {
        console.log(`La alergia con ID ${valor} aún no está registrada para el alumno ${idAlumnos}`);
      }

    }

    if (alergiasRegistradas.length > 0) {
      res.status(200).json({ exists: true, alergiasRegistradas });
    } else {
      res.status(200).json({ exists: false });
    }

  } catch (error) {
    console.error('Error al verificar alergias:', error);
    res.status(500).send('Error al verificar alergias');
  } finally {
    if (connection) {
      connection.release();
    }
  }
});



app.post('/guardarDiscapacidades', async (req, res) => {
  const { idAlumnos, opcionesDiscapacitados } = req.body;
  let connection;

  try {
    // Establecer conexión a la base de datos
    connection = await pool.getConnection();

    for (let i = 0; i < opcionesDiscapacitados.length; i++) {
      const valor = opcionesDiscapacitados[i];

      // Realizar la inserción en la tabla unicoDiscapa
      const insertQuery = 'INSERT INTO unicoDiscapa (idAlumno, valor,fecha_hora) VALUES (?, ?,NOW())';
      await connection.execute(insertQuery, [idAlumnos, valor]);

      console.log('Discapacidad', valor);
    }
  } catch (error) {
    console.error('Error al insertar valores en la tabla unicoDiscapa:', error);
    res.status(500).send('Error al insertar valores en la tabla unicoDiscapa');
    return;
  } finally {
    if (connection) {
      connection.release();
    }
  }
  res.status(200).send('Datos recibidos correctamente y discapacidades registrados en la base de datos');
});
app.post('/verificarDiscapacidades', async (req, res) => {
  const { idAlumnos, opcionesDiscapacitados } = req.body;
  let connection;
  let discapacidadesRegistradas = [];

  try {
    // Establecer conexión a la base de datos
    connection = await pool.getConnection();

    for (let i = 0; i < opcionesDiscapacitados.length; i++) {
      const valor = opcionesDiscapacitados[i];

      const existingDataQuery = `
              SELECT d.nombre AS nombre_discapacidad
              FROM unicoDiscapa u
              JOIN discapacidad d ON u.valor = d.id
              WHERE u.idAlumno = ? AND u.valor = ?
          `;
      const [existingDataRows] = await connection.execute(existingDataQuery, [idAlumnos, valor]);

      if (existingDataRows.length > 0) {
        const nombreDiscapacidad = existingDataRows[0].nombre_discapacidad;
        console.log(`La discapacidad ${nombreDiscapacidad} ya está registrada para el alumno ${idAlumnos}`);
        discapacidadesRegistradas.push(nombreDiscapacidad);
      } else {
        console.log(`La discapacidad con ID ${valor} aún no está registrada para el alumno ${idAlumnos}`);
      }
    }

    if (discapacidadesRegistradas.length > 0) {
      res.status(200).json({ exists: true, opcionesRegistradas: discapacidadesRegistradas });
    } else {
      res.status(200).json({ exists: false, opcionesRegistradas: [] });
    }

  } catch (error) {
    console.error('Error al verificar valores en la tabla unicoDiscapa:', error);
    res.status(500).send('Error al verificar valores en la tabla unicoDiscapa');
    return;
  } finally {
    if (connection) {
      connection.release();
    }
  }
});




app.post('/guardarVacunas', async (req, res) => {
  const { idAlumnos, opcionesVacunas } = req.body;
  let connection;

  try {
    // Establecer conexión a la base de datos
    connection = await pool.getConnection();

    for (let i = 0; i < opcionesVacunas.length; i++) {
      const valor = opcionesVacunas[i];

      // Realizar la inserción en la tabla unicoDiscapa
      const insertQuery = 'INSERT INTO unicoVacuna (idAlumno, valor,fecha_hora) VALUES (?, ?,NOW())';
      await connection.execute(insertQuery, [idAlumnos, valor]);

      console.log('Vacunas', valor);
    }
  } catch (error) {
    console.error('Error al insertar valores en la tabla unicoVacuna:', error);
    res.status(500).send('Error al insertar valores en la tabla unicoVacuna');
    return;
  } finally {
    if (connection) {
      connection.release();
    }
  }
  res.status(200).send('Datos recibidos correctamente y registrados en la base de datos');
});
app.post('/verificarVacunas', async (req, res) => {
  const { idAlumnos, opcionesVacunas } = req.body;
  let connection;
  let vacunasRegistradas = [];

  try {
    // Establecer conexión a la base de datos (asegúrate de tener pool definido)
    connection = await pool.getConnection();

    for (let i = 0; i < opcionesVacunas.length; i++) {
      const valor = opcionesVacunas[i];

      const existingDataQuery = `
          SELECT v.nombre AS nombre_vacuna
          FROM unicoVacuna u
          JOIN vacunas v ON u.valor = v.id
          WHERE u.idAlumno = ? AND u.valor = ?
      `;
      const [existingDataRows] = await connection.execute(existingDataQuery, [idAlumnos, valor]);

      if (existingDataRows.length > 0) {
        const nombreVacuna = existingDataRows[0].nombre_vacuna;
        console.log(`La vacuna ${nombreVacuna} ya está registrada para el alumno ${idAlumnos}`);
        vacunasRegistradas.push(nombreVacuna);
      } else {
        console.log(`La vacuna con ID ${valor} aún no está registrada para el alumno ${idAlumnos}`);
      }
    }

    if (vacunasRegistradas.length > 0) {
      res.status(200).json({ exists: true, opcionesRegistradas: vacunasRegistradas });
    } else {
      res.status(200).json({ exists: false, opcionesRegistradas: [] });
    }

  } catch (error) {
    console.error('Error al verificar valores en la tabla unicoVacuna:', error);
    res.status(500).send('Error al verificar valores en la tabla unicoVacuna');
    return;
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


app.get('/ConsultarUnicos/:idAlumno', async (req, res) => {
  const idAlumno = req.params.idAlumno;
  let connection;

  try {
    console.log('ID del alumno:', idAlumno);

    // Establecer conexión a la base de datos
    connection = await pool.getConnection();

    // Consultar alumnos con el mismo id en la tabla unicoAlergias y sus alergias correspondientes
    const query = `
      SELECT alergias.alergia
      FROM alergias
      JOIN unicoAlergias ON alergias.id = unicoAlergias.valor
      WHERE unicoAlergias.idAlumno = ?
    `;

    const [alergias] = await connection.execute(query, [idAlumno]);

    console.log('Alergias:', alergias);

    if (alergias.length === 0) {
      res.status(404).send("No se encontraron alergias para el ID de alumno proporcionado");
      return;
    }

    // Enviar los datos al frontend
    res.status(200).json(alergias);
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).send('Error al procesar la solicitud');
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

//--------------------------------

app.get('/ConsultarDiscapacifdada/:idAlumno', async (req, res) => {
  const idAlumno = req.params.idAlumno;
  let connection;

  try {
    console.log('ID del alumno:', idAlumno);

    // Establecer conexión a la base de datos
    connection = await pool.getConnection();

    // Consultar discapacidades correspondientes al ID del alumno
    const query = `
    SELECT discapacidad.nombre
    FROM discapacidad
    JOIN unicoDiscapa ON discapacidad.id = unicoDiscapa.valor
    WHERE unicoDiscapa.idAlumno = ?
  `;

    const [discapacidad] = await connection.execute(query, [idAlumno]);

    console.log('Discapacidad:', discapacidad);

    if (discapacidad.length === 0) {
      res.status(404).send("No se encontraron discapacidades para el ID de alumno proporcionado");
      return;
    }

    // Enviar los datos al frontend
    res.status(200).json(discapacidad);
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).send('Error al procesar la solicitud');
  } finally {
    if (connection) {
      connection.release();
    }
  }
});



app.get('/ConsultarVacunas/:idAlumno', async (req, res) => {
  const idAlumno = req.params.idAlumno;
  let connection;

  try {
    console.log('ID del alumno:', idAlumno);

    // Establecer conexión a la base de datos
    connection = await pool.getConnection();

    // Consultar el campo nombre de la tabla vacunas utilizando un JOIN
    const query = `
      SELECT vacunas.nombre
      FROM vacunas
      JOIN unicoVacuna ON vacunas.id = unicoVacuna.valor
      WHERE unicoVacuna.idAlumno = ?
    `;

    const [vacunas] = await connection.execute(query, [idAlumno]);

    console.log('Vacunas:', vacunas);

    if (vacunas.length === 0) {
      res.status(404).send("No se encontraron vacunas para el ID de alumno proporcionado");
      return;
    }

    // Enviar los datos al frontend
    res.status(200).json(vacunas);
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).send('Error al procesar la solicitud');
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







////////////-----------

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


app.get('/ConcultarevidenciasPDF', async (req, res) => {
  let connection;
  const curp = req.app.locals.curp;
  try {
    // Consulta SQL con JOIN para obtener la descripción de la agenda
    const query = `
      SELECT 
        e.id,
        e.id_agenda,
        a.descripcion AS descripcion_agenda
      FROM 
        evidenciasPDF e
      JOIN 
        agenda a ON e.id_agenda = a.id
      WHERE 
        e.curp = ?
    `;
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query, [curp]);
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

app.delete('/eliminarEvidencia/:id', async (req, res) => {
  let connection;
  const { id } = req.params;
  try {
    const query = 'DELETE FROM evidenciasPDF WHERE id = ?';
    connection = await req.mysqlPool.getConnection();
    await connection.execute(query, [id]);
    res.json({ message: 'Actividad eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    res.status(500).json({ error: 'Error al eliminar actividad' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


app.put('/editarEvidencia/:id', upload.single('file'), async (req, res) => {
  let connection;
  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo' });
  }
  const localFilePath = path.join(__dirname, 'uploads', req.file.filename);
  const fileContent = fs.readFileSync(localFilePath);

  try {
    connection = await req.mysqlPool.getConnection();

    // Actualizar archivo en la tabla evidenciasPDF
    const query = 'UPDATE evidenciasPDF SET pdf = ? WHERE id = ?';
    await connection.execute(query, [fileContent, id]);

    // Borrar el archivo temporal después de subirlo a la base de datos
    fs.unlinkSync(localFilePath);

    res.json({ message: 'Archivo PDF actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el archivo PDF en la tabla evidenciasPDF:', error);
    res.status(500).json({ message: 'Error al actualizar el archivo PDF' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

app.get('/descargarEvidencia/:id', async (req, res) => {
  let connection;
  const { id } = req.params;
  try {
    connection = await req.mysqlPool.getConnection();
    const [rows] = await connection.execute('SELECT pdf FROM evidenciasPDF WHERE id = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Evidencia no encontrada' });
    }

    const pdfBuffer = rows[0].pdf;

    res.setHeader('Content-Disposition', `attachment; filename=evidencia_${id}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al descargar evidencia:', error);
    res.status(500).json({ message: 'Error al descargar evidencia' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});
 


app.post('/guardar-rezago-academico', async (req, res) => {
  let connection;
  const {
    idAlumnos, 
    leer,
    escribir,
    habilidad,
    participacion,
    comportamiento
  } = req.body;

  try {
    // Establecer conexión desde el pool
    connection = await pool.getConnection();

    // Consulta SQL para insertar todos los datos en la tabla rezagoAlumno
    const query = `
      INSERT INTO rezagoAlumno (idAlumnos, habilidad_lectura, habilidad_escritura, habilidad_matematica, participacion, comportamiento)
      VALUES (?, ?, ?, ?, ?, ?)`;

    // Ejecutar la consulta SQL con los parámetros proporcionados
    await connection.execute(query, [idAlumnos, leer, escribir, habilidad, participacion, comportamiento]);

    // Enviar respuesta de éxito al cliente
    res.status(200).json({ message: 'Datos de rezago académico guardados correctamente' });

  } catch (error) {
    // Manejo de errores
    console.error('Error al guardar datos de rezago académico:', error);
    res.status(500).json({ error: 'Error al guardar datos de rezago académico' });

  } finally {
    // Liberar la conexión al pool, independientemente del resultado
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

app.get('/verificar-rezago/:idAlumnos', async (req, res) => {
  let connection;
  const { idAlumnos } = req.params;

  try {
    connection = await pool.getConnection();
    const query = `
      SELECT * FROM rezagoAlumno WHERE idAlumnos = ?`;
    const [result] = await connection.execute(query, [idAlumnos]);

    if (result.length > 0) {
      return res.status(200).json({ existe: true });
    }

    res.status(200).json({ existe: false });

  } catch (error) {
    console.error('Error en la consulta SQL:', error);
    res.status(500).json({ error: 'Error al verificar el registro de rezago académico' });

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

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});

//1721

//3126