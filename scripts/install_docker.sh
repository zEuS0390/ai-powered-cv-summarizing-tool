#!/bin/bash

# Extract version codename from /etc/os-release
ID=$(grep -E '^ID=.*' /etc/os-release | cut -d'=' -f2)
VERSION_CODENAME=$(grep VERSION_CODENAME /etc/os-release | cut -d'=' -f2)

# Check if the extracted version codename is empty
if [ -z "$VERSION_CODENAME" ]; then
    echo "Error: Unable to determine version codename."
    exit 1
fi

echo "Version Codename: $VERSION_CODENAME"

# See for more information: https://docs.docker.com/engine/install/

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo "Docker is already installed. Skipping installation."
else
    # Add Docker's official GPG key:
    sudo apt-get update -y
    sudo apt-get install ca-certificates curl gnupg -y
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/$ID/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    # Add the repository to Apt sources:
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$ID $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update -y

    # Install the Docker packages:
    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin -y
fi
