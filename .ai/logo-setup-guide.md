# Logo Setup Guide for VOD Platforms

## Problem
The application references logo files in `/public/logos/` that don't exist, causing 404 errors:
- `/logos/hbo-max.png`
- `/logos/disney-plus.png`
- `/logos/amazon-prime.png`
- `/logos/apple-tv-plus.png`
- `/logos/hulu.png`

Only `/logos/netflix.png` currently exists.

## Solution Options

### Option 1: Official Brand Assets (Recommended for Production)

Download official logos from these sources:

1. **Disney+**
   - Source: https://press.disneyplus.com/about/disney-plus-logo-2024
   - Save as: `disney-plus.png`

2. **Amazon Prime Video**
   - Source: Amazon press kit or Wikipedia
   - Save as: `amazon-prime.png`

3. **HBO Max**
   - Source: Official press kit or StickPNG (personal use)
   - Note: Recently rebranded, ensure you have the latest version
   - Save as: `hbo-max.png`

4. **Hulu**
   - Source: Hulu press kit
   - Save as: `hulu.png`

5. **Apple TV+**
   - Source: Apple press kit
   - Save as: `apple-tv-plus.png`

**Important**: Check licensing terms for commercial use.

### Option 2: Placeholder Images (Quick Development Solution)

Use a simple colored rectangle with text overlay for each service until official logos are obtained.

**Implementation**: Use a CSS-based approach or data URIs in the database.

### Option 3: Third-Party Logo API

Use a service like:
- **Clearbit Logo API**: `https://logo.clearbit.com/{domain}`
- **Google S2 Favicons**: `https://www.google.com/s2/favicons?domain={domain}&sz=128`

Examples:
- Netflix: `https://logo.clearbit.com/netflix.com`
- Disney+: `https://logo.clearbit.com/disneyplus.com`
- Prime: `https://logo.clearbit.com/primevideo.com`
- HBO: `https://logo.clearbit.com/hbomax.com`
- Hulu: `https://logo.clearbit.com/hulu.com`
- Apple TV+: `https://logo.clearbit.com/tv.apple.com`

### Option 4: Simple SVG Placeholders

Create simple, non-infringing placeholder SVGs with service initials.

## Recommended Specifications

- **Format**: PNG with transparency
- **Size**: 256x256px or 512x512px (square)
- **Background**: Transparent
- **File size**: < 50KB each

## Installation Steps

1. Download/create logo files
2. Save them to `d:\_repozytoria\10x-project\public\logos\`
3. Ensure filenames match exactly:
   - `hbo-max.png`
   - `disney-plus.png`
   - `amazon-prime.png`
   - `apple-tv-plus.png`
   - `hulu.png`
4. Verify accessibility at `http://localhost:3000/logos/{filename}`

## Current Status

✅ netflix.png - EXISTS
❌ hbo-max.png - MISSING
❌ disney-plus.png - MISSING
❌ amazon-prime.png - MISSING
❌ apple-tv-plus.png - MISSING
❌ hulu.png - MISSING
