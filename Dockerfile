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
RUN apk --no-cache add build-base ca-certificates
WORKDIR /app/games-backend

COPY games-backend/Cargo.toml games-backend/Cargo.lock ./

# 2. Создаем пустой бинарный проект с пустым main.rs.
# Это не позволит cargo создать исполняемый файл, но заставит его
# скачать и скомпилировать ВСЕ зависимости из Cargo.toml
RUN mkdir src && echo "fn main() { panic!(\"Dummy main should not be called\") }" > src/main.rs
# Собираем только зависимости, а не весь проект
RUN cargo build --release --locked

# 3. Теперь копируем наш настоящий код и данные для sqlx
COPY games-backend/src ./src
COPY games-backend/.sqlx ./.sqlx

# 4. Собираем финальный бинарный файл.
# Зависимости уже в кэше, поэтому этот шаг будет очень быстрым.
ENV SQLX_OFFLINE=true
RUN cargo build --release --locked


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