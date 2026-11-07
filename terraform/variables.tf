variable "docker_host" {
  description = "Docker daemon host socket or named pipe"
  type        = string
  default     = "npipe:////./pipe/docker_engine"
}

variable "network_name" {
  description = "Name of the Docker network for business incubator stack"
  type        = string
  default     = "business-inc-net"
}

variable "mongo_volume_name" {
  description = "Name of the persistent Docker volume for MongoDB"
  type        = string
  default     = "business_inc_mongo_data"
}

variable "prometheus_volume_name" {
  description = "Name of the persistent Docker volume for Prometheus"
  type        = string
  default     = "business_inc_prometheus_data"
}

variable "grafana_volume_name" {
  description = "Name of the persistent Docker volume for Grafana"
  type        = string
  default     = "business_inc_grafana_data"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}
