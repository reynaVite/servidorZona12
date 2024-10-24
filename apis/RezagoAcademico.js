const express = require('express');
const RezagoAcademico = express.Router(); 

RezagoAcademico.get('/verificar-rezago/:idAlumnos', async (req, res) => {
    let connection;
    const { idAlumnos } = req.params;

    try {
        connection = await pool.getConnection();
        const query = `
        SELECT * FROM rezagoAlumno WHERE idAlumnos = ?`;
        const [result] = await connection.execute(query, [idAlumnos]);

        if (result.length > 0) {
            return res.status(200).json({ existe: true });
        }

        res.status(200).json({ existe: false });

    } catch (error) {
        console.error('Error en la consulta SQL:', error);
        res.status(500).json({ error: 'Error al verificar el registro de rezago académico' });

    } finally {
        if (connection) {
            connection.release();
        }
    }
});

RezagoAcademico.post('/guardar-rezago-academico', async (req, res) => {
    let connection;
    const {
        idAlumnos,
        leer,
        escribir,
        habilidad,
        participacion,
        comportamiento
    } = req.body;

    try {
        // Establecer conexión desde el pool
        connection = await pool.getConnection();

        // Consulta SQL para insertar todos los datos en la tabla rezagoAlumno
        const query = `
        INSERT INTO rezagoAlumno (idAlumnos, habilidad_lectura, habilidad_escritura, habilidad_matematica, participacion, comportamiento)
        VALUES (?, ?, ?, ?, ?, ?)`;

        // Ejecutar la consulta SQL con los parámetros proporcionados
        await connection.execute(query, [idAlumnos, leer, escribir, habilidad, participacion, comportamiento]);

        // Enviar respuesta de éxito al cliente
        res.status(200).json({ message: 'Datos de rezago académico guardados correctamente' });

    } catch (error) {
        // Manejo de errores
        console.error('Error al guardar datos de rezago académico:', error);
        res.status(500).json({ error: 'Error al guardar datos de rezago académico' });

    } finally {
        // Liberar la conexión al pool, independientemente del resultado
        if (connection) {
            connection.release();
        }
    }
});


module.exports = RezagoAcademico;