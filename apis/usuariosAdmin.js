const express = require('express');
const usuariosAdmin = express.Router(); 
const nodemailer = require('nodemailer');

const enviarMailBaja = async (correo, nombre) => {
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
      subject: 'Aviso de baja del sistema EduZona012',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00314A; padding: 20px;">
            <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
          </div>
          
          <div style="background-color: #fff; padding: 20px;">
            <h3 style="margin-bottom: 20px;">Estimad@ ${nombre},</h3>
            <p>Le informamos que su cuenta en el sistema EduZona012 ha sido dada de baja.</p>
            <p>Si considera que esto es un error, por favor, consulte con su superior.</p>
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
  
  //YAAA
usuariosAdmin.get('/registroBaja', async (req, res) => {
    let connection;
    try {
      const curp = req.query.curp;
      const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, '');
      console.log('Datos de baja  backend:', { curp, ipAddress });
  
      connection = await req.mysqlPool.getConnection();
  
      await connection.execute(`
        UPDATE registro
        SET estado_cuenta = 2, estado_usuario = 2
        WHERE curp = ?
      `, [curp]); // Actualizar los campos estado_cuenta y estado_usuario a 2
  
      const [result] = await connection.execute(`
        SELECT correo, nombre FROM registro WHERE curp = ?
      `, [curp]); // Obtener el correo del registro
  
      if (result.length === 0) {
        return res.status(404).json({ error: 'No se encontraron registros para la CURP proporcionada' });
      }
  
      const insertQuery = 'INSERT INTO logs_BajaUser (IP, fecha_hora, curp, descripcion) VALUES (?, NOW(), ?, ?)';
      await connection.execute(insertQuery, [ipAddress, curp, 'Se eliminó el acceso de un usuario del sistema']);
  
      const { correo, nombre } = result[0];
  
      try {
        await enviarMailBaja(correo, nombre);
      } catch (mailError) {
        console.error('Error al enviar el correo:', mailError);
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error al obtener registros:', error);
      res.status(500).json({ error: 'Error al obtener registros' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  
//YAAA
usuariosAdmin.post('/borrar_asignacionAdmin', async (req, res) => {
    let connection;
    try {
      const { curp } = req.body;
  
      // Mostrar el valor de curp en la consola
      console.log('Curp recibida:', curp);
  
      // Obtener datos de la asignación a eliminar
      const selectAssignSql = 'SELECT id, grado_id, grupo_id FROM asignacion_g WHERE docente_curp = ?';
      connection = await req.mysqlPool.getConnection();
      const [rows] = await connection.query(selectAssignSql, [curp]);
  
      // Si no se encuentra ninguna asignación para la Curp dada, retornar un mensaje de éxito
      if (rows.length === 0) {
        console.log(`No se encontraron asignaciones para la Curp ${curp}`);
        res.json({ success: true, message: 'No se encontraron asignaciones para esta Curp' });
        return;
      }
  
      // Iterar sobre las asignaciones encontradas para realizar las acciones necesarias
      for (const row of rows) {
        const { id, grado_id, grupo_id } = row;
  
        // Vaciar el campo docente_curp en la tabla alumnos
        const updateAlumnosSql = 'UPDATE alumnos SET docente_curp = NULL WHERE docente_curp = ? AND grado_id = ? AND grupo_id = ?';
        await connection.query(updateAlumnosSql, [curp, grado_id, grupo_id]);
  
        // Borrar la asignación de la tabla asignacion_g
        const deleteSql = 'DELETE FROM asignacion_g WHERE id = ?';
        await connection.query(deleteSql, [id]);
        console.log('Asignación borrada correctamente');
  
        // Obtener datos del docente para enviar el correo de notificación
        const selectCorreoSql = 'SELECT correo, nombre, plantel FROM registro WHERE curp = ?';
        const [docenteRows] = await connection.query(selectCorreoSql, [curp]);
        const { correo, nombre, plantel } = docenteRows[0];
  
        // Enviar correo de notificación
        await enviarCorreoBorraAsig(correo, nombre, grupo_id, grado_id, plantel);
  
        // Obtener la dirección IP del cliente
        const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, '');
  
        // Insertar registro de eliminación en la tabla logs_eliasig
        const insertQuery = 'INSERT INTO logs_eliasig (IP, fecha_hora, curp, descripcion) VALUES (?, NOW(), ?, ?)';
        await connection.execute(insertQuery, [ipAddress, curp, 'Se eliminó una asignación de grupo y grado a un docente']);
      }
  
      res.json({ success: true, message: 'Asignaciones borradas correctamente' });
    } catch (error) {
      console.error('Error al borrar la asignación: ', error);
      res.status(500).json({ success: false, message: 'Error al borrar la asignación' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  

  const enviarMailActivar = async (correo, nombre) => {
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
      subject: 'Cuenta reactivada en el sistema EduZona012',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00314A; padding: 20px;">
            <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
          </div>
          
          <div style="background-color: #fff; padding: 20px;">
            <h3 style="margin-bottom: 20px;">Estimad@ ${nombre},</h3>
            <p>Le informamos que su cuenta en el sistema EduZona012 ha sido reactivada.</p>
            <p>Ahora puede iniciar sesión nuevamente con sus credenciales.</p>
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
  usuariosAdmin.get('/registroActivar', async (req, res) => {
    let connection;
    try {
      const curp = req.query.curp;
      const ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, '');
      console.log('Datos de inicio de sesión recibidos en el backend:', { curp, ipAddress });
  
      connection = await req.mysqlPool.getConnection();
  
      await connection.execute(`
        UPDATE registro
        SET estado_cuenta = 1, estado_usuario = 1
        WHERE curp = ?
      `, [curp]); // Actualizar los campos estado_cuenta y estado_usuario a 2
  
      const [result] = await connection.execute(`
        SELECT correo, nombre
        FROM registro
        WHERE curp = ?
      `, [curp]); // Obtener el correo del registro
  
      if (result.length === 0) {
        return res.status(404).json({ error: 'No se encontraron registros para la CURP proporcionada' });
      }
  
      const insertQuery = 'INSERT INTO logs_BajaUser (IP, fecha_hora, curp, descripcion) VALUES (?, NOW(), ?, ?)';
      await connection.execute(insertQuery, [ipAddress, curp, 'Se reactivó el acceso de un usuario del sistema']);
  
      const { correo, nombre } = result[0];
  
      try {
        await enviarMailActivar(correo, nombre);
      } catch (mailError) {
        console.error('Error al enviar el correo:', mailError);
      }
  
      res.json({ success: true });
    } catch (error) {
      console.error('Error al obtener registros:', error);
      res.status(500).json({ error: 'Error al obtener registros' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  
  
 
//YAAAA
usuariosAdmin.get('/registrosB', async (req, res) => {
    let connection;
    try {
        const { pagina, registrosPorPagina, busqueda } = req.query;
        const offset = (pagina - 1) * registrosPorPagina;
        const limit = parseInt(registrosPorPagina);

        // Ajustar la consulta SQL para filtrar por nombre_plantel
        const query = `
            SELECT registro.*, 
                   plantel.nombre AS nombre_plantel, 
                   sesion.tipo_sesion AS tipo_sesion, 
                   estado_cuenta.estado_cuenta AS estado_cuenta, 
                   estado_usuario.estado_usuario AS estado_usuario
            FROM registro
            JOIN plantel ON registro.plantel = plantel.id
            JOIN sesion ON registro.sesion = sesion.id
            JOIN estado_cuenta ON registro.estado_cuenta = estado_cuenta.id
            JOIN estado_usuario ON registro.estado_usuario = estado_usuario.id
            WHERE plantel.nombre LIKE ? 
            LIMIT ? OFFSET ?;
        `;

        const searchParam = `%${busqueda}%`; // Parámetro de búsqueda para LIKE
        connection = await req.mysqlPool.getConnection();
        const [results] = await connection.execute(query, [searchParam, limit, offset]);
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


module.exports = usuariosAdmin;
