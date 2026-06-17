#!/bin/bash
screen -d -m -S snappycook sh -c "json-server -p 2500 --watch --host 0.0.0.0 db.json"
screen -r
