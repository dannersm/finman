# FinMan

Otra App más de Finanzas hecha con Vibe-Coding (Pero funciona con el Santander)

> [Read this in English](README.en.md) 🇺🇸

**FinMan** es un gestor financiero que se sincroniza con tu banco y te ayuda a categorizar y medir tus gastos en tiempo real.
---

## 📖 Instrucciones de Uso

Una vez que la aplicación esté funcionando (ver sección de Instalación más abajo), esto es lo que puedes hacer:

### 1. 🏠 El Tablero Principal (Dashboard)
Al entrar a `http://localhost:3000`, verás el resumen de tu mes actual:
- **Gasto Total:** Cuánto has gastado en el mes en curso.
- **Gráfico de Barras:** Distribución visual de tus gastos por categoría (Comida, Transporte, Hogar, etc.).
- **Historial:** Una tabla con los movimientos sincronizados, ordenados por fecha. Aquí también se puede categorizar manualmente.
- **Gráfico Histórico:** Un gráfico de líneas que muestra los gatos en los distintos meses. Perfilable por tipos de gasto

![Vista del Tablero](assets/finman_dashboard.jpeg)

### 2. 🔄 Sincronizar con el Banco
En la esquina superior derecha, encontrarás el botón **"Sincronizar"**.
- Al presionarlo, FinMan usará tus credenciales (guardadas de forma segura en tu propio computador) para buscar nuevos movimientos.
- **Nota:** Esto puede tomar unos segundos dependiendo de los challenges del banco.

### 3. 🏷️ Categorizar Gastos
La parte más importante. FinMan intenta adivinar qué es cada gasto, pero tú tienes la última palabra:
- **Categorías configurables:** Puedes configurar categorías con palabras clave, exclusiones, y montos mínimos y máximos. Las categorías se aplican automáticamente a los movimientos scrapeados.

![Gestión de Categorías](assets/finman_categories.jpeg)

- **Aplicar Categorías:** Para aplicar los cambios a las categorías, sólo hay que dar al botón "Aplicar". Permite decidir si aplicar sólo a movimientos sin categoría, a todos los que hayan sido automáticamente categorizados, o a todos los movimientos (incluyendo los manualmente categorizados).
- **Cambiar una categoría manualmente:** Haz clic en los tres puntos en la tabla de historial para cambiar manualmente la categoría de un movimiento. (Esto toma precedencia sobre las categorías automáticas) 
- **Resumen de movimientos sin categorizar:** Una tabla resumen de los movimientos sin categorizar, agrupados por descripción del mismo, con conteo de ocurrencias y suma total. Útil para saber qué está faltando categorizar.

![Nueva Categoría](assets/finman_new_category.jpeg)

---

## 🚀 Instalación y Puesta en Marcha

Para usar FinMan en tu computador, necesitas instalarlo. Si estas palabras te suenan a chino (*Docker, Terminal*), pide ayuda a tu amigo informático de confianza o sigue estos pasos con cuidado.

### Requisitos Previos
- Tener instalado **Docker Desktop** (es el motor que hace funcionar la app).

### Paso a Paso (La forma fácil)

1.  **Configuración Inicial:**
    Abre tu terminal en la carpeta del proyecto y escribe:
    ```bash
    make setup
    ```
    *Esto creará un archivo `.env`. Ábrelo con el Bloc de Notas y pon tu RUT y Clave del banco donde se indica.*

2.  **Iniciar la Aplicación:**
    Escribe:
    ```bash
    make start
    ```
    *Espera unos momentos. Cuando termine, abre tu navegador web y entra a `http://localhost:3000`.*

3.  **Detener la Aplicación:**
    Cuando termines de usarla:
    ```bash
    make stop
    ```

---

## ⚙️ Información Técnica (Para Desarrolladores)

![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)

Esta sección es para quienes quieran modificar el código o entender cómo funciona por dentro.

### Arquitectura
El proyecto es un **Monorepo Virtual** que consta de:
- **Frontend (`/frontend`):** Hecho en Next.js. Es la interfaz que ve el usuario.
- **Scraper (`/scraper`):** Un servicio aislado con Playwright que navega el sitio del banco.
- **Base de Datos:** MongoDB corriendo en Docker.

### Comandos Avanzados (Makefile)

| Comando | Descripción |
| :--- | :--- |
| `make logs` | Muestra qué está pasando en la app y el scraper (sin ruido de base de datos). |
| `make dev` | Inicia el modo desarrollo (requiere Node.js instalado localmente). |
| `make build` | Reconstruye las imágenes de Docker (útil si modificas código). |
| `make clean` | Borra todo (contenedores y datos de la base de datos) para empezar de cero. |

### Configuración Manual (Sin Make)
Si no tienes `make` instalado, puedes usar Docker directamente:

```bash
# Iniciar
docker compose up -d

# Ver logs
docker compose logs -f frontend scraper
```
