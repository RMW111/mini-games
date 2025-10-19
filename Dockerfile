# Dockerfile

# --- ЭТАП 1: Сборка React-приложения ---
FROM node:20.12.2-alpine3.19 AS frontend-builder
WORKDIR /app/games-frontend
COPY games-frontend/package*.json ./
RUN npm install
COPY games-frontend/ .
RUN npm run build


# --- ЭТАП 2: Сборка Rust-бэкенда ---
FROM rust:1.84.1-alpine3.19 AS backend-builder
RUN apk --no-cache add build-base ca-certificates
WORKDIR /app/games-backend

# 1. Копируем только манифесты.
COPY games-backend/Cargo.toml games-backend/Cargo.lock ./

# 2. Создаем ПУСТУЮ БИБЛИОТЕКУ.
# Cargo скомпилирует зависимости, но НЕ СОЗДАСТ исполняемый файл.
RUN mkdir src && echo "pub fn dummy() {}" > src/lib.rs

# 3. Собираем зависимости. Исполняемый файл 'games-backend' НЕ создается.
RUN cargo build --release --locked

# 4. Удаляем временную библиотеку.
RUN rm -f src/lib.rs

# 5. Теперь копируем наш настоящий исходный код (с main.rs) и данные sqlx.
COPY games-backend/src ./src
COPY games-backend/.sqlx ./.sqlx

# 6. Собираем финальный бинарный файл.
# Cargo видит main.rs и теперь ОБЯЗАН создать исполняемый файл.
# Все зависимости уже в кэше, поэтому этот шаг будет очень быстрым.
ENV SQLX_OFFLINE=true
RUN cargo build --release --locked


# --- ЭТАП 3: Создание финального образа ---
FROM nginx:1.25.3-alpine3.19
RUN apk --no-cache add ca-certificates

COPY --from=frontend-builder /app/games-frontend/dist /usr/share/nginx/html
COPY games-frontend/nginx/nginx.conf /etc/nginx/nginx.conf

COPY --from=backend-builder /app/games-backend/target/release/games-backend /usr/local/bin/games-backend

EXPOSE 80

COPY start.sh /start.sh
RUN chmod +x /start.sh

CMD ["/start.sh"]