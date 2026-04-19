# QA pre-producción (staging)

Checklist para validar importaciones y puntajes antes de desplegar a producción. Ejecutar en un entorno **staging** con copia de datos o base limpia según el caso.

## 1. Empleados (importación Excel)

**Ruta admin:** `/admin/importaciones` → bloque «Empleados».

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Descargar plantilla, completar al menos 2 filas (una `USER`, una `ADMIN`), una con `activo` = no | — |
| 2 | Importar el archivo | Mensaje con filas OK y sin errores (o errores solo en filas inválidas) |
| 3 | Cerrar sesión e iniciar sesión con cédula `USER` activa | Entrada a `/tablero` |
| 4 | Intentar login con cédula marcada inactiva | Rechazo (`no_registrado` o equivalente) |
| 5 | Verificar en `/admin/usuarios` (o equivalente) que el rol `ADMIN` importado puede entrar a `/admin` | Acceso admin |

**Notas:** el archivo no debe contener filas con `rol` = `ADMIN` salvo que sea intencional; revisar el archivo antes de subir en producción.

---

## 2. Retos (importación Excel)

**Ruta admin:** `/admin/importaciones` → bloque «Retos».

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Importar un reto con `fuera_plataforma` = **sí** (histórico / solo puntajes) | Reto creado o actualizado |
| 2 | Comprobar en `/tablero` que **no** aparece como jugable (o no aparece en listados de retos activos según diseño de la app) | Coherente con `platformManaged` |
| 3 | Importar otro reto con `fuera_plataforma` = **no** y fechas vigentes | Visible en tablero para usuarios |
| 4 | Verificar fechas y `codigo` único en admin | Sin errores de duplicado |

---

## 3. Puntajes (importación Excel)

**Ruta admin:** `/admin/importaciones` → bloque «Puntajes por empleado y reto».

**Precondición:** empleados y retos ya existen; el código de reto en Excel coincide con el de la importación de retos.

| Paso | Acción | Resultado esperado |
|------|--------|-------------------|
| 1 | Importar puntajes para un **reto legacy** (`fuera_plataforma` = sí) y usuario sin actividad previa en ese reto | Filas OK; total de puntos en tablero / admin coincide |
| 2 | Reimportar la misma fila con otro valor de puntos | Total actualizado (solo movimiento `PARTICIPATION` sustituido) |
| 3 | Importar puntajes = 0 para esa misma combinación | Sin línea de ledger PARTICIPATION o delta 0 según reglas de negocio |
| 4 | **Caso mixto:** usuario ya tiene puntos en el tablero por un reto **gestionado en plataforma** (residuos, trivia, agua, lugares) y se intenta importar puntaje para el mismo reto | **Rechazo** con mensaje claro (guarda implementada en código) |
| 5 | Puntos históricos solo en retos `fuera_plataforma` o usuarios sin actividad en ese reto | Sin doble conteo |

---

## 4. Referencia técnica (ledger)

- La importación de puntajes crea/actualiza un movimiento `PointLedger` con `refType = PARTICIPATION`.
- Los retos jugados en la app usan otros `refType` (residuos, lugares, agua, trivia).
- El **total** del empleado es la **suma** de todos los movimientos; por eso la aplicación bloquea importar sobre retos `platformManaged` si ya hay actividad de tablero para ese empleado y reto.
