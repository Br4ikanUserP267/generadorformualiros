Write-Output "Prisma setup: cleaning cache, reinstalling packages and generating client"
# Ensure dev dependencies are installed
npm config set production false

# Clean npm cache and remove node_modules + lockfile
npm cache clean --force
if (Test-Path node_modules) { Remove-Item node_modules -Recurse -Force }
if (Test-Path package-lock.json) { Remove-Item package-lock.json -Force }

# Install and generate
npm install
npx prisma generate

Write-Output "Done. If errors appear, paste the output here."
