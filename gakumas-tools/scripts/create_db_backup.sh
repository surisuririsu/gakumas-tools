#!/bin/bash
source .env.local
mongodump --uri="$MONGODB_URI" --out="dump/`date +"%Y_%m_%d"`"
