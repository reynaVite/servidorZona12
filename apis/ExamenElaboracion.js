const express = require('express');
const ExamenElaboracion = express.Router();   
//obtener materias 
ExamenElaboracion.get('/getMaterias', async (req, res) => {
    let connection;
    try {
      const query = 'SELECT id, nombre FROM materias';

      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
        value: result.id, 
        label: result.nombre 
      }));
      res.json(options);
    } catch (error) {
      console.error('Error al obtener datos :', error);
      res.status(500).json({ error: 'Error al obtener datos' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });

 
ExamenElaboracion.post('/submitExamen', async (req, res) => {
  let connection;
  const now = new Date();
  const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const hora = now.toTimeString().split(' ')[0]; // HH:MM:SS
  const { opcion, descripcion, curp, pdfUrl } = req.body; // Recibir el 'pdfUrl' del frontend

  console.log('CURP:', curp);
  console.log('Fecha:', fecha);
  console.log('Hora:', hora);
  console.log('Opción:', opcion);
  console.log('Descripción:', descripcion);
  console.log('PDF URL:', pdfUrl);

  try {
    connection = await req.mysqlPool.getConnection();
    console.log('Conexión a la base de datos establecida.');

    // Obtener el ID correspondiente al CURP
    const [rows] = await connection.query(
      "SELECT id FROM asignacion_g WHERE docente_curp = ?",
      [curp]
    );

    if (rows.length > 0) {
      const id = rows[0].id;

      // Insertar en la tabla examen
      await connection.query(
        "INSERT INTO examen (hora, fecha, materia, pdf, descripcion, id_docente) VALUES (?, ?, ?, ?, ?, ?)",
        [hora, fecha, opcion, pdfUrl, descripcion, id]
      );

      console.log('Examen guardado exitosamente con la URL del PDF:', pdfUrl);
      res.json({ message: 'Examen guardado exitosamente', pdfUrl });
    } else {
      console.log('No se encontró el CURP en asignacion_g');
      res.status(404).json({ message: 'CURP no encontrado en asignacion_g' });
    }

  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    res.status(500).json({ message: 'Error al procesar la solicitud' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});


module.exports = ExamenElaboracion;
