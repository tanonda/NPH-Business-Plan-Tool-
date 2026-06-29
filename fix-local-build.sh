#!/usr/bin/env bash
set -euo pipefail

echo "Cleaning stale Next.js build artifacts and accidental duplicate API login page..."
rm -rf .next
rm -f src/app/api/auth/login/page.tsx

echo "Verifying routes..."
if [ -f src/app/api/auth/login/page.tsx ]; then
  echo "ERROR: src/app/api/auth/login/page.tsx still exists"
  exit 1
fi
if [ ! -f src/app/api/auth/login/route.ts ]; then
  echo "ERROR: src/app/api/auth/login/route.ts is missing"
  exit 1
fi
if [ ! -f src/app/login/page.tsx ]; then
  echo "ERROR: src/app/login/page.tsx is missing"
  exit 1
fi

echo "OK. Now run:"
echo "  npm ci"
echo "  npx prisma generate"
echo "  npm run build"
echo "  npm run dev"
