#!/bin/bash

# Prompt user for missing variables
read -p "Enter GPT model (default: gpt-3.5-turbo-1106): " gptModel
gptModel=${gptModel:-"gpt-3.5-turbo-1106"}  # Default if user input is empty

# Prompt user for initial GPT API Key, admin username, password, and email
read -p "Enter initial GPT API Key*: " apiKey
read -p "Enter admin username*: " adminUsername
read -p "Enter admin password*: " -s adminPassword
echo  # Move to the next line after the password input
read -p "Enter admin email*: " adminEmail

read -p "Enter email host*: " senderEmailHost
read -p "Enter email port*: " senderEmailPort
read -p "Enter email address*: " senderEmailAddress
read -p "Enter email app password*: " -s senderEmailAppPassword
echo  # Move to the next line after the password input

# Check if any of the inputs is empty
if [ -z "$apiKey" ] || [ -z "$adminUsername" ] || [ -z "$adminPassword" ] || [ -z "$adminEmail" ] || [ -z "$senderEmailHost" ] || [ -z "$senderEmailPort" ] || [ -z "$senderEmailAddress" ] || [ -z "$senderEmailAppPassword" ]; then
    echo "One or more inputs are empty. Script cancelled."
    exit 1  # Exit the script with an error status
fi

# Execute scripts inside the worker container to create admin user and set GPT API Key
sudo docker compose exec worker /bin/bash -c "python3 register_and_configure.py \
    --username $adminUsername \
    --password $adminPassword \
    --email $adminEmail \
    --sender_email_host $senderEmailHost \
    --sender_email_port $senderEmailPort \
    --sender_email_address $senderEmailAddress \
    --sender_email_app_password $senderEmailAppPassword \
    --gpt_model $gptModel \
    --gpt_api_key $apiKey"