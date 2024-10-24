const express = require('express');
const PreRegistro = express.Router();
const uuid = require('uuid'); 
const nodemailer = require('nodemailer');

PreRegistro.get('/plantel', async (req, res) => {
    let connection;
    try {
        const query = 'SELECT id, nombre FROM plantel';
        connection = await req.mysqlPool.getConnection();
        const [results] = await connection.execute(query);
        const options = results.map(result => ({
            value: result.id,
            label: result.nombre
        }));
        res.json(options);
    } catch (error) {
        console.error('Error al obtener datos del plantel:', error);
        res.status(500).json({ error: 'Error al obtener datos del plantel' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

PreRegistro.get('/sesiones', async (req, res) => {
    let connection;
    try {
        const query = 'SELECT id, tipo_sesion FROM sesion';
        connection = await req.mysqlPool.getConnection();
        const [results] = await connection.execute(query);
        const options = results.map(result => ({
            value: result.id,
            label: result.tipo_sesion
        }));
        res.json(options);
    } catch (error) {
        console.error('Error al obtener datos de sesiones:', error);
        res.status(500).json({ error: 'Error al obtener datos de sesiones' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

 
PreRegistro.post('/verificar-curpSoli', async (req, res) => {
    let connection;
    try {
        const { curp } = req.body;
        connection = await req.mysqlPool.getConnection();
        const query = 'SELECT COUNT(*) as count FROM registrosoli WHERE curp = ?';
        const [results] = await connection.execute(query, [curp]);
        const exists = results[0].count > 0;
        res.json({ exists });
    } catch (error) {
        console.error('Error al verificar la existencia de la CURP en la base de datos:', error);
        res.status(500).json({ error: 'Error al verificar la existencia de la CURP en la base de datos' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});
//verificar-curp" esta en recuperar contraseña

PreRegistro.post('/verificar-correo', async (req, res) => {
    let connection;
    try {
        const { correo } = req.body;
        connection = await req.mysqlPool.getConnection();
        const query = 'SELECT COUNT(*) as count FROM registro WHERE correo = ?';
        const [results] = await connection.execute(query, [correo]);
        const exists = results[0].count > 0;
        res.json({ exists });
    } catch (error) {
        console.error('Error al verificar la existencia del correo en la base de datos:', error);
        res.status(500).json({ error: 'Error al verificar la existencia del correo en la base de datos' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

PreRegistro.post('/verificar-correoSoli', async (req, res) => {
    let connection;
    try {
        const { correo } = req.body;
        connection = await req.mysqlPool.getConnection();
        const query = 'SELECT COUNT(*) as count FROM registrosoli WHERE correo = ?';
        const [results] = await connection.execute(query, [correo]);
        const exists = results[0].count > 0;
        res.json({ exists });
    } catch (error) {
        console.error('Error al verificar la existencia del correo en la base de datos:', error);
        res.status(500).json({ error: 'Error al verificar la existencia del correo en la base de datos' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

const enviarMail = async (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo) => {
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
    let nombreSesion;
    switch (sesion) {
      case 1:
        nombreSesion = 'Supervisor';
        break;
      case 2:
        nombreSesion = 'Director';
        break;
      case 3:
        nombreSesion = 'Maestro';
        break;
    }
    const mensaje = {
      from: 'EduZona012 <zona012huazalingo@gmail.com>',
      to: 'zona012huazalingo@gmail.com',
      subject: 'Solicitud de registro en EduZona012',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00314A; padding: 20px;">
            <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
          </div>
          <div style="background-color: #fff; padding: 20px;">
            <h3 style="margin-bottom: 20px;">Se ha recibido una nueva solicitud de registro que está pendiente de revisión:</h3>
            <ul>
              <li><strong>CURP:</strong> ${curp}</li>
              <li><strong>Plantel:</strong> ${nombrePlantel}</li>
              <li><strong>Sesión:</strong> ${nombreSesion}</li>
              <li><strong>Nombre:</strong> ${nombre}</li>
              <li><strong>Apellido paterno:</strong> ${aPaterno}</li>
              <li><strong>Apellido materno:</strong> ${aMaterno}</li>
              <li><strong>Correo:</strong> ${correo}</li>
            </ul>
            <p>Para aceptar o rechazar la solicitud, haz clic en el siguiente enlace:</p>
            <p><a href="https://edu-zona.vercel.app/">Enlace a la página de revisión de solicitudes</a></p>
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
  }
PreRegistro.post('/insertar-solicitud', async (req, res) => {
    let connection;
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
        connection = await req.mysqlPool.getConnection();
        const query = `
        INSERT INTO registrosoli 
          (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, clave)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
        await connection.execute(query, [curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, clave]);
        res.status(200).send('Registro exitoso');
        await enviarMail(curp, plantel, sesion, nombre, aPaterno, aMaterno, correo);
    } catch (error) {
        console.error('Error al insertar dato en la base de datos:', error);
        res.status(500).send('Error al insertar dato en la base de datos');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = PreRegistro;
