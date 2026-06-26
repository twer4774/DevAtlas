#!/bin/bash
set -e
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE portal;
    CREATE DATABASE akw;
    CREATE DATABASE gittrack;
EOSQL
