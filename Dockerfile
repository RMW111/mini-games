# syntax=docker/dockerfile:1.6

#############################################
# === ЭТАП 1: Сборка React фронтенда ===
#############################################
FROM node:20-alpine3.18 AS frontend-builder

WORKDIR /app

# Копируем package.json ИЗ ПОДКАТАЛОГА в текущем контексте
COPY games-frontend/package*.json ./
RUN npm ci

# Копируем остальной код фронта ИЗ ПОДКАТАЛОГА
COPY games-frontend/ .
RUN npm run build


#############################################
# === ЭТАП 2: Сборка Rust бэкенда ===
#############################################
FROM rust:alpine3.22 AS backend-builder
RUN apk add --no-cache musl-dev pkgconfig openssl-dev openssl-libs-static
RUN apk --no-cache add build-base ca-certificates

WORKDIR /app

# Копируем Cargo.toml ИЗ ПОДКАТАЛОГА
COPY games-backend/Cargo.toml games-backend/Cargo.lock ./

# Сборка зависимостей (фейковый src, чтобы кэшировать)
RUN mkdir src && echo "pub fn dummy() {}" > src/lib.rs
RUN cargo build --release --locked
RUN rm -rf src

# Копируем реальный код и собираем приложение
COPY games-backend/src ./src
COPY games-backend/.sqlx ./.sqlx
ENV SQLX_OFFLINE=true
RUN cargo build --release --locked


#############################################
# === ЭТАП 3: Финальный образ ===
#############################################
FROM nginx:1.26-alpine

WORKDIR /app
RUN apk --no-cache add ca-certificates

# Копируем собранный фронт
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Копируем nginx-конфиг (путь от корня проекта)
COPY games-frontend/nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем бинарь бэкенда
COPY --from=backend-builder /app/target/release/games-backend /usr/local/bin/games-backend

EXPOSE 80
COPY start.sh /start.sh
RUN chmod +x /start.sh
CMD ["/start.sh"]