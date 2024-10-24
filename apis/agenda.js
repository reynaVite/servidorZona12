const express = require('express');
const consultarAgenda = express.Router(); 
const path = require('path');
const { fromBuffer } = require('file-type');
const fs = require('fs');

consultarAgenda.get('/consultarActividadesId', async (req, res) => {
    const roleName = req.query.role;
    let connection;
    console.log('Rol del usuario:', roleName);
    try {
        const query = 'SELECT * FROM agenda WHERE tipo_asig = ?';
        connection = await req.mysqlPool.getConnection();
        const [results] = await connection.execute(query, [roleName]);
        res.json(results);
    } catch (error) {
        console.error('Error al obtener actividades:', error);
        res.status(500).json({ error: 'Error al obtener actividades' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

 


consultarAgenda.post('/subirPdf', async (req, res) => {
    let connection;
    const { curp, actividadId, pdfUrl } = req.body;  // Obtener los datos del cuerpo de la solicitud

    if (!pdfUrl) {
        return res.status(400).json({ message: 'No se proporcionó la URL del archivo PDF' });
    }

    try {
        connection = await req.mysqlPool.getConnection();

        // Guardar la URL del archivo PDF en la base de datos
        await connection.query(
            "INSERT INTO evidenciaspdf (id_agenda, pdf, curp) VALUES (?, ?, ?)",
            [actividadId, pdfUrl, curp]
        );

        res.json({ message: 'Archivo PDF subido exitosamente' });
    } catch (error) {
        console.error('Error al guardar el archivo en la base de datos:', error);
        res.status(500).json({ message: 'Error al guardar el archivo en la base de datos' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});



consultarAgenda.get('/verificarExistencia/:actividadId', async (req, res) => {
    const actividadId = req.params.actividadId;
    const curp = req.query.curp; // Obtener CURP desde los parámetros de consulta
    let connection;
    try {
      connection = await req.mysqlPool.getConnection();
      // Consultar si existe un registro con el id_agenda y curp dados
      const query = "SELECT COUNT(*) AS count FROM evidenciaspdf WHERE id_agenda = ? AND curp = ?";
      const [rows] = await connection.query(query, [actividadId, curp]);
      // Devolver true si hay al menos un registro
      res.json({ existe: rows[0].count > 0 });
    } catch (error) {
      console.error('Error al verificar la existencia en evidenciaspdf:', error);
      res.status(500).json({ error: 'Error al verificar la existencia' });
    } finally {
      if (connection) {
        connection.release(); // Liberar la conexión
      }
    }
  });
  
module.exports = consultarAgenda;
