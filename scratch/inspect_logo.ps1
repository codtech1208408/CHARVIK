Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PWD\client\public\logo.png")
Write-Host "Width:" $img.Width "Height:" $img.Height

# Find bounding box of non-white / non-transparent pixels
$minX = $img.Width
$maxX = 0
$minY = $img.Height
$maxY = 0

for ($y = 0; $y -lt $img.Height; $y += 5) {
    for ($x = 0; $x -lt $img.Width; $x += 5) {
        $pixel = $img.GetPixel($x, $y)
        # Check if not pure white and not transparent
        if ($pixel.A -gt 20 -and ($pixel.R -lt 245 -or $pixel.G -lt 245 -or $pixel.B -lt 245)) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Content Bounding Box: X=$minX to $maxX, Y=$minY to $maxY"
Write-Host "Content Width:" ($maxX - $minX) "Content Height:" ($maxY - $minY)

$img.Dispose()
