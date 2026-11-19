Add-Type -AssemblyName System.Drawing

$logo = [System.Drawing.Bitmap]::FromFile("$PWD\client\public\logo-navbar.png")

# Canvas: 1360 x 390
$W = 1360
$H = 390

$bmp = New-Object System.Drawing.Bitmap($W, $H, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::White)

# Colors
$navy = [System.Drawing.ColorTranslator]::FromHtml("#071E3D")
$navyBrush = New-Object System.Drawing.SolidBrush($navy)
$whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$navyPen = New-Object System.Drawing.Pen($navy, 4)
$thinPen = New-Object System.Drawing.Pen($navy, 1.5)

# Rounded rectangle helper
function Draw-RoundedRectangle($graphics, $pen, $rect, $radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $d, $d, 180, 90)
    $path.AddArc($rect.Right - $d, $rect.Y, $d, $d, 270, 90)
    $path.AddArc($rect.Right - $d, $rect.Bottom - $d, $d, $d, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    $graphics.DrawPath($pen, $path)
    $path.Dispose()
}

# 1. Outer rounded border
$outerRect = New-Object System.Drawing.Rectangle(10, 8, ($W - 20), ($H - 16))
Draw-RoundedRectangle $g $navyPen $outerRect 24

# 2. Draw Logo in upper section
$logoH = 190
$logoW = [int]($logoH * $logo.Width / $logo.Height)
$logoX = [int](($W - $logoW) / 2)
$logoY = 22
$g.DrawImage($logo, (New-Object System.Drawing.Rectangle($logoX, $logoY, $logoW, $logoH)))

# 3. Horizontal Divider line
$divY = $logoY + $logoH + 16
$g.DrawLine($thinPen, 40, $divY, ($W - 40), $divY)

# 4. Contact Info: Phone & Email
$contactY = $divY + 14
$fontContact = New-Object System.Drawing.Font("Arial", 18, [System.Drawing.FontStyle]::Bold)

# Draw Vector Icons inside circle
function Draw-PhoneCircle($graphics, $cx, $cy, $radius) {
    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#071E3D"))
    $graphics.FillEllipse($bg, ($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))
    $bg.Dispose()

    $wp = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 2.2)
    $graphics.DrawArc($wp, ($cx - 6), ($cy - 7), 12, 14, 180, 160)
    $wb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillEllipse($wb, ($cx - 7), ($cy - 5), 4, 6)
    $graphics.FillEllipse($wb, ($cx + 3), ($cy - 5), 4, 6)
    $wp.Dispose()
    $wb.Dispose()
}

function Draw-EmailCircle($graphics, $cx, $cy, $radius) {
    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#071E3D"))
    $graphics.FillEllipse($bg, ($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))
    $bg.Dispose()

    $wp = New-Object System.Drawing.Pen([System.Drawing.Color]::White, 1.8)
    $graphics.DrawRectangle($wp, ($cx - 7), ($cy - 5), 14, 10)
    $graphics.DrawLine($wp, ($cx - 7), ($cy - 5), $cx, ($cy + 1))
    $graphics.DrawLine($wp, ($cx + 7), ($cy - 5), $cx, ($cy + 1))
    $wp.Dispose()
}

function Draw-PinCircle($graphics, $cx, $cy, $radius) {
    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#071E3D"))
    $graphics.FillEllipse($bg, ($cx - $radius), ($cy - $radius), ($radius * 2), ($radius * 2))
    $bg.Dispose()

    $wb = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $graphics.FillEllipse($wb, ($cx - 4), ($cy - 6), 8, 8)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddLine(($cx - 3.5), ($cy - 1), ($cx + 3.5), ($cy - 1))
    $path.AddLine(($cx + 3.5), ($cy - 1), $cx, ($cy + 5))
    $path.CloseFigure()
    $graphics.FillPath($wb, $path)
    $path.Dispose()

    $nb = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#071E3D"))
    $graphics.FillEllipse($nb, ($cx - 1.5), ($cy - 3.5), 3, 3)
    $nb.Dispose()
    $wb.Dispose()
}

$phoneStr = "+91 9505151527"
$emailStr = "charvikstaffingconsulrancy@gmail.com"

$phoneSize = $g.MeasureString($phoneStr, $fontContact)
$emailSize = $g.MeasureString($emailStr, $fontContact)

$iconR = 14
$gapItem = 50
$totalContactW = ($iconR * 2 + 10 + $phoneSize.Width) + $gapItem + 20 + $gapItem + ($iconR * 2 + 10 + $emailSize.Width)
$contactStartX = [int](($W - $totalContactW) / 2)

# Draw Phone
$curX = $contactStartX
Draw-PhoneCircle $g ($curX + $iconR) ($contactY + 12) $iconR
$curX += ($iconR * 2 + 10)
$g.DrawString($phoneStr, $fontContact, $navyBrush, $curX, $contactY)
$curX += $phoneSize.Width + $gapItem

# Draw Pipe separator
$g.DrawLine($thinPen, $curX, ($contactY + 3), $curX, ($contactY + 23))
$curX += $gapItem

# Draw Email
Draw-EmailCircle $g ($curX + $iconR) ($contactY + 12) $iconR
$curX += ($iconR * 2 + 10)
$g.DrawString($emailStr, $fontContact, $navyBrush, $curX, $contactY)

# 5. Address Rounded Pill at Bottom
$addrY = $contactY + 44
$fontAddr = New-Object System.Drawing.Font("Arial", 10.8, [System.Drawing.FontStyle]::Bold)
$addrStr = "NH65, opp. Bajaj Electronic, beside Kakinada Subbayya Gari Hotel, Agamaiah Nagar Colony, Bank Colony, L. B. Nagar, Vanasthalipuram, Hyderabad, Telangana"
$addrSize = $g.MeasureString($addrStr, $fontAddr)

$pillW = [int]($addrSize.Width + 50)
$pillH = 36
$pillX = [int](($W - $pillW) / 2)
$pillRect = New-Object System.Drawing.Rectangle($pillX, $addrY, $pillW, $pillH)
Draw-RoundedRectangle $g $thinPen $pillRect 18

# Location icon in pill
$pinX = $pillX + 18
$pinY = $addrY + 18
Draw-PinCircle $g $pinX $pinY 10

# Address text
$addrTextX = $pinX + 15
$g.DrawString($addrStr, $fontAddr, $navyBrush, $addrTextX, ($addrY + 9))

$g.Dispose()

# Save to all letterhead destinations
$bmp.Save("$PWD\client\public\charvik-letterhead-header.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("$PWD\client\public\charvik-exact-print-header.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("$PWD\client\public\letterhead-top.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save("$PWD\client\public\charvik-letterhead.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Save("$PWD\client\public\charvik-official-letterhead.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$bmp.Save("C:\Users\SANTHOSH\.gemini\antigravity\brain\ee88d1f0-b5e2-4b5a-b3da-08e50e2df9d3\letterhead-updated.png", [System.Drawing.Imaging.ImageFormat]::Png)

Write-Host "Updated official letterhead headers with exact address, phone & email!"
$bmp.Dispose()
$logo.Dispose()
