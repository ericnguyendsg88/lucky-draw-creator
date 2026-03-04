

## Plan: Image Compression + Upload Integration

### 1. Add `compressImage()` utility (`src/lib/drawConfig.ts`)
- New async function that loads a data URL into a canvas, resizes to max 1920px width (maintaining aspect ratio), and re-encodes as JPEG at 75% quality
- Returns a smaller base64 data URL (typically 200-400 KB vs 4+ MB)

### 2. Compress before saving in `src/components/OnboardingWizard.tsx`
- In the `processFile` function for background images, call `compressImage()` on the result before passing to `saveBgImage()`
- Wrap `saveBgImage` in try/catch to show a toast on failure instead of crashing

### 3. Compress before saving in `src/App.tsx`
- Same treatment for the background upload handler in the main app
- Wrap in try/catch with user-friendly error toast

### Files
- `src/lib/drawConfig.ts` — add `compressImage(dataUrl, maxWidth?, quality?): Promise<string>`
- `src/components/OnboardingWizard.tsx` — compress in `processFile`, try/catch on save
- `src/App.tsx` — compress in upload handler, try/catch on save

