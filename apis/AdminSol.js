const express = require('express');
const AdminSol = express.Router();
const nodemailer = require('nodemailer');


AdminSol.get('/registroSol', async (req, res) => {
    let connection;
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
        connection = await req.mysqlPool.getConnection();
        const [results] = await connection.execute(query);
        res.json(results);
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ error: 'Error al obtener registros' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

const enviarMailSol = async (correo, nombre) => {
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
        subject: 'Solicitud de registro aceptada - EduZona012',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00314A; padding: 20px;">
            <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
          </div>
        
          <div style="background-color: #fff; padding: 20px;">
            <h3 style="margin-bottom: 20px;">Hola ${nombre},</h3>
            <p>Nos complace informarte que tu solicitud de registro en EduZona012 ha sido aceptada.</p>
            <p>¡Bienvenido a nuestra plataforma!</p>
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

AdminSol.get('/registroSolAcep', async (req, res) => {
    let connection;
    try {
        const curp = req.query.curp;
        const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, '');
        console.log('Datos de inicio de sesión recibidos en el backend:', { curp, ipAddress });

        const query = `
        SELECT curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, clave
        FROM registrosoli
        WHERE curp = ?
      `;

        connection = await req.mysqlPool.getConnection();
        const [results] = await connection.execute(query, [curp]);

        const insertQuery = 'INSERT INTO logs_AcepUser (IP, fecha_hora, curp, descripcion) VALUES (?, NOW(), ?, ?)';
        await connection.execute(insertQuery, [ipAddress, curp, 'Se concedió acceso a un usuario en el sistema']);

        if (results.length === 0) {
            return res.status(404).json({ error: 'No se encontraron registros para la CURP proporcionada' });
        }

        const correo = results[0].correo;
        const nombre = results[0].nombre;

        try {
            await enviarMailSol(correo, nombre);
        } catch (mailError) {
            console.error('Error al enviar el correo:', mailError);
        }

        const result = results[0];

        await connection.execute(`
        INSERT INTO registro (curp, plantel, sesion, nombre, aPaterno, aMaterno, correo, clave)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
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

        await connection.execute(`DELETE FROM registrosoli WHERE curp = ?`, [curp]); // Eliminar el registro en registrosoli relacionado con la CURP

        res.json(result);
    } catch (error) {
        console.error('Error al obtener registros:', error);
        res.status(500).json({ error: 'Error al obtener registros' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

const enviarMailSolCan = async (correo, nombre) => {
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
        subject: 'Solicitud de registro rechazada - EduZona012',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00314A; padding: 20px;">
            <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
          </div>
          <div style="background-color: #fff; padding: 20px;">
            <h3 style="margin-bottom: 20px;">Hola ${nombre},</h3>
            <p>Lamentamos informarte que tu solicitud de registro en EduZona012 ha sido rechazada.</p>
            <p>Gracias por tu interés en nuestra plataforma.</p>
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

AdminSol.get('/registroSolCan', async (req, res) => {
    let connection;
    try {
        const curp = req.query.curp;
        const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, '');
        console.log('Datos de inicio de sesión recibidos en el backend:', { curp, ipAddress });

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

        const { nombre, correo } = results[0];
        await enviarMailSolCan(correo, nombre);

        await connection.execute(`
        DELETE FROM registrosoli
        WHERE curp = ?
      `, [curp]);

        const insertQuery = 'INSERT INTO logs_CanUser (IP, fecha_hora, curp, descripcion) VALUES (?, NOW(), ?, ?)';
        await connection.execute(insertQuery, [ipAddress, curp, 'No se concedió acceso al sistema a un usuario']);

        res.json({ message: 'Correo electrónico enviado y registro eliminado exitosamente' });
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = AdminSol;