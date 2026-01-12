/**
 * Script 1: Exportar datos desde SQLite
 * 
 * IMPORTANTE: Ejecutar ANTES de cambiar DATABASE_CLIENT a postgres
 * Asegúrate de que .env tenga DATABASE_CLIENT=sqlite
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('═══════════════════════════════════════════════════');
console.log('  📦 PASO 1: EXPORTAR DATOS DESDE SQLITE');
console.log('═══════════════════════════════════════════════════\n');

// Verificar que estemos usando SQLite
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

if (!envContent.includes('DATABASE_CLIENT=sqlite')) {
  console.error('❌ ERROR: .env debe tener DATABASE_CLIENT=sqlite');
  console.error('   Cambia DATABASE_CLIENT=postgres a DATABASE_CLIENT=sqlite');
  console.error('   Luego ejecuta este script nuevamente.\n');
  process.exit(1);
}

console.log('✅ Configuración correcta: DATABASE_CLIENT=sqlite\n');

const backupDir = path.join(__dirname, '..', 'backup');

// Crear directorio de backup si no existe
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log('📁 Directorio de backup creado\n');
}

const exportFile = 'sqlite-export';
const command = `npm run strapi export -- --no-encrypt --file backup/${exportFile}`;

console.log('⏳ Ejecutando exportación...');
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
    console.log('✨ EXPORTACIÓN COMPLETADA EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════\n');
    // Detectar el archivo generado por Strapi export
    const exportedTar = path.join(backupDir, `${exportFile}.tar.gz`);
    const exportedEnc = path.join(backupDir, `${exportFile}.tar.gz.enc`);
    const shownFile = fs.existsSync(exportedTar)
      ? `${exportFile}.tar.gz`
      : (fs.existsSync(exportedEnc) ? `${exportFile}.tar.gz.enc` : `${exportFile}.tar.gz`);
    console.log(`📦 Archivo exportado: backup/${shownFile}\n`);
    
    console.log('📋 PRÓXIMOS PASOS:\n');
    console.log('   1. Abre el archivo .env');
    console.log('   2. Cambia: DATABASE_CLIENT=sqlite');
    console.log('      Por: DATABASE_CLIENT=postgres');
    console.log('   3. Configura las credenciales de PostgreSQL:');
    console.log('      DATABASE_HOST=localhost');
    console.log('      DATABASE_PORT=5432');
    console.log('      DATABASE_NAME=hughesbd');
    console.log('      DATABASE_USERNAME=postgres');
    console.log('      DATABASE_PASSWORD=tu_contraseña\n');
    console.log('   4. Ejecuta: npm run develop');
    console.log('      (Espera a que inicie y luego cierra con Ctrl+C)\n');
    console.log('   5. Ejecuta: node scripts/2-import.js\n');
  } else {
    console.log('❌ ERROR EN LA EXPORTACIÓN');
    console.log('═══════════════════════════════════════════════════\n');
    console.error(`   Código de salida: ${code}`);
    console.error('   Revisa los mensajes de error arriba.\n');
    process.exit(1);
  }
});
