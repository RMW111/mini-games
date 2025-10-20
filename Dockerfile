# syntax=docker/dockerfile:1.6
# ↑ обязательно для BuildKit и мультиконтекстных COPY

#############################################
# === ЭТАП 1: Сборка React фронтенда ===
#############################################
FROM node:20-alpine3.18 AS frontend-builder

WORKDIR /app

# Копируем package.json и lock-файл из контекста "games-frontend"
COPY --from=games-frontend package*.json ./
RUN npm ci

# Копируем остальной код фронта
COPY --from=games-frontend . .

RUN npm run build



#############################################
# === ЭТАП 2: Сборка Rust бэкенда ===
#############################################
FROM rust:alpine3.22 AS backend-builder
RUN apk --no-cache add build-base ca-certificates

WORKDIR /app

# Копируем Cargo.toml и Cargo.lock
COPY --from=games-backend Cargo.toml Cargo.lock ./

# Сборка зависимостей (фейковый src, чтобы кэшировать)
RUN mkdir src && echo "pub fn dummy() {}" > src/lib.rs
RUN cargo build --release --locked
RUN rm -rf src

# Копируем реальный код и собираем приложение
COPY --from=games-backend src ./src
COPY --from=games-backend .sqlx ./.sqlx
ENV SQLX_OFFLINE=true
RUN cargo build --release --locked



#############################################
# === ЭТАП 3: Финальный образ ===
#############################################
FROM nginx:1.26-alpine

WORKDIR /app

# Добавляем сертификаты
RUN apk --no-cache add ca-certificates

# Копируем собранный фронт
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Копируем nginx-конфиг
COPY --from=games-frontend nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем бинарь бэкенда
COPY --from=backend-builder /app/target/release/games-backend /usr/local/bin/games-backend

# Порт
EXPOSE 80

# Скрипт запуска
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]
