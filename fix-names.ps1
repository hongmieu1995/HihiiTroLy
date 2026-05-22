$file = "src-tauri\src\lib.rs"
$content = Get-Content $file -Raw
$content = $content -replace '\.join\("htssclub"\)', '.join("hihii")'
$content = $content -replace '"htssclub-launcher"', '"hihii-launcher"'
Set-Content $file $content -NoNewline
Write-Host "Done! Replaced htssclub -> hihii in lib.rs"
