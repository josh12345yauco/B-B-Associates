#!/bin/bash
echo "Starting B&B local server at http://localhost:3000"
open "http://localhost:3000"
python3 -m http.server 3000
