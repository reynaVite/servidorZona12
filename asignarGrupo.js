const express = require('express');
const asignarGrupo = express.Router();
 
const nodemailer = require('nodemailer');


asignarGrupo.get('/grupogradoDispo', async (req, res) => {
  let connection;

  try {
      const plantel = req.app.locals.plantel; // Acceso global a plantel
      console.log('Plantel recibido en grupogradoDispo:', plantel);

      if (!plantel) {
          return res.status(400).json({ error: 'Plantel no definido' });
      }

      const query = 'SELECT grado_id, grupo_id FROM alumnos WHERE plantel_id = ? AND docente_curp IS NULL';
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query, [plantel]);

      const options = results.map(result => ({
          grado_id: result.grado_id,
          grupo_id: result.grupo_id
      }));

      console.log('Grupos y grados obtenidos:', options);
      res.json(options);
  } catch (error) {
      console.error('Error al obtener los grupos y grados disponibles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
      if (connection) {
          connection.release();
      }
  }
});



  asignarGrupo.get('/grado', async (req, res) => {
    let connection;
    try {
      const query = 'SELECT id, grado FROM grado';
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
        value: result.id,
        label: result.grado
      }));
      res.json(options);
    } catch (error) {
      console.error('Error al obtener datos de grado:', error);
      res.status(500).json({ error: 'Error al obtener datos de grado' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  
  

  asignarGrupo.get('/grupo', async (req, res) => {
    let connection; 
    try {
      const query = 'SELECT id, grupo FROM grupo';
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
        value: result.id,
        label: result.grupo
      }));
      res.json(options);
    } catch (error) {
      console.error('Error al obtener datos de grupo:', error);
      res.status(500).json({ error: 'Error al obtener datos de grupo' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });



  asignarGrupo.get('/verificar_registros_curp', async (req, res) => {
    let connection;
    try {
      const curp = req.query.curp;
      const sql = 'SELECT COUNT(*) AS count FROM asignacion_g WHERE docente_curp = ?';
      connection = await req.mysqlPool.getConnection();
      const [result] = await connection.query(sql, [curp]);
      const count = result[0].count;
      // Mostrar mensaje en la consola si existen al menos un registro
      if (count >= 1) {
        console.log("Existe al menos un registroo con la misma CURP:", curp);
      }
      res.json({ count: count });
    } catch (error) {
      console.error("Error al verificar registros por CURP:", error);
      res.status(500).json({ error: "Error al verificar registros por CURP" });
    } finally {
      if (connection) {
        connection.release();  
      }
    }
  });

  

  asignarGrupo.get('/verificar_asignacion_grado_grupo', async (req, res) => {
    let connection;
  
    try {
      const { plantelId, grupo, grado } = req.query;
  
      // Mostrar los datos recibidos en la consola
      console.log("Datos recibidos:");
      console.log("Grado:", grado);
      console.log("Grupo:", grupo);
      console.log("Plantel ID:", plantelId);
  
      // Obtener una conexión del pool de conexiones MySQL
      connection = await req.mysqlPool.getConnection();
  
      // Consulta SQL para verificar la asignación
      const query = `
          SELECT COUNT(*) AS count
          FROM asignacion_g
          WHERE grado_id = ? AND grupo_id = ? AND docente_plantel = ?
      `;
      const [results] = await connection.execute(query, [grado, grupo, plantelId]);
  
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


  const enviarCorreoAsigna = async (correo, nombre, grupo, grado, plantelId) => {
    console.log('Datos que se enviarán por correo:');
    console.log('Correo:', correo);
    console.log('Nombre:', nombre);
    console.log('Grupo:', grupo);
    console.log('Grado:', grado);
    console.log('Plantel ID:', plantelId);
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
    switch (plantelId) {
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
      subject: 'Asignación de Grupo y Grado - EduZona012',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #00314A; padding: 20px;">
            <img src="https://eduzona.com.mx/logo.png" alt="EduZona012 Logo" style="max-width: 100px; max-height: 100px;">
          </div>
          <div style="background-color: #fff; padding: 20px;">
            <h3 style="margin-bottom: 20px;">Hola ${nombre},</h3>
            <p>Te informamos que has sido asignado al grupo ${letraGrupo} con grado ${grado} en el plantel ${nombrePlantel} de EduZona012.</p>
            <p>Por favor, toma nota de esta asignación y asegúrate de dirigirte a tus clases correspondientes según tu nuevo grupo y grado.</p>
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

  asignarGrupo.post('/asignar_grupo_grado', async (req, res) => {
    let connection;
    try {
      const { docenteId, grupo, grado, plantelId } = req.body;
      const sql = 'INSERT INTO asignacion_g (docente_curp, grado_id, grupo_id, docente_plantel) VALUES (?, ?, ?, ?)';
      connection = await req.mysqlPool.getConnection();
      await connection.query(sql, [docenteId, grado, grupo, plantelId]);
      console.log('Asignación guardada correctamente');
      const emailQuery = `SELECT correo, nombre, plantel FROM registro WHERE curp = ?`;
      const [rows] = await connection.query(emailQuery, [docenteId]);
      const { correo, nombre } = rows[0]; // Asegúrate de incluir plantel aquí
      await enviarCorreoAsigna(correo, nombre, grupo, grado, plantelId);
      res.json({ success: true, message: 'Asignación guardada correctamente' });
    } catch (error) {
      console.error('Error al guardar la asignación: ', error);
      res.status(500).json({ success: false, message: 'Error al guardar la asignación' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });



  asignarGrupo.post('/insertar_docente_curp_alumnos', async (req, res) => {
    let connection;
  
    try {
      const { curp, plantelId, grupo, grado } = req.body;
      console.log('Datos recibidos para insertar en la tabla alumnos:', { curp, plantelId, grupo, grado });
  
      connection = await req.mysqlPool.getConnection();
  
      const verifyQuery = 'SELECT COUNT(*) AS count FROM alumnos WHERE plantel_id = ? AND grupo_id = ? AND grado_id = ?';
      const [verifyResult] = await connection.query(verifyQuery, [plantelId, grupo, grado]);
  
      const count = verifyResult[0].count;
  
      if (count > 0) {
        const updateQuery = 'UPDATE alumnos SET docente_curp = ? WHERE plantel_id = ? AND grupo_id = ? AND grado_id = ?';
        await connection.query(updateQuery, [curp, plantelId, grupo, grado]);
        console.log('CURP del docente insertada correctamente en la tabla de alumnos');
        res.status(200).json({ message: 'CURP del docente insertada correctamente en la tabla de alumnos' });
      } else {
        console.log('No hay alumnos para ese grupo grado y plantel');
        res.status(200).json({ message: 'No se encontraron registros que cumplan las condiciones especificadas' });
      }
    } catch (error) {
      console.error('Error al insertar la CURP del docente: ', error);
      res.status(500).json({ error: 'Error al insertar la CURP del docente' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });


  module.exports = asignarGrupo;
