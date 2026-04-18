$env:PATH = "E:\;" + $env:PATH
Set-Location saas
npm install
npm run prisma:generate
if ($args.Count -gt 0) {
    $cmd = "npm " + ($args -join " ")
    Invoke-Expression $cmd
}
