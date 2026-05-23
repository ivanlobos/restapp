/**
 * Backup de la base de datos de PRODUCCION usando pg_dump.
 *
 * Uso:
 *   node scripts/backup-prod.js
 *
 * Requiere:
 *   - .env.backup con BACKUP_DATABASE_URL = connection string DIRECTA de prod
 *     (puerto 5432, NO el pooler 6543)
 *   - pg_dump instalado. Ruta configurable con PG_DUMP_PATH en .env.backup
 *     (default: /c/pgsql/bin/pg_dump.exe estilo Windows -> C:\pgsql\bin\pg_dump.exe)
 *
 * Salida:
 *   backups/restapp_prod_YYYY-MM-DD_HHMM.dump  (formato custom -Fc)
 *
 * Restaurar (referencia):
 *   pg_restore --clean --if-exists -d "<connection_string>" backups/archivo.dump
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Cargar .env.backup
require('dotenv').config({ path: '.env.backup' });

const DB_URL = process.env.BACKUP_DATABASE_URL;
const PG_DUMP = process.env.PG_DUMP_PATH || 'C:\\pgsql\\bin\\pg_dump.exe';

function fail(msg) {
  console.error('\nERROR: ' + msg + '\n');
  process.exit(1);
}

if (!DB_URL) {
  fail('Falta BACKUP_DATABASE_URL en .env.backup. Pega ahi la connection string DIRECTA de prod (puerto 5432).');
}

if (DB_URL.includes(':6543')) {
  fail('La connection string usa el puerto 6543 (pooler). pg_dump necesita la conexion DIRECTA (puerto 5432). Usa la DIRECT_URL.');
}

// Verificar que pg_dump existe
if (!fs.existsSync(PG_DUMP)) {
  fail('No se encontro pg_dump en: ' + PG_DUMP + '\nConfigura PG_DUMP_PATH en .env.backup con la ruta correcta.');
}

// Crear carpeta backups/
const backupsDir = path.join(process.cwd(), 'backups');
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
  console.log('Carpeta creada: backups/');
}

// Nombre con timestamp: restapp_prod_2026-05-22_1530.dump
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const stamp =
  now.getFullYear() + '-' +
  pad(now.getMonth() + 1) + '-' +
  pad(now.getDate()) + '_' +
  pad(now.getHours()) +
  pad(now.getMinutes());
const outFile = path.join(backupsDir, 'restapp_prod_' + stamp + '.dump');

console.log('\n========================================');
console.log('  BACKUP DE PRODUCCION');
console.log('========================================');
console.log('  pg_dump: ' + PG_DUMP);
console.log('  Destino: ' + outFile);
console.log('  Conectando a prod... (puede tardar unos segundos)');

try {
  // -Fc = formato custom (comprimido, restaurable con pg_restore)
  // --no-owner / --no-privileges = evita problemas de permisos al restaurar en otra DB
  execFileSync(
    PG_DUMP,
    [
      '-Fc',
      '--no-owner',
      '--no-privileges',
      '-f', outFile,
      DB_URL,
    ],
    { stdio: ['ignore', 'inherit', 'inherit'] }
  );
} catch (err) {
  fail('pg_dump fallo: ' + (err.message || err));
}

// Verificar resultado
if (!fs.existsSync(outFile)) {
  fail('pg_dump termino pero no se encontro el archivo de salida.');
}

const sizeKB = (fs.statSync(outFile).size / 1024).toFixed(1);
console.log('----------------------------------------');
console.log('  OK Backup creado: ' + sizeKB + ' KB');
console.log('  ' + outFile);
console.log('========================================\n');
