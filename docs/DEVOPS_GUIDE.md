# DevOps Engineer Implementation & Operations Guide

**Official Project Title**: Automated Application Deployment and Infrastructure Configuration Using DevOps Tools  
**Repository**: `business-inc`  
**Target Environment**: Windows 11 / WSL2 Ubuntu / Docker Desktop

---

## 1. Quick Start via One-Command Automation

To run the complete setup from scratch:

```bash
# 1. Environment prerequisite check & dependency install
make setup

# 2. Run automated test suite
make test

# 3. Provision Infrastructure using Terraform
make infra-init
make infra-plan
make infra-up

# 4. Deploy Application & Monitoring Stack
make deploy

# 5. Verify Health of all services
make health

# 6. Run Trivy DevSecOps Vulnerability Scan
make scan

# 7. Start full monitoring suite (cAdvisor & Node Exporter)
make monitor

# 8. Test Automated Rollback & Recovery
make rollback
```

---

## 2. Infrastructure as Code (Terraform)

The `terraform/` directory provisions the underlying container network and storage volumes:

```bash
cd terraform

# Initialize provider plugins (kreuzwerker/docker)
terraform init

# Format code
terraform fmt

# Validate configuration syntax
terraform validate

# Review execution plan
terraform plan

# Apply infrastructure changes
terraform apply -auto-approve

# Destroy infrastructure when decommissioning
terraform destroy -auto-approve
```

### Managed Resources:
- `docker_network.app_network`: Isolated bridge network (`172.28.0.0/16`)
- `docker_volume.mongo_data`: Persistent storage volume for MongoDB database
- `docker_volume.prometheus_data`: Persistent time-series database storage
- `docker_volume.grafana_data`: Persistent dashboard state and user configuration

---

## 3. Configuration Management (Ansible)

Ansible playbooks are located in `ansible/playbooks/` and execute idempotent tasks:

```bash
cd ansible

# Check playbook syntax
ansible-playbook -i inventory.ini playbooks/setup.yml --syntax-check
ansible-playbook -i inventory.ini playbooks/deploy.yml --syntax-check
ansible-playbook -i inventory.ini playbooks/health-check.yml --syntax-check
ansible-playbook -i inventory.ini playbooks/rollback.yml --syntax-check

# Run environment preparation
ansible-playbook -i inventory.ini playbooks/setup.yml

# Execute application deployment
ansible-playbook -i inventory.ini playbooks/deploy.yml

# Perform health check audit
ansible-playbook -i inventory.ini playbooks/health-check.yml

# Trigger recovery rollback
ansible-playbook -i inventory.ini playbooks/rollback.yml
```

---

## 4. Docker Containerization

The application uses an optimized, multi-stage, non-root `Dockerfile`:
- Stage 1 (`deps`): Installs production npm dependencies with `npm ci --omit=dev`.
- Stage 2 (`runner`): Copies production dependencies and source files, creates `appuser:appgroup`, drops root privileges, and defines container healthcheck.

### Docker Compose Service Architecture:
| Service | Image | Internal Port | Host Port | Role |
| :--- | :--- | :--- | :--- | :--- |
| **app** | `business-inc:latest` | 5000 | 5000 | Express API & Static Client |
| **mongo** | `mongo:7-jammy` | 27017 | 27017 | Database |
| **prometheus** | `prom/prometheus:v2.51.0` | 9090 | 9090 | Time-series Metrics Engine |
| **grafana** | `grafana/grafana:10.4.0` | 3000 | 3000 | Telemetry Visualization Dashboard |
| **cadvisor** | `gcr.io/cadvisor/cadvisor:v0.49.1` | 8080 | 8082 | Container Resource Usage Monitor |
| **node-exporter** | `prom/node-exporter:v1.7.0` | 9100 | 9100 | Host Hardware Telemetry |

---

## 5. Jenkins CI/CD Automation

Jenkins acts as the primary orchestrator for the project demonstration:

1. **Launch Jenkins Container**:
   ```bash
   make jenkins-up
   # Or: docker compose -f docker-compose.jenkins.yml up -d
   ```
2. **Access Jenkins**:
   Navigate to `http://localhost:8085` in your browser.
3. **Pipeline Stages**:
   - `1. GitHub Checkout`: Clones latest commit.
   - `2. Dependency Installation`: Executes `npm ci` across root and server.
   - `3. Code Validation`: Checks security audit and linting.
   - `4. Automated Tests`: Runs `npm test` verifying 5 distinct unit/API test scenarios.
   - `5. Docker Image Build`: Builds versioned container image tagged with commit SHA.
   - `6. Trivy Security Scan`: Audits image for HIGH and CRITICAL vulnerabilities.
   - `7. Terraform Validation`: Runs `terraform fmt` and `terraform validate`.
   - `8. Terraform Infrastructure Provisioning`: Runs `terraform apply`.
   - `9. Ansible Configuration`: Runs `ansible-playbook setup.yml`.
   - `10. Application Deployment`: Executes `docker compose up -d`.
   - `11. Health Verification`: Asserts HTTP 200 on `/api/health`.
   - `12. Deployment Reporting`: Publishes status report.
4. **Automated Rollback**:
   If health verification or deployment encounters an error, the `post { failure { ... } }` block triggers `ansible-playbook playbooks/rollback.yml`, restoring the previous stable image.

---

## 6. DevSecOps with Trivy

To scan the container image for known CVEs:

```bash
# On Linux / WSL:
bash security/trivy-scan.sh

# On Windows PowerShell:
.\security\trivy-scan.ps1
```

Reports are exported to `security/reports/` in both human-readable text and JSON formats.

---

## 7. Prometheus & Grafana Monitoring

1. **Prometheus UI**: `http://localhost:9090`
   - View scraped targets: `http://localhost:9090/targets`
   - Active alert rules: `http://localhost:9090/alerts`
2. **Grafana Dashboard**: `http://localhost:3000`
   - Default login: `admin` / `admin`
   - Auto-provisioned dashboard: *Business Incubator - DevOps Monitoring*
   - Displays real-time HTTP requests, latency percentiles, error rates, process memory, and MongoDB connection status.
