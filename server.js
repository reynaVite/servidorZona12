const express = require('express');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const cors = require('cors');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const uuid = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());


// Agregar middleware de helmet
app.use(helmet());
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
const pool = mysql.createPool({
  host: '162.241.62.202',
  user: 'eduzonac_adminZona',
  password: '.51?^^7mU6$1',
  database: 'eduzonac_012zona',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Middleware para adjuntar el pool de MySQL a cada solicitud
app.use((req, res, next) => {
  req.mysqlPool = pool;
  next();
});



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




const enviarTokenYCorreo = async (correo, nombre, token) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    }
  };

  const mensaje = {
    from: 'EduZona012 <zona012huazalingo@gmail.com>',
    to: correo,
    subject: 'Código de recuperación de contraseña - EduZona012',
    html: `
      <p>Hola ${nombre},</p>
      <p>Has solicitado restablecer tu contraseña en EduZona012. El código de recuperación que se proporciona tiene una duración de 10 minutos:</p>
      <p><strong>${token}</strong></p>
      <p>Por favor, úsalo dentro de los próximos 10 minutos para restablecer tu contraseña.</p>
      <p>Si no has solicitado esta recuperación de contraseña, por favor ignora este mensaje.</p>
    `
  };

  const transport = nodemailer.createTransport(config);

  try {
    const info = await transport.sendMail(mensaje);
    console.log('Correo electrónico enviado:', info);

    // Si deseas eliminar el registro después de enviar el correo, puedes hacerlo aquí
    // await connection.execute(`
    //   DELETE FROM registrosoli
    //   WHERE correo = ?
    // `, [correo]);
  } catch (error) {
    console.error('Error al enviar el correo:', error);
    throw error;
  }
};



app.post('/generar-token-y-enviar-correo', async (req, res) => {
  const { curp } = req.body;

  try {
    // Generar un token único utilizando UUID
    const token = uuid.v4();
    console.log('Token generado:', token);

    // Obtener una conexión del pool de conexiones MySQL
    const connection = await req.mysqlPool.getConnection();

    // Obtener el correo asociado a la CURP desde la base de datos
    const emailQuery = `SELECT correo, nombre FROM registro WHERE curp = ?`;
    const [rows] = await connection.query(emailQuery, [curp]);
    const { correo, nombre } = rows[0];

    // Actualizar el campo token en la tabla registro
    const updateTokenQuery = `UPDATE registro SET token = ?, fecha_envio = NOW() WHERE curp = ?`;
    await connection.query(updateTokenQuery, [token, curp]);

    // Liberar la conexión de vuelta al pool
    connection.release();

    // Enviar el token por correo electrónico
    await enviarTokenYCorreo(correo, nombre, token);

    console.log('Token generado y enviado por correo');

    // Programar la eliminación del token después de 10 minutos
    setTimeout(async () => {
      try {
        const deleteTokenQuery = `UPDATE registro SET token = NULL WHERE curp = ?`;
        await req.mysqlPool.query(deleteTokenQuery, [curp]);
        console.log('Token eliminado después de 10 minutos');
      } catch (error) {
        console.error('Error al eliminar el token después de 10 minutos:', error);
      }
    }, 10 * 60 * 1000);

    res.json({ token });
  } catch (error) {
    console.error('Error al generar y enviar el token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


app.get('/registrosB', async (req, res) => {
  try {
    const query = `
      SELECT * FROM registro;
    `;
    const connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    connection.release();
    res.json(results);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});



app.get('/registroSol', async (req, res) => {
  try {
    const query = `
      SELECT 
        r.curp, 
        p.nombre AS plantel, 
        s.tipo_sesion AS sesion, 
        r.nombre, 
        r.aPaterno, 
        r.aMaterno, 
        r.correo, 
        r.fecha_solicitud
      FROM 
        registrosoli r
        INNER JOIN plantel p ON r.plantel = p.id
        INNER JOIN sesion s ON r.sesion = s.id
    `;
    const connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    connection.release();
    res.json(results);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});






const enviarMailSolCan = async (correo, nombre) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    }
  };

  const mensaje = {
    from: 'zona012huazalingo@gmail.com',
    to: correo,
    subject: 'Solicitud de registro en EduZona012',
    html: `
      <p>Hola ${nombre},</p>
      <p>Lamentamos informarte que tu solicitud de registro en EduZona012 ha sido rechazada.</p>
      <p>Gracias por tu interés en nuestra plataforma.</p>
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

app.get('/registroSolCan', async (req, res) => {
  let connection;
  try {
    const curp = req.query.curp; // Obtener la CURP de los parámetros de la solicitud
    const query = `
      SELECT curp, nombre, correo
      FROM registrosoli
      WHERE curp = ?
    `;
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query, [curp]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros para la CURP proporcionada' });
    }

    // Obtener el nombre y el correo de los resultados
    const { nombre, correo } = results[0];

    // Llamada a la función enviarMail con el correo y el nombre como parámetros
    await enviarMailSolCan(correo, nombre);

    // Eliminar el registro en registrosoli relacionado con la CURP
    await connection.execute(`
      DELETE FROM registrosoli
      WHERE curp = ?
    `, [curp]);

    connection.release();
    res.json({ message: 'Correo electrónico enviado y registro eliminado exitosamente' });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    if (connection) {
      connection.release();
    }
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});









const enviarMailSol = async (correo, nombre) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    }
  };

  const mensaje = {
    from: 'zona012huazalingo@gmail.com',
    to: correo,
    subject: 'Solicitud de registro en EduZona012',
    html: `
      <p>Su solicitud de registro en EduZona012 ha sido aceptada.</p>
      <p>Puede dirigirse a la página oficial para completar su registro.</p>
      <li>Bienvenid@ ${nombre}</li>
    `
  };

  const transport = nodemailer.createTransport(config);

  const info = await transport.sendMail(mensaje);
  console.log(info);
};


app.get('/registroSolAcep', async (req, res) => {
  let connection;
  try {
    const curp = req.query.curp; // Obtener la CURP de los parámetros de la solicitud
    const query = `
      SELECT curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, clave
      FROM registrosoli
      WHERE curp = ?
    `;
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query, [curp]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros para la CURP proporcionada' });
    }

    // Obtener el correo de los resultados
    const correo = results[0].correo;
    const nombre = results[0].nombre;

    // Llamada a la función enviarMail con el correo como parámetro
    try {
      await enviarMailSol(correo, nombre);
    } catch (mailError) {
      console.error('Error al enviar el correo:', mailError);
      // Puedes decidir si quieres lanzar un error o simplemente lograr el problema y continuar
      // throw mailError;
    }

    // Registrar el registro obtenido en la otra tabla (ejemplo: tabla_registro)
    const result = results[0];
    await connection.execute(`
      INSERT INTO registro (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, clave)
      VALUES (?, ?, ?, ?, ?, ?, ?,?)
    `, [
      result.curp,
      result.plantel,
      result.sesion,
      result.nombre,
      result.aPaterno,
      result.aMaterno,
      result.correo,
      result.clave
    ]);

    // Eliminar el registro en registrosoli relacionado con la CURP
    await connection.execute(`
      DELETE FROM registrosoli
      WHERE curp = ?
    `, [curp]);

    connection.release();
    res.json(result);
  } catch (error) {
    console.error('Error al obtener registros:', error);
    if (connection) {
      connection.release();
    }
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});







const enviarMailBaja = async (correo, nombre) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    }
  };
  const mensaje = {
    from: 'zona012huazalingo@gmail.com',
    to: correo,
    subject: 'Aviso de baja del sistema EduZona012',
    html: `
      <p>Estimad@ ${nombre},</p>
      <p>Le informamos que su cuenta en el sistema EduZona012 ha sido dada de baja.</p>
      <p>Si considera que esto es un error, por favor, consulte con su superior.</p>
    `
  };
  

  const transport = nodemailer.createTransport(config);

  const info = await transport.sendMail(mensaje);
  console.log(info);
};

app.get('/registroBaja', async (req, res) => {
  let connection;
  try {
    const curp = req.query.curp; // Obtener la CURP de los parámetros de la solicitud
    
    connection = await req.mysqlPool.getConnection();
    
    // Actualizar los campos estado_cuenta y estado_usuario a 2
    await connection.execute(`
      UPDATE registro
      SET estado_cuenta = 2, estado_usuario = 2
      WHERE curp = ?
    `, [curp]);

    // Obtener el correo del registro
    const [result] = await connection.execute(`
      SELECT correo, nombre
      FROM registro
      WHERE curp = ?
    `, [curp]);
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'No se encontraron registros para la CURP proporcionada' });
    }
    
    const { correo, nombre } = result[0];
    
    // Llamada a la función enviarMail con el correo como parámetro
    try {
      await enviarMailBaja(correo, nombre);
    } catch (mailError) {
      console.error('Error al enviar el correo:', mailError);
      // Puedes decidir si quieres lanzar un error o simplemente lograr el problema y continuar
      // throw mailError;
    }

    connection.release();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error al obtener registros:', error);
    if (connection) {
      connection.release();
    }
    res.status(500).json({ error: 'Error al obtener registros' });
  }
});



















// Ruta para insertar datos desde el formulario
app.post('/insertar-datossss', async (req, res) => {
  try {
    const { dato } = req.body;
    const connection = await req.mysqlPool.getConnection();
    await connection.query('INSERT INTO yo (dato) VALUES (?)', [dato]);
    connection.release();
    res.status(200).send('Dato insertado correctamente en la base de datos');
  } catch (error) {
    console.error('Error al insertar dato en la base de datos:', error);
    res.status(500).send('Error al insertar dato en la base de datos');
  }
});

app.get('/plantel', async (req, res) => {
  try {
    const query = 'SELECT id, nombre FROM plantel';
    const connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.nombre
    }));
    connection.release();
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos del plantel:', error);
    res.status(500).json({ error: 'Error al obtener datos del plantel' });
  }
});

app.get('/sesiones', async (req, res) => {
  try {
    const query = 'SELECT id, tipo_sesion FROM sesion';
    const connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.tipo_sesion
    }));
    connection.release();
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos de sesiones:', error);
    res.status(500).json({ error: 'Error al obtener datos de sesiones' });
  }
});

app.get('/preguntas-secretas', async (req, res) => {
  try {
    const query = 'SELECT id, tipo_pregunta FROM pregunta';
    const connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.tipo_pregunta
    }));
    connection.release();
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos de preguntas secretas:', error);
    res.status(500).json({ error: 'Error al obtener datos de preguntas secretas' });
  }
});




app.post('/verificar-correo', async (req, res) => {
  try {
    const { correo } = req.body;
    const connection = await req.mysqlPool.getConnection();
    const query = 'SELECT COUNT(*) as count FROM registro WHERE correo = ?';
    const [results] = await connection.execute(query, [correo]);
    connection.release();
    const exists = results[0].count > 0;
    res.json({ exists });
  } catch (error) {
    console.error('Error al verificar la existencia del correo en la base de datos:', error);
    res.status(500).json({ error: 'Error al verificar la existencia del correo en la base de datos' });
  }
});


app.post('/verificar-correoSoli', async (req, res) => {
  try {
    const { correo } = req.body;
    const connection = await req.mysqlPool.getConnection();
    const query = 'SELECT COUNT(*) as count FROM registrosoli WHERE correo = ?';
    const [results] = await connection.execute(query, [correo]);
    connection.release();
    const exists = results[0].count > 0;
    res.json({ exists });
  } catch (error) {
    console.error('Error al verificar la existencia del correo en la base de datos:', error);
    res.status(500).json({ error: 'Error al verificar la existencia del correo en la base de datos' });
  }
});


app.post('/verificar-curpSoli', async (req, res) => {
  try {
    const { curp } = req.body;
    const connection = await req.mysqlPool.getConnection();
    const query = 'SELECT COUNT(*) as count FROM registrosoli WHERE curp = ?';
    const [results] = await connection.execute(query, [curp]);
    connection.release();
    const exists = results[0].count > 0;
    res.json({ exists });
  } catch (error) {
    console.error('Error al verificar la existencia de la CURP en la base de datos:', error);
    res.status(500).json({ error: 'Error al verificar la existencia de la CURP en la base de datos' });
  }
});


app.post('/verificar-curp', async (req, res) => {
  try {
    const { curp } = req.body;
    const connection = await req.mysqlPool.getConnection();
    const query = 'SELECT COUNT(*) as count, estado_usuario FROM registro WHERE curp = ?';
    const [results] = await connection.execute(query, [curp]);
    connection.release();

    if (results.length > 0) {
      const exists = results[0].count > 0;
      const estadoUsuario = results[0].estado_usuario;

      if (estadoUsuario === 2) {
        res.json({ exists, usuarioDeBaja: true });
      } else {
        res.json({ exists, usuarioDeBaja: false });
      }
    } else {
      res.json({ exists: false, usuarioDeBaja: false });
    }
  } catch (error) {
    console.error('Error al verificar la existencia de la CURP en la base de datos:', error);
    res.status(500).json({ error: 'Error al verificar la existencia de la CURP en la base de datos' });
  }
});


app.post('/verificar-curp-contra', async (req, res) => {
  try {
    const { curp } = req.body;
    const connection = await req.mysqlPool.getConnection();
    const query = 'SELECT COUNT(*) as count, contrasena FROM registro WHERE curp = ?';
    const [results] = await connection.execute(query, [curp]);
    connection.release();

    if (results.length === 0) {
      // Si la CURP no está registrada
      res.json({ exists: false, emptyPassword: false });
    } else {
      // Si la CURP está registrada
      const exists = results[0].count > 0;
      const emptyPassword = results[0].contrasena ? false : true;
      res.json({ exists, emptyPassword });
    }
  } catch (error) {
    console.error('Error al verificar la existencia de la CURP en la base de datos:', error);
    res.status(500).json({ error: 'Error al verificar la existencia de la CURP en la base de datos' });
  }
});











 
const enviarMailBloAdmin = async (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
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
    }
  };

  const mensaje = {
    from: 'zona012huazalingo@gmail.com',
    to: correo,
    subject: 'Cuenta bloqueada en EduZona012',
    html: `
      <li>Hola: ${nombre}</li>
      <p>Su cuenta en EduZona012 ha sido bloqueada debido a múltiples intentos fallidos de inicio de sesión.</p>
      <p>Para recuperar su cuenta, por favor diríjase a la página oficial y restablezca su contraseña.</p>
    `
  };
  

  const transport = nodemailer.createTransport(config);

  const info = await transport.sendMail(mensaje);
  console.log(info);
};
app.post('/updateEstadoCuenta', async (req, res) => {
  try {
    const { curp } = req.body;
    
    const connection = await req.mysqlPool.getConnection();

    try {
      // Consulta para obtener los datos del usuario
      const usuarioQuery = `
        SELECT curp, plantel, sesion, nombre, aPaterno, aMaterno, correo
        FROM registro
        WHERE curp = ?
      `;
      const [usuarioResult] = await connection.execute(usuarioQuery, [curp]);

      // Verificar si se encontró el usuario
      if (usuarioResult.length > 0) {
        const { curp, plantel, sesion, nombre, aPaterno, aMaterno, correo } = usuarioResult[0];

        // Actualizar el estado de cuenta a 2
        const updateQuery = `
          UPDATE registro
          SET estado_cuenta = 2
          WHERE curp = ?
        `;
        await connection.execute(updateQuery, [curp]);

        res.status(200).send('Actualización exitosa del estado de cuenta a 2');

        // Enviar correo al administrador con los datos extraídos
        await enviarMailBloAdmin(curp, plantel, sesion, nombre, aPaterno, aMaterno, correo);


        // Enviar correo al usuario bloqueado
        await enviarMailBloClie(correo, nombre);
      } else {
        // No se encontró el usuario en la base de datos
        res.status(404).send('No se encontró al usuario para la CURP especificada');
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).send('Error al procesar la solicitud');
  }
});














const enviarMail = async (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo) => {
  const config = {
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
      user: 'zona012huazalingo@gmail.com',
      pass: 'kkcw ofwd qeon cpvr'
    }
  };

  const mensaje = {
    from: 'zona012huazalingo@gmail.com',
    to: 'zona012huazalingo@gmail.com',
    subject: 'Solicitud de registro en EduZona012',
    html: `
      <p>Se ha recibido una nueva solicitud de registro que está pendiente de revisión:</p>
      <ul>
        <li>CURP: ${curp}</li>
        <li>Plantel: ${plantel}</li>
        <li>Sesión: ${sesion}</li>
        <li>Nombre: ${nombre}</li>
        <li>Apellido paterno: ${aPaterno}</li>
        <li>Apellido materno: ${aMaterno}</li>
        <li>Correo: ${correo}</li>
      </ul>
      <p>Para aceptar o rechazar la solicitud, haz clic en el siguiente enlace:</p>
      <p><a href="[Enlace a la página de revisión de solicitudes]">Enlace a la página de revisión de solicitudes</a></p>
      <p> <img src=".img/logo.png" alt="Logo de la empresa" style="max-width: 100px; height: auto;"></p>
    `
  };

  const transport = nodemailer.createTransport(config);

  const info = await transport.sendMail(mensaje);
  console.log(info);
}


app.post('/insertar-solicitud', async (req, res) => {
  try {
    const {
      curp,
      plantel,
      sesion,
      nombre,
      aPaterno,
      aMaterno,
      correo
    } = req.body;
    const clave = uuid.v4();
    const connection = await req.mysqlPool.getConnection();

    try {
      const query = `
              INSERT INTO registrosoli 
                  (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, clave)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
      await connection.execute(query, [curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, clave]);

      res.status(200).send('Registro exitoso');

      // Llamada a la función enviarMail con los datos como parámetros
      await enviarMail(curp, plantel, sesion, nombre, aPaterno, aMaterno, correo);

    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al insertar dato en la base de datos:', error);
    res.status(500).send('Error al insertar dato en la base de datos');
  }
});



app.post('/insertar-dato', async (req, res) => {
  try {
    const {
      curp,
      plantel,
      sesion,
      nombre,
      aPaterno,
      aMaterno,
      correo,
      pregunta,
      respuesta,
      contrasena
    } = req.body;
    const connection = await req.mysqlPool.getConnection();
    try {
      // Cifrar la contraseña antes de almacenarla en la base de datos
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
      // Cifrar la respuesta antes de almacenarla en la base de datos
      const hashedRespuesta = await bcrypt.hash(respuesta, saltRounds);
      const query = `
              INSERT INTO registro 
                  (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo,  pregunta, respuesta, contrasena)
              VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
      await connection.execute(query, [curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, pregunta, hashedRespuesta, hashedPassword]);
      res.status(200).send('Registro exitoso');
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al insertar dato en la base de datos:', error);
    res.status(500).send('Error al insertar dato en la base de datos');
  }
});


app.get('/obtener-clave-cifrado', async (req, res) => {
  try {
    const { curp } = req.query;

    // Establecer conexión a la base de datos
    const connection = await req.mysqlPool.getConnection();

    try {
      // Realizar consulta para obtener la clave de cifrado asociada a la CURP
      const [rows] = await connection.execute(
        'SELECT clave FROM registro WHERE curp = ?',
        [curp]
      );

      // Verificar si se encontraron resultados
      if (rows.length > 0) {
        // Retornar la clave de cifrado
        const claveCifrado = rows[0].clave;
        res.status(200).json({ claveCifrado });
      } else {
        // Si no se encontraron resultados, enviar un mensaje de error
        res.status(404).send('No se encontró ninguna clave de cifrado asociada a la CURP proporcionada');
      }
    } finally {
      // Liberar la conexión a la base de datos
      connection.release();
    }
  } catch (error) {
    console.error('Error al obtener clave de cifrado:', error);
    res.status(500).send('Error al obtener clave de cifrado');
  }
});



app.post('/insertar-dato2', async (req, res) => {
  try {
    const { curp, pregunta, respuesta, contrasena } = req.body;
    const connection = await req.mysqlPool.getConnection();
    
    try {
      // Cifrar la contraseña antes de almacenarla en la base de datos
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
      // Cifrar la respuesta antes de almacenarla en la base de datos
      const hashedRespuesta = await bcrypt.hash(respuesta, saltRounds);

      // Verificar si ya existe un registro con la CURP proporcionada
      const [existingRecord] = await connection.execute('SELECT * FROM registro WHERE curp = ?', [curp]);

      // Si existe un registro con esa CURP, actualizar los campos
      if (existingRecord.length > 0) {
        const query = `
          UPDATE registro 
          SET pregunta = ?, respuesta = ?, contrasena = ?
          WHERE curp = ?
        `;
        await connection.execute(query, [pregunta, hashedRespuesta, hashedPassword, curp]);

        // Actualizar estado_cuenta y estado_usuario a 1
        const updateEstadoQuery = 'UPDATE registro SET estado_cuenta = 1, estado_usuario = 1 WHERE curp = ?';
        await connection.execute(updateEstadoQuery, [curp]);

        res.status(200).send('Actualización exitosa');
      } else {
        // Si no existe un registro con esa CURP, enviar un mensaje de error
        res.status(400).send('No existe ningún registro con esta CURP');
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al actualizar dato en la base de datos:', error);
    res.status(500).send('Error al actualizar dato en la base de datos');
  }
});


app.post('/login', async (req, res) => {
  try {
    const { curp, contrasena } = req.body;
    console.log('Datos de inicio de sesión recibidos en el backend:', { curp });
    const connection = await req.mysqlPool.getConnection();

    try {
      const query = 'SELECT * FROM registro WHERE curp = ?';
      const [results] = await connection.execute(query, [curp]);

      if (results.length > 0) {
        const user = results[0];
        const hashedPassword = user.contrasena;
        const match = await bcrypt.compare(contrasena, hashedPassword);

        if (match) {
          if (user.estado_usuario === 1) {
            if (user.estado_cuenta === 1) {
              // Verifica el rol del usuario
              const userRole = user.sesion; // Cambiado a 'sesion'
              let roleName = '';

              if (userRole === 1) {
                roleName = 'Rol 1';
              } else if (userRole === 2) {
                roleName = 'Rol 2';
              } else if (userRole === 3) {
                roleName = 'Rol 3';
              } else {
                roleName = 'Otro Rol';
              }
              const updateQuery = 'UPDATE registro SET fecha_inicio_sesion = CURRENT_TIMESTAMP WHERE curp = ?';
              const [updateResult] = await connection.execute(updateQuery, [curp]);

              console.log(`Se actualizó ${updateResult.affectedRows} fila(s) en la tabla registro.`);
              console.log(`Inicio de sesión exitoso. Rol: ${roleName}`);
              res.json({ success: true, role: userRole, roleName: roleName });
            } else if (user.estado_cuenta === 2) {
              console.log('Inicio de sesión fallido: La cuenta está bloqueada');
              res.json({ success: false, message: 'La cuenta está bloqueada. Para recuperar su cuenta, restablezca su contraseña.' });
            }
          } else if (user.estado_usuario === 2) {
            console.log('Inicio de sesión fallido: El usuario ha sido dado de baja del sistema');
            res.json({ success: false, message: 'El usuario ha sido dado de baja del sistema' });
          }
        } else {
          console.log('Inicio de sesión fallido: Contraseña incorrecta');
          res.json({ success: false, message: 'Contraseña incorrecta' });
        }
      } else {
        console.log('Inicio de sesión fallido: Usuario no encontrado');
        res.json({ success: false, message: 'La CURP no está registrada' });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al procesar solicitud de inicio de sesión:', error);
    res.status(500).json({ success: false, message: 'Error al procesar solicitud de inicio de sesión' });
  }
});



app.get('/obtener-nombre/:curp', async (req, res) => {
  try {
    const { curp } = req.params;
    const connection = await req.mysqlPool.getConnection();

    const query = 'SELECT nombre, aPaterno, aMaterno FROM registro WHERE curp = ?';
    const [results] = await connection.execute(query, [curp]);

    connection.release();

    if (results.length > 0) {
      const { nombre, aPaterno, aMaterno } = results[0];
      res.json({ nombre, aPaterno, aMaterno });
    } else {
      res.status(404).json({ error: 'No se encontraron datos para la CURP proporcionada' });
    }
  } catch (error) {
    console.error('Error al obtener nombre desde la base de datos:', error);
    res.status(500).json({ error: 'Error al obtener nombre desde la base de datos' });
  }
});


app.get('/obtener-correo/:curp', async (req, res) => {
  try {
    const { curp } = req.params;
    const connection = await req.mysqlPool.getConnection();

    const query = 'SELECT correo FROM registro WHERE curp = ?';
    const [results] = await connection.execute(query, [curp]);

    connection.release();

    if (results.length > 0) {
      const { correo } = results[0];
      res.json({ correo });
    } else {
      res.status(404).json({ error: 'No se encontraron datos para la CURP proporcionada' });
    }
  } catch (error) {
    console.error('Error al obtener el correo desde la base de datos:', error);
    res.status(500).json({ error: 'Error al obtener correo desde la base de datos' });
  }
});

app.get('/obtener-pregunta/:curp', async (req, res) => {
  try {
    const { curp } = req.params;
    const connection = await req.mysqlPool.getConnection();

    const query = 'SELECT pregunta FROM registro WHERE curp = ?';
    const [results] = await connection.execute(query, [curp]);

    connection.release();

    if (results.length > 0) {
      const { pregunta } = results[0];
      res.json({ pregunta: pregunta });
    } else {
      res.status(404).json({ error: 'No se encontraron datos para la CURP proporcionada' });
    }
  } catch (error) {
    console.error('Error al obtener nombre desde la base de datos:', error);
    res.status(500).json({ error: 'Error al obtener nombre desde la base de datos' });
  }
});

app.get('/obtener-tipo-pregunta/:pregunta', async (req, res) => {
  try {
    const { pregunta } = req.params;
    const connection = await req.mysqlPool.getConnection();

    const preguntaQuery = 'SELECT tipo_pregunta FROM pregunta WHERE id = ?'; // Ajusta la consulta según tu esquema de base de datos
    const [preguntaResults] = await connection.execute(preguntaQuery, [pregunta]);

    connection.release();

    if (preguntaResults.length > 0) {
      const { tipo_pregunta } = preguntaResults[0];
      res.json({ tipo_pregunta: tipo_pregunta });
    } else {
      res.status(404).json({ error: 'No se encontraron datos para la pregunta proporcionada en la tabla pregunta' });
    }
  } catch (error) {
    console.error('Error al obtener tipo de pregunta desde la base de datos:', error);
    res.status(500).json({ error: 'Error al obtener tipo de pregunta desde la base de datos' });
  }
});





app.post('/recuperar-contrasena', async (req, res) => {
  try {
    const { curp, respuesta } = req.body;
    console.log('Datos de recuperación de contraseña:', { curp, respuesta });

    const connection = await req.mysqlPool.getConnection();

    try {
      // Verificar la existencia de la CURP y obtener la respuesta almacenada
      const checkExistenceQuery = 'SELECT respuesta FROM registro WHERE curp = ?';
      const [existenceResults] = await connection.execute(checkExistenceQuery, [curp]);

      if (existenceResults.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'La CURP no está registrada' });
      }

      const storedRespuesta = existenceResults[0].respuesta;

      // Verificar que la respuesta coincida
      const matchRespuesta = await bcrypt.compare(respuesta, storedRespuesta);

      if (!matchRespuesta) {
        connection.release();
        console.log('La respuesta no es correcta');
        return res.status(401).json({ error: 'La respuesta no es correcta. Por favor, inténtelo de nuevo.' });
      }

      // Devolver una respuesta exitosa si la verificación es exitosa
      res.json({ success: true });

    } finally {
      connection.release();
    }
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar solicitud de recuperación de contraseña' });
  }
});



app.post('/actualizar-contrasena', async (req, res) => {
  try {
    const { curp, nuevaContrasena } = req.body;
    console.log('Datos de inicio de sesión recibidos en el backend:', { curp, nuevaContrasena });

    const connection = await req.mysqlPool.getConnection();

    try {
      try {
        // Consultar el registro actual para obtener el valor actual de la contraseña
        const selectQuery = 'SELECT contrasena FROM registro WHERE curp = ?';
        const [rows] = await connection.execute(selectQuery, [curp]);

        if (rows.length === 0) {
          return res.status(404).json({ error: 'No se encontró ningún registro con la CURP proporcionada' });
        }

        // Obtener la contraseña actual
        const contrasenaActual = rows[0].contrasena;

        // Guardar el valor actual de la contraseña en otro campo (por ejemplo, contrasena_anterior)
        const updateAnteriorQuery = 'UPDATE registro SET ultima_contrasena = ? WHERE curp = ?';
        await connection.execute(updateAnteriorQuery, [contrasenaActual, curp]);

        // Cifrar la nueva contraseña antes de almacenarla en la base de datos
        const saltRounds = 10;
        const hashedNuevaContrasena = await bcrypt.hash(nuevaContrasena, saltRounds);

        // Actualizar la contraseña en el campo correspondiente en la base de datos con la nueva contraseña cifrada
        const updateQuery = 'UPDATE registro SET contrasena = ? WHERE curp = ?';
        await connection.execute(updateQuery, [hashedNuevaContrasena, curp]);

        // Actualizar el estado_cuenta a 1 después de cambiar la contraseña
        const updateEstadoCuentaQuery = 'UPDATE registro SET estado_cuenta = 1 WHERE curp = ?';
        await connection.execute(updateEstadoCuentaQuery, [curp]);

        // Log de depuración
        console.log('Contraseña actualizada exitosamente.');

        // Devolver una respuesta exitosa
        res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
      } catch (error) {
        console.error('Error al procesar solicitud de actualización de contraseña:', error);
        res.status(500).json({ error: 'Error al procesar solicitud de actualización de contraseña' });
      }
    } catch (error) {
      console.error('Error al procesar solicitud de actualización de contraseña:', error);
      res.status(500).json({ error: 'Error al procesar solicitud de actualización de contraseña' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al procesar solicitud de actualización de contraseña:', error);
    res.status(500).json({ error: 'Error al procesar solicitud de actualización de contraseña' });
  }
});




app.post('/verificar-codigo', async (req, res) => {
  try {
    const { curp, token } = req.body;

    const connection = await req.mysqlPool.getConnection();

    try {
      // Consultar el registro actual para obtener el token almacenado
      const selectQuery = 'SELECT token FROM registro WHERE curp = ?';
      const [rows] = await connection.execute(selectQuery, [curp]);

      if (rows.length === 0) {
        return res.status(404).json({ error: 'No se encontró ningún registro con la CURP proporcionada' });
      }

      const tokenFromDatabase = rows[0].token;

      // Verificar si el token proporcionado coincide con el token almacenado en la base de datos
      if (token === tokenFromDatabase) {
        // El token proporcionado es válido
        return res.json({ valid: true });
      } else {
        // El token proporcionado no coincide
        return res.json({ valid: false });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error al procesar solicitud de verificación de código:', error);
    res.status(500).json({ error: 'Error al procesar solicitud de verificación de código' });
  }
});






// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});