#!/bin/bash
# Targetted at Node 18+
npm i -g json-server
json-server --watch --host 0.0.0.0 db.json
