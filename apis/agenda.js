const express = require('express');
const consultarAgenda = express.Router();
const multer = require('multer');
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

const storageAgenda = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'agenda';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Crea la carpeta de forma recursiva
        }
        cb(null, dir); // Carpeta donde se guardarán los archivos
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Usa el nombre original del archivo
    }
});
const uploadAgenda = multer({ storage: storageAgenda });

consultarAgenda.post('/subirPdf', uploadAgenda.single('file'), async (req, res) => {
    let connection;
    const curp = req.body.curp;
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo' });
    }
    const filePath = path.join('agenda', req.file.originalname); // Ruta completa del archivo
    try {
        // Verificar que el archivo sea un PDF
        const fileBuffer = fs.readFileSync(filePath);
        const type = await fromBuffer(fileBuffer);
        if (!type || type.ext !== 'pdf') {
            fs.unlinkSync(filePath); // Eliminar el archivo si no es PDF
            return res.status(400).json({ message: 'El archivo debe ser un PDF' });
        }
        connection = await req.mysqlPool.getConnection();
        await connection.query("INSERT INTO evidenciasPDF (id_agenda, pdf, curp) VALUES (?, ?, ?)", [req.body.actividadId, filePath, curp]);
        res.json({ message: 'Archivo PDF subido exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al subir el archivo PDF' });
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
      const query = "SELECT COUNT(*) AS count FROM evidenciasPDF WHERE id_agenda = ? AND curp = ?";
      const [rows] = await connection.query(query, [actividadId, curp]);
      // Devolver true si hay al menos un registro
      res.json({ existe: rows[0].count > 0 });
    } catch (error) {
      console.error('Error al verificar la existencia en evidenciasPDF:', error);
      res.status(500).json({ error: 'Error al verificar la existencia' });
    } finally {
      if (connection) {
        connection.release(); // Liberar la conexión
      }
    }
  });
  
module.exports = consultarAgenda;
