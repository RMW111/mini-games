# Dockerfile

# --- ЭТАП 1: Сборка React-приложения ---
FROM node:20-alpine as frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build


# --- ЭТАП 2: Сборка Rust-бэкенда ---
FROM rust:1.77 as backend-builder

WORKDIR /app/backend

# Создаем пустой проект для кэширования зависимостей
RUN USER=root cargo new --bin .
COPY backend/Cargo.lock ./
COPY backend/Cargo.toml ./
RUN cargo build --release
RUN rm -f target/release/deps/backend*

# Копируем исходный код и собираем проект
COPY backend/src ./src
RUN cargo build --release


# --- ЭТАП 3: Создание финального образа ---
FROM nginx:1.25-alpine

# Установка зависимостей
RUN apk --no-cache add ca-certificates

# Настройка Nginx
COPY --from=frontend-builder /app/frontend/dist /usr/share/nginx/html
# Копируем новую конфигурацию Nginx
COPY frontend/nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем исполняемый файл бэкенда
COPY --from=backend-builder /app/backend/target/release/backend /usr/local/bin/backend

# Открываем порт, который слушает Nginx
EXPOSE 10000

# Создаем скрипт для запуска обоих сервисов
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Запускаем Nginx и бэкенд
CMD ["/start.sh"]