param(
    [string]$JsonFile,
    [string]$OutputPath
)

$code = @'
using System;
using System.IO;
using System.Text;

public class JsonHelper {
    public static string ReadUtf8(string path) {
        return File.ReadAllText(path, Encoding.UTF8);
    }
}
'@
Add-Type -TypeDefinition $code

$json = [JsonHelper]::ReadUtf8($JsonFile) | ConvertFrom-Json
$slides = $json.slides

$ppt = [System.Runtime.InteropServices.Marshal]::GetActiveObject('Kwpp.Application')
$pres = $ppt.ActivePresentation
if ($null -eq $pres) { $pres = $ppt.Presentations.Add() }

# Remove all existing slides
while ($pres.Slides.Count -gt 1) { $pres.Slides[$pres.Slides.Count].Delete() }

# Change first slide to blank
$pres.Slides[1].Layout = 12

# Add titles and content for first slide (special handling)
$s0 = $slides[0]
$shapes = $pres.Slides[1].Shapes

# Title
$tb = $shapes.AddTextbox(1, 60, 50, 840, 60)
$tb.TextFrame.TextRange.Text = $s0.title
$tb.TextFrame.TextRange.Font.Size = 36
$tb.TextFrame.TextRange.Font.Bold = $true
$tb.TextFrame.TextRange.Font.Color.RGB = 0x1A1A2E

# Content
$body = $s0.body -join "`r`n"
$tb2 = $shapes.AddTextbox(1, 60, 160, 840, 400)
$tb2.TextFrame.TextRange.Text = $body
$tb2.TextFrame.TextRange.Font.Size = 18
$tb2.TextFrame.TextRange.Font.Color.RGB = 0x333333

# Add slides 2-N and populate
for ($i = 1; $i -lt $slides.Count; $i++) {
    $idx = $pres.Slides.Count + 1
    $newSlide = $pres.Slides.Add($idx, 12)  # blank layout
    $s = $slides[$i]
    $shapes = $newSlide.Shapes

    # Title bar background
    $bar = $shapes.AddShape(1, 0, 0, 960, 90)
    $bar.Fill.ForeColor.RGB = 0x1A1A2E
    $bar.Line.Visible = $false

    # Title text
    $tb = $shapes.AddTextbox(1, 50, 18, 860, 55)
    $tb.TextFrame.TextRange.Text = $s.title
    $tb.TextFrame.TextRange.Font.Size = 28
    $tb.TextFrame.TextRange.Font.Bold = $true
    $tb.TextFrame.TextRange.Font.Color.RGB = 0xFFFFFF

    # Content
    $body = $s.body -join "`r`n"
    $tb2 = $shapes.AddTextbox(1, 50, 115, 860, 410)
    $tb2.TextFrame.TextRange.Text = $body
    $tb2.TextFrame.TextRange.Font.Size = 16
    $tb2.TextFrame.TextRange.Font.Color.RGB = 0x333333
    $tb2.TextFrame.TextRange.ParagraphFormat.SpaceAfter = 6
}

$pres.SaveAs($OutputPath)
Write-Output '{"success":true}'
