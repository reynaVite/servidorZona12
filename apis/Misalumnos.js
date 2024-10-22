const express = require('express');
const Misalumnos = express.Router();
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

Misalumnos.get('/alumnos', async (req, res) => {
    const curp = req.app.locals.curp;
    let connection;

    try {
        // Intentamos obtener una conexión del pool
        connection = await pool.getConnection();

        // Consulta para obtener grado_id y grupo_id del docente
        const [asignacionRows] = await connection.execute(`
        SELECT grado_id, grupo_id
        FROM asignacion_g
        WHERE docente_curp = ?
      `, [curp]);

        // Verificar si se encontraron resultados en la tabla asignacion_g
        if (asignacionRows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron asignaciones para el docente' });
        }

        const { grado_id, grupo_id } = asignacionRows[0]; // Tomar el primer resultado

        // Consulta para obtener los datos de los alumnos
        const [alumnosRows] = await connection.execute(`
        SELECT alumnos.*, 
               CONCAT(alumnos.nombre, ' ', alumnos.aPaterno, ' ', alumnos.aMaterno) AS nombre_completo,
               grupo.grupo AS nombre_grupo 
        FROM alumnos 
        INNER JOIN grupo ON alumnos.grupo_id = grupo.id 
        WHERE docente_curp = ? AND grado_id = ? AND grupo_id = ?
      `, [curp, grado_id, grupo_id]);

        // Verificar si se encontraron resultados en la tabla alumnos
        if (alumnosRows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron alumnos para el docente en este grado y grupo' });
        }

        // Enviamos los resultados al cliente
        res.json(alumnosRows);
    } catch (error) {
        console.error('Error en la consulta SQL:', error);
        res.status(500).json({ error: 'Error en la consulta SQL' });
    } finally {
        // Liberamos la conexión de vuelta al pool en cualquier caso
        if (connection) {
            connection.release();
        }
    }
});

//YAAAA
Misalumnos.post('/borrarAlumnos', async (req, res) => {
    let connection;

    try {
        const { docenteId } = req.body;
        connection = await req.mysqlPool.getConnection();
        const deleteSql = 'DELETE FROM alumnos WHERE idAlumnos = ?';
        await connection.query(deleteSql, [docenteId]);
        console.log('Alumno borrado correctamente');
        res.json({ success: true, message: 'Alumno borrado correctamente' });
    } catch (error) {
        console.error('Error al borrar alumno: ', error);
        res.status(500).json({ success: false, message: 'Error al borrar alumno' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

//YAAAAAAAAA
Misalumnos.post('/actualizarAlumno', async (req, res) => {
    let connection;

    try {
        const { idAlumnos, nombre, aPaterno, aMaterno } = req.body;
        console.log('Datos recibidos:', { idAlumnos, nombre, aPaterno, aMaterno }); // Imprimir datos recibidos en la consola del servidor
        const sql = 'UPDATE alumnos SET nombre = ?, aPaterno = ?, aMaterno = ? WHERE idAlumnos = ?';
        connection = await req.mysqlPool.getConnection();
        await connection.query(sql, [nombre, aPaterno, aMaterno, idAlumnos]);
        console.log('Alumno actualizado correctamente');
        res.json({ success: true, message: 'Alumno actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar alumno: ', error);
        res.status(500).json({ success: false, message: 'Error al actualizar alumno' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = Misalumnos;
