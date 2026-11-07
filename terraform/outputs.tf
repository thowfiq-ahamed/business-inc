output "network_id" {
  description = "The ID of the provisioned Docker network"
  value       = docker_network.app_network.id
}

output "network_name" {
  description = "The name of the provisioned Docker network"
  value       = docker_network.app_network.name
}

output "mongo_volume_name" {
  description = "The name of the MongoDB data volume"
  value       = docker_volume.mongo_data.name
}

output "prometheus_volume_name" {
  description = "The name of the Prometheus data volume"
  value       = docker_volume.prometheus_data.name
}

output "grafana_volume_name" {
  description = "The name of the Grafana data volume"
  value       = docker_volume.grafana_data.name
}
