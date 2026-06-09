const mysql = require('mysql2/promise');
require('dotenv').config();

const tdsPool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_TDS_USER,
  password: process.env.DB_TDS_PASS,
  database: process.env.DB_TDS_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

const panlePool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_PANLE_USER,
  password: process.env.DB_PANLE_PASS,
  database: process.env.DB_PANLE_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

module.exports = {
  tdsPool,
  panlePool
};
