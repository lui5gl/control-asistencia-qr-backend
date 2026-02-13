# Usar Node.js LTS 24.13.1 con Alpine (imagen más ligera y segura)
FROM node:24.13.1-alpine

# Instalar dependencias necesarias para compilar módulos nativos
RUN apk add --no-cache python3 make g++

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto 3000
EXPOSE 3000

# Comando por defecto (se sobrescribe en docker-compose para development)
CMD ["npm", "start"]