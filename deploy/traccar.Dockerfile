# Stage 1: Build Backend
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
# Download and cache dependencies
COPY gradlew .
COPY gradle gradle
RUN chmod +x gradlew && ./gradlew --version
COPY build.gradle settings.gradle ./
RUN ./gradlew dependencies --no-daemon || true

# Build the application
COPY . .
RUN chmod +x gradlew && ./gradlew assemble --no-daemon

# Stage 2: Build Frontend
FROM node:20-alpine AS web-build
WORKDIR /app/traccar-web
COPY traccar-web/package*.json ./
RUN npm install --legacy-peer-deps
COPY traccar-web/ ./
RUN npm run build

# Stage 3: Runtime
FROM eclipse-temurin:21-jre-alpine
RUN apk add --no-cache curl bash
RUN addgroup -g 1001 -S appuser && adduser -u 1001 -S -G appuser appuser
WORKDIR /opt/traccar

# Ensure logs and data directories exist
RUN mkdir -p logs data schema templates conf && \
    chown -R appuser:appuser /opt/traccar

# Copy backend artifacts
COPY --from=build --chown=appuser:appuser /app/target/tracker-server.jar ./
COPY --from=build --chown=appuser:appuser /app/target/lib ./lib
COPY --from=build --chown=appuser:appuser /app/schema ./schema
COPY --from=build --chown=appuser:appuser /app/templates ./templates

# Copy frontend artifacts (modern build)
COPY --from=web-build --chown=appuser:appuser /app/traccar-web/build ./modern/

# Copy configuration
COPY config/traccar/traccar.xml ./conf/traccar.xml

USER appuser
EXPOSE 8082
EXPOSE 5001-5150/tcp
EXPOSE 5001-5150/udp

ENV JAVA_OPTS="-Xms512m -Xmx1g"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.net.preferIPv4Stack=true -jar tracker-server.jar conf/traccar.xml"]
