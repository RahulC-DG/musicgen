#!/bin/bash

# Voice Productivity Companion Startup Script

echo "🎵 Starting Voice Productivity Companion..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Please copy .env.example to .env and add your Deepgram API key."
    echo "   Run: cp .env.example .env"
    echo "   Then edit .env with your API key from https://deepgram.com"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🚀 Launching application..."
npm start 