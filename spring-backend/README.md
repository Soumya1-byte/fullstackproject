# Spring Boot Backend

This Spring Boot app now covers the same main API groups your frontend expects:

- `/api/v1/auth`
- `/api/v1/users`
- `/api/v1/courses`
- `/api/v1/forms`
- `/api/v1/responses`
- `/api/v1/analytics`
- `/health`

It uses MongoDB, JWT access tokens, refresh-token cookies, role-aware access control, and response payloads compatible with the current React client.

## Local run

```bash
cd spring-backend
mvn spring-boot:run
```

Default server port is `4000`.

## Required environment variables

```bash
MONGODB_URI=mongodb://localhost:27017/fsad_feedback
FRONTEND_URL=http://localhost:5173
JWT_SECRET=development_secret
REFRESH_JWT_SECRET=development_refresh_secret
ADMIN_LOGIN_EMAIL=soumya.mishra.7812@gmail.com
ADMIN_LOGIN_PASSWORD=321123
SECURE_COOKIES=false
```

## Build

```bash
cd spring-backend
mvn clean package
```

The runnable jar is created in `target/feedback-backend-0.0.1-SNAPSHOT.jar`.

## Docker

```bash
cd spring-backend
docker build -t fsad-feedback-spring .
docker run -p 4000:4000 \
  -e MONGODB_URI=mongodb://host.docker.internal:27017/fsad_feedback \
  -e FRONTEND_URL=http://localhost:5173 \
  fsad-feedback-spring
```

## Notes

- Admin analytics are privacy-suppressed when there are fewer than 5 numeric answers.
- Students can only submit forms assigned through course enrollment.
- The backend keeps Mongo collection names close to the earlier Node/Mongoose version to make migration easier.
