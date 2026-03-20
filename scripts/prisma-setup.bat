@echo off
echo Prisma setup: cleaning cache, reinstalling packages and generating client
REM Ensure dev dependencies are installed
npm config set production false

REM Clean npm cache and remove node_modules + lockfile
npm cache clean --force
if exist node_modules rd /s /q node_modules
if exist package-lock.json del /f package-lock.json

REM Install and generate
npm install
npx prisma generate
echo Done. If errors appear, paste the output here.
pause
