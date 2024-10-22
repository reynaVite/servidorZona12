const express = require('express');
const Misalumnos = express.Router();
const uuid = require('uuid');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

//YAAAAAAAAAAAAA
app.get('/categoria', async (req, res) => {
    let connection;
  
    try {
      const query = 'SELECT id, nombre, valor_id FROM Categorias'; // Modificación para incluir valor_id
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
        value: result.id,
        label: result.nombre,
        valor_id: result.valor_id // Incluir valor_id en el objeto retornado
      }));
      res.json(options);
    } catch (error) {
      console.error('Error al obtener datos de las categorias:', error);
      res.status(500).json({ error: 'Error al obtener datos de las categorias' });
    } finally {
      if (connection) {
        connection.release(); // Liberar la conexión de vuelta al pool
      }
    }
  });

  //YAAA
app.get('/valorCategoria', async (req, res) => {
    let connection;
  
    try {
      const query = 'SELECT id, valor FROM valorCate';
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
        value: result.id,
        label: result.valor
      }));
      res.json(options);
    } catch (error) {
      console.error('Error al obtener datos de las categorias:', error);
      res.status(500).json({ error: 'Error al obtener datos de las categorias' });
    } finally {
      if (connection) {
        connection.release(); // Liberar la conexión al pool
      }
    }
  });

//YAAA
app.get('/alergias', async (req, res) => {
    let connection;
    try {
      const query = 'SELECT id, alergia FROM alergias';
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
        value: result.id,
        label: result.alergia
      }));
      res.json(options);
    } catch (error) {
      console.error('Error al obtener datos de alergias:', error);
      res.status(500).json({ error: 'Error al obtener datos de alergias' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  


  //YAAA
app.get('/vacunas', async (req, res) => {
    let connection;
    try {
      const query = 'SELECT id, nombre FROM vacunas';
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
        value: result.id,
        label: result.nombre
      }));
      res.json(options);
    } catch (error) {
      console.error('Error al obtener datos de vacunas:', error);
      res.status(500).json({ error: 'Error al obtener datos de vacunas' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  
//YAAAAAAAA
app.post('/Insercategorias', async (req, res) => {
    let connection;
  
    try {
      const { categoria, valor } = req.body;
      console.log('Datos recibidos:', { categoria, valor }); // Imprimir datos recibidos en la consola del servidor
      const sql = 'INSERT INTO Categorias (nombre, valor_id) VALUES (?, ?)'; // Sentencia SQL de inserción
      connection = await req.mysqlPool.getConnection();
      await connection.query(sql, [categoria, valor]); // Insertar la categoría en la tabla Categorias junto con su valor
      console.log('Categoría insertada correctamente');
      res.json({ success: true, message: 'Categoría insertada correctamente' });
    } catch (error) {
      console.error('Error al insertar categoría: ', error);
      res.status(500).json({ success: false, message: 'Error al insertar categoría:' });
    } finally {
      if (connection) {
        connection.release(); // Liberar la conexión de vuelta al pool
      }
    }
  });
  
  
//YAAAAAAAA
app.post("/verificarSalAlumn", async (req, res) => {
    let connection;
  
    try {
      console.log("Recibiendo datos:", req.body); // Agregar este log para mostrar los datos recibidos
  
      const { idAlumnos, categoria } = req.body;
  
      // Obtener una conexión del pool de conexiones MySQL
      connection = await req.mysqlPool.getConnection();
  
      // Consulta SQL para verificar la existencia de idAlumnos y categoria en la tabla saludAlum
      const query = "SELECT COUNT(*) AS count FROM saludAlum WHERE idAlumno = ? AND idCategoria = ?";
      const [results] = await connection.execute(query, [idAlumnos, categoria]);
  
      const count = results[0].count;
      console.log("Cantidad de datos encontrados:", count);
      // Enviar respuesta indicando si los datos existen o no en la base de datos
      res.json({ exists: count > 0 });
    } catch (error) {
      console.error("Error al verificar los datos en la base de datos:", error);
      res.status(500).json({ error: "Error al verificar los datos en la base de datos" });
    } finally {
      if (connection) {
        connection.release(); // Liberar la conexión al pool
      }
    }
  });
  
  //YAAAA
app.post('/guardarDatosSalud', async (req, res) => {
    let connection;
  
    try {
      const { idAlumnos, categoria, valor } = req.body;
      console.log('Datos recibidos:', { idAlumnos, categoria, valor });
      connection = await req.mysqlPool.getConnection();
      const query = 'INSERT INTO saludAlum (idAlumno, idCategoria, valor, fecha_hora) VALUES (?, ?, ?, NOW())';
      await connection.query(query, [idAlumnos, categoria, valor]);
      console.log('Datos insertados correctamente en la tabla saludAlum');
      res.json({ success: true, message: 'Datos insertados correctamente en la tabla saludAlum' });
    } catch (error) {
      console.error('Error al procesar la solicitud: ', error);
      res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
    } finally {
      if (connection) {
        connection.release(); // Liberar la conexión al pool
      }
    }
  });
  
  app.post('/verificarDiscapacidades', async (req, res) => {
    const { idAlumnos, opcionesDiscapacitados } = req.body;
    let connection;
    let discapacidadesRegistradas = [];
  
    try {
      // Establecer conexión a la base de datos
      connection = await pool.getConnection();
  
      for (let i = 0; i < opcionesDiscapacitados.length; i++) {
        const valor = opcionesDiscapacitados[i];
  
        const existingDataQuery = `
                SELECT d.nombre AS nombre_discapacidad
                FROM unicoDiscapa u
                JOIN discapacidad d ON u.valor = d.id
                WHERE u.idAlumno = ? AND u.valor = ?
            `;
        const [existingDataRows] = await connection.execute(existingDataQuery, [idAlumnos, valor]);
  
        if (existingDataRows.length > 0) {
          const nombreDiscapacidad = existingDataRows[0].nombre_discapacidad;
          console.log(`La discapacidad ${nombreDiscapacidad} ya está registrada para el alumno ${idAlumnos}`);
          discapacidadesRegistradas.push(nombreDiscapacidad);
        } else {
          console.log(`La discapacidad con ID ${valor} aún no está registrada para el alumno ${idAlumnos}`);
        }
      }
  
      if (discapacidadesRegistradas.length > 0) {
        res.status(200).json({ exists: true, opcionesRegistradas: discapacidadesRegistradas });
      } else {
        res.status(200).json({ exists: false, opcionesRegistradas: [] });
      }
  
    } catch (error) {
      console.error('Error al verificar valores en la tabla unicoDiscapa:', error);
      res.status(500).send('Error al verificar valores en la tabla unicoDiscapa');
      return;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  

  app.post('/guardarDiscapacidades', async (req, res) => {
    const { idAlumnos, opcionesDiscapacitados } = req.body;
    let connection;
  
    try {
      // Establecer conexión a la base de datos
      connection = await pool.getConnection();
  
      for (let i = 0; i < opcionesDiscapacitados.length; i++) {
        const valor = opcionesDiscapacitados[i];
  
        // Realizar la inserción en la tabla unicoDiscapa
        const insertQuery = 'INSERT INTO unicoDiscapa (idAlumno, valor,fecha_hora) VALUES (?, ?,NOW())';
        await connection.execute(insertQuery, [idAlumnos, valor]);
  
        console.log('Discapacidad', valor);
      }
    } catch (error) {
      console.error('Error al insertar valores en la tabla unicoDiscapa:', error);
      res.status(500).send('Error al insertar valores en la tabla unicoDiscapa');
      return;
    } finally {
      if (connection) {
        connection.release();
      }
    }
    res.status(200).send('Datos recibidos correctamente y discapacidades registrados en la base de datos');
  });


  app.post('/verificarAlergias', async (req, res) => {
    const { idAlumnos, opcionesAlergias } = req.body;
    let connection;
    let alergiasRegistradas = [];
  
    try {
      // Establecer conexión a la base de datos (asegúrate de tener pool definido)
      connection = await pool.getConnection();
  
      for (let i = 0; i < opcionesAlergias.length; i++) {
        const valor = opcionesAlergias[i];
  
        const existingDataQuery = `
            SELECT a.alergia AS nombre_alergia
            FROM unicoAlergias ua
            JOIN alergias a ON ua.valor = a.id
            WHERE ua.idAlumno = ? AND ua.valor = ?
        `;
  
        const [existingDataRows] = await connection.execute(existingDataQuery, [idAlumnos, valor]);
  
        if (existingDataRows.length > 0) {
          const nombreAlergia = existingDataRows[0].nombre_alergia; // Utilizar nombre_alergia en lugar de nombre
          console.log(`La alergia ${nombreAlergia} ya está registrada para el alumno ${idAlumnos}`);
          alergiasRegistradas.push(nombreAlergia);
        } else {
          console.log(`La alergia con ID ${valor} aún no está registrada para el alumno ${idAlumnos}`);
        }
  
      }
  
      if (alergiasRegistradas.length > 0) {
        res.status(200).json({ exists: true, alergiasRegistradas });
      } else {
        res.status(200).json({ exists: false });
      }
  
    } catch (error) {
      console.error('Error al verificar alergias:', error);
      res.status(500).send('Error al verificar alergias');
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  

  app.post('/guardarAlergias', async (req, res) => {
    const { idAlumnos, opcionesAlergias } = req.body; // Recibir cicloEscolar y alumnos del cuerpo de la solicitud
  
    let connection;
  
    try {
      // Establecer conexión a la base de datos
      connection = await pool.getConnection();
  
      for (let i = 0; i < opcionesAlergias.length; i++) {
        const valor = opcionesAlergias[i];
  
        // Realizar la inserción en la tabla unicoAlergias
        const insertQuery = 'INSERT INTO unicoAlergias (idAlumno, valor,fecha_hora) VALUES (?, ?,NOW())';
        await connection.execute(insertQuery, [idAlumnos, valor]);
  
        console.log('Alergia', valor);
      }
    } catch (error) {
      console.error('Error al insertar valores en la tabla unicoAlergias:', error);
      res.status(500).send('Error al insertar valores en la tabla unicoAlergias');
      return;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  
    res.status(200).send('Datos recibidos correctamente y alergias registrados en la base de datos');
  });
   
  app.post('/verificarVacunas', async (req, res) => {
    const { idAlumnos, opcionesVacunas } = req.body;
    let connection;
    let vacunasRegistradas = [];
  
    try {
      // Establecer conexión a la base de datos (asegúrate de tener pool definido)
      connection = await pool.getConnection();
  
      for (let i = 0; i < opcionesVacunas.length; i++) {
        const valor = opcionesVacunas[i];
  
        const existingDataQuery = `
            SELECT v.nombre AS nombre_vacuna
            FROM unicoVacuna u
            JOIN vacunas v ON u.valor = v.id
            WHERE u.idAlumno = ? AND u.valor = ?
        `;
        const [existingDataRows] = await connection.execute(existingDataQuery, [idAlumnos, valor]);
  
        if (existingDataRows.length > 0) {
          const nombreVacuna = existingDataRows[0].nombre_vacuna;
          console.log(`La vacuna ${nombreVacuna} ya está registrada para el alumno ${idAlumnos}`);
          vacunasRegistradas.push(nombreVacuna);
        } else {
          console.log(`La vacuna con ID ${valor} aún no está registrada para el alumno ${idAlumnos}`);
        }
      }
  
      if (vacunasRegistradas.length > 0) {
        res.status(200).json({ exists: true, opcionesRegistradas: vacunasRegistradas });
      } else {
        res.status(200).json({ exists: false, opcionesRegistradas: [] });
      }
  
    } catch (error) {
      console.error('Error al verificar valores en la tabla unicoVacuna:', error);
      res.status(500).send('Error al verificar valores en la tabla unicoVacuna');
      return;
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  


  app.post('/guardarVacunas', async (req, res) => {
    const { idAlumnos, opcionesVacunas } = req.body;
    let connection;
  
    try {
      // Establecer conexión a la base de datos
      connection = await pool.getConnection();
  
      for (let i = 0; i < opcionesVacunas.length; i++) {
        const valor = opcionesVacunas[i];
  
        // Realizar la inserción en la tabla unicoDiscapa
        const insertQuery = 'INSERT INTO unicoVacuna (idAlumno, valor,fecha_hora) VALUES (?, ?,NOW())';
        await connection.execute(insertQuery, [idAlumnos, valor]);
  
        console.log('Vacunas', valor);
      }
    } catch (error) {
      console.error('Error al insertar valores en la tabla unicoVacuna:', error);
      res.status(500).send('Error al insertar valores en la tabla unicoVacuna');
      return;
    } finally {
      if (connection) {
        connection.release();
      }
    }
    res.status(200).send('Datos recibidos correctamente y registrados en la base de datos');
  });
   
//YAAA
app.get('/discapacidad', async (req, res) => {
    let connection;
    try {
      const query = 'SELECT id, nombre FROM discapacidad';
      connection = await req.mysqlPool.getConnection();
      const [results] = await connection.execute(query);
      const options = results.map(result => ({
        value: result.id,
        label: result.nombre
      }));
      res.json(options);
    } catch (error) {
      console.error('Error al obtener datos de discapacidades:', error);
      res.status(500).json({ error: 'Error al obtener datos de discapacidades' });
    } finally {
      if (connection) {
        connection.release();
      }
    }
  });
  
   

  

  
module.exports = Misalumnos;


