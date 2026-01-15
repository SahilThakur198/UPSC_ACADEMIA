---
description: SEO optimization workflow for UPSC Academia
---

# SEO Optimization Workflow

This workflow ensures all pages are optimized for search engines.

## Step 1: Meta Tags Verification

Check that all pages have essential meta tags:

**Required on ALL pages:**
- `<title>` (50-60 characters, unique per page)
- `<meta name="description">` (150-160 characters)
- `<meta name="viewport">`
- `<meta charset="UTF-8">`

**Pages to check:**
- index.html
- enroll.html
- login.html
- view_notes.html

```powershell
# Check for meta descriptions
Select-String -Path *.html -Pattern 'meta name="description"' | ForEach-Object { Write-Host "$($_.Filename): Found" }
```

## Step 2: Open Graph Tags Validation

Verify social media meta tags are present (Facebook, LinkedIn sharing):

**Required OG tags:**
- `og:title`
- `og:description`
- `og:image`
- `og:url`
- `og:type`

**Check:**
```powershell
# Search for Open Graph tags
Select-String -Path *.html -Pattern 'property="og:' | Select-Object Filename, Line
```

## Step 3: Twitter Card Validation

Verify Twitter Card tags for Twitter sharing:

**Required Twitter tags:**
- `twitter:card`
- `twitter:title`
- `twitter:description`
- `twitter:image`

## Step 4: Schema Markup Verification

Check structured data implementation:

**Existing Schema (from index.html):**
- ✅ Educational Organization schema
- ✅ Local Business schema
- ✅ FAQ schema
- ✅ Breadcrumb schema

**Verify:**
```powershell
# Search for JSON-LD structured data
Select-String -Path *.html -Pattern 'application/ld\+json'
```

**Test with:**
- Google Rich Results Test: https://search.google.com/test/rich-results

## Step 5: Image Alt Text Check

All images MUST have descriptive alt text for accessibility and SEO:

```powershell
# Find images without alt attributes
Select-String -Path *.html -Pattern '<img(?![^>]*alt)' -AllMatches
```

**Manual Check:**
- Verify all alt text is descriptive (not "image1.jpg")
- Alt text should describe the image content
- Decorative images can have empty alt=""

## Step 6: Heading Hierarchy Validation

Check proper H1-H6 structure:

**Rules:**
- Only ONE `<h1>` per page
- Don't skip heading levels (h1 → h2 → h3, not h1 → h3)
- Headings should be descriptive

```powershell
# Count H1 tags per file
Get-ChildItem -Filter *.html | ForEach-Object {
    $h1Count = (Select-String -Path $_ -Pattern '<h1' -AllMatches).Matches.Count
    Write-Host "$($_.Name): $h1Count H1 tags"
}
```

## Step 7: Mobile-Friendly Test

**Required:**
- Responsive design with proper viewport meta tag
- Text readable without zooming
- Tap targets at least 48x48 CSS pixels
- No horizontal scrolling

**Test with:**
- Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

## Step 8: Page Load Speed Analysis

**Target:**
- First Contentful Paint < 1.8s
- Largest Contentful Paint < 2.5s
- Total page load < 3s

**Optimization:**
- Compress images (WebP format)
- Minify CSS and JavaScript (for production)
- Enable browser caching
- Use CDN for external resources
- Lazy load images

```powershell
# Check total file sizes
$totalSize = (Get-ChildItem -File -Recurse -Exclude node_modules,*.git* | Measure-Object -Property Length -Sum).Sum / 1MB
Write-Host "Total project size: $([math]::Round($totalSize, 2)) MB"
```

## Step 9: Sitemap Validation

Check sitemap.xml exists and is valid:

```powershell
# Verify sitemap exists
Test-Path sitemap.xml
```

**Sitemap should include:**
- All public pages (index.html, enroll.html, view_notes.html)
- NOT login.html (usually excluded as it's behind auth)
- Correct URLs with full domain
- Last modification dates
- Priority and change frequency

**Test sitemap:**
- XML syntax validator
- Submit to Google Search Console

## Step 10: Robots.txt Validation

Check robots.txt exists and is configured correctly:

```powershell
# Verify robots.txt exists
Test-Path robots.txt
```

**Should contain:**
- Sitemap location
- Any directory restrictions
- User-agent directives

## Step 11: Canonical URLs

Ensure all pages have canonical link tags to avoid duplicate content:

```html
<link rel="canonical" href="https://upscacademia.com/page.html">
```

```powershell
# Check for canonical tags
Select-String -Path *.html -Pattern 'rel="canonical"'
```

## Step 12: Internal Linking Structure

**Best Practices:**
- Every page should be reachable within 3 clicks from homepage
- Use descriptive anchor text (not "click here")
- Ensure navigation is consistent across pages

## SEO Checklist

### index.html
- [ ] Unique, descriptive title tag
- [ ] Meta description (150-160 chars)
- [ ] OG tags complete
- [ ] Twitter card tags
- [ ] Schema markup (Organization, FAQ)
- [ ] One H1 tag only
- [ ] All images have alt text
- [ ] Canonical URL set
- [ ] Internal links use descriptive text

### enroll.html
- [ ] Unique title tag
- [ ] Meta description
- [ ] OG tags
- [ ] Canonical URL
- [ ] Heading hierarchy correct

### view_notes.html
- [ ] Unique title tag
- [ ] Meta description
- [ ] OG tags
- [ ] Canonical URL
- [ ] Heading hierarchy correct

### login.html
- [ ] Add `<meta name="robots" content="noindex, nofollow">` (private page)
- [ ] Unique title tag

### Global
- [ ] sitemap.xml valid and submitted
- [ ] robots.txt configured
- [ ] All images optimized
- [ ] Mobile-friendly test passed
- [ ] Page speed > 85 score

## Tools to Use

1. **Google Search Console** - Submit sitemap, check indexing
2. **Google PageSpeed Insights** - Test performance
3. **Google Mobile-Friendly Test** - Test responsiveness
4. **Google Rich Results Test** - Validate structured data
5. **Screaming Frog** - Crawl site for SEO issues (optional)

## Expected Results

After completing this workflow:
- ✅ All pages have proper meta tags
- ✅ Structured data validates without errors
- ✅ All images have descriptive alt text
- ✅ Mobile-friendly test passes
- ✅ Page speed score > 85
- ✅ Sitemap is valid and submitted
- ✅ No broken links
