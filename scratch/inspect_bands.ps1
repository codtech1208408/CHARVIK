Add-Type -AssemblyName System.Drawing

$img = [System.Drawing.Bitmap]::FromFile("$PWD\client\public\logo.png")

# Analyze row by row non-white pixel density
$rows = @()
for ($y = 0; $y -lt $img.Height; $y += 2) {
    $count = 0
    for ($x = 0; $x -lt $img.Width; $x += 4) {
        $p = $img.GetPixel($x, $y)
        if ($p.A -gt 20 -and ($p.R -lt 240 -or $p.G -lt 240 -or $p.B -lt 240)) {
            $count++
        }
    }
    if ($count -gt 5) {
        $rows += $y
    }
}

# Group into continuous bands
$bands = @()
$start = $rows[0]
$prev = $rows[0]

foreach ($r in $rows) {
    if ($r - $prev -gt 10) {
        $bands += [PSCustomObject]@{ Start = $start; End = $prev; Height = ($prev - $start) }
        $start = $r
    }
    $prev = $r
}
$bands += [PSCustomObject]@{ Start = $start; End = $prev; Height = ($prev - $start) }

foreach ($b in $bands) {
    Write-Host "Band: Y=$($b.Start) to $($b.End) (Height: $($b.Height))"
}

$img.Dispose()
