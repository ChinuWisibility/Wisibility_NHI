# Deployment Steps for Windows Local Server (Docker + OpenVPN)

Follow these steps on your Windows machine to deploy the NHI-ALPS stack.

### 1. Preparation (Local Machine)
1. Ensure your `.env` file in the root directory has the correct local API URL:
   ```env
   VITE_API_BASE_URL=/api
   ```
2. Commit and push your changes to GitHub:
   ```bash
   git add .
   git commit -m "feat: switch to Caddy for automatic Tailscale HTTPS"
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
*Note: You must run PowerShell as Administrator to allow Docker to access the Tailscale socket for HTTPS.*

#### **C. Initialize Database**
Wait for the containers to start, then run:
```powershell
# Run migrations
docker exec -it nhi-alps-backend npm run db:migrate

# Seed data (Admin user and Demo data)
docker exec -it nhi-alps-backend npm run db:seed-admin
docker exec -it nhi-alps-backend npm run db:seed
```

### 3. Usage
*   **Web App**: `https://wisibilitysrv01.tail654aab.ts.net`
*   **Login**: Use the local email login option (`admin@nhi.local` / `Admin@123`).
*   **API Health**: `https://wisibilitysrv01.tail654aab.ts.net/api/health`

### 4. OpenVPN Note
If you want others on your VPN to access the app, give them your **VPN IP address** (e.g., `http://10.8.x.x`). You do **not** need to change `VITE_API_BASE_URL` to the VPN IP because the Nginx proxy handles the `/api` routing locally on the server.
