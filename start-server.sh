#!/bin/bash
# Start a local server for ShopKart

echo "Starting ShopKart local server..."
echo "Open your browser and go to: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

cd /root/flipkart-clone

# Try Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000
else
    echo "Python is not installed. Please install Python or open index.html directly in your browser."
    exit 1
fi