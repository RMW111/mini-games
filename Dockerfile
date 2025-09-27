# Dockerfile

# --- ЭТАП 1: Сборка React-приложения ---
FROM node:20-alpine as frontend-builder

WORKDIR /app/games-frontend

COPY games-frontend/package*.json ./
RUN npm install

COPY games-frontend/ .
RUN npm run build


# --- ЭТАП 2: Сборка Rust-бэкенда ---
FROM rust:1.85-alpine as backend-builder

RUN apk --no-cache add ca-certificates

WORKDIR /app/games-backend

RUN USER=root cargo init --bin .

COPY games-backend/Cargo.lock ./
COPY games-backend/Cargo.toml ./

COPY games-backend/.sqlx ./.sqlx

# Кэшируем зависимости
RUN cargo build --release
RUN rm -f src/main.rs

# Копируем исходный код
COPY games-backend/src ./src

# Устанавливаем SQLX_OFFLINE в true, чтобы sqlx использовал папку .sqlx
ENV SQLX_OFFLINE=true
RUN cargo build --release


# --- ЭТАП 3: Создание финального образа ---
FROM nginx:1.25-alpine

RUN apk --no-cache add ca-certificates

COPY --from=frontend-builder /app/games-frontend/dist /usr/share/nginx/html
COPY games-frontend/nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=backend-builder /app/games-backend/target/release/games-backend /usr/local/bin/games-backend

EXPOSE 10000

COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]