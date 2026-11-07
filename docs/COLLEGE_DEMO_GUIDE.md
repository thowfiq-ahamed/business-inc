# College Project Demonstration & Viva Examination Guide

**Official Project Title**: Automated Application Deployment and Infrastructure Configuration Using DevOps Tools  
**Student Project Target**: Business Incubator Full-Stack Platform (`business-inc`)  
**Examiner Evaluation Guide & Viva Questions**

---

## 1. Project Overview & Pitch

### Problem Statement:
Traditional software deployments suffer from "works on my machine" syndrome, manual configuration drift, lack of automated infrastructure provisioning, undetected security vulnerabilities, and absence of automated recovery during production incidents.

### Solution Provided by this Project:
This project transforms the existing multi-tier **Business Incubator** platform into an enterprise-grade automated ecosystem utilizing:
- **Terraform** for declarative Infrastructure as Code (IaC).
- **Ansible** for idempotent configuration management.
- **Docker & Docker Compose** for lightweight, isolated containerization.
- **Jenkins** for 12-stage automated Continuous Integration & Continuous Deployment (CI/CD).
- **Trivy** for DevSecOps automated image vulnerability assessment.
- **Prometheus & Grafana** for real-time observability, alerting, and telemetry dashboards.
- **Automated Recovery Playbooks** for self-healing and zero-downtime rollback.

---

## 2. 5-Minute Live Demonstration Flow

When demonstrating this project to external examiners or college faculty, follow this step-by-step sequence:

### Step 1: Show Application Preserved & Working (1 Minute)
1. Open browser to `http://localhost:5000`.
2. Demonstrate the Business Incubator platform features:
   - Founder / Mentor / Investor authentication.
   - Startup directory and resource browsing.
   - Contact form and API responsiveness.
3. Show that the original Express + MongoDB architecture was 100% preserved.

### Step 2: Show Terraform Infrastructure as Code (1 Minute)
1. Open terminal in `terraform/`:
   ```bash
   terraform validate
   terraform plan
   ```
2. Explain to the examiner:
   *"We use Terraform to manage immutable infrastructure—our isolated Docker bridge network `business-inc-net` and persistent storage volumes for MongoDB and Prometheus."*

### Step 3: Show Jenkins 12-Stage CI/CD Pipeline (1.5 Minutes)
1. Navigate to Jenkins dashboard at `http://localhost:8085`.
2. Open the `business-inc-pipeline` and review the 12 stages:
   - *Stage 1*: GitHub Checkout
   - *Stage 2*: Dependency Installation (`npm ci`)
   - *Stage 3*: Code Validation (`npm audit`)
   - *Stage 4*: Automated Tests (5 passing tests via `node:test`)
   - *Stage 5*: Versioned Docker Build (tagged with commit SHA)
   - *Stage 6*: DevSecOps Trivy Scan
   - *Stage 7-8*: Terraform Validation & Provisioning
   - *Stage 9*: Ansible Configuration
   - *Stage 10*: Docker Compose Deployment
   - *Stage 11*: Health Verification (`/api/health`)
   - *Stage 12*: Deployment Reporting

### Step 4: Show Real-Time Monitoring in Grafana (1 Minute)
1. Navigate to Grafana at `http://localhost:3000` (User: `admin`, Pass: `admin`).
2. Open the auto-provisioned **Business Incubator - DevOps Monitoring** dashboard.
3. Demonstrate live telemetry:
   - App availability (UP/DOWN).
   - MongoDB database connection status.
   - Live HTTP request count & throughput graph.
   - 95th percentile latency curves.
   - Node.js heap memory & CPU utilization.

### Step 5: Demonstrate Automated Rollback & Fault Tolerance (30 Seconds)
1. Run the fault recovery demonstration:
   ```bash
   make rollback
   ```
2. Explain to the examiner:
   *"When our health check detects a faulty deployment or corrupted container, our pipeline catches the failure and immediately triggers Ansible's `rollback.yml` playbook, restoring the last verified working container without human intervention."*

---

## 3. High-Scoring Viva Questions & Model Answers

### Q1: What is the difference between Terraform and Ansible in your project?
**Answer**:
*"Terraform is an **Infrastructure as Code (IaC)** provisioning tool using a declarative approach. In our project, Terraform provisions the foundation: Docker networks and persistent data volumes. Ansible is a **Configuration Management** tool that configures the provisioned environment, validates dependencies, idempotently triggers deployments, and handles rollback procedures."*

### Q2: Why did you implement both Jenkins and GitHub Actions?
**Answer**:
*"Jenkins serves as our primary on-premises/local enterprise CI/CD orchestrator where we have full control over the execution environment, Trivy security gates, and direct integration with Terraform and Ansible. GitHub Actions serves as the cloud-based repository gatekeeper for linting, cloud-hosted automated tests, and Docker Hub/GHCR image publishing."*

### Q3: How did you implement DevSecOps in your pipeline?
**Answer**:
*"We integrated **Trivy**, an open-source vulnerability scanner, directly into Stage 6 of our Jenkins pipeline and our GitHub Actions workflow. Trivy scans the container image for OS-level and application-level CVEs (Common Vulnerabilities and Exposures), generating detailed audit reports. It can fail the pipeline if unpatched CRITICAL vulnerabilities are introduced."*

### Q4: How does Prometheus collect metrics from your Node.js application?
**Answer**:
*"We instrumented the Express application with `prom-client` in `server/utils/metrics.js`. The app records incoming request counts, latency histograms, process memory, and MongoDB connection status. It exposes these metrics at `http://localhost:5000/metrics`. Prometheus scrapes this endpoint every 15 seconds using a pull model."*

### Q5: How does your rollback mechanism work?
**Answer**:
*"Whenever a new build is triggered, the previous stable image is preserved and tagged with `previous`. After deployment, a health check probe queries `/api/health`. If the health check fails or times out after 15 retries, the pipeline's failure handler triggers `ansible/playbooks/rollback.yml`, which re-deploys the `previous` tagged image, ensuring high availability."*
