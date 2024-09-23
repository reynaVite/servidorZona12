const express = require('express');
const ExamenElaboracion = express.Router(); 
const multer = require('multer'); 
const path = require('path');  
const { fromBuffer } = require('file-type');
const fs = require('fs');

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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads'); // Carpeta donde se guardarán los archivos
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Usa el nombre original del archivo
  }
});
const upload = multer({ storage: storage });

ExamenElaboracion.post('/submitExamen', upload.single('file'), async (req, res) => {
  let connection;
  const now = new Date();
  const fecha = now.toISOString().split('T')[0]; // YYYY-MM-DD
  const hora = now.toTimeString().split(' ')[0]; // HH:MM:SS
  const { opcion, descripcion, curp } = req.body; // Agregar 'curp' aquí

  console.log('CURP:', curp); // Mostrar CURP en consola
  console.log('Fecha:', fecha);
  console.log('Hora:', hora);
  console.log('Opción:', opcion);
  console.log('Descripción:', descripcion);

  // Verificar si se subió un archivo
  if (!req.file) {
    console.log('No se subió ningún archivo');
    return res.status(400).json({ message: 'No se subió ningún archivo' });
  }

  const filePath = path.join('uploads', req.file.originalname); // Ruta completa del archivo
  console.log('Archivo recibido:', req.file.originalname);
  console.log('Ruta del archivo:', filePath);

  // Verificar que el archivo sea un PDF
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const type = await fromBuffer(fileBuffer);
    if (!type || type.ext !== 'pdf') {
      console.log('El archivo no es un PDF. Tipo de archivo:', type ? type.ext : 'desconocido');
      fs.unlinkSync(filePath); // Eliminar el archivo si no es PDF
      return res.status(400).json({ message: 'El archivo debe ser un PDF' });
    }
  } catch (err) {
    console.error('Error al procesar el archivo:', err);
    fs.unlinkSync(filePath); // Eliminar el archivo en caso de error
    return res.status(500).json({ message: 'Error al procesar el archivo' });
  }

  try {
    connection = await req.mysqlPool.getConnection();
    console.log('Conexión a la base de datos establecida.');

    // Realizar la consulta para obtener el ID correspondiente al CURP
    const [rows] = await connection.query(
      "SELECT id FROM asignacion_g WHERE docente_curp = ?",
      [curp]
    );

    if (rows.length > 0) {
      const id = rows[0].id; // Obtener el primer ID
      console.log('ID encontrado en asignacion_g:', id);

      // Ahora puedes continuar con la inserción en la tabla examen
      await connection.query(
        "INSERT INTO examen (hora, fecha, materia, pdf, descripcion, id_docente) VALUES (?, ?, ?, ?, ?, ?)",
        [hora, fecha, opcion, filePath, descripcion, id] // Cambiar a 6 parámetros
      );

      console.log('Ruta del archivo PDF subida exitosamente a la tabla examen:', filePath);
      res.json({ message: 'Ruta del archivo PDF subida exitosamente', filePath });
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
