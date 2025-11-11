# Custom Asset Guide

This project ships with simple colour blocks so you can start playing right away. Swap in your own artwork and sounds by following the steps below.

## Folder layout

- `assets/characters/` – PNG sprites for the hero, demons, bosses, etc.
- `assets/audio/` – MP3 or WAV files for slashes, demon sounds, background music.

Feel free to add more folders (for example `backgrounds/` or `ui/`) if that is easier to organise. Just remember to update the file paths in `src/scenes/MainScene.ts`.

## Adding sprites

1. Place your image inside `assets/characters/`. Keep the filename simple, e.g. `hero.png` or `demon.png`.
2. Open `src/scenes/MainScene.ts`.
3. In the `preload()` method, replace the placeholder texture calls with:

   ```ts
   this.load.image('heroSprite', 'assets/characters/hero.png');
   this.load.image('demonSprite', 'assets/characters/demon.png');
   ```

4. Update `spawnHero` and `spawnDemon` to use `'heroSprite'` and `'demonSprite'` instead of the placeholder square keys.

Tip: If you need to resize a sprite, try keeping the hero around 64×64 pixels so collision circles stay tidy.

## Adding audio

1. Drop your sound files into `assets/audio/`.
2. In `preload()`, add lines like:

   ```ts
   this.load.audio('slash-sfx', 'assets/audio/slash.mp3');
   this.load.audio('demon-pop', 'assets/audio/demon-pop.wav');
   ```

3. The game already checks for these keys before playing them, so once the files are loaded the sound effects will just work.

## Hot tips for young designers

- Keep backup copies of your favourite art in case you want to try alternate versions.
- Short looping music tracks (30–60 seconds) work great for background ambience.
- If you are unsure which file name to use, look for the matching `this.load.*` line in the code—your new files should use the same path.

