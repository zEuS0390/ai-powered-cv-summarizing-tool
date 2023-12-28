#!/bin/bash

# Install docker
# ./scripts/install_docker.sh

# Build and run the containers in the background using docker compose
sudo docker-compose up --build -d

# Run admin regsitration and settings configuration
./scripts/register_admin_and_configure_settings.sh

# Display logs for the containers
sudo docker-compose logs -f --tail=100
