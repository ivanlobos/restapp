# Restaurar un backup de producción

Procedimiento para restaurar un backup `.dump` de prod. Probado el 2026-05-22.

> **REGLA DE ORO:** un restore SOBREESCRIBE la base destino por completo.
> Antes de cualquier restore, confirmar SIEMPRE a qué base estás apuntando.
> NUNCA restaurar sobre prod sin estar 100% seguro.

## Requisitos

- `pg_restore.exe` y `psql.exe` instalados (vienen en `C:\pgsql\bin\`).
- El archivo `.dump` a restaurar (en la carpeta `backups/`).
- La connection string DIRECTA (puerto 5432) de la base destino.
  - dev = host `kurjifphwzvcuxtycbeu`
  - prod = host `txsjqmpdrocvvvpuqjdl`

## Paso 1 — Cargar la URL destino sin exponer el password

Lee la DIRECT_URL del .env destino a una variable temporal del terminal:

```
export RESTORE_URL=$(grep '^DIRECT_URL' .env | sed -E 's/^DIRECT_URL="?([^"]*)"?.*/\1/')
```

## Paso 2 — VERIFICAR el destino (enmascarando el password)

```
echo "$RESTORE_URL" | sed -E 's/(postgres:)[^@]*@/\1***@/'
```

Confirmar TRES cosas antes de seguir:
1. El host es el que esperas (dev vs prod).
2. El puerto es 5432 (directa, NO el 6543 del pooler).
3. La URL se ve completa y bien formada.

## Paso 3 — Restaurar

```
/c/pgsql/bin/pg_restore.exe --clean --if-exists --no-owner --no-privileges -d "$RESTORE_URL" backups/NOMBRE_DEL_ARCHIVO.dump
```

- `--clean --if-exists`: borra cada objeto antes de recrearlo (esto sobreescribe).
- `--no-owner --no-privileges`: ignora dueños/permisos del dump original.

### Errores ESPERADOS (no son fallas)

Saldrán varios errores tipo "Non-superuser owned event trigger..." y al final
algo como "errors ignored on restore: 544". Esto es NORMAL: son objetos internos
de Supabase (event triggers pgrst_*, extensiones, schemas auth/storage) que el
usuario `postgres` no puede recrear porque no es superusuario. No afectan tus
tablas de negocio.

## Paso 4 — Verificar que el restore funcionó

```
/c/pgsql/bin/psql.exe "$RESTORE_URL" -c "SELECT slug, name FROM \"Tenant\" ORDER BY slug;"
```

Deben aparecer los tenants que el dump contenía. Si la tabla tiene datos, el
restore de las tablas de negocio funcionó.

## Si restauraste sobre DEV (para una prueba)

Dev queda con datos de prod. Para devolverla a su estado de desarrollo:

```
npx prisma db push --force-reset    # CONFIRMAR ANTES que .env apunta a dev
npm run db:seed
```

OJO: el seed regenera las admin keys de dev (cambian cada vez).
