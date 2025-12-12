# Auto Deploy to VPS (Frontend)

This document explains how the **salao-frontend** repo auto-deploys to your Hostinger VPS (`app2.andrepombo.info`) using GitHub Actions and Docker Compose.

The backend repo has a complementary document in its own `DEPLOYMENT.md`.

---

## 1. Architecture Overview

- **Git repo**: `salao-frontend` on GitHub.
- **Branch that deploys**: `main`.
- **VPS**: Hostinger, domain `app2.andrepombo.info` behind Traefik.
- **Stack location on VPS**: `~/apps/app2/docker-compose.yml` with services:
  - `db`, `backend`, `frontend`.
- **Service name for frontend**: `frontend` in `docker-compose.yml`.

**Flow:**

1. You push to `main` in `salao-frontend`.
2. GitHub Actions workflow `.github/workflows/deploy.yml` runs.
3. It syncs the frontend code to the VPS at `~/apps/app2/frontend`.
4. On the VPS, it runs `docker compose up -d --build frontend` in `~/apps/app2`.
5. It performs a health check on `https://app2.andrepombo.info` via Traefik.

---

## 2. One-Time VPS Setup (shared with backend)

Most VPS setup is shared with the backend deployment. In short:

- User `andre` exists and owns `~/apps/app2`.
- `docker compose` plugin is installed (`docker compose version` works).
- `andre` is in the `docker` group so Docker can run without `sudo`.

For full details, see the backend repo’s `DEPLOYMENT.md`.

---

## 3. SSH Key and GitHub Secrets

Frontend uses the **same SSH key and VPS secrets** as the backend.

In the **salao-frontend** repository on GitHub:

1. Go to **Settings → Secrets and variables → Actions**.
2. Add/update these secrets:

- `VPS_HOST` → `app2.andrepombo.info`
- `VPS_SSH_USER` → `andre`
- `VPS_SSH_KEY` → contents of the same private key file used for backend (e.g. `id_ed25519_app2`).

No additional app-specific secrets are currently required in the frontend workflow, because:

- The React app uses Vite and either same-origin API (`/api/...`) or `VITE_API_BASE_URL` at build time.
- API routing is handled by Traefik + backend service.

---

## 4. Frontend Deploy Workflow Details

The workflow file is `.github/workflows/deploy.yml`.

Key parts:

- **Trigger**:

  ```yaml
  on:
    push:
      branches:
        - main
  ```

- **Checkout & verification**:

  ```yaml
  - uses: actions/checkout@v4

  - name: Verify deployment files
    run: |
      echo "Files to be deployed:"
      ls -la
      echo "Docker compose file:"
      cat docker-compose.yml
  ```

- **Sync frontend code to VPS**:

  ```yaml
  - name: Copy files with SSH
    uses: easingthemes/ssh-deploy@main
    with:
      SSH_PRIVATE_KEY: ${{ secrets.VPS_SSH_KEY }}
      ARGS: "-rlgoDzvc -i"
      SOURCE: "./"
      REMOTE_HOST: ${{ secrets.VPS_HOST }}
      REMOTE_USER: ${{ secrets.VPS_SSH_USER }}
      TARGET: '/home/${{ secrets.VPS_SSH_USER }}/apps/app2/frontend'
      EXCLUDE: "/dist/, /node_modules/, /.git/, /coverage/, /.vscode/, /.idea/"
  ```

- **Build & start frontend container**:

  ```yaml
  SCRIPT_AFTER: |
    # Build and start the frontend service from the main app2 stack
    cd /home/${{ secrets.VPS_SSH_USER }}/apps/app2

    echo "Cleaning up unused Docker resources..."
    docker system prune --volumes -f

    echo "Building and starting frontend container..."
    docker compose up -d --build frontend

    echo "Waiting for containers to start..."
    sleep 10

    # Health check via Traefik / public HTTPS URL
    echo "Performing health check..."
    if curl -f https://app2.andrepombo.info > /dev/null 2>&1; then
      echo "✅ Frontend deployment successful! Application is responding."
    else
      echo "❌ Health check failed. Checking container logs..."
      docker compose logs frontend --tail=50
      exit 1
    fi

    echo "🚀 Frontend deployment completed successfully!"
  ```

---

## 5. Day-to-Day Usage

To deploy frontend changes:

1. Commit your code in `salao-frontend`:

   ```bash
   git add .
   git commit -m "feat: frontend change"
   git push origin main
   ```

2. Go to the **Actions** tab in GitHub and open the latest **Deploy Frontend to VPS** run.
3. When the workflow is green, the frontend is live at:

   - `https://app2.andrepombo.info`

---

## 6. Notes & Troubleshooting

- If the job fails but the container is running, check the health-check section in the logs.
- You can temporarily relax the health check by removing the `exit 1` line if you want deploys to be more forgiving.
- Any change to the `~/apps/app2/docker-compose.yml` (e.g. service names) must be reflected in this workflow (service name `frontend`).

For more details on the overall stack (Postgres, backend, Traefik), see the backend repo’s `DEPLOYMENT.md` and backend `README.md`.
