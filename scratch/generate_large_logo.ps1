Add-Type -AssemblyName System.Drawing

$icon = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\crop_icon.png")
$charvik = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\crop_charvik.png")

# Canvas: 1440 x 700
$W = 1440
$H = 700

$master = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($master)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# Colors
$navy = [System.Drawing.ColorTranslator]::FromHtml("#071E3D")
$orange = [System.Drawing.ColorTranslator]::FromHtml("#FF7A00")
$navyBrush = New-Object System.Drawing.SolidBrush($navy)
$orangeBrush = New-Object System.Drawing.SolidBrush($orange)
$orangePen = New-Object System.Drawing.Pen($orange, 6.5)

# 1. Draw Icon: balanced width = 380 (height = 380 * 530 / 640 = 315)
$iconW = 380
$iconH = [int]($iconW * $icon.Height / $icon.Width)
$iconX = [int](($W - $iconW) / 2)
$iconY = 6
$g.DrawImage($icon, (New-Object System.Drawing.Rectangle($iconX, $iconY, $iconW, $iconH)))

# 2. Draw CHARVIK: 1320 wide, 200 high
$charvikW = 1320
$charvikH = 200
$charvikX = 60
$charvikY = $iconY + $iconH + 12
$g.DrawImage($charvik, (New-Object System.Drawing.Rectangle($charvikX, $charvikY, $charvikW, $charvikH)))

# 3. Draw STAFFING CONSULTANCY: BIGGER FONT (48pt Arial Bold)
$staffingY = $charvikY + $charvikH + 20
$fontStaffing = New-Object System.Drawing.Font("Arial", 48, [System.Drawing.FontStyle]::Bold)
$staffingText = "STAFFING CONSULTANCY"
$staffingSize = $g.MeasureString($staffingText, $fontStaffing)

$textLeft = ($W - $staffingSize.Width) / 2
$textRight = ($W + $staffingSize.Width) / 2
$lineY = $staffingY + 32

# Left orange bar: from X=60 to textLeft - 25
$g.DrawLine($orangePen, 60, $lineY, [int]($textLeft - 25), $lineY)
# Right orange bar: from textRight + 25 to X=1380
$g.DrawLine($orangePen, [int]($textRight + 25), $lineY, 1380, $lineY)

# Draw Staffing text
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString($staffingText, $fontStaffing, $navyBrush, (New-Object System.Drawing.RectangleF(0, $staffingY, $W, 66)), $sfCenter)

# 4. Draw SLOGAN: "YOUR TALENT | OUR SUPPORT | A BRIGHTER FUTURE": FONT 33pt
$sloganY = $staffingY + 76
$fontSlogan = New-Object System.Drawing.Font("Arial", 33, [System.Drawing.FontStyle]::Bold)
$fontPipe = New-Object System.Drawing.Font("Arial", 36, [System.Drawing.FontStyle]::Bold)

$t1 = "YOUR TALENT"
$sep = "|"
$t2 = "OUR SUPPORT"
$t3 = "A BRIGHTER FUTURE"

$w1 = $g.MeasureString($t1, $fontSlogan).Width
$wSep = $g.MeasureString($sep, $fontPipe).Width
$w2 = $g.MeasureString($t2, $fontSlogan).Width
$w3 = $g.MeasureString($t3, $fontSlogan).Width

# Span exactly 1320 from X=60 to X=1380
$rawW = $w1 + $w2 + $w3 + (2 * $wSep)
$rem = 1320 - $rawW
$gap = [int]($rem / 4)
$actualTotalW = $rawW + (4 * $gap)
$startX = [int](60 + (1320 - $actualTotalW) / 2)

Write-Host "Slogan: gap=$gap, actualTotalW=$actualTotalW, startX=$startX"

# Draw Part 1
$g.DrawString($t1, $fontSlogan, $navyBrush, $startX, $sloganY)
$curX = $startX + $w1 + $gap

# Draw Pipe 1
$g.DrawString($sep, $fontPipe, $orangeBrush, $curX, ($sloganY - 3))
$curX += $wSep + $gap

# Draw Part 2
$g.DrawString($t2, $fontSlogan, $navyBrush, $curX, $sloganY)
$curX += $w2 + $gap

# Draw Pipe 2
$g.DrawString($sep, $fontPipe, $orangeBrush, $curX, ($sloganY - 3))
$curX += $wSep + $gap

# Draw Part 3
$g.DrawString($t3, $fontSlogan, $navyBrush, $curX, $sloganY)

$g.Dispose()

# Trim tight with 6px padding
$minY = $master.Height; $maxY = 0; $minX = $master.Width; $maxX = 0
for ($y = 0; $y -lt $master.Height; $y++) {
    for ($x = 0; $x -lt $master.Width; $x++) {
        $p = $master.GetPixel($x, $y)
        if ($p.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$cropX = [math]::Max(0, $minX - 6)
$cropY = [math]::Max(0, $minY - 6)
$cropW = [math]::Min($master.Width - $cropX, ($maxX - $minX) + 12)
$cropH = [math]::Min($master.Height - $cropY, ($maxY - $minY) + 12)

$rect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)
$finalBmp = $master.Clone($rect, $master.PixelFormat)
$master.Dispose()

$finalBmp.Save("$PWD\client\public\logo-navbar.png", [System.Drawing.Imaging.ImageFormat]::Png)
$finalBmp.Save("$PWD\client\public\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$finalBmp.Save("$PWD\client\public\logo-horizontal.png", [System.Drawing.Imaging.ImageFormat]::Png)
$finalBmp.Save("$PWD\client\src\assets\logo.png", [System.Drawing.Imaging.ImageFormat]::Png)
$finalBmp.Save("$PWD\client\src\assets\logo-horizontal.png", [System.Drawing.Imaging.ImageFormat]::Png)
$finalBmp.Save("$PWD\client\src\assets\logo-compact.png", [System.Drawing.Imaging.ImageFormat]::Png)
$finalBmp.Save("C:\Users\SANTHOSH\.gemini\antigravity\brain\ee88d1f0-b5e2-4b5a-b3da-08e50e2df9d3\logo-preview.png", [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "New Large Logo: $cropW x $cropH (Ratio: $([math]::Round($cropW / $cropH, 2)))"
$finalBmp.Dispose()
$icon.Dispose()
$charvik.Dispose()
