# OTT Education - Chat Application

A full-stack real-time communication platform (chat application similar to Zalo) built as a course project (DoAnMonHoc2025).

## Architecture

- **Frontend**: React 19 + Vite, located in `OTT_Education_FE/`
- **Backend**: Java 17 + Spring Boot 3.4.4, located in `OTT_Education_BE/`

## Tech Stack

### Frontend
- React 19 with React Router DOM v6
- Vite (build tool) — runs on port **5000**
- Material UI (MUI) v7
- @stomp/stompjs + sockjs-client (WebSocket)
- Agora SDK (video/voice calling)
- Recharts (statistics)
- Axios (HTTP client)

### Backend
- Spring Boot 3.4.4 (Java 17) — runs on port **8080**
- MongoDB (Spring Data MongoDB) — uses hosted Atlas cluster
- Spring Security + JWT auth
- WebSockets (STOMP/SockJS)
- Cloudinary (media storage)
- Gmail SMTP (email notifications)
- Swagger/OpenAPI documentation

## Running the Project

### Frontend Only (Development)
The frontend dev server proxies `/api` and `/ws` requests to the backend at `localhost:8080`.

```bash
cd OTT_Education_FE
npm run dev
```

### Backend
The backend requires Java 17 and Maven. Run with:
```bash
cd OTT_Education_BE
./mvnw spring-boot:run -Dspring.profiles.active=dev
```

## Workflows

- **Start application**: `cd OTT_Education_FE && npm run dev` (port 5000, webview)

## Key Configuration

- Frontend vite config: `OTT_Education_FE/vite.config.js`
- Backend dev config: `OTT_Education_BE/src/main/resources/application-dev.yml`
- MongoDB Atlas URI is in `application-dev.yml`
- Cloudinary credentials in `application-dev.yml`
- JWT secrets in `application-dev.yml`

## Deployment

Configured as a static site deployment:
- Build: `cd OTT_Education_FE && npm run build`
- Public dir: `OTT_Education_FE/dist`

Note: For full functionality in production, the Spring Boot backend would need to be hosted separately and the frontend API base URL updated accordingly.
