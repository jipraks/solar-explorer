# 🪐 Solar Explorer

An interactive 3D solar-system simulation built for education — orbit it, zoom into it, tap any planet for the full story, or take the controls and fly there yourself. Bilingual (Indonesian / English). The whole app is one generated HTML file; the only other files are what a PWA needs to be installable.

![Main view](docs/screenshots/desktop-overview.jpg)

---

## ✨ Features

| | |
|---|---|
| 🌍 **10 celestial bodies** | The Sun, all 8 planets, and Pluto, wrapped in NASA photo textures |
| 🌙 **12 major moons** | The Moon, Io, Europa, Ganymede, Callisto, Titan, Enceladus, Triton, Titania, Charon, Phobos, Deimos |
| 💍 **Rings** | Saturn and Uranus, at their true axial tilts |
| ☄️ **Asteroid belt** | ~2,200 rocks with differential rotation following Kepler's Third Law |
| 🔭 **Real orbits** | Ellipses with true eccentricity & inclination, solved through Kepler's equation — planets genuinely slow down at aphelion |
| 🌗 **Rotation & tilt** | True rotation periods and axial tilts; Venus and Uranus spin retrograde |
| ⏱️ **Time control** | 0.01 – 600 days/second, with a pause button |
| 🔊 **Read aloud** | Every info panel can be narrated out loud in either language, highlighting each paragraph as it is read — for children who are not fluent readers yet |
| 🚀 **Pilot mode** | Take the controls: a thrust lever, a steering stick, and a talking ship computer. Fly to any planet and open its data on arrival |
| 🎚️ **Synthesised engine** | The engine roar is generated in the browser — no audio files — and swells with the thrust lever, ducking whenever the ship computer speaks |
| 🌐 **Bilingual** | The language is chosen on first launch (and remembered), and the ID/EN buttons switch the entire interface *and* all content at any time |
| 📄 **In-app credits** | A credits button in the top bar lists every data and texture source, with links |
| ⛶ **Full screen** | One button (or `F`) in the top bar and in the cockpit |
| ☀️ **Screen stays awake** | A tablet will not lock itself mid-orbit; the lock is dropped whenever the app is not on screen |
| 📲 **Installable** | A real PWA: install it to the home screen and it opens without a browser, and without a network |
| 📱 **Mobile-first** | The info panel becomes a bottom sheet, touch targets are enlarged, and the camera reframes itself automatically |

### Educational content

Every celestial body comes with:

- a short, kid-friendly description,
- a data table (diameter, distance, orbital & rotation period, moon count, gravity, temperature, orbital speed),
- a visual comparison against Earth,
- three fun facts,
- and a full explanation that expands for adult readers.

All of it is available completely in both Indonesian and English.

### Read-aloud narration

The **Bacakan / Read aloud** button in the info panel speaks the body's name, its short
description, and its three fun facts, highlighting each block as it goes. The long "full
explanation" is written for adults and is deliberately left out.

It uses the browser's built-in [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API),
so there is no extra dependency, no API key, and no audio to download — it keeps working
offline once the device has a voice installed. The narration stops by itself when the panel is
closed, another body is selected, the language is switched, or the tab is hidden.

Voice quality is the device's, not the app's. Android, iOS, Windows and macOS all ship an
Indonesian voice; some desktop Linux browsers do not, and in that case the panel says so
instead of reading Indonesian text with an English voice and pretending it worked. The button
is hidden entirely on browsers without the API.

### Pilot mode

The rocket button in the top bar hands the controls over: the camera becomes a ship
with a thrust lever, a steering stick, and a cockpit readout of speed, nearest body
and distance. Fly to a planet and an **Open data** button appears, which drops you
back onto the map with that planet's info panel open — narration included.

There is no second scene. `OrbitControls` is switched off and the camera is driven
directly, so pilot mode inherits the same planets, orbits and asteroid belt the map
already simulates.

Some deliberate choices:

- **The flight model is arcade, not Newtonian.** The ship goes where its nose points,
  with enough inertia to feel heavy, and it quietly rolls itself level. Real orbital
  drift would leave a child tumbling and lost inside ten seconds.
- **Time slows down while flying.** At the map's default 10 days/second Mercury races
  along its orbit at ~26 units/second, faster than the ship's top speed — a child
  could chase it forever and never catch it. Pilot mode clamps time to 0.8 days/second
  and restores your setting on exit.
- **You cannot fly through anything.** Getting inside a body pushes the ship back out
  and bounces it clear; the Sun warns you off before you get there.
- **Hit a world hard enough and the ship blows up** — see below.
- **The readouts are real.** Speed and distance are recovered by inverting the map's
  own distance compression, which is also why the ship reads as travelling hundreds of
  times the speed of light. Rather than hide that, the help sheet names it: a warp
  drive like that only exists in stories.

The ship computer speaks its callouts — engine start, full thrust, approaching a
planet, arrival, and the Sun warning — through the same Web Speech API as the panel
narration, in whichever language is selected, and can be muted from the cockpit.

### Crashing

Touching a planet gently just bumps and bounces, as before. Coming in above 5.5 units
per second — roughly half thrust — destroys the ship: a 220-particle burst at the point
of impact, a full-screen flash, a camera shake, a low boom, and a red canopy with
**Kapal hancur / Ship destroyed** across it. The Sun is fatal at any speed, because it
is the Sun.

That difference is the whole lesson: ease off the thrust before you arrive. Losing the
ship costs a child about two seconds and nothing else — a spare appears automatically,
standing off the world it hit and already pointed at it, and the computer says so.

Details that matter more than they sound:

- **The controls go dead during those two seconds**, and a lever that was being held
  when the ship blew up stays inert until it is released. Otherwise a finger resting on
  full thrust would launch the spare ship straight back into the planet.
- **Debris is left behind in space** rather than following the planet, and it keeps
  flying — and clears itself — even if you leave the cockpit mid-explosion.
- **The engine falls silent** while the ship is wreckage.

### The cockpit cabin

Pilot mode is framed as an interior, not a border: a lit ceiling beam, two angled side
pillars carrying instrument banks and a vent grille, a dashboard with button banks and
two glowing screens, and mullions splitting the glass into three panes. It all turns red
when the ship is wrecked.

Every part of it is CSS — the hull is a single enormous spread shadow around the window
rectangle, so it fits any screen shape with no artwork — and the instrument banks are
generated in `app.js` from a seeded sequence, so the layout is identical on every load
without a few hundred lines of markup. The lamps blink on staggered timers.

The frame sizes live in CSS variables (`--ckTop`, `--ckSide`, `--ckBot`) so the window,
the media queries and the tests all read from one set of numbers. The window keeps about
60% of the screen on a desktop. A phone gets a slimmer cabin: no mullions and no pillar
instruments, because splitting a small window into three panes throws away most of the
view and a 34px pillar is too narrow to carry anything legible.

### Engine sound

Synthesised with the Web Audio API rather than shipped as audio files, so it stays a
single generated HTML file with nothing to download. Three layers: looping brown noise
through a lowpass for the roar, three detuned sawtooths for the mechanical hum (the
detuning is what stops it sounding like a keyboard note), and a sine near 40 Hz for
weight. The thrust lever drives volume, filter cutoff and pitch at once — moving all
three together is what makes the ear believe the engine is working. Passing a planet
gets a whoosh, a collision a thud, and the Sun a two-tone alarm.

The engine ducks to a quarter of its volume whenever the ship computer speaks,
otherwise a child hears the roar and none of the words. It has its own mute button,
separate from the voice — a classroom usually wants the narration without the engine —
and that choice is remembered. Muted, no `AudioContext` is created at all.

Audio only ever starts from the button press that enters pilot mode, because browsers
allow it no other way, and it is suspended on exit and in a hidden tab.

> On iPhone, Web Audio follows the physical silent switch in some conditions, so the
> engine can be inaudible with the phone silenced even though everything is working.
> That is iOS behaviour, not something the page can override.

Controls: drag or arrows/WASD to steer, the lever or the mouse wheel for thrust,
space to brake, Escape to leave.

---

## 📲 Install it

The app is a PWA. On Android and desktop Chrome an **install** button appears in the
top bar when the browser offers it; on iPhone and iPad, Safari installs through
*Share → Add to Home Screen*. Installed, it opens in its own window with no browser
chrome around it.

A service worker caches the app shell **and** the Three.js module and planet textures
from the CDN, so after one online visit it starts and runs with no network at all —
which is the difference between a museum kiosk that works and one that shows an error.
Page loads are network-first, so a redeploy is picked up on the next online visit
rather than being pinned to whatever was cached first.

Files involved: `manifest.webmanifest`, `sw.js`, `icons/`. The icons are generated
rather than hand-drawn — see `tools/make-icons.mjs`.

### Keeping the screen awake

A tablet locking itself while a child is watching the planets go round is the most
annoying thing this app can do, so it holds a
[screen wake lock](https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API)
for as long as the page is visible.

The browser releases the lock by itself the moment the page is hidden — which is what
keeps this from flattening a battery in someone's bag — so it is taken again on the way
back. Chromium grants it on load; Safari (16.4+) refuses until the page has been
interacted with, so the request is retried on the first touch or key. Browsers without
the API simply go without, and nothing else changes.

There is no button for it. It is on whenever the app is.

---

## 🚀 Getting started

Open `index.html` in any browser. No build step, no dependencies to install.

```bash
git clone https://github.com/YOUR-USERNAME/solar-explorer.git
cd solar-explorer
python3 -m http.server 8000
# open http://localhost:8000
```

> **An internet connection is required** to pull Three.js and the planet textures from a CDN.
> If they fail to load, the page shows a clear message instead of a loading screen that spins forever.

### GitHub Pages

This repo deploys as-is. Go to **Settings → Pages → Source: Deploy from a branch → `main` / `(root)`**, and the site goes live at `https://YOUR-USERNAME.github.io/solar-explorer/`.

**If you forked this repo, delete the `CNAME` file in the root first** — it carries the original author's custom domain and will hijack your deployment.

Want your own domain? Put it in `CNAME` (or set it under **Settings → Pages → Custom domain**) and add a `CNAME` DNS record pointing at `YOUR-USERNAME.github.io`. If your DNS sits behind a proxy — Cloudflare's orange cloud, for instance — leave the record unproxied until GitHub has issued the certificate, otherwise **Enforce HTTPS** never becomes available and the site can fail with an SSL error.

---

## 🖼️ Screenshots

| Earth & the Moon | Saturn |
|---|---|
| ![Earth](docs/screenshots/desktop-earth.jpg) | ![Saturn](docs/screenshots/desktop-saturn.jpg) |

| Top view | Mobile |
|---|---|
| ![Top view](docs/screenshots/desktop-top.jpg) | ![Mobile](docs/screenshots/mobile-overview.jpg) |

---

## 🛠️ Development

The source is split across three files in `src/`, then inlined into a single `index.html`:

```
src/index.template.html   HTML + CSS + UI structure
src/data.js               astronomical data & all bilingual copy
src/app.js                Three.js scene, camera, interaction, UI logic
```

```bash
python3 build.py           # bundle src/ → index.html
python3 build.py --check   # verify index.html is in sync with src/
```

Always edit the files in `src/`, then run `build.py`. Never edit `index.html` directly — it is generated.

### Adding a new celestial body

Add one object to the `BODIES` array in `src/data.js`. Display radius, orbital distance, and camera framing are all derived automatically from `radiusKm` and `dist` (in AU).

### A note on scale

Distances and sizes are deliberately **compressed** so that every planet fits on one screen:

```
display radius   = 1.40 × (R / R_earth) ^ 0.42
display distance = 18 + 30 × (AU ^ 0.55)
```

At true scale, Earth would be a single pixel and Neptune would sit a hundred screens away. The compression is explained inside the app (the "How to explore" guide and a note in every info panel) so it never becomes a misconception.

What is **not** compressed: orbital eccentricity, inclination, axial tilt, orbital period, and rotation period — those all use real figures.

---

## 📊 Data sources

- Planet figures: [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- Moon counts: [IAU Minor Planet Center](https://www.iau.org/) (March 2026 — Jupiter 101, Saturn 285)
- Planet textures: [threex.planets](https://github.com/jeromeetienne/threex.planets) by Jerome Etienne (MIT), assembled from NASA imagery and [Planet Pixel Emporium](https://planetpixelemporium.com/) by James Hastings-Trew
- 3D engine: [Three.js](https://threejs.org/) r180

Moon counts keep rising as new discoveries are confirmed — the app notes this in the panel of every planet with a large moon count.

The same list is available inside the app through the credits button (document icon) in the top bar; its contents live in the `CREDITS` array in `src/data.js`.

---

## 📄 License

Code: [MIT](LICENSE).

Planet textures are loaded at runtime from third-party repositories and remain subject to their own licences; they are not bundled in this repo.
