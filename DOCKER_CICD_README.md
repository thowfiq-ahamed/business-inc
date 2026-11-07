# Business Inc — Docker, Jenkins & GitHub Actions CI/CD Setup

**Official Project Title**: Automated Application Deployment and Infrastructure Configuration Using DevOps Tools

---

## 1. CI/CD Architecture Overview

This project implements a dual-pipeline strategy:
1. **Jenkins (Primary Demonstration Pipeline)**:
   - 12-Stage on-premises / local declarative pipeline defined in `Jenkinsfile`.
   - Executes code validation, unit tests, Docker build, Trivy security scan, Terraform infrastructure provisioning, Ansible configuration, container deployment, health check verification, and automated rollback upon failure.
   - Hosted via `docker-compose.jenkins.yml` at `http://localhost:8085`.
2. **GitHub Actions (Cloud CI/CD & Registry)**:
   - Defined in `.github/workflows/ci-cd.yml`.
   - Executes linting, automated unit tests, Trivy vulnerability audits, pushes versioned container images to GitHub Container Registry (GHCR), and triggers Render webhooks for cloud demo deployment.

---

## 2. File Manifest

| File / Folder | Purpose |
| :--- | :--- |
| `Dockerfile` | Multi-stage Docker image (Node 20 Alpine, non-root `appuser`, healthcheck) |
| `docker-compose.yml` | Full microservices stack: App, MongoDB, Prometheus, Grafana, cAdvisor, Node Exporter |
| `docker-compose.jenkins.yml` | Dedicated Jenkins CI/CD automation controller |
| `Jenkinsfile` | 12-stage declarative enterprise CI/CD pipeline |
| `.github/workflows/ci-cd.yml` | Cloud GitHub Actions pipeline |
| `terraform/` | Infrastructure as Code (Docker network, persistent storage volumes) |
| `ansible/` | Configuration management playbooks (setup, deploy, health-check, rollback) |
| `security/` | Trivy vulnerability scan scripts and policies |
| `monitoring/` | Prometheus scrape configs, alert rules, and Grafana dashboards |

---

## 3. Quick Start (Local Docker & DevOps Stack)

```bash
# 1. Setup environment configuration
make setup

# 2. Run automated tests
make test

# 3. Provision Infrastructure via Terraform
make infra-init
make infra-up

# 4. Deploy Application Stack via Docker Compose
make deploy

# 5. Verify Health Status
make health
```

---

## 4. Endpoints & Access

- **Application Web UI**: [http://localhost:5000](http://localhost:5000)
- **Prometheus Metrics**: [http://localhost:5000/metrics](http://localhost:5000/metrics)
- **Prometheus UI**: [http://localhost:9090](http://localhost:9090)
- **Grafana Dashboards**: [http://localhost:3000](http://localhost:3000) (`admin` / `admin`)
- **Jenkins CI/CD**: [http://localhost:8085](http://localhost:8085)
- **cAdvisor Metrics**: [http://localhost:8082](http://localhost:8082)
