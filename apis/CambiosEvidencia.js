const express = require('express');
const CambiosEvidencia = express.Router(); 
 


CambiosEvidencia.get('/ConcultarevidenciasPDF', async (req, res) => {
    let connection;
    const curp = req.query.curp;  // Obtener la CURP desde los parámetros de consulta
  
    if (!curp) {
      return res.status(400).json({ error: 'CURP es requerida' });
    }
  
    try {
      // Consulta SQL con JOIN para obtener la descripción de la agenda
      const query = `
        SELECT 
          e.id,
          e.id_agenda,
          a.descripcion AS descripcion_agenda
        FROM 
          evidenciaspdf e
        JOIN 
          agenda a ON e.id_agenda = a.id
        WHERE 
          e.curp = ?
      `;
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query, [curp]); // Pasar la CURP a la consulta
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
  

CambiosEvidencia.delete('/eliminarEvidencia/:id', async (req, res) => {
    let connection;
    const { id } = req.params;
    try {
        const query = 'DELETE FROM evidenciaspdf WHERE id = ?';
        connection = await req.mysqlPool.getConnection();
        await connection.execute(query, [id]);
        res.json({ message: 'Actividad eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar actividad:', error);
        res.status(500).json({ error: 'Error al eliminar actividad' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});


CambiosEvidencia.put('/editarEvidencia/:id', async (req, res) => {
    let connection;
    const { id } = req.params;
    const { pdfUrl } = req.body; // Asegúrate de recibir la nueva URL
  
    try {
      connection = await req.mysqlPool.getConnection();
      const query = 'UPDATE evidenciaspdf SET pdf = ? WHERE id = ?'; // Actualiza la URL en la tabla
      await connection.execute(query, [pdfUrl, id]);
      res.json({ message: 'Archivo PDF actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar el archivo PDF en la base de datos:', error);
      res.status(500).json({ message: 'Error al actualizar el archivo PDF' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  

CambiosEvidencia.get('/descargarEvidencia/:id', async (req, res) => {
    let connection;
    const { id } = req.params;
    try {
        connection = await req.mysqlPool.getConnection();
        const [rows] = await connection.execute('SELECT pdf FROM evidenciaspdf WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Evidencia no encontrada' });
        }

        const pdfUrl = rows[0].pdf; // Suponiendo que 'pdf' contiene la URL pública de Firebase
        res.json({ url: pdfUrl }); // Devuelve la URL al frontend
    } catch (error) {
        console.error('Error al descargar evidencia:', error);
        res.status(500).json({ message: 'Error al descargar evidencia' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});




module.exports = CambiosEvidencia;
