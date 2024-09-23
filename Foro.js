const express = require('express');
const app = express(); 
const Foro = express.Router(); 
const path = require('path');

Foro.get('/consultarMaterias', async (req, res) => {
  let connection;
  try {
    const query = `
      SELECT e.id, e.id_docente, e.hora, e.fecha, m.nombre AS materia, e.pdf, e.descripcion, a.docente_curp
      FROM examen e
      JOIN materias m ON e.materia = m.id
      JOIN asignacion_g a ON e.id_docente = a.id
    `;
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    
    // Imprimir resultados en consola
    console.log('Resultados obtenidos:', results);

    res.json(results);
  } catch (error) {
    console.error('Error al obtener datos:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


Foro.get('/foro', async (req, res) => {
    let connection;
    try {
      const query = `
        SELECT * FROM foro
      `;
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      res.json(results);
    } catch (error) {
      console.error('Error al obtener datos:', error);
      res.status(500).json({ error: 'Error al obtener datos' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

Foro.get('/getPdf', async (req, res) => {
    const { id } = req.query; // Obtén el id desde los parámetros de consulta
  
    if (!id) {
      return res.status(400).json({ error: 'Falta el parámetro id' });
    }
  
    let connection;
    try {
      connection = await req.mysqlPool.getConnection();
  
      const query = `
        SELECT pdf
        FROM examen
        WHERE id = ?
      `;
  
      const [rows] = await connection.execute(query, [id]);
  
      if (rows.length === 0) {
        return res.status(404).json({ error: 'PDF no encontrado' });
      }
  
      const pdfPath = rows[0].pdf;
  
      // Enviar el archivo PDF
      const fullPath = path.join(__dirname, pdfPath); // Asegúrate de tener el path correcto
      res.sendFile(fullPath);
    } catch (error) {
      console.error('Error al obtener el PDF:', error);
      res.status(500).json({ error: 'Error al obtener el PDF' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  
 Foro.post('/guardarForo', async (req, res) => {
  let connection;

  try {
    const { id, opinion, fecha, hora,   curp } = req.body; // Incluye docente_curp aquí

    console.log('Datos recibidos para el foro:', { id, opinion, fecha, hora, curp});
    connection = await req.mysqlPool.getConnection();
    const query = 'INSERT INTO foro (id_examen, curp, opinion, fecha, hora) VALUES (?,?,?,?,?)'; 
    await connection.query(query, [id, curp, opinion, fecha, hora]); // Usa docente_curp aquí
    console.log('Datos insertados correctamente al foro'); 
    res.json({ success: true, message: 'Datos insertados correctamente al foro' });
  } catch (error) {
    console.error('Error al procesar la solicitud: ', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  } finally {
    if (connection) {
      connection.release(); 
    }
  }
});


Foro.delete('/eliminarComentario/:id', async (req, res) => {
    let connection;
    try {
      const { id } = req.params;
      const query = `DELETE FROM foro WHERE id = ?`;
      connection = await req.mysqlPool.getConnection();
      const [result] = await connection.execute(query, [id]);
      
      if (result.affectedRows > 0) {
        res.json({ message: 'Comentario eliminado correctamente.' });
      } else {
        res.status(404).json({ error: 'Comentario no encontrado.' });
      }
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      res.status(500).json({ error: 'Error al eliminar comentario' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

Foro.put('/actualizarComentario', async (req, res) => {
    let connection;
    try {
      const { id, opinion } = req.body; // Obtener los datos del cuerpo de la solicitud
  
      // Verificar que se recibieron todos los datos necesarios
      if (!id || !opinion) {
        return res.status(400).json({ error: 'Faltan datos en la solicitud' });
      }
  
      const query = `UPDATE foro SET opinion = ? WHERE id = ?`;
      connection = await req.mysqlPool.getConnection();
      const [result] = await connection.execute(query, [opinion, id]);
  
      if (result.affectedRows > 0) {
        res.json({ message: 'Comentario actualizado correctamente.' });
      } else {
        res.status(404).json({ error: 'Comentario no encontrado.' });
      }
    } catch (error) {
      console.error('Error al actualizar comentario:', error);
      res.status(500).json({ error: 'Error al actualizar comentario' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

  
  module.exports = Foro;