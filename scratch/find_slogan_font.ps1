Add-Type -AssemblyName System.Drawing

$b = New-Object System.Drawing.Bitmap(100, 100)
$g = [System.Drawing.Graphics]::FromImage($b)

for ($pt = 40; $pt -ge 28; $pt--) {
    $f = New-Object System.Drawing.Font("Arial", $pt, [System.Drawing.FontStyle]::Bold)
    $fp = New-Object System.Drawing.Font("Arial", ($pt + 3), [System.Drawing.FontStyle]::Bold)
    $w1 = $g.MeasureString("YOUR TALENT", $f).Width
    $w2 = $g.MeasureString("OUR SUPPORT", $f).Width
    $w3 = $g.MeasureString("A BRIGHTER FUTURE", $f).Width
    $wSep = $g.MeasureString("|", $fp).Width
    $rawW = $w1 + $w2 + $w3 + (2 * $wSep)
    $rem = 1320 - $rawW
    $gap = [int]($rem / 4)
    Write-Host "Pt=${pt} rawW=$([math]::Round($rawW, 1)) rem=$([math]::Round($rem, 1)) gap=${gap}"
}
$g.Dispose()
$b.Dispose()
