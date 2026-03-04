#!/bin/bash

# Financial News MCP Server Setup Script

echo "Setting up Financial News MCP Server..."

# Check if .env exists, if not copy from example
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo "✓ .env file created"
else
    echo "✓ .env file already exists"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project
echo "Building project..."
npm run build

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file and add your API keys:"
echo "   - NEWS_API_KEY: Get yours at https://newsapi.org/register"
echo "   - ALPHA_VANTAGE_API_KEY: Get yours at https://www.alphavantage.co/support/#api-key"
echo ""
echo "2. Run the server:"
echo "   npm start"
echo ""
echo "3. For development with hot-reload:"
echo "   npm run dev"
