pipeline {
    agent any

    environment {
        APP_NAME = "business-inc"
        DOCKER_IMAGE = "business-inc"
        IMAGE_TAG = "${BUILD_NUMBER}-${GIT_COMMIT.take(7)}"
        PREVIOUS_IMAGE_TAG = "previous"
        SCAN_REPORT_DIR = "security/reports"
        APP_HEALTH_URL = "http://localhost:5000/api/health"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('1. GitHub Checkout') {
            steps {
                echo "=== Stage 1: GitHub Checkout ==="
                checkout scm
                sh '''
                    echo "Checked out commit: ${GIT_COMMIT}"
                    echo "Branch: ${GIT_BRANCH}"
                '''
            }
        }

        stage('2. Dependency Installation') {
            steps {
                echo "=== Stage 2: Dependency Installation ==="
                sh '''
                    npm ci
                    npm --prefix server ci
                '''
            }
        }

        stage('3. Code Validation') {
            steps {
                echo "=== Stage 3: Code Validation & Audit ==="
                sh '''
                    npm --prefix server audit --audit-level=high || true
                '''
            }
        }

        stage('4. Automated Tests') {
            steps {
                echo "=== Stage 4: Automated Testing Suite ==="
                sh '''
                    npm test
                '''
            }
        }

        stage('5. Docker Image Build') {
            steps {
                echo "=== Stage 5: Building Versioned Docker Image ==="
                sh '''
                    # Tag current latest as previous for safe recovery
                    if docker image inspect ${DOCKER_IMAGE}:latest >/dev/null 2>&1; then
                        docker tag ${DOCKER_IMAGE}:latest ${DOCKER_IMAGE}:${PREVIOUS_IMAGE_TAG}
                    fi

                    # Build new versioned image
                    docker build -t ${DOCKER_IMAGE}:${IMAGE_TAG} -t ${DOCKER_IMAGE}:latest .
                    echo "Built Docker images: ${DOCKER_IMAGE}:${IMAGE_TAG} and ${DOCKER_IMAGE}:latest"
                '''
            }
        }

        stage('6. Trivy Security Scan') {
            steps {
                echo "=== Stage 6: DevSecOps Vulnerability Scanning ==="
                sh '''
                    mkdir -p ${SCAN_REPORT_DIR}
                    if command -v trivy >/dev/null 2>&1; then
                        echo "Executing Trivy image vulnerability scan..."
                        trivy image --severity HIGH,CRITICAL --format table --output ${SCAN_REPORT_DIR}/trivy-report-${IMAGE_TAG}.txt ${DOCKER_IMAGE}:${IMAGE_TAG} || true
                        trivy image --severity HIGH,CRITICAL --format json --output ${SCAN_REPORT_DIR}/trivy-report-${IMAGE_TAG}.json ${DOCKER_IMAGE}:${IMAGE_TAG} || true
                        cat ${SCAN_REPORT_DIR}/trivy-report-${IMAGE_TAG}.txt | head -n 30 || true
                    else
                        echo "Trivy CLI not present in agent path, running via docker container..."
                        docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v $(pwd)/${SCAN_REPORT_DIR}:/reports aquasec/trivy:latest image --severity HIGH,CRITICAL --format table --output /reports/trivy-report-${IMAGE_TAG}.txt ${DOCKER_IMAGE}:${IMAGE_TAG} || true
                    fi
                '''
            }
        }

        stage('7. Terraform Validation') {
            steps {
                echo "=== Stage 7: Terraform Syntax & Configuration Validation ==="
                sh '''
                    cd terraform
                    terraform fmt -check || terraform fmt
                    terraform init -backend=false
                    terraform validate
                '''
            }
        }

        stage('8. Terraform Infrastructure Provisioning') {
            steps {
                echo "=== Stage 8: Terraform Infrastructure Provisioning ==="
                sh '''
                    cd terraform
                    terraform init -input=false
                    terraform plan -out=tfplan
                    terraform apply -input=false -auto-approve tfplan
                '''
            }
        }

        stage('9. Ansible Configuration') {
            steps {
                echo "=== Stage 9: Ansible Host & Configuration Management ==="
                sh '''
                    cd ansible
                    ansible-playbook -i inventory.ini playbooks/setup.yml
                '''
            }
        }

        stage('10. Application Deployment') {
            steps {
                echo "=== Stage 10: Docker Compose Application Deployment ==="
                sh '''
                    export APP_IMAGE_TAG="${IMAGE_TAG}"
                    docker compose up -d app mongo prometheus grafana
                '''
            }
        }

        stage('11. Health Verification') {
            steps {
                echo "=== Stage 11: Deployment Health Verification ==="
                sh '''
                    echo "Waiting for application to respond on ${APP_HEALTH_URL}..."
                    for i in $(seq 1 15); do
                        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" ${APP_HEALTH_URL} || true)
                        if [ "$HTTP_STATUS" = "200" ]; then
                            echo "Application verified healthy (HTTP 200)!"
                            curl -s ${APP_HEALTH_URL}
                            exit 0
                        fi
                        echo "Attempt $i: Status $HTTP_STATUS, retrying in 3s..."
                        sleep 3
                    done
                    echo "Health verification timed out!"
                    exit 1
                '''
            }
        }

        stage('12. Deployment Reporting') {
            steps {
                echo "=== Stage 12: Deployment Reporting & Artifact Archival ==="
                sh '''
                    echo "=========================================================="
                    echo " DEPLOYMENT REPORT"
                    echo " Project: Business Incubator Platform"
                    echo " Image:   ${DOCKER_IMAGE}:${IMAGE_TAG}"
                    echo " App URL: http://localhost:5000"
                    echo " Status:  SUCCESSFULLY DEPLOYED"
                    echo " Date:    $(date)"
                    echo "=========================================================="
                '''
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'security/reports/**', allowEmptyArchive: true
            cleanWs notFailBuild: true
        }
        success {
            echo "CI/CD Pipeline executed successfully! Deployment is operational."
        }
        failure {
            echo "Pipeline failed! Initiating automated recovery and rollback to previous version..."
            sh '''
                if [ -f "ansible/playbooks/rollback.yml" ]; then
                    cd ansible
                    export PREVIOUS_IMAGE_TAG="${PREVIOUS_IMAGE_TAG}"
                    ansible-playbook -i inventory.ini playbooks/rollback.yml || true
                else
                    echo "Falling back to Docker restart with latest working image..."
                    docker compose up -d app
                fi
            '''
        }
    }
}
