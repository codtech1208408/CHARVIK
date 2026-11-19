Add-Type -AssemblyName System.Drawing

$icon = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\crop_icon.png")
$charvik = [System.Drawing.Bitmap]::FromFile("$PWD\scratch\crop_charvik.png")

# Master canvas: 1400 x 780
$W = 1400
$H = 780

$master = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($master)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)

# 1. Draw Icon: centered, 470 wide
$iconW = 470
$iconH = [int]($iconW * $icon.Height / $icon.Width)
$iconX = [int](($W - $iconW) / 2)
$iconY = 8
$g.DrawImage($icon, (New-Object System.Drawing.Rectangle($iconX, $iconY, $iconW, $iconH)))

# 2. Draw CHARVIK: centered, 1320 wide, from X=40 to X=1360
$charvikW = 1320
$charvikH = 200
$charvikX = 40
$charvikY = $iconY + $iconH + 16
$g.DrawImage($charvik, (New-Object System.Drawing.Rectangle($charvikX, $charvikY, $charvikW, $charvikH)))

# Colors
$navy = [System.Drawing.ColorTranslator]::FromHtml("#0B2545")
$orange = [System.Drawing.ColorTranslator]::FromHtml("#FF7A00")
$navyBrush = New-Object System.Drawing.SolidBrush($navy)
$orangeBrush = New-Object System.Drawing.SolidBrush($orange)
$orangePen = New-Object System.Drawing.Pen($orange, 5.5)

# 3. Draw STAFFING CONSULTANCY
$staffingY = $charvikY + $charvikH + 22
$fontStaffing = New-Object System.Drawing.Font("Arial", 41, [System.Drawing.FontStyle]::Bold)

# Tracked out text: "S T A F F I N G   C O N S U L T A N C Y" or standard with lines
$staffingText = "S T A F F I N G   C O N S U L T A N C Y"
$staffingSize = $g.MeasureString($staffingText, $fontStaffing)

# If tracked out is too wide, use single-spaced with slightly larger font
if ($staffingSize.Width -gt 1100) {
    $staffingText = "STAFFING CONSULTANCY"
    $fontStaffing = New-Object System.Drawing.Font("Arial", 44, [System.Drawing.FontStyle]::Bold)
    $staffingSize = $g.MeasureString($staffingText, $fontStaffing)
}

$textLeft = ($W - $staffingSize.Width) / 2
$textRight = ($W + $staffingSize.Width) / 2
$lineY = $staffingY + 28

# Left bar: from X=40 to textLeft - 30
$g.DrawLine($orangePen, 40, $lineY, [int]($textLeft - 30), $lineY)
# Right bar: from textRight + 30 to X=1360
$g.DrawLine($orangePen, [int]($textRight + 30), $lineY, 1360, $lineY)

# Draw Staffing text
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString($staffingText, $fontStaffing, $navyBrush, (New-Object System.Drawing.RectangleF(0, $staffingY, $W, 56)), $sfCenter)

# 4. Draw SLOGAN: "YOUR TALENT | OUR SUPPORT | A BRIGHTER FUTURE"
$sloganY = $staffingY + 68
$fontSlogan = New-Object System.Drawing.Font("Arial", 37, [System.Drawing.FontStyle]::Bold)
$fontPipe = New-Object System.Drawing.Font("Arial", 40, [System.Drawing.FontStyle]::Bold)

$t1 = "YOUR TALENT"
$sep = "|"
$t2 = "OUR SUPPORT"
$t3 = "A BRIGHTER FUTURE"

$w1 = $g.MeasureString($t1, $fontSlogan).Width
$wSep = $g.MeasureString($sep, $fontPipe).Width
$w2 = $g.MeasureString($t2, $fontSlogan).Width
$w3 = $g.MeasureString($t3, $fontSlogan).Width

# Generous gap around pipes (e.g. 35px each side)
$gap = 38
$totalW = $w1 + $gap + $wSep + $gap + $w2 + $gap + $wSep + $gap + $w3
$startX = ($W - $totalW) / 2

# Draw Part 1
$g.DrawString($t1, $fontSlogan, $navyBrush, $startX, $sloganY)
$curX = $startX + $w1 + $gap

# Draw Pipe 1
$g.DrawString($sep, $fontPipe, $orangeBrush, $curX, ($sloganY - 2))
$curX += $wSep + $gap

# Draw Part 2
$g.DrawString($t2, $fontSlogan, $navyBrush, $curX, $sloganY)
$curX += $w2 + $gap

# Draw Pipe 2
$g.DrawString($sep, $fontPipe, $orangeBrush, $curX, ($sloganY - 2))
$curX += $wSep + $gap

# Draw Part 3
$g.DrawString($t3, $fontSlogan, $navyBrush, $curX, $sloganY)

$g.Dispose()

# Find exact bounds and trim
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
$finalBmp.Save("C:\Users\SANTHOSH\.gemini\antigravity\brain\ee88d1f0-b5e2-4b5a-b3da-08e50e2df9d3\logo-preview.png", [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Refined Logo Saved: $cropW x $cropH (Ratio: $([math]::Round($cropW / $cropH, 2)))"
$finalBmp.Dispose()
$icon.Dispose()
$charvik.Dispose()
