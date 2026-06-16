# Batch PPT Generator - reads slides data from JSON, generates PPT via WPS COM
param(
    [string]$DataFile = $PSScriptRoot + "\slides-data.json",
    [string]$OutputPath = "C:\Users\LV\Desktop\DevPilot_Generated.pptx"
)

$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Read JSON data file (UTF-8)
$jsonContent = Get-Content -Path $DataFile -Encoding UTF8 -Raw
$data = $jsonContent | ConvertFrom-Json
$slidesData = $data.slides

# Get WPS PPT COM object
function Get-WpsPpt {
    try { return [System.Runtime.InteropServices.Marshal]::GetActiveObject('Kwpp.Application') }
    catch { return $null }
}

$ppt = Get-WpsPpt
if ($null -eq $ppt) {
    Write-Output '{"success":false,"error":"WPS PPT not running"}'
    exit 1
}

try {
    # Get active presentation or create new
    $pres = $ppt.ActivePresentation
    if ($null -eq $pres) {
        $pres = $ppt.Presentations.Add()
    }

    $targetCount = $slidesData.Count
    $currentCount = $pres.Slides.Count

    # Add missing slides (ppLayoutText = 1)
    for ($i = $currentCount; $i -lt $targetCount; $i++) {
        $pres.Slides.Add($i + 1, 1)
    }
    # Remove extra slides from end
    for ($i = $currentCount; $i -gt $targetCount; $i--) {
        $pres.Slides[$i].Delete()
    }

    # Populate each slide
    for ($i = 0; $i -lt $slidesData.Count; $i++) {
        $slideData = $slidesData[$i]
        $slide = $pres.Slides[$i + 1]
        $title = $slideData.title
        $bodyLines = $slideData.body

        # Set title
        try {
            $slide.Shapes.Title.TextFrame.TextRange.Text = $title
            $slide.Shapes.Title.TextFrame.TextRange.Font.Size = 32
            $slide.Shapes.Title.TextFrame.TextRange.Font.Bold = $true
        } catch {
            try {
                $tb = $slide.Shapes.AddTextbox(1, 50, 30, 860, 50)
                $tb.TextFrame.TextRange.Text = $title
                $tb.TextFrame.TextRange.Font.Size = 32
                $tb.TextFrame.TextRange.Font.Bold = $true
            } catch {}
        }

        # Set body content
        $bodyText = $bodyLines -join "`r`n"
        $contentShape = $null
        try {
            foreach ($sh in $slide.Shapes) {
                if ($sh.Type -eq 14) {
                    try {
                        $phType = $sh.PlaceholderFormat.Type
                        if ($phType -eq 2 -or $phType -eq 7) {
                            $contentShape = $sh
                            break
                        }
                    } catch {}
                }
            }
        } catch {}

        try {
            if ($null -ne $contentShape) {
                $contentShape.TextFrame.TextRange.Text = $bodyText
                $contentShape.TextFrame.TextRange.Font.Size = 16
                $contentShape.TextFrame.TextRange.ParagraphFormat.SpaceAfter = 6
            } else {
                $tb = $slide.Shapes.AddTextbox(1, 50, 100, 860, 420)
                $tb.TextFrame.TextRange.Text = $bodyText
                $tb.TextFrame.TextRange.Font.Size = 16
            }
        } catch {}
    }

    # Save
    $pres.SaveAs($OutputPath)
    Write-Output '{"success":true,"path":"'"$($OutputPath -replace '\\','\\')"'","slides":'"$targetCount"'}'
} catch {
    $msg = $_.Exception.Message
    Write-Output '{"success":false,"error":"'"$msg"'"}'
}
