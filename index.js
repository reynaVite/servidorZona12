const express = require('express');  
const mysql = require('mysql2/promise');
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());


const PORT = process.env.PORT || 3000;


const pool = mysql.createPool({
  host: '162.241.62.202',
  user: 'eduzonac_adminZona',
  password: '.51?^^7mU6$1',
  database: 'eduzonac_012zona',
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});

app.use((req, res, next) => {
  req.mysqlPool = pool;
  next();
});

app.get('/', async (req, res) => {
  try {
    const connection = await req.mysqlPool.getConnection();
    console.log('Conexión exitosa a la base de datos');
    connection.release();
    res.send('Conexión exitosa a la base de datos');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
    res.status(500).send('Error al conectar a la base de datos');
  }
});

app.get('/consultarActividades', async (req, res) => {
  let connection;
  try {
    const query = 'SELECT * FROM agenda';
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
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

 





app.post('/guardarAgenda', async (req, res) => {
  let connection;

  try {
    const { titulo, descripcion, asignacion, fecha, hora } = req.body;
    console.log('Datos recibidos para la agenda:', { titulo, descripcion, asignacion, fecha, hora });
    connection = await req.mysqlPool.getConnection();
    const query ='INSERT INTO agenda ( titulo, descripcion, tipo_asig, fecha_sol, hora_sol, fecha_creacion) VALUES (?,?,?,?,?, NOW())'; 
    await connection.query(query, [titulo, descripcion, asignacion, fecha, hora]);
    console.log('Datos insertados correctamente a la agenda'); 
    res.json({ success: true, message: 'Datos insertados correctamente a la agenda' });
  } catch (error) {
    console.error('Error al procesar la solicitud: ', error);
    res.status(500).json({ success: false, message: 'Error al procesar la solicitud' });
  } finally {
    if (connection) {
      connection.release(); 
    }
  }
});


//YAAAAAAAAAAAAAAAA
app.post('/login', async (req, res) => {
  let plantel;
  let curp;
  let connection;
  let ipAddress;
  let requestedUrl;
  try {
    const { curp: curpFromReq, contrasena } = req.body;
    curp = curpFromReq; // Asignar el valor de la CURP desde el body de la solicitud
    ipAddress = req.ip.includes('::1') ? '127.0.0.1' : req.ip.replace(/^.*:/, ''); // Extraer la IP del cliente
    requestedUrl = req.originalUrl; // Obtener la URL solicitada
    console.log('Datos de inicio de sesión recibidos en el backend:', { curp, ipAddress, requestedUrl }); // Mostrar los datos en consola
    connection = await req.mysqlPool.getConnection();
    try {

      const query = 'SELECT * FROM registro WHERE curp = ?';
      const [results] = await connection.execute(query, [curp]);
      if (results.length > 0) {
        const user = results[0];
        const hashedPassword = user.contrasena;
        const match = await bcrypt.compare(contrasena, hashedPassword);
        if (match) {
          if (user.estado_usuario === 1) {
            if (user.estado_cuenta === 1) {
              // Verifica el rol del usuario
              const userRole = user.sesion;
              let roleName = '';
              if (userRole === 1) {
                roleName = ' 1';
              } else if (userRole === 2) {
                roleName = ' 2';
              } else if (userRole === 3) {
                roleName = ' 3';
              } else {
                roleName = 'Otro Rol';
              }
              plantel = user.plantel;
              app.locals.plantel = plantel;
              app.locals.curp = curp;
              app.locals.roleName = roleName;
              const updateQuery = 'UPDATE registro SET fecha_inicio_sesion = CURRENT_TIMESTAMP WHERE curp = ?';
              const [updateResult] = await connection.execute(updateQuery, [curp]);
              console.log(`Se actualizó ${updateResult.affectedRows} fila(s) en la tabla registro.`);
              console.log(`Inicio de sesión exitoso. Rol: ${roleName}`);
              console.log('Valor del plantel:', plantel);
              console.log('Valor de la curp:', curp);
              // Guardar datos en la tabla logs_iniciosesion
              const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
              await connection.execute(insertQuery, [curp, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión exitoso"]);

              res.json({ success: true, role: userRole, roleName: roleName, plantel: plantel });

            } else if (user.estado_cuenta === 2) {
              console.log('Inicio de sesión fallido: La cuenta está bloqueada');
              // Guardar datos en la tabla logs_iniciosesion
              const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
              await connection.execute(insertQuery, [curp, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión fallido: La cuenta está bloqueada"]);
              res.json({ success: false, message: 'La cuenta está bloqueada. Para recuperar su cuenta, restablezca su contraseña.' });
            }
          } else if (user.estado_usuario === 2) {
            console.log('Inicio de sesión fallido: El usuario ha sido dado de baja del sistema');
            // Guardar datos en la tabla logs_iniciosesion
            const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
            await connection.execute(insertQuery, [curp, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión fallido: El usuario ha sido dado de baja del sistema"]);
            res.json({ success: false, message: 'El usuario ha sido dado de baja del sistema' });
          }
        } else {
          console.log('Inicio de sesión fallido: Contraseña incorrecta');
          // Guardar datos en la tabla logs_iniciosesion
          const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
          await connection.execute(insertQuery, [curp, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión fallido: Contraseña incorrecta"]);
          res.json({ success: false, message: 'Contraseña incorrecta' });
        }
      } else {
        console.log('Inicio de sesión fallido: Usuario no encontrado');
        // Guardar datos en la tabla logs_iniciosesion
        const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
        await connection.execute(insertQuery, [curp, ipAddress, requestedUrl, res.statusCode, "Inicio de sesión fallido: Usuario no encontrado"]);
        res.json({ success: false, message: 'La CURP no está registrada' });
      }
    } finally {
      if (connection) {
        connection.release();
      }
    }
  } catch (error) {
    console.error('Error al procesar solicitud de inicio de sesión:', error);
    if (connection) {
      // Guardar datos en la tabla logs_iniciosesion
      const insertQuery = 'INSERT INTO logs_iniciosesion (curp, IP, URLS, HTTP, dia, hora, descripcion) VALUES (?, ?, ?, ?, CURRENT_DATE(), CURRENT_TIME(), ?)';
      await connection.execute(insertQuery, [curp, ipAddress, requestedUrl, res.statusCode, "Error al procesar solicitud de inicio de sesión"]);
      res.status(500).json({ success: false, message: 'Error al procesar solicitud de inicio de sesión' });
      connection.release();
    }

  }

});

 
 


 
 
app.listen(PORT, () => {
  console.log(`Servidor en ejecución en el puerto ${PORT}`);
});
