variable "aws_region" {
  description = "AWS region for the production Lightsail instance."
  type        = string
  default     = "eu-west-1"
}

variable "availability_zone" {
  description = "Lightsail availability zone. Confirm it with aws lightsail get-regions before apply."
  type        = string
  default     = "eu-west-1a"
}

variable "instance_name" {
  description = "Lightsail instance name."
  type        = string
  default     = "priceswitch-production"
}

variable "bundle_id" {
  description = "Lightsail Linux bundle. small_3_0 is the 2 GB plan; confirm the current bundle ID before apply."
  type        = string
  default     = "small_3_0"
}

variable "blueprint_id" {
  description = "Lightsail operating-system blueprint."
  type        = string
  default     = "ubuntu_24_04"
}

variable "ssh_cidr" {
  description = "CIDR allowed to use SSH. Set this to your current public IP with /32."
  type        = string
}
