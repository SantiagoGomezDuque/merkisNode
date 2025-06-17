const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Crear tabla de usuarios si no existe
db.prepare(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT NOT NULL,
    telefono TEXT NOT NULL,
    departamento TEXT NOT NULL,
    direccion TEXT NOT NULL,
    municipio TEXT NOT NULL,
    password TEXT NOT NULL
  )
`).run();

module.exports = db;