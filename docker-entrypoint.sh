#!/bin/sh

# Ensure data directory exists
mkdir -p /app/data

# Run data migration script
node --experimental-modules /app/src/migrateData.js

# Start the application
node --experimental-modules /app/src/index.js
