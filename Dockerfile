FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

COPY backend/pom.xml .

COPY backend/src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/fitmind-backend-1.0.0.jar app.jar

EXPOSE 10000

CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=65.0", "-XX:+UseSerialGC", "-Xss256k", "-jar", "app.jar"]
