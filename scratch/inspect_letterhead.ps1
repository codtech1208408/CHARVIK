Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PWD\client\public\charvik-letterhead-header.png")

# Analyze where the dividing line and text are
for ($y = 150; $y -lt $img.Height; $y += 5) {
    $dark = 0
    for ($x = 20; $x -lt $img.Width - 20; $x += 5) {
        $p = $img.GetPixel($x, $y)
        if ($p.A -gt 50 -and ($p.R -lt 50 -or $p.B -gt 100)) {
            $dark++
        }
    }
    Write-Host "Y=$y darkCount=$dark"
}
$img.Dispose()
