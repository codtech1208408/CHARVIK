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

# 1. Draw Icon: centered, 460 wide, 381 high
$iconW = 460
$iconH = [int]($iconW * $icon.Height / $icon.Width)
$iconX = [int](($W - $iconW) / 2)
$iconY = 10
$g.DrawImage($icon, (New-Object System.Drawing.Rectangle($iconX, $iconY, $iconW, $iconH)))

# 2. Draw CHARVIK: centered, full 1320 wide, 200 high
$charvikW = 1320
$charvikH = 200
$charvikX = [int](($W - $charvikW) / 2)
$charvikY = $iconY + $iconH + 15
$g.DrawImage($charvik, (New-Object System.Drawing.Rectangle($charvikX, $charvikY, $charvikW, $charvikH)))

# 3. Draw STAFFING CONSULTANCY:
# Width must match CHARVIK exactly (1320 wide, from X=40 to X=1360)
$staffingY = $charvikY + $charvikH + 20
$navy = [System.Drawing.ColorTranslator]::FromHtml("#0B2545")
$orange = [System.Drawing.ColorTranslator]::FromHtml("#FF7A00")
$navyBrush = New-Object System.Drawing.SolidBrush($navy)
$orangeBrush = New-Object System.Drawing.SolidBrush($orange)
$orangePen = New-Object System.Drawing.Pen($orange, 5)

# Text: "S T A F F I N G   C O N S U L T A N C Y"
$fontStaffing = New-Object System.Drawing.Font("Arial", 42, [System.Drawing.FontStyle]::Bold)
$sfCenter = New-Object System.Drawing.StringFormat
$sfCenter.Alignment = [System.Drawing.StringAlignment]::Center
$sfCenter.LineAlignment = [System.Drawing.StringAlignment]::Center

# Calculate text width
$staffingText = "STAFFING CONSULTANCY"
# Let's space it out or measure:
$textSize = $g.MeasureString($staffingText, $fontStaffing)

# Left and Right orange lines
$lineY = $staffingY + 28
$textLeft = ($W - $textSize.Width) / 2
$textRight = ($W + $textSize.Width) / 2

# Draw Left Line (from CHARVIK left edge X=40 to textLeft - 25)
$g.DrawLine($orangePen, 40, $lineY, [int]($textLeft - 25), $lineY)
# Draw Right Line (from textRight + 25 to CHARVIK right edge X=1360)
$g.DrawLine($orangePen, [int]($textRight + 25), $lineY, 1360, $lineY)

# Draw text in center
$g.DrawString($staffingText, $fontStaffing, $navyBrush, (New-Object System.Drawing.RectangleF(0, $staffingY, $W, 55)), $sfCenter)

# 4. Draw SLOGAN: "YOUR TALENT | OUR SUPPORT | A BRIGHTER FUTURE"
# Width must span nicely under CHARVIK
$sloganY = $staffingY + 65
$fontSlogan = New-Object System.Drawing.Font("Arial", 38, [System.Drawing.FontStyle]::Bold)

# Parts:
# "YOUR TALENT"  "|"  "OUR SUPPORT"  "|"  "A BRIGHTER FUTURE"
$p1 = "YOUR TALENT"
$sep1 = "|"
$p2 = "OUR SUPPORT"
$sep2 = "|"
$p3 = "A BRIGHTER FUTURE"

$s1 = $g.MeasureString($p1, $fontSlogan)
$sSep = $g.MeasureString(" | ", $fontSlogan)
$s2 = $g.MeasureString($p2, $fontSlogan)
$s3 = $g.MeasureString($p3, $fontSlogan)

$totalSloganW = $s1.Width + $sSep.Width + $s2.Width + $sSep.Width + $s3.Width
$curX = ($W - $totalSloganW) / 2

# Draw P1
$g.DrawString($p1, $fontSlogan, $navyBrush, $curX, $sloganY)
$curX += $s1.Width - 10

# Draw Sep 1
$g.DrawString(" | ", $fontSlogan, $orangeBrush, $curX, $sloganY)
$curX += $sSep.Width - 20

# Draw P2
$g.DrawString($p2, $fontSlogan, $navyBrush, $curX, $sloganY)
$curX += $s2.Width - 10

# Draw Sep 2
$g.DrawString(" | ", $fontSlogan, $orangeBrush, $curX, $sloganY)
$curX += $sSep.Width - 20

# Draw P3
$g.DrawString($p3, $fontSlogan, $navyBrush, $curX, $sloganY)

$g.Dispose()
$master.Save("$PWD\client\public\logo-navbar.png", [System.Drawing.Imaging.ImageFormat]::Png)
$master.Dispose()

$icon.Dispose()
$charvik.Dispose()

Write-Host "Created client\public\logo-navbar.png with ultra-crisp vector typography!"
