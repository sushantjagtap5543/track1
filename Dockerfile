# GeoSurePath Dockerfile v1.1.0
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY . .
RUN chmod +x gradlew && ./gradlew assemble --no-daemon

# Stage 2: Frontend (traccar-web)
FROM node:20-alpine AS web-build
WORKDIR /app/traccar-web
COPY traccar-web/package*.json ./ 2>/dev/null || echo "⚠️ traccar-web submodule missing - skipping frontend build"
RUN if [ -f package.json ]; then npm install --legacy-peer-deps && npm run build; else mkdir -p build; fi

# Stage 3: Runtime (non-root)
FROM eclipse-temurin:21-jre-alpine
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S -G appuser appuser
WORKDIR /opt/traccar

COPY --from=build --chown=appuser:appuser /app/target/tracker-server.jar ./
COPY --from=build --chown=appuser:appuser /app/target/lib ./lib
COPY --from=build --chown=appuser:appuser /app/schema ./schema
COPY --from=build --chown=appuser:appuser /app/templates ./templates
COPY --from=web-build --chown=appuser:appuser /app/traccar-web/build ./modern || true

COPY docker/traccar.xml ./conf/traccar.xml

USER appuser
EXPOSE 8082
ENTRYPOINT ["java", "-Xmx512m", "-Djava.net.preferIPv4Stack=true", "-jar", "tracker-server.jar", "conf/traccar.xml"]
