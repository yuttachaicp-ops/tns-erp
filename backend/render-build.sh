#!/bin/bash
set -e
echo '=== Step 1: Checking files ==='
ls -la
ls -la prisma/
echo '=== Step 2: Copying schema ==='
cp prisma/schema.production.prisma prisma/schema.prisma
echo '=== Step 3: npm ci (with devDependencies) ==='
NPM_CONFIG_PRODUCTION=false npm ci
echo '=== Step 4: prisma generate ==='
npx prisma generate
echo '=== Step 5: prisma db push ==='
npx prisma db push
echo '=== Step 6: next build ==='
npx next build
echo '=== BUILD COMPLETE ==='