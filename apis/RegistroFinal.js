const express = require('express');
const RegistroFinal = express.Router();
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

RegistroFinal.get('/preguntas-secretas', async (req, res) => {
  let connection;
  try {
      const query = 'SELECT id, tipo_pregunta FROM pregunta';
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
          value: result.id,
          label: result.tipo_pregunta
      }));
      res.json(options);
  } catch (error) {
      console.error('Error al obtener datos de preguntas secretas:', error);
      res.status(500).json({ error: 'Error al obtener datos de preguntas secretas' });
  } finally {
      if (connection) {
          connection.release();
      }
  }
});

RegistroFinal.post('/verificar-curp-contra', async (req, res) => {
    let connection;
    try {
      const { curp } = req.body;
      connection = await req.mysqlPool.getConnection();
      const query = 'SELECT COUNT(*) as count, contrasena FROM registro WHERE curp = ?';
      const [results] = await connection.execute(query, [curp]);
      if (results.length === 0) {
        res.json({ exists: false, emptyPassword: false });
      } else {
        const exists = results[0].count > 0;
        const emptyPassword = results[0].contrasena ? false : true;
        res.json({ exists, emptyPassword });
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

 
  
  RegistroFinal.post('/insertar-dato2', async (req, res) => {
    let connection;
    try {
      const { curp, pregunta, respuesta, contrasena } = req.body;
      connection = await req.mysqlPool.getConnection();
      // Cifrar la contraseña antes de almacenarla en la base de datos
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
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
        res.status(400).send('No existe ningún registro con esta CURP');
      }
    } catch (error) {
      console.error('Error al actualizar dato en la base de datos:', error);
      res.status(500).send('Error al actualizar dato en la base de datos');
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  


module.exports = RegistroFinal;
