#!/bin/bash
set -e
echo '=== Step 1: Checking files ==='
ls -la
ls -la prisma/
echo '=== Step 2: Copying schema ==='
cp prisma/schema.production.prisma prisma/schema.prisma
echo '=== Step 3: npm ci ==='
npm ci
echo '=== Step 4: prisma generate ==='
npx prisma generate
echo '=== Step 5: prisma db push ==='
npx prisma db push
echo '=== Step 6: next build ==='
echo "Node: $(node --version)"
echo "TypeScript: $(npx tsc --version 2>/dev/null || echo NOT_INSTALLED)"
npx next build 2>&1
echo '=== BUILD COMPLETE ==='