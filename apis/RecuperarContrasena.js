const express = require('express');
const RecuperarContrasena = express.Router();
const uuid = require('uuid'); 
const bcrypt = require('bcryptjs');

const nodemailer = require('nodemailer');

// Ruta para verificar si la curp existe en la bd
RecuperarContrasena.post('/verificar-curp', async (req, res) => {
    let connection;
    try {
        const { curp } = req.body;
        connection = await req.mysqlPool.getConnection();
        const query = 'SELECT COUNT(*) as count, estado_usuario FROM registro WHERE curp = ?';
        const [results] = await connection.execute(query, [curp]);
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
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Ruta para verificar el codigo del correo 
RecuperarContrasena.post('/verificar-codigo', async (req, res) => {
    let connection;
    try {
        const { curp, token } = req.body;
        connection = await req.mysqlPool.getConnection();
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
    } catch (error) {
        console.error('Error al procesar solicitud de verificación de código:', error);
        res.status(500).json({ error: 'Error al procesar solicitud de verificación de código' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

const enviarTokenYCorreo = async (correo, nombre, token) => {
    const config = {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
            user: 'zona012huazalingo@gmail.com',
            pass: 'kkcw ofwd qeon cpvr'
        },
        tls: {
            rejectUnauthorized: false // Ignora la verificación del certificado
        }
    };
    const mensaje = {
        from: 'EduZona012 <zona012huazalingo@gmail.com>',
        to: correo,
        subject: 'Código de recuperación de contraseña - EduZona012',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #00314A; padding: 20px;">
            <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
          </div>
              <div style="background-color: #fff; padding: 20px;">
                <h3 style="margin-bottom: 20px;">Hola ${nombre},</h3>
                <p>Has solicitado restablecer tu contraseña en EduZona012. El código de recuperación que se proporciona tiene una duración de 10 minutos:</p>
                <div style="display: flex; align-items: center; margin-bottom: 20px;">
                  <strong style="flex: 1;">${token}</strong>
                </div>
                <p>Por favor, úsalo dentro de los próximos 10 minutos para restablecer tu contraseña.</p>
                <p>Si no has solicitado esta recuperación de contraseña, por favor ignora este mensaje.</p>
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

// Ruta para generar el token y mandarlos al correo
RecuperarContrasena.post('/generar-token-y-enviar-correo', async (req, res) => {
    const { curp } = req.body;
    let connection;
    try {
        const token = uuid.v4(); // Generar un token único utilizando UUID
        console.log('Token generado:', token);
        connection = await req.mysqlPool.getConnection();
        const emailQuery = `SELECT correo, nombre FROM registro WHERE curp = ?`; // Obtener el correo asociado a la CURP desde la base de datos
        const [rows] = await connection.query(emailQuery, [curp]);
        const { correo, nombre } = rows[0];
        const updateTokenQuery = `UPDATE registro SET token = ?, fecha_envio = NOW() WHERE curp = ?`;
        await connection.query(updateTokenQuery, [token, curp]);
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
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


RecuperarContrasena.get('/obtener-datos-usuario/:curp', async (req, res) => {
  const { curp } = req.params; // Obtener la CURP de los parámetros de la ruta
  let connection;

  try {
      connection = await req.mysqlPool.getConnection();
      
      // Consulta para obtener los datos del usuario basado en la CURP
      const query = `SELECT nombre, aPaterno, aMaterno FROM registro WHERE curp = ?`;
      const [rows] = await connection.query(query, [curp]);

      // Verificar si se encontraron resultados
      if (rows.length === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { nombre, aPaterno, aMaterno } = rows[0];
      res.json({ nombre, aPaterno, aMaterno });
  } catch (error) {
      console.error('Error al obtener los datos del usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
      if (connection) {
          connection.release();
      }
  }
});

// Ruta para obtener la pregunta secreta del registro para 
RecuperarContrasena.get('/obtener-pregunta/:curp', async (req, res) => {
    let connection;
    try {
      const { curp } = req.params;
      connection = await req.mysqlPool.getConnection();
      const query = 'SELECT pregunta FROM registro WHERE curp = ?';
      const [results] = await connection.execute(query, [curp]);
      if (results.length > 0) {
        const { pregunta } = results[0];
        res.json({ pregunta: pregunta });
      } else {
        res.status(404).json({ error: 'No se encontraron datos para la CURP proporcionada' });
      }
    } catch (error) {
      console.error('Error al obtener nombre desde la base de datos:', error);
      res.status(500).json({ error: 'Error al obtener nombre desde la base de datos' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

RecuperarContrasena.get('/obtener-tipo-pregunta/:pregunta', async (req, res) => {
    let connection;
    try {
      const { pregunta } = req.params;
      connection = await req.mysqlPool.getConnection();
      const preguntaQuery = 'SELECT tipo_pregunta FROM pregunta WHERE id = ?'; // Ajusta la consulta según tu esquema de base de datos
      const [preguntaResults] = await connection.execute(preguntaQuery, [pregunta]);
      if (preguntaResults.length > 0) {
        const { tipo_pregunta } = preguntaResults[0];
        res.json({ tipo_pregunta: tipo_pregunta });
      } else {
        res.status(404).json({ error: 'No se encontraron datos para la pregunta proporcionada en la tabla pregunta' });
      }
    } catch (error) {
      console.error('Error al obtener tipo de pregunta desde la base de datos:', error);
      res.status(500).json({ error: 'Error al obtener tipo de pregunta desde la base de datos' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });


  RecuperarContrasena.get('/obtener-correo/:curp', async (req, res) => {
    let connection;
    try {
      const { curp } = req.params;
      connection = await req.mysqlPool.getConnection();
      const query = 'SELECT correo FROM registro WHERE curp = ?';
      const [results] = await connection.execute(query, [curp]);
      if (results.length > 0) {
        const { correo } = results[0];
        res.json({ correo });
      } else {
        res.status(404).json({ error: 'No se encontraron datos para la CURP proporcionada' });
      }
    } catch (error) {
      console.error('Error al obtener el correo desde la base de datos:', error);
      res.status(500).json({ error: 'Error al obtener correo desde la base de datos' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  RecuperarContrasena.post('/recuperar-contrasena', async (req, res) => {
    let connection;
    try {
      const { curp, respuesta } = req.body;
      console.log('Datos de recuperación de contraseña:', { curp, respuesta });
      connection = await req.mysqlPool.getConnection();
  
      // Verificar la existencia de la CURP y obtener la respuesta almacenada
      const checkExistenceQuery = 'SELECT respuesta FROM registro WHERE curp = ?';
      const [existenceResults] = await connection.execute(checkExistenceQuery, [curp]);
      if (existenceResults.length === 0) {
        return res.status(404).json({ error: 'La CURP no está registrada' });
      }
      const storedRespuesta = existenceResults[0].respuesta;
  
      // Verificar que la respuesta coincida
      const matchRespuesta = await bcrypt.compare(respuesta, storedRespuesta);
      if (!matchRespuesta) {
        console.log('La respuesta no es correcta');
        return res.status(401).json({ error: 'La respuesta no es correcta. Por favor, inténtelo de nuevo.' });
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error al procesar solicitud de recuperación de contraseña:', error);
      res.status(500).json({ error: 'Error al procesar solicitud de recuperación de contraseña' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  RecuperarContrasena.post('/actualizar-contrasena', async (req, res) => {
    let connection;
    try {
      const { curp, nuevaContrasena } = req.body;
      const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, ''); // Extraer la IP del cliente
      console.log('Datos de inicio de sesión recibidos en el backend:', { curp, nuevaContrasena, ipAddress }); // Mostrar los datos en consola
      connection = await req.mysqlPool.getConnection();
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
        // Consulta para insertar datos en la tabla logs_CanContra
        const insertQuery = 'INSERT INTO logs_CanContra (IP, fecha_hora, curp, descripcion) VALUES (?, NOW(), ?, ?)';
        await connection.execute(insertQuery, [ipAddress, curp, 'Se realizó la recuperación de contraseña mediante correo/pregunta secreta']);
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
      if (connection) {
        connection.release();
      }
    }
  });
  
module.exports = RecuperarContrasena;
