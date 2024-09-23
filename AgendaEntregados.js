const express = require('express');
const AgendaEntregados = express.Router();
const path = require('path');

AgendaEntregados.get('/consultarPDF', async (req, res) => {
  let connection;
  try {
    const query = `
      SELECT e.id_agenda, e.curp, e.pdf, e.id, a.titulo
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

AgendaEntregados.get('/obtenerPDF/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const query = `
      SELECT pdf FROM evidenciasPDF WHERE id = ?
    `;
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query, [id]);

    if (results.length > 0) {
      const pdfPath = path.join(__dirname, results[0].pdf);
      res.sendFile(pdfPath);
    } else {
      res.status(404).json({ error: 'PDF no encontrado' });
    }
  } catch (error) {
    console.error('Error al obtener el PDF:', error);
    res.status(500).json({ error: 'Error al obtener el PDF' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = AgendaEntregados;
