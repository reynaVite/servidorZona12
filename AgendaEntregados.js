const express = require('express');
const AgendaEntregados = express.Router();
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');


AgendaEntregados.get('/consultarPDF', async (req, res) => {
    let connection;
    try {
      const query = `
        SELECT e.id_agenda, e.curp, e.pdf, a.titulo
        FROM evidenciasPDF AS e
        INNER JOIN agenda AS a ON e.id_agenda = a.id
      `;
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      res.json(results);
    } catch (error) {
      console.error('Error al obtener pdf:', error);
      res.status(500).json({ error: 'Error al obtener pdf' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

module.exports = AgendaEntregados;
