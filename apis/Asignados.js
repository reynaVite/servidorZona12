const express = require('express');
const Asignados = express.Router();
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

 
Asignados.get('/asignaciong', async (req, res) => {
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

  

  Asignados.post('/actualizar_asignacion', async (req, res) => {
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
  Asignados.post('/borrar_asignacion', async (req, res) => {
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
  
   

module.exports = Asignados;
