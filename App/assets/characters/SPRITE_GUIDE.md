# Getting Character Sprites for Your Game

Since you want a character that looks like Rumi from K Pop Demon Huntrix but aren't great at drawing, here are the **easiest options**:

## Option 1: AI-Generated Sprite Sheets (Easiest! ⭐)

1. **Pixelcut** (https://www.pixelcut.ai/create/running-animation-sprite-sheet-generator)
   - Upload a reference image of Rumi (or describe her)
   - It generates a running animation sprite sheet automatically
   - Free to use

2. **Other AI Tools:**
   - Use DALL-E, Midjourney, or Stable Diffusion to generate character images
   - Then use a tool like "Sprite Sheet Generator" to combine frames

## Option 2: Free Sprite Assets

1. **OpenGameArt.org** - Search for "character running" or "anime girl running"
   - Many free sprite sheets available
   - Look for ones with 4-8 frames for smooth animation

2. **itch.io** - Search "free sprite sheets" or "character sprites"
   - Lots of free assets, some inspired by anime/K-pop style

3. **Kenney.nl** - Free game assets (more generic but professional)

## Option 3: Simple Pixel Art Tools

If you want to try making your own (even if simple):

1. **Piskel** (https://www.piskelapp.com/) - Free online pixel art editor
   - Has animation support built-in
   - Easy to use, even for beginners
   - Export as sprite sheet

2. **Aseprite** - Professional pixel art tool (paid, but worth it)
   - Great for animations
   - Has a free trial

## Sprite Sheet Requirements

Once you have your sprite sheet:

1. **Format:** PNG file with transparent background
2. **Layout:** Horizontal strip of frames (all frames in one row)
3. **Frame Size:** Each frame should be 48x48 pixels (or 64x64 if you prefer)
4. **Number of Frames:** 4-8 frames work well for running animation
5. **Naming:** Save as `hero-run.png` in the `assets/characters/` folder

### Example Sprite Sheet Layout:
```
[Frame 1][Frame 2][Frame 3][Frame 4]
  48px     48px     48px     48px
```

Total image width = 48 × number of frames
Total image height = 48

## How to Use Your Sprite Sheet

1. Place your `hero-run.png` file in `assets/characters/`
2. Open `src/scenes/MainScene.ts`
3. In the `preload()` method, uncomment and update this line:
   ```ts
   this.load.spritesheet('heroRun', 'assets/characters/hero-run.png', {
     frameWidth: 48,  // Change to match your frame width
     frameHeight: 48  // Change to match your frame height
   });
   ```
4. The code is already set up to use it! Just restart your dev server.

## Tips for Rumi-Inspired Character

- Look for sprites with: long hair, modern clothing, energetic pose
- Anime-style sprites work well for K-pop inspired characters
- Pink/purple color schemes match the K-pop aesthetic
- If you find a sprite you like but it's the wrong color, you can recolor it in Piskel or similar tools

Good luck! 🎮✨

