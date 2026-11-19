Add-Type -AssemblyName System.Drawing

$icon = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\crop_icon.png")
$charvik = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\crop_charvik.png")
$staffing = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\crop_staffing.png")
$slogan = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\crop_slogan.png")

# Let's test a balanced composite
# Canvas width = 1360
$W = 1360

# We want:
# Icon: centered, say width 480 (height = 480 * 530 / 640 = 398)
$iconW = 460
$iconH = [int]($iconW * $icon.Height / $icon.Width)
$iconX = [int](($W - $iconW) / 2)
$iconY = 0

# CHARVIK: full width (1320), centered (X=20)
$charvikY = $iconY + $iconH + 15
$charvikW = $charvik.Width
$charvikH = $charvik.Height
$charvikX = [int](($W - $charvikW) / 2)

# STAFFING: height 75, width 1320
$staffingY = $charvikY + $charvikH + 20
$staffingW = 1320
$staffingH = 75
$staffingX = [int](($W - $staffingW) / 2)

# SLOGAN: height 75, width 1320
$sloganY = $staffingY + $staffingH + 20
$sloganW = 1320
$sloganH = 70
$sloganX = [int](($W - $sloganW) / 2)

$totalH = $sloganY + $sloganH + 10

Write-Host "Composed Size: $W x $totalH (Ratio: $([math]::Round($W / $totalH, 2)))"

$master = New-Object System.Drawing.Bitmap($W, $totalH, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($master)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

# Clear with transparent
$g.Clear([System.Drawing.Color]::Transparent)

# Draw Icon
$g.DrawImage($icon, (New-Object System.Drawing.Rectangle($iconX, $iconY, $iconW, $iconH)))

# Draw CHARVIK
$g.DrawImage($charvik, (New-Object System.Drawing.Rectangle($charvikX, $charvikY, $charvikW, $charvikH)))

# Draw STAFFING CONSULTANCY
# Instead of stretching low-res crop_staffing, let's draw crisp vector elements:
# Orange bars on left and right, and bold text in the middle:
# Or draw crop_staffing:
$g.DrawImage($staffing, (New-Object System.Drawing.Rectangle($staffingX, $staffingY, $staffingW, $staffingH)))

# Draw SLOGAN
$g.DrawImage($slogan, (New-Object System.Drawing.Rectangle($sloganX, $sloganY, $sloganW, $sloganH)))

$g.Dispose()

$master.Save("$PWD\client\public\logo-navbar-master.png", [System.Drawing.Imaging.ImageFormat]::Png)
$master.Dispose()

$icon.Dispose()
$charvik.Dispose()
$staffing.Dispose()
$slogan.Dispose()

Write-Host "Created client\public\logo-navbar-master.png successfully!"
