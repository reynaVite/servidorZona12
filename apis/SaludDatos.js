const express = require('express');
const SaludDatos = express.Router();
const app = express(); 

SaludDatos.get('/saludAlum', async (req, res) => {
    let connection;

    try {
        // Suponiendo que recibes la CURP del docente en el parámetro de consulta 'curpDocente'
        const curpDocente = req.app.locals.curp;

        connection = await pool.getConnection();

        // Paso 1: Obtener la información de asignación del docente
        const [asignacionRows] = await connection.execute(`
        SELECT grado_id, grupo_id, docente_plantel
        FROM asignacion_g
        WHERE docente_curp = ?;
      `, [curpDocente]);

        // Paso 2: Obtener los alumnos que cumplen con las condiciones de grado, grupo y plantel
        const alumnosQuery = `
        SELECT idAlumnos
        FROM alumnos
        WHERE grado_id = ? AND grupo_id = ? AND plantel_id = ?;
      `;
        const [alumnosRows] = await connection.execute(alumnosQuery, [
            asignacionRows[0].grado_id,
            asignacionRows[0].grupo_id,
            asignacionRows[0].docente_plantel
        ]);

        // Paso 3: Obtener los datos de saludAlum para los alumnos obtenidos en el Paso 2
        const idAlumnos = alumnosRows.map(row => row.idAlumnos).join(',');
        const saludAlumQuery = `
      SELECT saludAlum.*, 
             Categorias.valor_id AS valor_id,
             Categorias.nombre AS nombreCategoria,
             alumnos.nombre AS nombreAlumno,
             alumnos.aPaterno AS aPaternoAlumno,
             alumnos.aMaterno AS aMaternoAlumno
      FROM saludAlum
      INNER JOIN Categorias ON saludAlum.idCategoria = Categorias.id
      INNER JOIN alumnos ON saludAlum.idAlumno = alumnos.idAlumnos
      WHERE saludAlum.idAlumno IN (${idAlumnos});
    `;

        const [saludAlumRows] = await connection.execute(saludAlumQuery);

        res.json(saludAlumRows);
    } catch (error) {
        console.error('Error en la consulta SQL:', error);
        res.status(500).json({ error: 'Error en la consulta SQL' });
    } finally {
        if (connection) {
            connection.release(); // Liberar la conexión al pool
        }
    }
});

SaludDatos.post('/actualizarSalud', async (req, res) => {
    let connection;
    try {
        const { id, valor } = req.body;
        console.log('Datos recibidos:', { id, valor }); // Imprimir datos recibidos en la consola del servidor
        const sql = 'UPDATE saludAlum SET valor = ? WHERE id = ?';
        connection = await req.mysqlPool.getConnection();
        await connection.query(sql, [valor, id]);
        console.log('Datos actualizados correctamente en la tabla saludAlum');
        res.json({ success: true, message: 'Datos actualizados correctamente en la tabla saludAlum' });
    } catch (error) {
        console.error('Error al actualizar alumno: ', error);
        res.status(500).json({ success: false, message: 'Error al actualizar alumno' });
    } finally {
        if (connection) {
            connection.release(); // Liberar la conexión al pool
        }
    }
});

SaludDatos.delete('/saludAlumBorrar', async (req, res) => {
    let connection;
    try {
        const { id } = req.body;
        connection = await req.mysqlPool.getConnection();
        const deleteSql = 'DELETE FROM saludAlum WHERE id = ?';
        await connection.query(deleteSql, [id]);
        console.log('Alumno borrado correctamente');
        res.json({ success: true, message: 'Alumno borrado correctamente' });
    } catch (error) {
        console.error('Error al borrar alumno: ', error);
        res.status(500).json({ success: false, message: 'Error al borrar alumno' });
    } finally {
        if (connection) {
            connection.release(); // Liberar la conexión al pool
        }
    }
});

SaludDatos.get('/ConsultarUnicos/:idAlumno', async (req, res) => {
    const idAlumno = req.params.idAlumno;
    let connection;

    try {
        console.log('ID del alumno:', idAlumno);

        // Establecer conexión a la base de datos
        connection = await pool.getConnection();

        // Consultar alumnos con el mismo id en la tabla unicoAlergias y sus alergias correspondientes
        const query = `
        SELECT alergias.alergia
        FROM alergias
        JOIN unicoAlergias ON alergias.id = unicoAlergias.valor
        WHERE unicoAlergias.idAlumno = ?
      `;

        const [alergias] = await connection.execute(query, [idAlumno]);

        console.log('Alergias:', alergias);

        if (alergias.length === 0) {
            res.status(404).send("No se encontraron alergias para el ID de alumno proporcionado");
            return;
        }

        // Enviar los datos al frontend
        res.status(200).json(alergias);
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send('Error al procesar la solicitud');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

SaludDatos.get('/ConsultarDiscapacifdada/:idAlumno', async (req, res) => {
    const idAlumno = req.params.idAlumno;
    let connection;

    try {
        console.log('ID del alumno:', idAlumno);

        // Establecer conexión a la base de datos
        connection = await pool.getConnection();

        // Consultar discapacidades correspondientes al ID del alumno
        const query = `
      SELECT discapacidad.nombre
      FROM discapacidad
      JOIN unicoDiscapa ON discapacidad.id = unicoDiscapa.valor
      WHERE unicoDiscapa.idAlumno = ?
    `;

        const [discapacidad] = await connection.execute(query, [idAlumno]);

        console.log('Discapacidad:', discapacidad);

        if (discapacidad.length === 0) {
            res.status(404).send("No se encontraron discapacidades para el ID de alumno proporcionado");
            return;
        }

        // Enviar los datos al frontend
        res.status(200).json(discapacidad);
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send('Error al procesar la solicitud');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

SaludDatos.get('/ConsultarVacunas/:idAlumno', async (req, res) => {
    const idAlumno = req.params.idAlumno;
    let connection;

    try {
        console.log('ID del alumno:', idAlumno);

        // Establecer conexión a la base de datos
        connection = await pool.getConnection();

        // Consultar el campo nombre de la tabla vacunas utilizando un JOIN
        const query = `
        SELECT vacunas.nombre
        FROM vacunas
        JOIN unicoVacuna ON vacunas.id = unicoVacuna.valor
        WHERE unicoVacuna.idAlumno = ?
      `;

        const [vacunas] = await connection.execute(query, [idAlumno]);

        console.log('Vacunas:', vacunas);

        if (vacunas.length === 0) {
            res.status(404).send("No se encontraron vacunas para el ID de alumno proporcionado");
            return;
        }

        // Enviar los datos al frontend
        res.status(200).json(vacunas);
    } catch (error) {
        console.error('Error al procesar la solicitud:', error);
        res.status(500).send('Error al procesar la solicitud');
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

module.exports = SaludDatos;