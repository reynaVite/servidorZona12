const express = require('express');
const router = express.Router();

// Ruta para obtener datos de grado
router.get('/grado', async (req, res) => {
  let connection;
  try {
    const query = 'SELECT id, grado FROM grado';
    connection = await req.mysqlPool.getConnection();
    const [results] = await connection.execute(query);
    const options = results.map(result => ({
      value: result.id,
      label: result.grado
    }));
    res.json(options);
  } catch (error) {
    console.error('Error al obtener datos de grado:', error);
    res.status(500).json({ error: 'Error al obtener datos de grado' });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

// Puedes agregar más rutas aquí

module.exports = router;
