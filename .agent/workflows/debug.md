---
description: Debug workflow for UPSC Academia codebase
---

# Debug Workflow

This workflow performs comprehensive debugging checks on the UPSC Academia codebase.

## Step 1: HTML Validation

Check all HTML files for syntax errors and best practices:

```powershell
# List all HTML files
Get-ChildItem -Path . -Filter *.html -Recurse -Exclude node_modules,*.min.html | ForEach-Object { Write-Host "Checking: $($_.Name)" }
```

**Manual Check:**
- Verify all HTML files have proper `<!DOCTYPE html>` declarations
- Check for unclosed tags
- Ensure proper nesting of elements
- Verify all `id` attributes are unique within each page

## Step 2: CSS Syntax Validation

Check CSS files for syntax errors and redundancies:

```powershell
# Check CSS file size and line count
Get-ChildItem -Filter *.css | ForEach-Object { 
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    $size = [math]::Round($_.Length/1KB, 2)
    Write-Host "$($_.Name): $lines lines, $size KB"
}
```

**Manual Check:**
- Look for duplicate selectors in style.css
- Check for unused CSS rules
- Verify all custom properties are defined in :root
- Ensure media queries are consolidated

## Step 3: JavaScript Linting

Check JavaScript files for errors and code quality:

```powershell
# Check JavaScript file size
Get-ChildItem -Filter *.js | ForEach-Object {
    $lines = (Get-Content $_.FullName | Measure-Object -Line).Lines
    Write-Host "$($_.Name): $lines lines"
}
```

**Manual Check:**
- Search for console.log statements (production cleanup)
- Check for unused variables and functions
- Verify all event listeners are properly attached
- Ensure no global variable pollution

## Step 4: Console Error Detection

**Browser Testing Required:**
1. Open each HTML page in browser
2. Open Developer Tools (F12)
3. Check Console tab for errors
4. Check Network tab for failed requests
5. Check for 404 errors on resources

**Pages to test:**
- index.html
- enroll.html
- login.html
- view_notes.html

## Step 5: Link Validation

Check for broken internal links:

```powershell
# List all href and src attributes (manual inspection needed)
Select-String -Path *.html -Pattern 'href=|src=' | ForEach-Object { $_.Line.Trim() }
```

**Manual Check:**
- Verify all internal links point to existing files
- Check all image src paths are correct
- Ensure all script and CSS file paths are valid

## Step 6: Image Optimization Check

```powershell
# Check image file sizes
Get-ChildItem -Path img -File | ForEach-Object {
    $size = [math]::Round($_.Length/1KB, 2)
    Write-Host "$($_.Name): $size KB"
}
```

**Manual Check:**
- Images over 500KB should be optimized
- Verify all images have appropriate formats (JPG for photos, PNG for graphics, WebP for modern browsers)
- Check that images have proper alt attributes in HTML

## Step 7: Mobile Responsiveness Test

**Browser Testing Required:**
1. Open Developer Tools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on multiple device sizes:
   - Mobile (375px, 414px)
   - Tablet (768px, 1024px)
   - Desktop (1280px, 1920px)

**Check:**
- All text is readable
- Buttons are clickable (min 44x44px)
- No horizontal scrolling
- Images scale properly
- Navigation menu works on mobile

## Step 8: Performance Check

**Manual Check in Browser:**
1. Open Lighthouse in Chrome DevTools
2. Run audit for Performance, Accessibility, Best Practices, SEO
3. Address any issues with score below 90

**Common Issues:**
- Unoptimized images
- Render-blocking resources
- Unused CSS/JavaScript
- Missing compression

## Success Criteria

All steps should show:
- ✅ No HTML syntax errors
- ✅ No CSS syntax errors
- ✅ No JavaScript console errors
- ✅ All links working
- ✅ All images loading correctly
- ✅ Mobile responsive on all breakpoints
- ✅ Lighthouse scores > 85
