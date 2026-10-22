# ---- Fase 1: compilar o JAR ----
FROM gradle:8.14-jdk21 AS build
WORKDIR /home/gradle/app
COPY build.gradle settings.gradle ./
COPY src ./src
RUN gradle bootJar -x test --no-daemon

# ---- Fase 2: imagem final, so com o JRE ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /home/gradle/app/build/libs/*-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
