/**
 * Script 2: Importar datos a PostgreSQL
 * 
 * IMPORTANTE: Ejecutar DESPUÉS de:
 * 1. Cambiar DATABASE_CLIENT a postgres en .env
 * 2. Ejecutar npm run develop (para crear las tablas)
 * 3. Cerrar Strapi (Ctrl+C)
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('═══════════════════════════════════════════════════');
console.log('  📥 PASO 2: IMPORTAR DATOS A POSTGRESQL');
console.log('═══════════════════════════════════════════════════\n');

// Verificar que estemos usando PostgreSQL
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

if (!envContent.includes('DATABASE_CLIENT=postgres')) {
  console.error('❌ ERROR: .env debe tener DATABASE_CLIENT=postgres');
  console.error('   Cambia DATABASE_CLIENT=sqlite a DATABASE_CLIENT=postgres');
  console.error('   Luego ejecuta este script nuevamente.\n');
  process.exit(1);
}

console.log('✅ Configuración correcta: DATABASE_CLIENT=postgres\n');

const exportFile = 'sqlite-export';
const encPath = path.join(__dirname, '..', 'backup', `${exportFile}.tar.gz.enc`);
const gzPath = path.join(__dirname, '..', 'backup', `${exportFile}.tar.gz`);
const exportPath = fs.existsSync(encPath) ? encPath : (fs.existsSync(gzPath) ? gzPath : null);

if (!exportPath) {
  console.error('❌ ERROR: No se encontró el archivo de exportación');
  console.error(`   Buscado en: backup/${exportFile}.tar.gz y backup/${exportFile}.tar.gz.enc`);
  console.error('   Primero ejecuta: node scripts/1-export.js\n');
  process.exit(1);
}

console.log(`✅ Archivo de exportación encontrado: ${path.basename(exportPath)}\n`);

// Usar la ruta completa con extensión que fue detectada, con separadores POSIX
const importFile = `backup/${path.basename(exportPath)}`.replace(/\\/g, '/');
const command = `npm run strapi import -- --file ${importFile} --force`;

console.log('⏳ Ejecutando importación...');
console.log(`   Comando: ${command}\n`);
console.log('   Esto puede tomar varios minutos dependiendo de la cantidad de datos...\n');

const child = exec(command, { 
  maxBuffer: 10 * 1024 * 1024,
  cwd: path.join(__dirname, '..')
});

child.stdout.on('data', (data) => {
  process.stdout.write(data);
});

child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  console.log('\n═══════════════════════════════════════════════════');
  
  if (code === 0) {
    console.log('✨ IMPORTACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('✅ Todos los datos han sido migrados a PostgreSQL\n');
    
    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('   1. Ejecuta: npm run develop');
    console.log('   2. Accede al panel de administración');
    console.log('   3. Verifica que todos tus datos estén presentes\n');
    
    console.log('💡 NOTA IMPORTANTE:\n');
    console.log('   - Tu archivo SQLite original sigue en .tmp/data.db');
    console.log('   - El backup está en backup/sqlite-export.tar.gz (o .tar.gz.enc si encriptaste)');
    console.log('   - NO LOS BORRES hasta confirmar que todo funciona\n');
    
    console.log('📁 Si tienes archivos subidos (uploads):');
    console.log('   Los archivos en public/uploads/ ya deberían estar ahí');
    console.log('   No necesitas copiarlos manualmente\n');
  } else {
    console.log('❌ ERROR EN LA IMPORTACIÓN');
    console.log('═══════════════════════════════════════════════════\n');
    console.error(`   Código de salida: ${code}`);
    console.error('   Revisa los mensajes de error arriba.\n');
    console.error('💡 SOLUCIONES COMUNES:\n');
    console.error('   - Verifica que PostgreSQL esté corriendo');
    console.error('   - Verifica las credenciales en .env');
    console.error('   - Verifica que la base de datos exista');
    console.error('   - Asegúrate de haber ejecutado npm run develop primero\n');
    process.exit(1);
  }
});
