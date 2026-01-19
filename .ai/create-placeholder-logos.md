# Quick Solution: Create Placeholder Logos

## Option A: Run the Migration (Recommended - Immediate Fix)

The migration `20260119120000_update_platform_logos_external.sql` will update the database to use external Clearbit Logo API URLs. This provides immediate working logos without downloading files.

**To apply:**
```bash
npx supabase db reset
```

Or if you have Supabase running locally:
```bash
npx supabase migration up
```

## Option B: Download Free Logos Manually

### Quick Sources (Free for Development/Testing)

1. **Visit these sites to download PNGs:**
   - https://www.stickpng.com/ (search for each service)
   - https://www.freepnglogos.com/ (search for each service)
   - https://worldvectorlogo.com/ (SVG format, can convert to PNG)

2. **Download Steps:**
   - Search for "Netflix logo transparent"
   - Search for "HBO Max logo transparent"
   - Search for "Disney Plus logo transparent"
   - Search for "Amazon Prime Video logo transparent"
   - Search for "Apple TV Plus logo transparent"
   - Search for "Hulu logo transparent"

3. **Save to:** `d:\_repozytoria\10x-project\public\logos\`

4. **Ensure exact filenames:**
   - `hbo-max.png`
   - `disney-plus.png`
   - `amazon-prime.png`
   - `apple-tv-plus.png`
   - `hulu.png`

## Option C: Create Simple Text-Based Placeholders

Use an online tool like:
- https://placeholder.com/
- https://via.placeholder.com/

Example URLs for 256x256 colored placeholders:
```
https://via.placeholder.com/256/E50914/FFFFFF?text=Netflix
https://via.placeholder.com/256/B9090B/FFFFFF?text=HBO+Max
https://via.placeholder.com/256/113CCF/FFFFFF?text=Disney%2B
https://via.placeholder.com/256/00A8E1/FFFFFF?text=Prime
https://via.placeholder.com/256/000000/FFFFFF?text=Apple+TV%2B
https://via.placeholder.com/256/1CE783/000000?text=Hulu
```

## Recommended Immediate Action

**Use the migration** - it's the fastest solution and requires no manual file downloads. The Clearbit Logo API provides decent quality logos automatically.

Run:
```powershell
npx supabase db reset
```

This will:
1. Apply all migrations including the new logo URL updates
2. Immediately fix all 404 errors
3. Display proper logos in the application

## Future Enhancement

Later, you can:
1. Download official brand assets
2. Save them to `/public/logos/`
3. Revert the logo URLs in the database to use local paths
