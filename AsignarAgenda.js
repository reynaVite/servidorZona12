const express = require('express');
const AsignarAgenda = express.Router();
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

//sesion esta en preRegistro

AsignarAgenda.post('/guardarAgenda', async (req, res) => {
    let connection;
  
    try {
      const { titulo, descripcion, asignacion, fecha, hora } = req.body;
      console.log('Datos recibidos para la agenda:', { titulo, descripcion, asignacion, fecha, hora });
      connection = await req.mysqlPool.getConnection();
      const query ='INSERT INTO agenda ( titulo, descripcion, tipo_asig, fecha_sol, hora_sol, fecha_creacion) VALUES (?,?,?,?,?, NOW())'; 
      await connection.query(query, [titulo, descripcion, asignacion, fecha, hora]);
      console.log('Datos insertados correctamente a la agenda'); 
      res.json({ success: true, message: 'Datos insertados correctamente a la agenda' });
    } catch (error) {
      console.error('Error al procesar la solicitud: ', error);
      res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
    } finally {
      if (connection) {
        connection.release(); 
      }
    }
  });
  

module.exports = AsignarAgenda;
