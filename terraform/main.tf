# Automated Infrastructure Provisioning using Terraform Docker Provider

# 1. Dedicated Docker Network for the Business Incubator Architecture
resource "docker_network" "app_network" {
  name   = var.network_name
  driver = "bridge"
  ipam_config {
    subnet  = "172.28.0.0/16"
    gateway = "172.28.0.1"
  }
  labels {
    label = "environment"
    value = var.environment
  }
  labels {
    label = "managed_by"
    value = "terraform"
  }
}

# 2. Persistent Volume for MongoDB Database
resource "docker_volume" "mongo_data" {
  name = var.mongo_volume_name
  labels {
    label = "service"
    value = "mongodb"
  }
  labels {
    label = "managed_by"
    value = "terraform"
  }
}

# 3. Persistent Volume for Prometheus Time Series Data
resource "docker_volume" "prometheus_data" {
  name = var.prometheus_volume_name
  labels {
    label = "service"
    value = "prometheus"
  }
  labels {
    label = "managed_by"
    value = "terraform"
  }
}

# 4. Persistent Volume for Grafana Dashboards and State
resource "docker_volume" "grafana_data" {
  name = var.grafana_volume_name
  labels {
    label = "service"
    value = "grafana"
  }
  labels {
    label = "managed_by"
    value = "terraform"
  }
}
