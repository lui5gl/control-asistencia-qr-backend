# Backend API

API REST desarrollada con Node.js, Express, Prisma ORM, PostgreSQL y TypeScript.

## Requisitos Previos

- Docker Engine 29.x o superior
- Docker Compose v5.x o superior
- Node.js 22.x o superior (solo para desarrollo local sin Docker)

## Stack Tecnológico

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| Node.js | 22.22.0 | Runtime de JavaScript |
| TypeScript | 5.9.3 | Superset tipado de JavaScript |
| Express | 5.2.1 | Framework web para Node.js |
| Prisma | 7.4.0 | ORM para PostgreSQL |
| PostgreSQL | 18.2 | Base de datos relacional |
| JWT | jsonwebtoken | Autenticación basada en tokens |
| Bcrypt | bcryptjs | Hasheo de contraseñas |
| Docker | 29.2.1 | Containerización |
| Docker Compose | 5.0.2 | Orquestación de contenedores |

## Configuración del Entorno de Desarrollo

### 1. Clonar el Repositorio

```bash
git clone https://github.com/lui5gl/control-asistencia-qr-backend
cd backend
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar el archivo `.env` con los valores correspondientes:

```env
# Database Configuration
POSTGRES_CONTAINER_NAME=postgres
POSTGRES_VERSION=18.2
POSTGRES_USER=<tu_usuario>
POSTGRES_PASSWORD=<tu_password>
POSTGRES_DB=<tu_database>
POSTGRES_PORT=5432

# Backend Configuration
BACKEND_CONTAINER_NAME=backend
BACKEND_PORT=3000
NODE_ENV=development
API_KEY=your_secret_api_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Prisma Database URL
DATABASE_URL="postgresql://<tu_usuario>:<tu_password>@db:5432/<tu_database>?schema=public"
```

### 3. Generar Secretos de Autenticación
Es necesario generar un secreto seguro para firmar los tokens JWT:

```bash
docker exec -it backend npm run generate:secret
```

### 4. Iniciar los Servicios con Docker

```bash
docker-compose up -d
```

Este comando iniciará dos contenedores:
- **db**: Servidor PostgreSQL
- **backend**: Aplicación Node.js con hot-reload habilitado

### 4. Ejecutar Migraciones de Base de Datos

```bash
docker exec -it backend npm run prisma:migrate
```

### 5. Poblar la Base de Datos (Opcional)

```bash
docker exec -it backend npm run prisma:seed
```

## Autenticación y Seguridad

La API utiliza una combinación de mecanismos de seguridad:

1. **API Key**: Todas las rutas bajo `/api/*` requieren el encabezado `x-api-key: your_key`.
2. **JWT (JSON Web Token)**: Las rutas protegidas requieren un token Bearer en el encabezado `Authorization`.
3. **Bcrypt**: Las contraseñas de los usuarios nunca se almacenan en texto plano.

### Endpoints de Autenticación

- `POST /api/auth/register`: Registro de nuevos usuarios.
- `POST /api/auth/login`: Autenticación y obtención del token JWT.
- `GET /api/auth/me`: Verificación del perfil del usuario autenticado (requiere JWT).

## Documentación de la API (Swagger)

Una vez iniciado el servidor, puedes acceder a la documentación interactiva en:
`http://localhost:3000/api-docs`

## Arquitectura del Proyecto

```
backend/
├── prisma/
│   ├── schema.prisma        # Esquema de la base de datos
│   └── migrations/          # Migraciones generadas por Prisma
├── src/
│   ├── config/
│   │   └── prisma.ts        # Configuración del cliente Prisma
│   ├── controllers/
│   │   └── user.controller.ts # Controladores de la API
│   ├── database/
│   │   └── seeds/           # Datos de prueba
│   ├── middlewares/
│   │   └── index.ts         # Middlewares de Express
│   ├── models/              # Modelos de dominio
│   ├── routes/
│   │   ├── index.ts         # Router principal
│   │   └── user.routes.ts   # Rutas del recurso User
│   ├── types/
│   │   └── index.ts         # Tipos TypeScript y DTOs
│   └── index.ts             # Punto de entrada
├── dist/                    # JavaScript compilado
├── tsconfig.json            # Configuración de TypeScript
├── docker-compose.yml       # Orquestación de contenedores
├── Dockerfile               # Imagen del contenedor backend
└── package.json             # Dependencias y scripts
```

## Convenciones de Código

### Estructura de Directorios

- **controllers/**: Contiene la lógica de negocio de cada endpoint. Los controladores exportan funciones asíncronas que manejan las peticiones HTTP.
- **routes/**: Define las rutas de la API y mapea los endpoints a sus respectivos controladores.
- **types/**: Define los tipos TypeScript, interfaces y DTOs para tipado estático.
- **config/**: Configuraciones de servicios externos (Prisma, etc.).
- **middlewares/**: Middlewares de Express para autenticación, validación, manejo de errores, etc.

### Patrones Utilizados

- **Controladores**: Funciones exportadas que reciben `Request` y `Response` de Express.
- **Tipado**: Uso de DTOs para tipar el body y params de las peticiones.
- **Prisma Client**: Instancia singleton con adaptador PostgreSQL.

### Ejemplo de Controlador

```typescript
import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getAll = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error message' });
  }
};
```

### Ejemplo de Ruta

```typescript
import { Router } from 'express';
import * as controller from '../controllers/resource.controller';

const router = Router();

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
```

## Documentación de la API (Swagger)

La API cuenta con documentación interactiva generada con **Swagger** (OpenAPI 3.0). Una vez que el servidor backend esté en ejecución (ya sea mediante Docker o en desarrollo local), puedes visualizar y probar los endpoints desde tu navegador web ingresando a:

- **URL:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Desde esta interfaz podrás inspeccionar todos los endpoints disponibles, ver qué parámetros requieren, analizar los esquemas de petición y respuesta, e incluso realizar peticiones de prueba utilizando el botón "Try it out".

---

## Endpoints de la API

### Endpoints Generales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Información de la API |
| GET | `/health` | Estado del servidor |
| GET | `/api` | Versión de la API |

### Recurso Users

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar todos los usuarios |
| GET | `/api/users/:id` | Obtener usuario por ID |
| POST | `/api/users` | Crear nuevo usuario |
| PUT | `/api/users/:id` | Actualizar usuario |
| DELETE | `/api/users/:id` | Eliminar usuario |

#### Esquema User

```typescript
interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

## Comandos Disponibles

### Docker

```bash
docker-compose up -d        # Iniciar servicios en background
docker-compose down         # Detener servicios
docker-compose logs -f      # Ver logs en tiempo real
docker-compose logs -f backend  # Logs del backend únicamente
docker-compose restart      # Reiniciar servicios
docker-compose build        # Reconstruir imágenes
```

### Prisma

```bash
npm run prisma:generate     # Generar cliente Prisma
npm run prisma:migrate      # Crear y aplicar migración
npm run prisma:seed         # Ejecutar seeds
npm run prisma:studio       # Abrir Prisma Studio (GUI)
```

### Desarrollo Local

```bash
npm install                 # Instalar dependencias
npm run dev                 # Servidor con hot-reload (tsx watch)
npm run build               # Compilar TypeScript a JavaScript
npm start                   # Ejecutar en producción
```

## Flujo de Desarrollo

1. Crear o modificar el modelo en `prisma/schema.prisma`
2. Ejecutar migración: `docker exec -it backend npm run prisma:migrate`
3. Crear tipos en `src/types/index.ts` si es necesario
4. Implementar controlador en `src/controllers/`
5. Definir rutas en `src/routes/`
6. Registrar rutas en `src/routes/index.ts`

## Variables de Entorno

| Variable | Requerido | Descripción |
|----------|-----------|-------------|
| `POSTGRES_USER` | Sí | Usuario de PostgreSQL |
| `POSTGRES_PASSWORD` | Sí | Contraseña de PostgreSQL |
| `POSTGRES_DB` | Sí | Nombre de la base de datos |
| `POSTGRES_PORT` | No | Puerto de PostgreSQL (default: 5432) |
| `BACKEND_PORT` | No | Puerto del servidor (default: 3000) |
| `NODE_ENV` | No | Ambiente: `development` o `production` |
| `DATABASE_URL` | Sí | URL de conexión para Prisma |

## Hot Reload

El contenedor backend está configurado con volúmenes que sincronizan los cambios en el código fuente:

```yaml
volumes:
  - ./src:/app/src
  - ./tsconfig.json:/app/tsconfig.json
```

Los cambios en los archivos dentro de `src/` se reflejan automáticamente sin necesidad de reconstruir el contenedor.

## Prisma Studio

Para visualizar y editar la base de datos desde una interfaz gráfica:

```bash
docker exec -it backend npm run prisma:studio
```

Prisma Studio estará disponible en `http://localhost:5555`.
