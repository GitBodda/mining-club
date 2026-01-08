# DigitalOcean Deployment Guide

## Quick Deploy to DigitalOcean App Platform

### Method 1: Web UI (Easiest)

1. **Go to DigitalOcean App Platform**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect GitHub Repository**
   - Select "GitHub" as source
   - Authorize DigitalOcean to access your GitHub
   - Select repository: `GitBodda/mining-club`
   - Select branch: `main`
   - Enable "Autodeploy" (deploys on every push)

3. **Configure Application**
   - **Name**: mining-club
   - **Region**: Choose closest to your users (e.g., New York, San Francisco, London)
   - **Build Command**: `npm run build`
   - **Run Command**: `npm start`
   - **HTTP Port**: 8080
   - **Instance Size**: Basic ($5/month) or Professional ($12/month)

4. **Add Database**
   - Click "Add Resource" → "Database"
   - Select "PostgreSQL"
   - Version: 15
   - Plan: Basic ($15/month for production)
   - Database name: `mining-club-db`
   - DigitalOcean will automatically add `DATABASE_URL` to your environment

5. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   ```
   NODE_ENV=production
   SESSION_SECRET=<generate-random-secret>
   FIREBASE_SERVICE_ACCOUNT=<paste-firebase-json>
   VITE_FIREBASE_API_KEY=<your-firebase-api-key>
   VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=<your-project-id>
   VITE_FIREBASE_STORAGE_BUCKET=<your-project>.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
   VITE_FIREBASE_APP_ID=<your-app-id>
   ```

6. **Deploy**
   - Review settings
   - Click "Create Resources"
   - Wait 5-10 minutes for initial deployment
   - Your app will be live at: `https://mining-club-xxxxx.ondigitalocean.app`

### Method 2: Using doctl CLI

1. **Install DigitalOcean CLI**
   ```bash
   # macOS
   brew install doctl
   
   # Linux
   cd ~
   wget https://github.com/digitalocean/doctl/releases/download/v1.94.0/doctl-1.94.0-linux-amd64.tar.gz
   tar xf doctl-*.tar.gz
   sudo mv doctl /usr/local/bin
   ```

2. **Authenticate**
   ```bash
   doctl auth init
   # Enter your DigitalOcean API token
   # Get token from: https://cloud.digitalocean.com/account/api/tokens
   ```

3. **Create App**
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

4. **Get App ID**
   ```bash
   doctl apps list
   ```

5. **Add Environment Variables**
   ```bash
   # Set your environment variables through the web UI or using doctl
   doctl apps update <app-id> --spec .do/app.yaml
   ```

### Method 3: Using Docker + Droplet (VPS)

1. **Create Droplet**
   - Go to: https://cloud.digitalocean.com/droplets
   - Click "Create Droplet"
   - Choose: Ubuntu 22.04 LTS
   - Size: Basic ($6/month 1GB RAM or $12/month 2GB RAM)
   - Select datacenter region
   - Add SSH key or use password

2. **SSH into Droplet**
   ```bash
   ssh root@your-droplet-ip
   ```

3. **Install Docker**
   ```bash
   # Update system
   apt update && apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   apt install docker-compose -y
   ```

4. **Clone Repository**
   ```bash
   cd /root
   git clone https://github.com/GitBodda/mining-club.git
   cd mining-club
   ```

5. **Create .env File**
   ```bash
   nano .env
   ```
   
   Add your environment variables:
   ```
   DATABASE_URL=postgresql://...
   SESSION_SECRET=your-secret
   FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
   ```

6. **Build and Run**
   ```bash
   # Build Docker image
   docker build -t mining-club .
   
   # Run container
   docker run -d \
     --name mining-club \
     -p 80:8080 \
     --env-file .env \
     --restart unless-stopped \
     mining-club
   ```

7. **Setup Nginx (Optional - for SSL)**
   ```bash
   apt install nginx certbot python3-certbot-nginx -y
   
   # Configure Nginx
   nano /etc/nginx/sites-available/mining-club
   ```
   
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8080;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   ln -s /etc/nginx/sites-available/mining-club /etc/nginx/sites-enabled/
   nginx -t
   systemctl restart nginx
   
   # Get SSL certificate
   certbot --nginx -d your-domain.com
   ```

## Continuous Deployment

With App Platform, every push to `main` branch will automatically deploy.

To manually trigger deployment:
```bash
git add .
git commit -m "Update application"
git push origin main
```

## Monitoring

1. **View Logs**
   - Go to: https://cloud.digitalocean.com/apps
   - Select your app
   - Click "Runtime Logs"

2. **Check Health**
   - View "Insights" tab for metrics
   - Monitor CPU, Memory, and Request rates

## Cost Estimate

**App Platform (Recommended):**
- App: $5-12/month
- Database: $15/month (managed PostgreSQL)
- Total: ~$20-27/month

**Droplet + Managed Database:**
- Droplet: $6-12/month
- Database: $15/month
- Total: ~$21-27/month

**Droplet Only (Database on same server):**
- Droplet: $12/month (2GB RAM minimum)
- Total: ~$12/month

## Troubleshooting

**Build fails:**
- Check build logs in DigitalOcean console
- Verify all environment variables are set
- Ensure Dockerfile is correct

**App crashes:**
- Check runtime logs
- Verify DATABASE_URL is correct
- Check Firebase credentials

**Database connection fails:**
- Ensure DATABASE_URL includes `?sslmode=require`
- Check database is running
- Verify firewall rules allow connection

## Support

For DigitalOcean support:
- Documentation: https://docs.digitalocean.com/products/app-platform/
- Community: https://www.digitalocean.com/community/
- Support tickets: https://cloud.digitalocean.com/support
