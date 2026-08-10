# Deployment Guide — AWS Multi-Tier + Docker + CI/CD

This guide documents the complete deployment of this application on AWS. The stack uses Docker containers on EC2, automated CI/CD via GitHub Actions, RDS for production database, and S3 + CloudFront for the frontend.

---

## Architecture at a Glance

```
GitHub repo → GitHub Actions → Docker Hub → EC2 (Docker)
                                         → ALB → users
S3 + CloudFront → users (frontend)
RDS MySQL → EC2 backend (private subnet)
```

---

## Prerequisites

- AWS account (free tier)
- Docker Desktop installed locally
- Docker Hub account
- Node.js 20+ installed locally
- Git installed locally

---

## Deployment Order

```
1. VPC + Networking
2. Security Groups
3. RDS MySQL
4. S3 Buckets + IAM Role
5. EC2 + Docker setup
6. Application Load Balancer
7. Frontend Build + S3 Upload
8. CloudFront
9. GitHub Actions CI/CD
```

---

## Phase 1 — VPC and Networking

### Create VPC
```
VPC → Your VPCs → Create VPC
Name: ecommerce-vpc
IPv4 CIDR: 10.0.0.0/16
Tenancy: Default
```

### Create Subnets (4 total)
```
ecommerce-public-1a   → AZ: us-east-1a | CIDR: 10.0.1.0/24
ecommerce-public-1b   → AZ: us-east-1b | CIDR: 10.0.2.0/24
ecommerce-private-1a  → AZ: us-east-1a | CIDR: 10.0.3.0/24
ecommerce-private-1b  → AZ: us-east-1b | CIDR: 10.0.4.0/24
```

### Internet Gateway
```
Name: ecommerce-igw
After creation: Actions → Attach to VPC → ecommerce-vpc
```

### Route Tables

**Public:**
```
Name: ecommerce-public-rt
Route: 0.0.0.0/0 → ecommerce-igw
Subnet associations: ecommerce-public-1a, ecommerce-public-1b
```

**Private:**
```
Name: ecommerce-private-rt
No internet route
Subnet associations: ecommerce-private-1a, ecommerce-private-1b
```

---

## Phase 2 — Security Groups

### ALB Security Group
```
Name: ecommerce-alb-sg
Inbound: HTTP 80 + HTTPS 443 from 0.0.0.0/0
```

### EC2 Security Group
```
Name: ecommerce-ec2-sg
Inbound:
  Custom TCP | 5000 | Source: ecommerce-alb-sg
  SSH        | 22   | Source: 0.0.0.0/0 (required for GitHub Actions CI/CD)
```

### RDS Security Group
```
Name: ecommerce-rds-sg
Inbound: MySQL/Aurora | 3306 | Source: ecommerce-ec2-sg
```

---

## Phase 3 — RDS MySQL

### DB Subnet Group
```
Name: ecommerce-db-subnet-group
VPC: ecommerce-vpc
Subnets: ecommerce-private-1a, ecommerce-private-1b
```

### RDS Instance
```
Engine: MySQL 8.0
Template: Free tier
Identifier: ecommerce-db
Username: admin | Password: [your password]
Instance: db.t3.micro | Storage: 20GB gp2
VPC: ecommerce-vpc
Subnet group: ecommerce-db-subnet-group
Public access: No
Security group: ecommerce-rds-sg
Initial DB name: ecommerce
Automatic backups: disabled
```

Save the endpoint — used as DB_HOST in backend env.

---

## Phase 4 — S3 Buckets and IAM Role

### Product Images Bucket
```
Name: ecommerce-product-images-shah
Region: us-east-1
Block public access: OFF

Bucket policy:
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::ecommerce-product-images-shah/*"
  }]
}
```

### Frontend Bucket
```
Name: ecommerce-frontend-shah
Region: us-east-1
Block public access: OFF
Static website hosting: enabled
  Index document: index.html
  Error document: index.html

Same bucket policy as above (update bucket name)
```

### IAM Role for EC2
```
IAM → Roles → Create role
Trusted entity: EC2
Policy: AmazonS3FullAccess
Name: ecommerce-ec2-s3-role
```

---

## Phase 5 — EC2 and Docker Setup

### Launch Instance
```
Name: ecommerce-backend
AMI: Amazon Linux 2023
Type: t2.micro
Key pair: ecommerce-keypair (RSA, .pem) — save this file
Network: ecommerce-vpc | Subnet: ecommerce-public-1a
Auto-assign public IP: Enable
Security group: ecommerce-ec2-sg
IAM profile: ecommerce-ec2-s3-role
```

### SSH In
```bash
chmod 400 ecommerce-keypair.pem
ssh -i ecommerce-keypair.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### Install Docker
```bash
sudo dnf update -y
sudo dnf install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user
exit
# SSH back in for group change to take effect
ssh -i ecommerce-keypair.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

### Install Docker Compose Plugin
```bash
sudo mkdir -p /usr/local/lib/docker/cli-plugins
sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
docker compose version
```

### Create App Directory
```bash
mkdir -p ~/ecommerce
```

---

## Phase 6 — Application Load Balancer

### Target Group
```
Type: Instances
Name: ecommerce-tg
Protocol: HTTP | Port: 5000
VPC: ecommerce-vpc
Health check path: /api/health
Register: ecommerce-backend EC2 instance on port 5000
```

### Load Balancer
```
Type: Application Load Balancer
Name: ecommerce-alb
Scheme: Internet-facing
VPC: ecommerce-vpc
Subnets: ecommerce-public-1a, ecommerce-public-1b
Security group: ecommerce-alb-sg
Listener: HTTP 80 → forward to ecommerce-tg
```

Wait for state: Active. Note the ALB DNS name — used as VITE_API_URL in frontend.

---

## Phase 7 — Frontend Build and S3 Upload

### Update Frontend .env
```
VITE_API_URL=http://your-alb-dns.us-east-1.elb.amazonaws.com
```

### Build and Upload
```bash
cd frontend
npm install && npm run build
# Upload contents of dist/ to ecommerce-frontend-shah S3 bucket
```

---

## Phase 8 — CloudFront

```
Origin domain: paste S3 website endpoint URL (not dropdown)
Origin protocol: HTTP only
Viewer protocol: Redirect HTTP to HTTPS
Cache policy: CachingOptimized
Default root object: index.html
Price class: North America and Europe
```

### Custom Error Pages (required for React Router)
```
403 → /index.html → 200
404 → /index.html → 200
```

### Update Backend CORS
Add CloudFront domain to allowed origins in backend, restart containers.

---

## Phase 9 — GitHub Actions CI/CD

### Docker Hub Setup
1. Create Docker Hub account
2. Create two public repos: `ecommerce-backend`, `ecommerce-frontend`
3. Generate access token: Docker Hub → Account Settings → Security → New Access Token

### GitHub Secrets
Add these in repo → Settings → Secrets and variables → Actions:

```
DOCKERHUB_USERNAME    Docker Hub username
DOCKERHUB_TOKEN       Docker Hub access token
EC2_HOST              EC2 public IP address
EC2_USER              ec2-user
EC2_SSH_KEY           full contents of ecommerce-keypair.pem
```

### Workflow File
Create `.github/workflows/deploy.yml` — see the file in this repo.

**What it does on every push to main:**
1. Builds backend Docker image and pushes to Docker Hub
2. Builds frontend Docker image and pushes to Docker Hub
3. SSHes into EC2
4. Pulls latest repo changes
5. Pulls new images from Docker Hub
6. Restarts containers with `docker compose up -d`
7. Prunes old images

---

## Verifying the Deployment

### Check containers on EC2
```bash
ssh -i ecommerce-keypair.pem ec2-user@YOUR_EC2_PUBLIC_IP
docker ps
```

Expected output:
```
ecommerce-frontend   Up X minutes   0.0.0.0:80->80/tcp
ecommerce-backend    Up X minutes   0.0.0.0:5000->5000/tcp
ecommerce-mysql      Up X minutes (healthy)
```

### Check backend health via ALB
```bash
curl http://YOUR_ALB_DNS/api/health
# Expected: {"status":"healthy",...}
```

### Check frontend
Open CloudFront URL in browser — app loads over HTTPS.

---

## Cost Control

Stop resources when not demoing:

```bash
# Stop EC2
EC2 → Instances → select → Instance state → Stop

# Stop RDS
RDS → Databases → select → Actions → Stop temporarily
```

Restart for demo: start RDS first (2-3 min), then EC2. App live in under 5 minutes.

**Estimated monthly cost if running 24/7:**
See [COST.md](./COST.md)

---

## Updating the Application

With CI/CD set up, all updates are automatic:

```bash
# Make changes locally
git add .
git commit -m "your change"
git push origin main
# Pipeline handles everything else
```

Monitor the pipeline at: `github.com/Shazam-byte/ecommerce-app-complete-containerized/actions`

---

## Useful Commands on EC2

```bash
# View running containers
docker ps

# View logs
docker logs ecommerce-backend
docker logs ecommerce-frontend
docker logs ecommerce-mysql

# Restart all containers
cd ~/ecommerce/ecommerce-app-complete-containerized
docker compose down && docker compose up -d

# Pull latest images manually
docker compose pull

# Clean up old images
docker image prune -f
```
