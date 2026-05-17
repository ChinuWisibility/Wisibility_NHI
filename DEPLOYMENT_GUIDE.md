# Deployment Steps for Windows Local Server (Docker + OpenVPN)

Follow these steps on your Windows machine to deploy the NHI-ALPS stack.

### 1. Preparation (Local Machine)
1. Ensure your `.env` file in the root directory has the correct local API URL:
   ```env
   VITE_API_BASE_URL=http://localhost/api
   ```
2. Commit and push your changes to GitHub:
   ```bash
   git add .
   git commit -m "chore: prepare for local server deployment"
   git push origin main
   ```

### 2. Deployment (Server Machine)
Open **PowerShell** (as Administrator) on your server and run:

#### **A. Get the Code**
```powershell
cd C:\path\to\your\workspace
git pull origin main
```

#### **B. Build and Start**
```powershell
docker compose up --build -d
```

#### **C. Initialize Database**
Wait for the containers to start, then run:
```powershell
# Run migrations
docker exec -it nhi-alps-backend npm run db:migrate

# Seed data (Admin user and Demo data)
docker exec -it nhi-alps-backend npm run db:seed
```

### 3. Usage
*   **Web App**: `http://localhost` (or your VPN IP).
*   **Login**: Use the local email login option.
*   **API**: `http://localhost/api/health`
*   **pgAdmin**: `http://localhost:5050` (Login: `admin@nhi-alps.com` / `admin_password`)

### 4. OpenVPN Note
If you want others on your VPN to access the app, give them your **VPN IP address** (e.g., `http://10.8.x.x`). You do **not** need to change `VITE_API_BASE_URL` to the VPN IP because the Nginx proxy handles the `/api` routing locally on the server.
