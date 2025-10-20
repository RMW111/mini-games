# syntax=docker/dockerfile:1.6

# --- Виртуальные этапы для импорта контекстов ---
# Этот этап просто делает файлы из контекста "games-frontend" доступными под именем "fe-src"
FROM games-frontend AS fe-src
# Аналогично для бэкенда
FROM games-backend AS be-src


#############################################
# === ЭТАП 1: Сборка React фронтенда ===
#############################################
FROM node:20-alpine3.18 AS frontend-builder

WORKDIR /app

# Теперь мы копируем из четко определенного этапа "fe-src"
COPY --from=fe-src package*.json ./
RUN npm ci

# Копируем остальной код фронта
COPY --from=fe-src . .
RUN npm run build


#############################################
# === ЭТАП 2: Сборка Rust бэкенда ===
#############################################
FROM rust:alpine3.22 AS backend-builder
RUN apk --no-cache add build-base ca-certificates

WORKDIR /app

# Копируем из этапа "be-src"
COPY --from=be-src Cargo.toml Cargo.lock ./

# Сборка зависимостей (фейковый src, чтобы кэшировать)
RUN mkdir src && echo "pub fn dummy() {}" > src/lib.rs
RUN cargo build --release --locked
RUN rm -rf src

# Копируем реальный код и собираем приложение
COPY --from=be-src src ./src
COPY --from=be-src .sqlx ./.sqlx
ENV SQLX_OFFLINE=true
RUN cargo build --release --locked


#############################################
# === ЭТАП 3: Финальный образ ===
#############################################
FROM nginx:1.26-alpine

WORKDIR /app

# Добавляем сертификаты
RUN apk --no-cache add ca-certificates

# Копируем собранный фронт из этапа frontend-builder
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Копируем nginx-конфиг из контекста фронтенда (через этап fe-src)
COPY --from=fe-src nginx/nginx.conf /etc/nginx/nginx.conf

# Копируем бинарь бэкенда из этапа backend-builder
COPY --from=backend-builder /app/target/release/games-backend /usr/local/bin/games-backend

# Порт
EXPOSE 80

# Скрипт запуска
COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]