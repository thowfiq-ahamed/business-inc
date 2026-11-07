.PHONY: help setup build infra-init infra-plan infra-up deploy health monitor test destroy scan rollback jenkins-up

help:
	@echo "=========================================================="
	@echo " Automated Application Deployment & Infrastructure Automation"
	@echo "=========================================================="
	@echo " Available Targets:"
	@echo "   make setup       : Check prerequisites, copy configs & install dependencies"
	@echo "   make test        : Execute automated test suite"
	@echo "   make build       : Build production Docker container images"
	@echo "   make infra-init  : Initialize Terraform Docker provider"
	@echo "   make infra-plan  : Preview Terraform infrastructure changes"
	@echo "   make infra-up    : Provision Docker networks and volumes with Terraform"
	@echo "   make deploy      : Deploy core application, MongoDB, and monitoring"
	@echo "   make health      : Run health checks against all endpoints"
	@echo "   make monitor     : Start full monitoring stack (Prometheus, Grafana, cAdvisor)"
	@echo "   make scan        : Run Trivy DevSecOps security audit"
	@echo "   make rollback    : Trigger automated recovery and restore previous image"
	@echo "   make jenkins-up  : Launch dedicated Jenkins CI/CD automation server"
	@echo "   make destroy     : Tear down infrastructure and stop containers"
	@echo "=========================================================="

setup:
	@bash scripts/setup.sh || powershell -ExecutionPolicy Bypass -File scripts/setup.ps1

test:
	npm test

build:
	docker compose build app

infra-init:
	cd terraform && terraform init

infra-plan:
	cd terraform && terraform plan

infra-up:
	cd terraform && terraform apply -auto-approve

deploy:
	docker compose up -d app mongo prometheus grafana

health:
	@bash scripts/health-check.sh || powershell -ExecutionPolicy Bypass -File scripts/health-check.ps1

monitor:
	docker compose --profile monitoring up -d

scan:
	@bash security/trivy-scan.sh || powershell -ExecutionPolicy Bypass -File security/trivy-scan.ps1

rollback:
	@bash scripts/test-recovery.sh || powershell -ExecutionPolicy Bypass -File scripts/test-recovery.ps1

jenkins-up:
	docker compose -f docker-compose.jenkins.yml up -d

destroy:
	docker compose down -v
	cd terraform && terraform destroy -auto-approve || true
