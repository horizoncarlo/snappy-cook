#!/bin/bash
#screen -d -m -S snappycook sh -c "json-server -p 2500 --watch --host 0.0.0.0 db.json"
#screen -r

pm2 start json-server --name "snappycook" -- -p 2500 --watch --host 0.0.0.0 db.json
