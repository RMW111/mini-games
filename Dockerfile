# Dockerfile

# --- ЭТАП 1: Сборка React-приложения ---
FROM node:20-alpine as frontend-builder

WORKDIR /app/games-frontend

COPY games-frontend/package*.json ./
RUN npm install

COPY games-frontend/ .
RUN npm run build


# --- ЭТАП 2: Сборка Rust-бэкенда ---
FROM rust:1.79 as backend-builder

WORKDIR /app/games-backend

# Создаем пустой проект для кэширования зависимостей
RUN USER=root cargo init --bin .

COPY games-backend/Cargo.lock ./
COPY games-backend/Cargo.toml ./
# Эта сборка кэширует зависимости
RUN cargo build --release
# Удаляем временный main.rs, чтобы он не конфликтовал со следующим шагом
RUN rm -f src/main.rs

# Копируем исходный код и собираем проект
COPY games-backend/src ./src
RUN cargo build --release


# --- ЭТАП 3: Создание финального образа ---
FROM nginx:1.25-alpine

# Установка зависимостей
RUN apk --no-cache add ca-certificates

# Настройка Nginx
COPY --from=frontend-builder /app/games-frontend/dist /usr/share/nginx/html
COPY games-frontend/nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем исполняемый файл бэкенда.
# Убедитесь, что имя 'games-backend' совпадает с `name` в Cargo.toml
COPY --from=backend-builder /app/games-backend/target/release/games-backend /usr/local/bin/games-backend

# Открываем порт, который слушает Nginx
EXPOSE 10000

# Создаем скрипт для запуска обоих сервисов
COPY start.sh /start.sh
RUN chmod +x /start.sh

# Запускаем Nginx и бэкенд
CMD ["/start.sh"]