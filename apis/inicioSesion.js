const express = require('express');
const app = express();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const inicioSesion = express.Router(); 

// Ruta para inicio de sesi
inicioSesion.post('/login', async (req, res) => {
    let connection;
    try {
      const { curp: curpFromReq, contrasena } = req.body;
      const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, '');
      const requestedUrl = req.originalUrl;
      console.log('Datos de inicio de sesión recibidos en el backend:', { curp: curpFromReq, ipAddress, requestedUrl });
  
      connection = await req.mysqlPool.getConnection();
      const query = 'SELECT * FROM registro WHERE curp = ?';
      const [results] = await connection.execute(query, [curpFromReq]);
  
      if (results.length > 0) {
        const user = results[0];
        const match = await bcrypt.compare(contrasena, user.contrasena);
        if (match) {
          if (user.estado_usuario === 1) {
            if (user.estado_cuenta === 1) {
              const userRole = user.sesion;
              let roleName = '';
              if (userRole === 1) {
                roleName = ' 1';
              } else if (userRole === 2) {
                roleName = ' 2';
              } else if (userRole === 3) {
                roleName = ' 3';
              } else {
                roleName = 'Otro Rol';
              }
              app.locals.plantel = user.plantel;
              app.locals.curp = curpFromReq;
              app.locals.roleName = roleName;
  
              const updateQuery = 'UPDATE registro SET fecha_inicio_sesion = CURRENT_TIMESTAMP WHERE curp = ?';
              await connection.execute(updateQuery, [curpFromReq]);
  
              const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
              await connection.execute(insertQuery, [curpFromReq, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión exitoso"]);
  
              res.json({ success: true, role: userRole, roleName: roleName, plantel: user.plantel });
            } else if (user.estado_cuenta === 2) {
              const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
              await connection.execute(insertQuery, [curpFromReq, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión fallido: La cuenta está bloqueada"]);
              res.json({ success: false, message: 'La cuenta está bloqueada. Para recuperar su cuenta, restablezca su contraseña.' });
            }
          } else if (user.estado_usuario === 2) {
            const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
            await connection.execute(insertQuery, [curpFromReq, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión fallido: El usuario ha sido dado de baja del sistema"]);
            res.json({ success: false, message: 'El usuario ha sido dado de baja del sistema' });
          }
        } else {
          const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
          await connection.execute(insertQuery, [curpFromReq, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión fallido: Contraseña incorrecta"]);
          res.json({ success: false, message: 'Contraseña incorrecta' });
        }
      } else {
        const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
        await connection.execute(insertQuery, [curpFromReq, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión fallido: Usuario no encontrado"]);
        res.json({ success: false, message: 'La CURP no está registrada' });
      }
    } catch (error) {
      console.error('Error al procesar solicitud de inicio de sesión:', error);
      res.status(500).json({ success: false, message: 'Error al procesar solicitud de inicio de sesión' });
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

  
// Ruta para actualizar el estado de cuenta
inicioSesion.post('/updateEstadoCuenta', async (req, res) => {
    let connection;
    try {
      const { curp } = req.body;
      const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, '');
      console.log('Datos de actualización de estado de cuenta recibidos en el backend:', { curp, ipAddress });
  
      connection = await req.mysqlPool.getConnection();
      const usuarioQuery = 'SELECT curp, plantel, sesion, nombre, aPaterno, aMaterno, correo FROM registro WHERE curp = ?';
      const [usuarioResult] = await connection.execute(usuarioQuery, [curp]);
  
      if (usuarioResult.length > 0) {
        const { curp, plantel, sesion, nombre, aPaterno, aMaterno, correo } = usuarioResult[0];
        const updateQuery = 'UPDATE registro SET estado_cuenta = 2 WHERE curp = ?';
        await connection.execute(updateQuery, [curp]);
  
        await Promise.all([
          enviarMailBloAdmin(curp, plantel, sesion, nombre, aPaterno, aMaterno, correo),
          enviarMailBloClie(correo, nombre)
        ]);
  
        const insertQuery = 'INSERT INTO logs_bloqueoIni (IP, fecha_hora, curp) VALUES (?, NOW(), ?)';
        await connection.execute(insertQuery, [ipAddress, curp]);
  
        res.status(200).send('Actualización exitosa del estado de cuenta a 2');
      } else {
        res.status(404).send('No se encontró al usuario para la CURP especificada');
      }
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      res.status(500).send('Error al procesar la solicitud');
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  

module.exports = inicioSesion;
