# Art guide: drop-in drawings

Save PNG files (transparent backgrounds) into `www/art/` using the exact names below.
The game picks them up automatically. Anything you haven't drawn yet stays as the pixel sprite.

The `art-templates/` folder has guide images showing the canvas size and where things go.
Use them as a bottom layer in your art app, then hide them before exporting.

## Sizes

| Type | Canvas | Notes |
|---|---|---|
| Chibi (battles) | 512 × 512 | Feet near the bottom, centred. Weapon in their right hand (viewer's right). |
| Portrait / pfp | 512 × 512 | Head and shoulders. Shown in square and rounded frames. |
| Monster | 512 × 512 | Facing the viewer. |
| Lilia layers | 600 × 800 | Every layer exactly the same size, so they line up. |
| Hero layers | 512 × 512 | Every layer exactly the same size, so they line up. |

## Companions

`art/characters/<id>/chibi.png` and `art/characters/<id>/portrait.png`

IDs: `ryuu`, `mirelle`, `aurelia`, `kai`, `vex`, `lyra`, `pip`, `bram`, `tamsin`, `fenn`, `clover`

Example: `art/characters/mirelle/portrait.png`

## Monsters

`art/monsters/<id>.png`. Optional: `art/monsters/<id>_boss.png` for the crowned boss version. If there's no boss file, the boss uses the normal art.

IDs: `dummy`, `slime`, `shroom`, `bat`, `goblin`, `golem`, `wyvern`

## Lilia (PNGtuber layers)

All in `art/lilia/`, all 600 × 800:

| File | What's on it |
|---|---|
| `base.png` | Everything except eyes and mouth (hair, face, body, outfit) |
| `eyes_open.png` | Open eyes only |
| `eyes_closed.png` | Closed eyes only (she blinks every few seconds) |
| `mouth_closed.png` | Closed mouth only |
| `mouth_open.png` | Open mouth only (flaps while her text types out) |

Only `base.png` is required to switch her over. Add the others for blinking and talking.

## Hero (layered, colour-tinted)

The art layers match the character creator exactly, so every option a player can pick has a layer here.

Tinted layers are drawn in **greyscale**. The game tints them to the player's chosen colour:
- White becomes the full colour
- Greys become shades of it
- Black lines stay black

Layers marked "full colour" are drawn normally and never tinted.

Make two sets, one in `art/hero/chibi/` and one in `art/hero/portrait/`. Every layer is 512 × 512 so they line up.

| File | Tinted by | Notes |
|---|---|---|
| `skin.png` | skin colour | Head, neck, hands, legs. **Required** |
| `top_<top>.png` | top colour | **Required** for the top the player picked |
| `bottom_<bottom>.png` | bottom colour | **Required** for the bottom the player picked |
| `shoes_<bottom>.png` | full colour | The shoes that go with that bottom. Optional |
| `hair_front_<style>.png` | hair colour | Bangs and top of the head. **Required** |
| `hair_back_<style>.png` | hair colour | Hair behind the head (long hair, tails, buns). Optional |
| `eyes_<shape>.png` | eye colour | Irises only |
| `eyeline_<shape>.png` | full colour | Lashes, whites and highlights for that eye shape |
| `brows_<brows>.png` | hair colour | Eyebrows |
| `mouth_<mouth>.png` | full colour | Mouth |
| `extra_<extra>.png` | full colour | Blush, freckles, etc. (no file for "none") |
| `head_<headwear>.png` | see below | Headwear in front of the hair (no file for "none") |
| `head_back_<headwear>.png` | see below | Part of the headwear behind the head, e.g. the back of the hood. Optional |
| `weapon_<type>.png` | full colour | `sword`, `staff`, `dagger`, `mace`, `bow` |

**Option names** (the `<...>` part of each file name):

| Option | Names |
|---|---|
| Hair style | `short`, `long`, `ponytail`, `twintails`, `spiky`, `bob`, `braid`, `buns` |
| Eye shape | `round`, `sharp`, `sleepy`, `cat`, `sparkly` |
| Brows | `soft`, `angry`, `worried`, `thick` |
| Mouth | `smile`, `grin`, `neutral`, `fang` |
| Extras | `blush`, `freckles`, `mole`, `scar` |
| Top | `tunic`, `blouse`, `hoodie`, `robe`, `vest` |
| Bottom (shoes included) | `skirt` (boots), `longskirt` (slippers), `pants` (boots), `shorts` (sandals) |
| Headwear | `ribbon`, `witch`, `hood`, `cat` |

Headwear tints: `hood` uses the top colour, `cat` (cat ears) uses the hair colour, `ribbon` and `witch` are full colour.

Example: `art/hero/chibi/eyes_sparkly.png`

**Stacking order**, from back to front:
1. Headwear back
2. Back hair
3. Skin
4. Bottom
5. Shoes
6. Top
7. Face extra
8. Eyes (irises)
9. Eye lines
10. Mouth
11. Front hair
12. Brows (on top of the bangs, so expressions show)
13. Headwear
14. Weapon

The hero only switches to drawn art once all four **required** layers exist for that look. Until then it stays pixel. Anything optional that's missing is just skipped.

## Story characters (visual-novel scenes)

Waist-up portraits, roughly 512 × 768, on a transparent background. The bottom third sits behind the dialogue box. Until a file exists, the character uses a pixel placeholder.

| Character | Base file |
|---|---|
| Goddess Tidea | `art/story/tidea.png` |
| Old Barnaby | `art/story/barnaby.png` |
| Marigold | `art/story/marigold.png` |
| Lilia (optional) | Uses her guild art unless you add `lilia_sad.png` / `lilia_angry.png` |

**Faces:** the base file is the **happy** face. Add `art/story/<name>_sad.png` and `art/story/<name>_angry.png` for the other two. A missing face falls back to the base file.

Other feelings are shown with **emote icons** the game draws beside the head (anger vein, gloom lines, sweat drop, !, ?, sparkle, music note, …, heart, zzz), so no extra art is needed for them.

## Story backgrounds

`art/story/bg_<name>.png`: about 1080 × 1920 (portrait phone). The bottom third sits behind the dialogue box, so keep important details higher up. Until the art exists, each background uses a coloured placeholder.

| File | Scene |
|---|---|
| `bg_laundry.png` | Your laundry room (real world) |
| `bg_phone.png` | Tidea's glow through the phone screen |
| `bg_guild.png` | Adventurer's Guild hall |
| `bg_tavern.png` | The tavern |
| `bg_fields.png` | Slime Fields |
| `bg_town.png` | Town square |

## Testing your art

Drawn art doesn't show when you double-click `index.html`, because browsers block it for local files. Use one of these instead:
- Run `npx serve www` and open the link it prints (see README).
- Build the APK.

## Title screen
- `art/title.png`: optional key art behind the title screen logo (portrait, about 1080x1920). Until it exists, a purple glow background is used.
