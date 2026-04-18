$env:PATH = "E:\;" + $env:PATH
Set-Location traccar-web
npm install
npm run build
