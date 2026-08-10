# Architecture — Design Decisions & Reasoning

This document explains the architectural decisions behind the AWS deployment of this e-commerce catalog application. Every choice here has a reason — this is the reasoning I would walk through in a technical interview.

---

## Architecture Diagram

```
                        ┌─────────────────────────────────────────────────┐
                        │                   Internet                       │
                        └───────────────────────┬─────────────────────────┘
                                                │
                                                ▼
                        ┌─────────────────────────────────────────────────┐
                        │              CloudFront (HTTPS/CDN)              │
                        └────────────┬────────────────────────────────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    ▼                                 ▼
        ┌───────────────────────┐       ┌─────────────────────────────┐
        │  S3 — React frontend  │       │  Application Load Balancer  │
        │  (static website)     │       │  (public subnets 1a + 1b)   │
        └───────────────────────┘       └──────────────┬──────────────┘
                                                       │
                        ┌──────────────────────────────┼──────────────────────────────┐
                        │               VPC: 10.0.0.0/16                              │
                        │                              │                              │
                        │   ┌──────────────────────────▼─────────────────────────┐   │
                        │   │           Public Subnet — EC2 Docker Host          │   │
                        │   │                                                    │   │
                        │   │   ┌─────────────────────────────────────────────┐  │   │
                        │   │   │            Docker Compose Stack             │  │   │
                        │   │   │                                             │  │   │
                        │   │   │  ┌──────────────┐   ┌──────────────────┐   │  │   │
                        │   │   │  │   frontend   │   │    backend       │   │  │   │
                        │   │   │  │  nginx:80    │   │  node.js:5000    │   │  │   │
                        │   │   │  └──────────────┘   └────────┬─────────┘   │  │   │
                        │   │   │                              │             │  │   │
                        │   │   │              ┌───────────────┤             │  │   │
                        │   │   │              ▼               ▼             │  │   │
                        │   │   │  ┌──────────────────┐  S3 images bucket   │  │   │
                        │   │   │  │  mysql:3306       │  (via IAM role)     │  │   │
                        │   │   │  └──────────────────┘                     │  │   │
                        │   │   └─────────────────────────────────────────┘  │   │
                        │   └────────────────────────────────────────────────┘   │
                        │                              │                          │
                        │   ┌──────────────────────────▼─────────────────────┐   │
                        │   │           Private Subnet — Data Tier           │   │
                        │   │                                                │   │
                        │   │   ┌─────────────────┐                         │   │
                        │   │   │  RDS MySQL 8.0  │                         │   │
                        │   │   │  (port 3306)    │                         │   │
                        │   │   └─────────────────┘                         │   │
                        │   └────────────────────────────────────────────────┘   │
                        └─────────────────────────────────────────────────────── ┘
```

---

## Decision 1 — Why Three-Tier Architecture

**What it is:** Presentation tier (frontend), application tier (backend), data tier (database) deployed as completely separate layers.

**Why not a monolith:** A monolith bundles everything together — if one part crashes, everything crashes. Separate tiers can be scaled, updated, or replaced independently. The frontend can be updated without touching the backend. The database can be migrated without redeploying the app.

**Why not serverless:** Lambda + API Gateway would work but hides the infrastructure layer entirely. This project is deliberately built on EC2 and RDS to demonstrate understanding of VMs, networking, and managed databases — the concepts the AWS SAA-C03 exam and most cloud job interviews test.

---

## Decision 2 — Why Docker on EC2

**What it is:** Instead of installing Node.js directly on EC2 and managing it with PM2, the entire application stack runs inside Docker containers orchestrated by Docker Compose.

**Why Docker over raw installation:**

| | Raw install + PM2 | Docker |
|---|---|---|
| Environment consistency | "Works on my machine" problem | Identical environment everywhere |
| Deployment | SSH in, git pull, restart PM2 | Pull new image, restart container |
| Rollback | Hard — requires git reset | Easy — pull previous image tag |
| Local dev | Install everything locally | docker compose up |
| CI/CD integration | Script-heavy | Native image build and push |

**Why Docker Compose over standalone containers:** Three services need to talk to each other — backend needs MySQL, frontend needs backend. Compose handles networking, startup order, and health checks automatically. Backend waits for MySQL to be healthy before starting. All services share a private Docker network — MySQL port is never exposed to the internet.

---

## Decision 3 — Why Public and Private Subnets

The VPC has four subnets: two public, two private.

**Public subnets** (`10.0.1.0/24`, `10.0.2.0/24`) contain:
- Application Load Balancer
- EC2 Docker host

These need internet access — the ALB receives traffic from users, the EC2 needs to pull Docker images from Docker Hub.

**Private subnets** (`10.0.3.0/24`, `10.0.4.0/24`) contain:
- RDS MySQL

The database has no route to the internet. Even if someone knew the RDS endpoint, they couldn't connect — there is no network path to it from outside the VPC.

**Why 2 Availability Zones:** If one AWS data center goes down, traffic routes to the other. ALB requires subnets in at least 2 AZs to distribute traffic.

---

## Decision 4 — Why ALB Instead of Direct EC2 Access

Without an ALB, users hit the EC2 instance directly. Problems:
- Single point of failure — EC2 crashes, app goes down
- EC2 public IP changes every restart
- Port 5000 directly exposed to internet

With the ALB:
- Stable DNS name that never changes
- EC2 security group only accepts traffic from ALB — port 5000 never exposed
- Health checks automatically stop routing to unhealthy instances
- Ready for horizontal scaling — add more EC2 instances to the target group

---

## Decision 5 — Why RDS Instead of MySQL in Docker

MySQL runs inside Docker Compose for local development. In production, RDS is used instead.

| | MySQL in Docker | RDS MySQL |
|---|---|---|
| Backups | Manual | Automated |
| Failover | Manual setup | Multi-AZ automatic |
| Patching | You manage | AWS manages |
| Data persistence | Volume management | Managed storage |
| Monitoring | You set up | CloudWatch built-in |

For production, the operational reliability of RDS outweighs the cost. The Docker MySQL is intentionally kept for local development only.

---

## Decision 6 — Why RDS is in a Private Subnet

The database contains user data, order history, and hashed passwords. No scenario exists where it should be reachable from the internet.

The only inbound rule on `ecommerce-rds-sg`:
```
Port 3306 — Source: ecommerce-ec2-sg only
```

Not even a direct connection from your laptop is possible. To query it directly you would need to SSH into EC2 first and connect from there.

---

## Decision 7 — Why S3 + CloudFront for the Frontend

**Why not serve frontend from EC2:** The frontend container on EC2 exists for local development parity. In production, serving static files from S3 + CloudFront is cheaper, faster, and more reliable than EC2.

**Why CloudFront:**
- S3 website hosting is HTTP only — CloudFront adds HTTPS automatically
- Files cached at global edge locations — faster for users everywhere
- DDoS protection via AWS Shield Standard at no extra cost
- Custom error pages fix React Router — 403/404 returns `index.html` with 200

---

## Decision 8 — Why IAM Role Instead of Access Keys

The backend uploads product images to S3. Two ways to authenticate:

**Access keys in .env:** If `.env` is ever committed to GitHub accidentally, those keys are compromised instantly. Bots scan GitHub for AWS credentials 24/7.

**IAM instance role:** EC2 gets an attached role with S3 permissions. The AWS SDK picks up credentials from the instance metadata service automatically — no keys in code, no keys in `.env`, nothing to leak.

---

## Decision 9 — Why GitHub Actions for CI/CD

Every push to `main` should deploy automatically. Manual deployment (SSH in, git pull, restart) is error-prone and doesn't scale.

GitHub Actions was chosen over alternatives because:
- Native GitHub integration — no separate CI server to maintain
- Free for public repos
- Direct Docker Hub integration via official actions
- SSH deployment via `appleboy/ssh-action` — battle-tested, well documented
- Secrets management built in — no credentials ever in code

**Pipeline flow:**
```
push to main
  → checkout code
  → build backend image
  → build frontend image
  → push both to Docker Hub
  → SSH into EC2
  → git pull latest repo
  → docker compose pull (new images)
  → docker compose up -d (restart with new images)
  → docker image prune (clean up old images)
```

---

## Security Group Layering

```
ecommerce-alb-sg   → allows 80/443 from 0.0.0.0/0
ecommerce-ec2-sg   → allows 5000 from ecommerce-alb-sg only
                   → allows 22 from 0.0.0.0/0 (required for CI/CD SSH)
ecommerce-rds-sg   → allows 3306 from ecommerce-ec2-sg only
```

Defense in depth — every layer only accepts traffic from the layer directly above it.

---

## What Would Change in Production at Scale

| Component | Current | Production |
|---|---|---|
| EC2 | t2.micro, 1 instance | t3.medium+, Auto Scaling Group |
| RDS | t3.micro, single AZ | r6g.large, Multi-AZ enabled |
| Docker | Compose on single EC2 | Kubernetes (EKS) |
| CI/CD | GitHub Actions → EC2 | GitHub Actions → ECR → EKS |
| Images | Docker Hub (public) | AWS ECR (private) |
| Secrets | .env in compose file | AWS Secrets Manager |
| Logging | Docker logs | CloudWatch Logs agent |
| HTTPS on ALB | Not configured | ACM certificate |
| SSH port | Open to world | AWS Systems Manager Session Manager |
