const express = require('express');
const CambiosEvidencia = express.Router();
const app = express();
const nodemailer = require('nodemailer');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' },{ storage: multer.memoryStorage() });
CambiosEvidencia.get('/ConcultarevidenciasPDF', async (req, res) => {
    let connection;
    const curp = req.app.locals.curp;
    try {
        // Consulta SQL con JOIN para obtener la descripción de la agenda
        const query = `
        SELECT 
          e.id,
          e.id_agenda,
          a.descripcion AS descripcion_agenda
        FROM 
          evidenciasPDF e
        JOIN 
          agenda a ON e.id_agenda = a.id
        WHERE 
          e.curp = ?
      `;
        connection = await req.mysqlPool.getConnection();
        const [results] = await connection.execute(query, [curp]);
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
        const query = 'DELETE FROM evidenciasPDF WHERE id = ?';
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

CambiosEvidencia.put('/editarEvidencia/:id', upload.single('file'), async (req, res) => {
    let connection;
    const { id } = req.params;
    if (!req.file) {
        return res.status(400).json({ message: 'No se subió ningún archivo' });
    }
    const localFilePath = path.join(__dirname, 'uploads', req.file.filename);
    const fileContent = fs.readFileSync(localFilePath);

    try {
        connection = await req.mysqlPool.getConnection();

        // Actualizar archivo en la tabla evidenciasPDF
        const query = 'UPDATE evidenciasPDF SET pdf = ? WHERE id = ?';
        await connection.execute(query, [fileContent, id]);

        // Borrar el archivo temporal después de subirlo a la base de datos
        fs.unlinkSync(localFilePath);

        res.json({ message: 'Archivo PDF actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar el archivo PDF en la tabla evidenciasPDF:', error);
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
        const [rows] = await connection.execute('SELECT pdf FROM evidenciasPDF WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Evidencia no encontrada' });
        }

        const pdfBuffer = rows[0].pdf;

        res.setHeader('Content-Disposition', `attachment; filename=evidencia_${id}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        res.send(pdfBuffer);
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
