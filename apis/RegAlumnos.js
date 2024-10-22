const express = require('express');
const RegAlumnos = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' },{ storage: multer.memoryStorage() });

RegAlumnos.post('/verificar-asignacion', async (req, res) => {
    let connection;
    try {
        const curp = req.app.locals.curp;
        // Realizar la consulta en la tabla asignacion_g para verificar si existe la CURP
        connection = await req.mysqlPool.getConnection();
        const query = 'SELECT COUNT(*) AS count FROM asignacion_g WHERE docente_curp = ?';
        const [results] = await connection.execute(query, [curp]);
        const count = results[0].count; // Obtiene el número de coincidencias

        // Verificar si la CURP existe en la tabla asignacion_g
        if (count > 0) {
            // Si la CURP existe, responder con un mensaje de éxito
            res.status(200).json({ success: true, message: 'La CURP existe en la tabla asignacion_g' });
        } else {
            // Si la CURP no existe, responder con un mensaje de error
            res.status(404).json({ success: false, message: 'La CURP no existe en la tabla asignacion_g' });
        }
    } catch (error) {
        console.error('Error al verificar la CURP en la tabla asignacion_g:', error);
        res.status(500).json({ success: false, message: 'Error al verificar la CURP en la tabla asignacion_g' });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

RegAlumnos.post('/verificar-duplicados', async (req, res) => {
    const plantel = req.app.locals.plantel;
    const { cicloEscolar, alumnos } = req.body;
    let connection;

    try {
        connection = await req.mysqlPool.getConnection();

        let duplicadosEncontrados = false;

        for (let i = 1; i < alumnos.length; i++) {
            const studentData = alumnos[i];
            const checkQuery = 'SELECT COUNT(*) AS count FROM alumnos WHERE nombre = ? AND aPaterno = ? AND aMaterno = ? AND sexo = ? AND ciclo_escolar = ? AND plantel_id = ?';
            const [checkResult] = await connection.execute(checkQuery, [studentData[0], studentData[1], studentData[2], studentData[3], cicloEscolar, plantel]);
            const count = checkResult[0].count;

            if (count > 0) {
                // Si se encuentra el alumno en la tabla, marcar que se encontraron duplicados, mostrar un mensaje en la consola y detener la iteración
                duplicadosEncontrados = true;
                console.log('Alumno encontrado en la base de datos:', studentData);
                break;
            }
        }

        if (duplicadosEncontrados) {
            console.log('Si se encontraron duplicados');
            // Si se encontraron duplicados, enviar una respuesta al frontend indicando esto
            return res.status(200).json({ duplicadosEncontrados: true });
        } else {
            // Si no se encontraron duplicados, enviar una respuesta indicando que la verificación está completa

            console.log('No se encontraron duplicados');
            return res.status(200).json({ duplicadosEncontrados: false });
        }
    } catch (error) {
        console.error('Error al verificar duplicados:', error);
        res.status(500).send('Error al verificar duplicados');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

RegAlumnos.post('/registrar-alumnos', async (req, res) => {
    const plantel = req.app.locals.plantel;
    const curp = req.app.locals.curp;
    const { cicloEscolar, alumnos } = req.body; // Recibir cicloEscolar y alumnos del cuerpo de la solicitud

    let connection;

    try {
        // Realizar la consulta en la tabla asignacion_g para obtener grado_id y grupo_id
        connection = await req.mysqlPool.getConnection();
        const query = 'SELECT grado_id, grupo_id FROM asignacion_g WHERE docente_curp = ?';
        const [results] = await connection.execute(query, [curp]);

        // Verificar si se encontraron asignaciones para el docente
        if (results.length > 0) {
            const { grado_id, grupo_id } = results[0];
            console.log('Asignación encontrada - CURP:', curp, '- Grado:', grado_id, '- Grupo:', grupo_id);

            // Iterar sobre los subarrays que contienen los datos de los alumnos
            const headers = alumnos[0];
            console.log('Datos recibidos del frontend:', alumnos); // Mostrar datos recibidos del frontend

            for (let i = 1; i < alumnos.length; i++) {
                const studentData = alumnos[i];

                // Crear un objeto de alumno utilizando los encabezados como claves
                const alumno = {
                    docente_curp: curp,
                    nombre: studentData[0], // El primer valor es el nombre
                    aPaterno: studentData[1], // El segundo valor es el apellido paterno
                    aMaterno: studentData[2], // El tercer valor es el apellido materno
                    sexo: studentData[3], // El cuarto valor es el sexo 
                    grado_id: grado_id, // Asignar el grado_id obtenido de la consulta
                    grupo_id: grupo_id, // Asignar el grupo_id obtenido de la consulta
                    ciclo_escolar: cicloEscolar // Guardar el ciclo escolar en el objeto alumno
                };

                // Insertar el alumno en la tabla alumnos
                // Insertar el alumno en la tabla alumnos
                const insertQuery = 'INSERT INTO alumnos (docente_curp, nombre, aPaterno, aMaterno, grado_id, grupo_id, sexo, ciclo_escolar, plantel_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
                await connection.execute(insertQuery, [alumno.docente_curp, alumno.nombre, alumno.aPaterno, alumno.aMaterno, alumno.grado_id, alumno.grupo_id, alumno.sexo, alumno.ciclo_escolar, plantel]);

                console.log('Alumno insertado en la base de datos:', alumno);
            }
        } else {
            console.log('No se encontraron asignaciones para el docente con CURP:', curp);
        }
    } catch (error) {
        console.error('Error al obtener asignaciones de docente o al insertar alumnos:', error);
        res.status(500).send('Error al obtener asignaciones de docente o al insertar alumnos');
        return;
    } finally {
        if (connection) {
            connection.release();
        }
    }

    res.status(200).send('Datos recibidos correctamente y alumnos registrados en la base de datos');
});

RegAlumnos.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No se ha proporcionado ningún archivo');
    }
    res.status(200).send('El archivo se cargó correctamente');
});

module.exports = RegAlumnos;