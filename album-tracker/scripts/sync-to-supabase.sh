#!/bin/bash

# Helper script to sync albums.json to Supabase
# This makes it easier to run the upsert without typing credentials manually

set -e

# Check if running locally or remotely
if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  # Environment variables are set
  URL="$SUPABASE_URL"
  KEY="$SUPABASE_SERVICE_ROLE_KEY"
else
  # Try to get from Supabase CLI
  echo "Getting Supabase credentials from CLI..."

  # Get project ref from .git/config or supabase status
  if command -v supabase &> /dev/null; then
    # Use supabase status to get the API URL
    STATUS=$(supabase status 2>/dev/null || echo "")

    if [ -n "$STATUS" ]; then
      URL=$(echo "$STATUS" | grep "API URL" | awk '{print $3}')
      KEY=$(echo "$STATUS" | grep "service_role key" | awk '{print $3}')
    fi
  fi

  # If still not found, prompt user
  if [ -z "$URL" ] || [ -z "$KEY" ]; then
    echo ""
    echo "Could not auto-detect Supabase credentials."
    echo ""
    echo "Please provide your Supabase credentials:"
    echo ""
    read -p "Supabase URL (e.g., https://xxx.supabase.co): " URL
    read -p "Service Role Key: " KEY
  fi
fi

if [ -z "$URL" ] || [ -z "$KEY" ]; then
  echo "Error: Could not determine Supabase credentials"
  exit 1
fi

echo ""
echo "Using Supabase URL: $URL"
echo ""

# Run the upsert script
node scripts/upsert-albums.js "$URL" "$KEY"
