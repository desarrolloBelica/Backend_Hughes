# Guía de Migración: SQLite → PostgreSQL

## 📋 Prerrequisitos

1. ✅ PostgreSQL instalado y ejecutándose
2. ✅ Base de datos creada en PostgreSQL
3. ✅ Datos actuales en SQLite (`.tmp/data.db`)

## 🚀 Proceso de Migración (4 pasos)

### Paso 1: Exportar datos desde SQLite

**IMPORTANTE:** Ejecuta esto ANTES de cambiar la configuración de base de datos.

Asegúrate de que en `.env` esté configurado:
```env
DATABASE_CLIENT=sqlite
```

Luego ejecuta:

```bash
npm run strapi export -- --no-encrypt --file backup/sqlite-export
```

Esto creará un archivo comprimido con todos tus datos en `backup/sqlite-export.tar.gz` (si usas `--no-encrypt`). Si exportas cifrado, el archivo será `backup/sqlite-export.tar.gz.enc`.

### Paso 2: Configurar PostgreSQL

Edita el archivo `.env` y cambia estas líneas:

```env
DATABASE_CLIENT=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=hughesbd
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=TU_CONTRASEÑA
DATABASE_SSL=false
```

### Paso 3: Crear estructura de tablas en PostgreSQL

Ejecuta Strapi para que cree las tablas automáticamente:

```bash
npm run develop
```

Espera a que inicie completamente (verás el mensaje de admin panel listo).
Luego **cierra el servidor** con `Ctrl+C`.

### Paso 4: Importar los datos a PostgreSQL

```bash
npm run strapi import -- --file backup/sqlite-export
```

Strapi importará todos los datos:
- ✅ Content types
- ✅ Usuarios administradores  
- ✅ Usuarios de la aplicación
- ✅ Roles y permisos
- ✅ Configuraciones

### Paso 5: Verificar la migración

```bash
npm run develop
```

Accede al panel de administración y verifica que todos tus datos estén presentes.

## 🔧 Solución de Problemas

### Error: "Cannot connect to database"
- Verifica que PostgreSQL esté corriendo
- Verifica usuario y contraseña en `.env`
- Verifica que la base de datos exista: `CREATE DATABASE hughesbd;`

### Error durante la importación
- Asegúrate de que las tablas estén creadas (Paso 3)
- Verifica que el archivo de exportación exista
- Intenta con `--force` al final del comando de importación

### Datos faltantes
- El comando export/import de Strapi maneja todo automáticamente
- Si faltan archivos subidos, copia manualmente la carpeta `public/uploads/`

## ⚠️ Notas Importantes

1. **Mantén el backup**: No borres `.tmp/data.db` ni el archivo `backup/sqlite-export.tar.gz` (o `.tar.gz.enc`) hasta confirmar que todo funciona.

2. **Archivos subidos**: Los archivos en `public/uploads/` NO se migran automáticamente. Cópialos manualmente si los necesitas.

3. **Revertir**: Si necesitas volver a SQLite:
   - Cambia `DATABASE_CLIENT=sqlite` en `.env`
   - Tu archivo SQLite original sigue en `.tmp/data.db`

## 📦 Comandos de Referencia

```bash
# Exportar datos
npm run strapi export -- --no-encrypt --file backup/nombre-archivo

# Importar datos
npm run strapi import -- --file backup/nombre-archivo

# Importar forzando sobrescritura
npm run strapi import -- --file backup/nombre-archivo --force
```

## 🔄 Migración Automatizada (Opcional)

Si prefieres usar scripts automatizados, ejecuta:

```bash
# 1. Exportar (con SQLite activo en .env)
node scripts/1-export.js

# 2. Cambiar DATABASE_CLIENT a postgres en .env

# 3. Crear tablas
npm run develop
# (Luego cierra con Ctrl+C)

# 4. Importar
node scripts/2-import.js
```
