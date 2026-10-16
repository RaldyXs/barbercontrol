# BarberControl 💈✂️
> **Sistema Ágil de Gestión y Control para Barberos y Salones de Estética**  
> *Optimizado para barberos independientes dominicanos: rápido, táctil, con cálculo en Pesos Dominicanos (RD$), gestión de cola de turnos, control de fiados y balance de caja diario.*

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8.svg)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Render](https://img.shields.io/badge/Deploy-Render-black.svg)](https://render.com/)

---

## 📌 Tabla de Contenidos
1. [Visión y Propósito](#-visión-y-propósito)
2. [Arquitectura y Principios SOLID](#-arquitectura-y-principios-solid)
3. [Módulos y Funcionalidades](#-módulos-y-funcionalidades)
4. [Estructura del Código](#-estructura-del-código)
5. [Instalación y Desarrollo Local](#-instalación-y-desarrollo-local)
6. [Despliegue en Producción (Render.com)](#-despliegue-en-producción-rendercom)
7. [Licencia](#-licencia)

---

## 💈 Visión y Propósito

**BarberControl** nació para solucionar los problemas reales de los barberos que trabajan de forma autónoma o en locales de alto flujo:
- ❌ **Sin fricciones**: Agregar un cliente o turno toma menos de 5 segundos. No se obliga a pedir teléfono ni datos innecesarios.
- 🇩🇴 **Adaptado a República Dominicana**: Todos los importes se manejan en **Pesos Dominicanos (`RD$`)** con desglose de cobro en Efectivo o Transferencia bancaria.
- ⚡ **Modo Móvil Primero (PWA-Ready)**: Botones táctiles de gran tamaño, transiciones suaves y visibilidad óptima desde el teléfono del barbero colocado en el espejo o estación de trabajo.
- 🔒 **Persistencia Segura**: Backend Node.js ligero que almacena citas, servicios y fiados de forma atómica en disco sin requerir configuraciones de bases de datos pesadas.

---

## 🏛 Arquitectura y Principios SOLID

El código de BarberControl fue refactorizado siguiendo rigurosamente los principios de diseño de software **SOLID** para garantizar mantenibilidad, desacoplamiento y facilidad de pruebas:

| Principio | Aplicación en BarberControl | Archivos Clave |
| :--- | :--- | :--- |
| **S** - *Single Responsibility Principle* (Responsabilidad Única) | Cada módulo tiene una única razón para cambiar. Los cálculos financieros, la derivación de clientes y el almacenamiento de datos están completamente aislados del estado de la interfaz de usuario. | • [`cajaCalculator.ts`](src/services/cajaCalculator.ts)<br>• [`clienteService.ts`](src/services/clienteService.ts)<br>• [`httpAgendaStorage.ts`](src/services/httpAgendaStorage.ts) |
| **O** - *Open/Closed Principle* (Abierto/Cerrado) | La capa de almacenamiento está abierta a la extensión pero cerrada a la modificación. Se pueden añadir nuevos motores de persistencia (Supabase, Firebase, LocalStorage, SQLite) implementando `IAgendaStorage` sin modificar el `AgendaContext` ni las vistas. | • [`storage.interface.ts`](src/services/storage.interface.ts) |
| **L** - *Liskov Substitution Principle* (Sustitución de Liskov) | Cualquier implementación que cumpla el contrato `IAgendaStorage` puede intercambiarse transparentemente (por ejemplo, `HttpAgendaStorage` en producción o un `MockAgendaStorage` en tests unitarios) sin alterar el comportamiento del sistema. | • [`storage.interface.ts`](src/services/storage.interface.ts)<br>• [`httpAgendaStorage.ts`](src/services/httpAgendaStorage.ts) |
| **I** - *Interface Segregation Principle* (Segregación de Interfaces) | En lugar de una interfaz monolítica gigante en el contexto, las operaciones y estados se segregan por dominios específicos: citas, servicios, fiados, analíticas de caja y navegación. Los componentes solo dependen de las interfaces que necesitan. | • [`types/index.ts`](src/types/index.ts)<br>(`ICitasOperations`, `IServiciosOperations`, `IFiadosOperations`, `ICajaAnalytics`, `INavegacionState`) |
| **D** - *Dependency Inversion Principle* (Inversión de Dependencias) | El estado global (`AgendaContext`) no depende de una implementación concreta de red (`fetch` directo o axios), sino de la abstracción `IAgendaStorage`. La dependencia se inyecta con un valor por defecto o mediante parámetros configurables. | • [`AgendaContext.tsx`](src/context/AgendaContext.tsx) |

---

## 🚀 Módulos y Funcionalidades

### 1. 📅 Cola de Turnos y Agenda Diaria
- Alternancia ágil entre modo **Turnos** (orden de llegada para el día a día) y **Citas Programadas** (con hora asignada).
- Estados de cita claros: `Pendiente`, `En Proceso` y `Completada`.
- Finalización de cita con un solo clic especificando método de pago: **Efectivo** o **Transferencia**.
- Opción instantánea de enviar a la **Libreta de Fiados** si el cliente paga luego.

### 2. 💵 Control de Caja en Tiempo Real
- Resumen automático de ingresos brutos del día en `RD$`.
- Desglose separado: Total Efectivo vs. Total Transferencia.
- Conteo de cortes y servicios completados hoy.
- Balance vivo de deudas pendientes por cobrar.

### 3. 📒 Libreta de Fiados (Cuentas por Cobrar)
- Registro transparente de clientes con saldo pendiente.
- Historial de fecha y corte realizado.
- Acciones rápidas:
  - **Abonar deuda**: Registrar un pago parcial reduciendo el monto pendiente.
  - **Saldar cuenta**: Marcar la deuda como completamente pagada y enviar el cobro directamente a la caja del día.

### 4. ✂️ Catálogo de Servicios y Tarifas
- Tarifas preconfiguradas para cortes dominicanos:
  - Corte Clásico (`RD$ 350`)
  - Corte + Barba / Perfilado (`RD$ 500`)
  - Barba Express (`RD$ 200`)
  - Lavado + Peinado (`RD$ 250`)
  - Tinte / Color (`RD$ 700`)
  - Paquete Completo VIP (`RD$ 850`)
- Creación, edición y eliminación de servicios y precios en cualquier momento.

---

## 📂 Estructura del Código

```text
barbercontrol/
├── server.js                      # Servidor backend Express (API /api/agenda y estáticos dist/)
├── data/
│   └── agenda-db.json             # Base de datos JSON limpia para producción
├── src/
│   ├── components/                # Componentes modulares y reutilizables
│   │   ├── Header.tsx             # Barra superior con fecha y estado del servidor
│   │   ├── Navigation.tsx         # Barra de navegación táctil inferior/superior
│   │   ├── NuevaCitaModal.tsx     # Modal ágil para registrar cliente y corte
│   │   └── CobrarModal.tsx        # Modal de cobro rápido (Efectivo/Transferencia/Fiado)
│   ├── context/
│   │   └── AgendaContext.tsx      # Orquestador del estado inyectando IAgendaStorage (DIP)
│   ├── services/                  # Servicios desacoplados (SRP, OCP, LSP)
│   │   ├── storage.interface.ts   # Contrato abstracto IAgendaStorage
│   │   ├── httpAgendaStorage.ts   # Implementación cliente HTTP
│   │   ├── cajaCalculator.ts      # Motor puro de cálculo financiero y métricas
│   │   └── clienteService.ts      # Motor de extracción de clientes frecuentes
│   ├── types/
│   │   └── index.ts               # Interfaces segregadas (ISP) y modelos de dominio
│   ├── utils/
│   │   └── formatters.ts          # Formateador oficial de moneda RD$ y fechas
│   ├── views/                     # Vistas principales de la aplicación
│   │   ├── AgendaView.tsx         # Vista de turnos y citas del día
│   │   ├── CajaView.tsx           # Vista de ingresos y métricas de caja
│   │   ├── FiadosView.tsx         # Vista de la libreta de deudas
│   │   └── ServiciosView.tsx      # Vista de tarifas y catálogo
│   ├── App.tsx                    # Componente raíz
│   └── main.tsx                   # Punto de entrada Vite/React
├── render.yaml                    # Especificación de Infraestructura como Código para Render
├── package.json                   # Dependencias y scripts de compilación
├── tsconfig.json                  # Configuración estricta de TypeScript
└── vite.config.ts                 # Configuración de empaquetado Vite
```

---

## 💻 Instalación y Desarrollo Local

### Prerrequisitos
- Node.js 18.x o superior
- npm 9.x o superior

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/RaldyXs/barbercontrol.git
   cd barbercontrol
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Modo Desarrollo (Frontend Vite con recarga rápida):**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

4. **Compilar para Producción:**
   ```bash
   npm run build
   ```

5. **Iniciar Servidor Completo (Producción Local):**
   ```bash
   npm start
   ```
   Abre [http://localhost:3000](http://localhost:3000). El backend servirá tanto la API de datos como el frontend compilado.

---

## ☁️ Despliegue en Producción (Render.com)

El proyecto está preparado para desplegarse de forma 100% gratuita y continua en **Render**:

### Opción Rápida: Desde el Dashboard de Render

1. Entra a [dashboard.render.com](https://dashboard.render.com/) e inicia sesión.
2. Haz clic en el botón azul **"New +"** y selecciona **"Web Service"**.
3. Elige la opción **"Build and deploy from a Git repository"** y haz clic en **Next**.
4. Conecta tu cuenta de GitHub y selecciona el repositorio:
   ```text
   RaldyXs/barbercontrol
   ```
5. Configura los siguientes campos:
   - **Name**: `barbercontrol` *(o el nombre que prefieras)*
   - **Region**: La más cercana (ej. *Ohio, US East*)
   - **Branch**: `main`
   - **Root Directory**: *(dejar en blanco)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. Haz clic en **"Deploy Web Service"**.

Render compilará la aplicación y en pocos minutos te entregará una URL permanente con certificado SSL gratuito (ejemplo: `https://barbercontrol.onrender.com`).

---

## 📄 Licencia

Este proyecto es de código abierto bajo la licencia [MIT](LICENSE). Siéntete libre de utilizarlo y personalizarlo para cualquier barbería o salón.
