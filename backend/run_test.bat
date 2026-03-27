set PORT=3001
start /B node dist/main.js > local_server.log 2>&1
timeout /t 5 /nobreak
node ../test_http_3001.js > result.log 2>&1
taskkill /IM "node.exe" /F
