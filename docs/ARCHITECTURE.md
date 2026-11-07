# Architecture Specification

**Official Project Title**: Automated Application Deployment and Infrastructure Configuration Using DevOps Tools  
**Application Target**: Business Incubator Platform (`business-inc`)  
**Deployment Model**: Containerized Microservices with Automated CI/CD, IaC, and Monitoring

---

## 1. High-Level System Architecture

The Business Incubator platform consists of an Express.js backend serving both static client assets and RESTful API endpoints, backed by a persistent MongoDB database. The entire ecosystem is deployed, provisioned, configured, and monitored using modern DevOps tools.

```mermaid
flowchart TD
    subgraph Clients["User & Client Tier"]
        Browser["Web Browser (Founder / Mentor / Investor / Admin)"]
    end

    subgraph ReverseProxy_AppTier["Application & Data Tier (Port: 5000)"]
        App["Business Incubator App (Node.js / Express)<br/>- Static Assets<br/>- REST APIs<br/>- prom-client /metrics"]
        DB[("MongoDB 7.0<br/>Port: 27017<br/>Persistent Volume: mongo_data")]
    end

    subgraph MonitoringTier["Observability Tier"]
        Prometheus["Prometheus Server (Port: 9090)<br/>- Scrapes App /metrics<br/>- Scrapes cAdvisor /metrics<br/>- Evaluates Alert Rules"]
        Grafana["Grafana Dashboards (Port: 3000)<br/>- Auto-provisioned Dashboards<br/>- Real-time Visualizations"]
        cAdvisor["cAdvisor (Port: 8082)<br/>- Container Resource Metrics"]
        NodeExp["Node Exporter (Port: 9100)<br/>- Host Hardware Metrics"]
    end

    subgraph AutomationTier["DevOps & Automation Tier"]
        TF["Terraform (IaC)<br/>- Docker Network (business-inc-net)<br/>- Volumes (mongo_data, prometheus_data, grafana_data)"]
        Ansible["Ansible (Config Mgmt)<br/>- setup.yml<br/>- deploy.yml<br/>- health-check.yml<br/>- rollback.yml"]
        Jenkins["Jenkins Pipeline (Port: 8085)<br/>- 12-Stage CI/CD<br/>- Automated Rollback"]
        Trivy["Trivy Security Scanner<br/>- Vulnerability Audit<br/>- Security Gates"]
    end

    Browser -->|HTTP :5000| App
    App -->|Mongoose DB Driver| DB
    Prometheus -->|Scrapes /metrics| App
    Prometheus -->|Scrapes :8082| cAdvisor
    Prometheus -->|Scrapes :9100| NodeExp
    Grafana -->|Queries Metrics| Prometheus
    TF -.->|Provisions| ReverseProxy_AppTier
    Ansible -.->|Configures & Deploys| ReverseProxy_AppTier
    Jenkins -->|Executes| TF
    Jenkins -->|Executes| Ansible
    Jenkins -->|Scans Images| Trivy
```

---

## 2. Infrastructure as Code (IaC) - Terraform Architecture

Terraform is implemented with the `kreuzwerker/docker` provider to provide declarative, reproducible, and immutable local infrastructure.

```mermaid
flowchart LR
    TF_Config["Terraform Files<br/>(main.tf, providers.tf, variables.tf)"] -->|terraform apply| TF_Engine["Terraform Engine"]
    TF_Engine -->|Provisions| Net["Docker Network<br/>(business-inc-net: 172.28.0.0/16)"]
    TF_Engine -->|Provisions| Vol1["Docker Volume<br/>(business_inc_mongo_data)"]
    TF_Engine -->|Provisions| Vol2["Docker Volume<br/>(business_inc_prometheus_data)"]
    TF_Engine -->|Provisions| Vol3["Docker Volume<br/>(business_inc_grafana_data)"]
    Net --- Compose["Docker Compose Services"]
    Vol1 --- Compose
    Vol2 --- Compose
    Vol3 --- Compose
```

---

## 3. CI/CD Pipeline Flow (Jenkins & GitHub Actions)

The primary CI/CD automation engine demonstrated is **Jenkins**, utilizing a comprehensive 12-stage declarative pipeline. GitHub Actions operates in parallel for cloud validation and continuous integration.

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Git as GitHub Repository
    participant JK as Jenkins CI/CD Engine
    participant QA as Test Runner (node:test)
    participant SEC as Trivy Security Scanner
    participant TF as Terraform (IaC)
    participant ANS as Ansible (Config Mgmt)
    participant DOCK as Docker Engine
    participant MON as Prometheus / Health Probes

    Dev->>Git: Push Code to branch
    Git->>JK: Webhook / Polling Trigger
    JK->>JK: 1. GitHub Checkout
    JK->>JK: 2. Dependency Installation (npm ci)
    JK->>QA: 3. Code Validation & 4. Automated Tests
    QA-->>JK: All Tests Passed (5/5)
    JK->>DOCK: 5. Build Docker Image (Tagged & Latest)
    JK->>SEC: 6. Trivy Security Scan (HIGH, CRITICAL)
    SEC-->>JK: Vulnerability Report Generated
    JK->>TF: 7. Validate & 8. Provision Infrastructure
    TF-->>DOCK: Create Networks & Volumes
    JK->>ANS: 9. Ansible Configuration (setup.yml)
    JK->>DOCK: 10. Application Deployment (docker compose)
    JK->>MON: 11. Health Verification (/api/health)
    alt Health Check Passes
        MON-->>JK: HTTP 200 OK
        JK->>JK: 12. Deployment Report Generated
    else Health Check Fails
        MON-->>JK: Timeout / Failure
        JK->>ANS: Trigger Automated Rollback (rollback.yml)
        ANS->>DOCK: Restore Previous Working Image
    end
```

---

## 4. Observability & Monitoring Architecture

The metrics telemetry stack is completely decoupled from application business logic, using Prometheus pull model:

1. **Application Layer**: Express app instantiates `prom-client`, recording request counts, latency histograms, Node.js memory/CPU, and MongoDB connection state at `/metrics`.
2. **Prometheus Layer**: Scrapes `/metrics` every 15 seconds, computes rates and quantiles, and triggers alerts on degradation.
3. **Grafana Layer**: Automatically provisions the Prometheus data source and renders the custom *Business Incubator - DevOps Monitoring* dashboard.
4. **Host & Container Layer**: cAdvisor and Node Exporter collect kernel, CPU, disk I/O, and container-level resource statistics.
