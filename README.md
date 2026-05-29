# Sistema de Gestión de Inventario — IES Villa de Mazo

Este es el cliente web frontend para el **Sistema de Gestión de Inventario del IES Villa de Mazo**, una aplicación moderna y responsiva construida con tecnologías de vanguardia para rastrear, gestionar y auditar el equipamiento tecnológico del instituto.

La interfaz está diseñada con una estética oscura premium, efectos de glassmorphism, gradientes de fondo dinámicos y micro-animaciones fluidas para ofrecer una experiencia de usuario sobresaliente.

---

## 🚀 Tecnologías Principales

El proyecto utiliza un conjunto moderno de herramientas y librerías optimizadas para el rendimiento y la mantenibilidad:

- **React 19**: Biblioteca base para la construcción de interfaces de usuario. Aprovecha el nuevo **React Compiler** para optimizar renderizados de forma automática.
- **Vite 8**: Herramienta de compilación rápida para desarrollo y empaquetado ultraeficiente en producción.
- **TypeScript 6**: Tipado estático estricto en toda la aplicación para reducir errores en tiempo de desarrollo.
- **Tailwind CSS v4**: Motor CSS que utiliza la directiva `@theme` integrada directamente en `src/index.css` (sin necesidad de un archivo `tailwind.config.js` externo), lo cual permite una configuración fluida de estilos y breakpoints como `xs` (480px).
- **Lucide React**: Paquete de iconos vectoriales modernos y estilizados.
- **Axios**: Cliente HTTP con interceptores de respuesta para manejar solicitudes de red y propagación uniforme de errores.

---

## 📁 Estructura del Proyecto

La estructura del directorio `src` está organizada por responsabilidades de la siguiente manera:

```text
src/
├── api/          # Configuración del cliente HTTP e integración con endpoints
│   ├── client.ts     # Instancia de Axios e interceptor de errores
│   └── inventory.ts  # Servicios API para productos, categorías, usuarios, préstamos y movimientos
├── assets/       # Recursos estáticos (Logotipos e iconos PNG personalizados)
├── components/   # Componentes modulares y reutilizables de la interfaz de usuario
│   ├── BarcodeScanner.tsx # Escáner de cámara en tiempo real
│   ├── DataTable.tsx      # Tabla avanzada con filtrado, ordenamiento y paginación
│   ├── ExportMenu.tsx     # Botones y menú flotante para exportar datos
│   ├── Modal.tsx          # Contenedor de ventanas emergentes responsivo
│   ├── SettingsModal.tsx  # Modal para editar perfil de administrador
│   └── Sidebar.tsx        # Menú lateral para ordenadores y barra de navegación inferior para móviles
├── hooks/        # Hooks personalizados de React
│   ├── useFetch.ts    # Abstracción para llamadas API con manejo de carga y errores
│   ├── useScanner.ts  # Lógica y ciclo de vida de la cámara con @zxing
│   └── useToast.tsx   # Sistema dinámico de notificaciones flotantes (Toasts)
├── pages/        # Componentes de página completos
│   ├── CategoriasPage.tsx  # Vista para gestionar categorías
│   ├── Dashboard.tsx       # Vista general con estadísticas e historial rápido
│   ├── LoginPage.tsx       # Formulario de autenticación local
│   ├── MovimientosPage.tsx # Historial completo de auditorías del inventario
│   ├── NotFoundPage.tsx    # Página de error 404 personalizada
│   ├── PrestamosPage.tsx   # Control de préstamos de dispositivos
│   ├── ProductosPage.tsx   # Gestor del catálogo principal de productos
│   └── UsuariosPage.tsx    # Gestión de usuarios del sistema (solo administradores)
├── types/        # Definición de interfaces TypeScript
│   └── inventory.ts   # Modelos de datos del inventario (Producto, Categoria, etc.)
└── utils/        # Funciones de utilidad
    └── exportUtils.ts # Lógica para generar archivos Excel (.xlsx) y PDF (.pdf)
```

---

## 🛠️ Funcionalidades del Sistema

### 1. Autenticación y Control de Accesos
- **Inicio de sesión**: Formulario responsivo con validación de credenciales. La sesión se almacena de forma segura en el `localStorage`.
- **Roles**: Soporte para roles de usuario (`admin` y `user`). El panel de **Usuarios** se encuentra restringido únicamente para cuentas de administrador.
- **Confirmación de salida**: Al pulsar el botón de cerrar sesión, se despliega un modal de confirmación premium con estilo de advertencia (usando un icono de `AlertTriangle` y colores rojo/danger) para evitar cierres de sesión accidentales.

### 2. Dashboard Informativo
- Muestra tarjetas de estadísticas dinámicas (Total de productos, categorías, dispositivos en préstamo, artículos en mantenimiento, etc.).
- Gráficos y listas visuales de los movimientos más recientes realizados en el inventario.
- Resumen de préstamos activos con fechas de vencimiento próximas.

### 3. Catálogo de Inventario Avanzado (CRUD)
- Tabla interactiva con búsqueda por texto, ordenamiento por columnas y paginación fluida.
- Formularios de creación y edición de productos que se adaptan automáticamente a pantallas móviles (centrado vertical y desplazamiento optimizado).
- Registro de marcas, modelos, números de serie, precios de adquisición, ubicaciones físicas y estados (Disponible, Asignado, En Mantenimiento, Baja).

### 4. Escáner de Códigos de Barras y QR
- Integración nativa de la cámara mediante `@zxing/library` cargada perezosamente (`lazy loading`) para no saturar el tamaño del archivo JavaScript inicial.
- Incluye una interfaz animada con una línea de escaneo láser en movimiento continuo.
- **Acciones inteligentes**:
  - Si el código escaneado coincide con un producto registrado, despliega una ficha detallada del producto con la opción de ubicarlo en el inventario.
  - Si el código no está registrado, permite buscarlo manualmente o pre-rellenar el formulario para registrar un nuevo producto utilizando el código escaneado como número de serie predeterminado.
- Control de errores integrado con botón de reintento si el acceso a la cámara es denegado o falla.

### 5. Exportación de Reportes
- Menú desplegable para exportar la información actual de las tablas de datos.
- **Excel (`.xlsx`)**: Genera hojas de cálculo organizadas utilizando la librería `xlsx`.
- **PDF (`.pdf`)**: Genera documentos PDF maquetados profesionalmente con tablas automáticas utilizando `jspdf` y `jspdf-autotable`.

### 6. Control de Préstamos y Auditoría (Movimientos)
- Módulo de préstamos para registrar la entrega de dispositivos a alumnos/profesores indicando fechas límites.
- Auditoría histórica automatizada que registra cada modificación de estado, creación o eliminación indicando la fecha, el tipo de cambio y el usuario responsable.

---

## 💻 Configuración de Desarrollo

### Requisitos previos
- Node.js (v18 o superior recomendado)
- Administrador de paquetes `npm` o `pnpm`

### Instalación de dependencias
```bash
npm install
# o
pnpm install
```

### Ejecutar en modo desarrollo (Local)
```bash
npm run dev
```
El servidor de desarrollo de Vite se iniciará (usualmente en `http://localhost:5173`).

### Compilar para producción
Para compilar y minificar todo el código en el directorio `/dist`:
```bash
npm run build
```

### Probar versión de producción localmente
```bash
npm run preview
```
