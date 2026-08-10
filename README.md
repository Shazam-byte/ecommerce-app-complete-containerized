# E-Commerce Catalog — AWS Multi-Tier Deployment

A full-stack e-commerce catalog application deployed on AWS using a three-tier architecture. Built as a portfolio project demonstrating real-world cloud infrastructure design, containerization, CI/CD automation, and AWS service integration.

**Live Demo:** https://dxxxxxxxxxxxx.cloudfront.net  
**Docker Hub:** https://hub.docker.com/u/shahzaman219

---

## Architecture Overview

```
Internet
    │
    ▼
CloudFront (HTTPS, CDN, global edge caching)
    │
    ├──▶ S3 (React frontend — static website hosting)
    │
    └──▶ Application Load Balancer (public subnet, port 80)
              │
              ▼
         EC2 — Docker Host (public subnet)
         ├── ecommerce-frontend container (nginx, port 80)
         ├── ecommerce-backend container (Node.js, port 5000)
         └── ecommerce-mysql container (MySQL 8.0, port 3306)
              │
              ├──▶ RDS MySQL (private subnet, port 3306)
              │
              └──▶ S3 (product images bucket)

All resources inside custom VPC (10.0.0.0/16)
Public subnets: ALB, EC2
Private subnets: RDS MySQL
```

---

## CI/CD Pipeline

Every push to `main` triggers the automated pipeline:

```
git push → GitHub Actions
    → Build backend Docker image
    → Build frontend Docker image
    → Push both images to Docker Hub
    → SSH into EC2
    → Pull latest images
    → Restart containers
    → Zero manual steps
```

---

## AWS Services Used

| Service | Purpose |
|---|---|
| VPC | Isolated network with public/private subnet separation |
| EC2 (t2.micro) | Docker host running all application containers |
| Application Load Balancer | Distributes traffic to EC2, single public entry point |
| RDS MySQL (t3.micro) | Managed relational database in private subnet |
| S3 (images) | Stores and serves product images publicly |
| S3 (frontend) | Hosts the React static build |
| CloudFront | CDN + HTTPS in front of the frontend S3 bucket |
| IAM | EC2 instance role for S3 access — no hardcoded credentials |
| Security Groups | Layered traffic control at every tier |

---

## Tech Stack

**Frontend**
- React + Vite
- Tailwind CSS
- Nginx (inside Docker container)
- Hosted on S3 + CloudFront

**Backend**
- Node.js + Express
- JWT authentication (httpOnly cookies)
- bcrypt password hashing
- AWS SDK v3 for S3 image uploads
- Hosted on EC2 inside Docker container

**Database**
- MySQL 8.0
- Hosted on RDS in private subnet
- Raw SQL via `mysql2` (no ORM)

**DevOps**
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- Docker Hub (image registry)

---

## Features

- Product catalog with pagination, category filter, price range filter, and search
- Product detail page with image gallery and related products
- Cart with persistent storage per user in the database
- Multi-step checkout (shipping → review → mock payment → confirmation)
- JWT-based auth — register, login, logout
- Admin panel (role-based access) — CRUD for products, categories, order management
- Product reviews — star rating + text, average rating displayed on catalog

---

## Security Design

```
Internet  →  ALB only (port 80/443)
ALB       →  EC2 only (port 5000)
EC2       →  RDS only (port 3306)
EC2       →  S3 via IAM role (no access keys in code)
RDS       →  unreachable from internet
```

---

## Running Locally with Docker

Make sure Docker and Docker Compose are installed.

```bash
git clone https://github.com/Shazam-byte/ecommerce-app-complete-containerized.git
cd ecommerce-app-complete-containerized
docker compose up --build
```

Open `http://localhost` in your browser.

To stop:
```bash
docker compose down
```

To stop and wipe the database:
```bash
docker compose down -v
```

---

## Running Locally without Docker

### Prerequisites
- Node.js 20+
- MySQL 8.0 running locally

### Backend
```bash
cd backend
npm install
cp .env.example .env
# fill in your local values
node migrate.js
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# set VITE_API_URL=http://localhost:5000
npm run dev
```

---

## Environment Variables

### Backend `.env`
```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ecommerce
DB_USER=root
DB_PASSWORD=yourpassword
JWT_SECRET=your_long_random_secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=ecommerce-product-images-shah
NODE_ENV=development
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:5000
```

---

## Database Schema

```
users           — id, name, email, password_hash, role, created_at
categories      — id, name, slug, description
products        — id, name, slug, description, price, stock, category_id, created_at
product_images  — id, product_id, image_url, is_primary
cart_items      — id, user_id, product_id, quantity
orders          — id, user_id, status, total, shipping_address, created_at
order_items     — id, order_id, product_id, quantity, price_at_purchase
reviews         — id, user_id, product_id, rating, comment, created_at
```

---

## Docker Hub Images

| Image | Link |
|---|---|
| Backend | https://hub.docker.com/r/shahzaman219/ecommerce-backend |
| Frontend | https://hub.docker.com/r/shahzaman219/ecommerce-frontend |

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — design decisions and architectural reasoning
- [DEPLOYMENT.md](./DEPLOYMENT.md) — full step-by-step AWS deployment guide
- [COST.md](./COST.md) — monthly cost breakdown

---

## Author

**Shahzaman Ajmal**
- GitHub: [github.com/Shazam-byte](https://github.com/Shazam-byte)
- LinkedIn: [linkedin.com/in/shahzaman-ajmal](https://linkedin.com/in/shahzaman-ajmal)
- Portfolio: [portfolio-mu-lemon-24.vercel.app](https://portfolio-mu-lemon-24.vercel.app)
