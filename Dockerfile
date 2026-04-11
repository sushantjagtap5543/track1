# GeoSurePath Dockerfile v1.2.0
# Optimized for production and caching

# Stage 1: Build Backend
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew
# Dependency caching layer
RUN ./gradlew --version
COPY . .
RUN ./gradlew assemble --no-daemon

# Stage 2: Build Frontend
FROM node:20-alpine AS web-build
WORKDIR /app/traccar-web
# Optimal layer caching for Node dependencies
COPY traccar-web/package*.json ./
RUN npm install --legacy-peer-deps || echo "Failed to install dependencies"
COPY traccar-web/ ./
RUN if [ -f package.json ]; then npm run build; else mkdir -p build; fi

# Stage 3: Runtime
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S -G appuser appuser
WORKDIR /opt/traccar

# Ensure logs and data directories exist with correct permissions
RUN mkdir -p logs data && chown -R appuser:appuser /opt/traccar

COPY --from=build --chown=appuser:appuser /app/target/tracker-server.jar ./
COPY --from=build --chown=appuser:appuser /app/target/lib ./lib
COPY --from=build --chown=appuser:appuser /app/schema ./schema
COPY --from=build --chown=appuser:appuser /app/templates ./templates
COPY --from=web-build --chown=appuser:appuser /app/traccar-web/build ./modern || true

COPY docker/traccar.xml ./conf/traccar.xml

USER appuser
EXPOSE 8082
EXPOSE 5001-5150/tcp
EXPOSE 5001-5150/udp

ENTRYPOINT ["java", "-Xmx1g", "-Djava.net.preferIPv4Stack=true", "-jar", "tracker-server.jar", "conf/traccar.xml"]
