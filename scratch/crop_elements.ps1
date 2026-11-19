Add-Type -AssemblyName System.Drawing

$src = [System.Drawing.Bitmap]::FromFile("$PWD\client\public\logo.png")

# Let's save the exact cropped elements
# 1. Icon
$iconRect = [System.Drawing.Rectangle]::FromLTRB(385, 40, 1025, 570)
$iconBmp = $src.Clone($iconRect, $src.PixelFormat)
$iconBmp.Save("$PWD\scratch\crop_icon.png")
$iconBmp.Dispose()

# 2. CHARVIK
$charvikRect = [System.Drawing.Rectangle]::FromLTRB(40, 580, 1360, 780)
$charvikBmp = $src.Clone($charvikRect, $src.PixelFormat)
$charvikBmp.Save("$PWD\scratch\crop_charvik.png")
$charvikBmp.Dispose()

# 3. Staffing Consultancy
$staffingRect = [System.Drawing.Rectangle]::FromLTRB(40, 800, 1360, 865)
$staffingBmp = $src.Clone($staffingRect, $src.PixelFormat)
$staffingBmp.Save("$PWD\scratch\crop_staffing.png")
$staffingBmp.Dispose()

# 4. Slogan
$sloganRect = [System.Drawing.Rectangle]::FromLTRB(65, 885, 1335, 925)
$sloganBmp = $src.Clone($sloganRect, $src.PixelFormat)
$sloganBmp.Save("$PWD\scratch\crop_slogan.png")
$sloganBmp.Dispose()

$src.Dispose()
Write-Host "Cropped all 4 elements successfully!"
