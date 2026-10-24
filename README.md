# CHARUSAT ITUE301 — Practical 11: Containerization with Docker and Docker Compose

**Student Roll Number:** 24CS106  
**Course:** Advanced Web Development Frameworks (ITUE301)  
**Subject:** Practical 11 — Containerization with Docker and Docker Compose  

---

## 📌 Three-Service Container Architecture

Practical 11 packages the full-stack Task Management application into isolated, portable Docker containers coordinated by Docker Compose.

```text
Host Machine (Browser: http://localhost:5173)
       │
       │ Host Port Mapping
       ▼
┌─────────────────────────────────────────────────────────────┐
│ Docker Bridge Network (awdf-app-network-practical11)        │
│                                                             │
│   ┌──────────────────────────┐                              │
│   │  Frontend Service        │                              │
│   │  (awdf-frontend)         │                              │
│   │  Nginx 1.25 Alpine       │                              │
│   │  Container Port: 80      │                              │
│   │  Host Port: 5173         │                              │
│   └─────────────┬────────────┘                              │
│                 │ Browser HTTP calls (http://localhost:5000)│
│                 ▼                                           │
│   ┌──────────────────────────┐                              │
│   │  Backend Service         │                              │
│   │  (awdf-backend)          │                              │
│   │  Node.js 20 Alpine       │                              │
│   │  Port: 5000              │                              │
│   └─────────────┬────────────┘                              │
│                 │ Mongoose ODM (mongodb://mongodb:27017/...) │
│                 ▼                                           │
│   ┌──────────────────────────┐                              │
│   │  Database Service        │    ┌──────────────────────┐  │
│   │  (awdf-mongodb)          │───►│ Named Docker Volume  │  │
│   │  Mongo 7.0 Image         │    │ (awdf-mongodb-data)  │  │
│   │  Port: 27017             │    │ Mount: /data/db      │  │
│   └──────────────────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🐳 Dockerfiles Design

### 1. Backend (`backend/Dockerfile`)
- **Base Image**: `node:20-alpine` for a lightweight and secure footprint.
- **Layer Optimization**: Copies `package*.json` manifests and runs `npm ci --omit=dev` before copying source files.
- **Binding**: Express binds to `0.0.0.0` within the container on port `5000`.
- **Security**: `.dockerignore` strictly excludes `node_modules`, local `.env` files, and git metadata.

### 2. Frontend (`frontend/Dockerfile`)
- **Multi-Stage Build**:
  - **Stage 1 (Build)**: `node:20-alpine` installs dependencies and compiles the Vite production bundle into `/app/dist`.
  - **Stage 2 (Production Server)**: `nginx:alpine` serves static assets through a custom `nginx.conf` supporting SPA fallback routing (`try_files $uri $uri/ /index.html;`).

---

## 🌐 Networking & Service Resolution

### Why is MongoDB addressed as `mongodb://mongodb:27017`?
Inside a Docker Compose network, Docker creates an automatic internal DNS resolver. Containers communicate using their **service names** as hostnames.
- From inside the `backend` container, `mongodb` resolves to the database container's private IP on the bridge network.
- `localhost` cannot be used inside the backend container because `localhost` refers to the backend container itself, not the database container or host machine.

### Difference Between `EXPOSE` and `ports`:
- **`EXPOSE` (Dockerfile)**: Metadata documenting which port the containerized process listens on inside the container. It does **not** publish or bind the port to the host machine.
- **`ports` (Compose)**: Specifies the port forwarding rule from the host machine to the container (e.g., `"5173:80"` routes traffic from `http://localhost:5173` on the host to port `80` inside the Nginx container).

---

## 💾 MongoDB Data Persistence

A named Docker volume is declared in `docker-compose.yml`:
```yaml
volumes:
  mongodb_data:
    name: awdf-mongodb-data-practical11
```
- Mounted to `/data/db` inside MongoDB.
- Task records and user collections survive container stoppage, restart, and recreation (`docker compose down` followed by `docker compose up`).
- Data is only destroyed if the user explicitly supplies the volume removal flag (`docker compose down -v`).

---

## 🚀 Single-Command Startup & Teardown

### 1. Start the Complete Stack
```bash
docker compose up --build
# Or detached mode:
docker compose up --build -d
```
1. Builds the backend Node.js image.
2. Builds the multi-stage frontend Nginx image.
3. Launches the MongoDB container and waits for its health check to pass.
4. Launches the backend and frontend containers on the shared bridge network.

### 2. Access the Application
- **Frontend SPA**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`
- **MongoDB**: `localhost:27017` (accessible via MongoDB Compass)

### 3. Verification Steps
1. Navigate to `http://localhost:5173` and register a new user.
2. Create tasks with high and medium priorities.
3. In your terminal, restart the stack:
   ```bash
   docker compose restart
   ```
4. Refresh `http://localhost:5173` and log in; all created tasks persist from the named volume.

### 4. Teardown
```bash
# Stop containers and preserve database volume:
docker compose down

# Stop containers and remove database volume:
docker compose down -v
```

---

## 📂 Container Configuration Structure

```text
24CS106_AWDF_Practical-11/
├── docker-compose.yml           # Multi-service composition file
├── .env.example                 # Environment variables template
├── README.md                    # Practical 11 documentation
├── backend/
│   ├── Dockerfile               # Node.js 20 production container
│   ├── .dockerignore            # Build context exclusions
│   └── src/server.js            # Express application entry
└── frontend/
    ├── Dockerfile               # Multi-stage Nginx production container
    ├── nginx.conf               # Nginx SPA fallback configuration
    ├── .dockerignore            # Build context exclusions
    └── src/                     # React application source code
```
