# DepthCrunch — Product Concept

> *The first cereal box that breaks the fourth wall.*

---

## Author & Tech Origin

This concept is built around a demo created by **Xiao Hai (@xiaowo1800)**, surfaced and explained by **Ulrich Buckenlei** (Digitalisation Strategist at VISORIC GmbH) on LinkedIn.

The demo achieves something remarkable with three off-the-shelf components:

| Layer | Technology | Role |
|---|---|---|
| Sensor | Standard webcam | Captures user head/face position in real time |
| AI | TensorFlow.js (in-browser) | Tracks face landmarks locally, no server needed |
| Render | Three.js | Adjusts 3D camera perspective to match user position |

The result: a flat screen becomes a **spatial window**. As you move your head, the scene responds with natural parallax — objects shift, depth reveals, foreground and background separate — as if the display were a pane of glass looking into a 3D room. No headset. No app. No specialized hardware.

---

## The Product: DepthCrunch

**Category:** Breakfast cereal
**Tagline:** *Look deeper.*
**Target:** Kids 6–14 + curious adults; parents who value screen-free-adjacent play

---

### The Core Idea

Every box of DepthCrunch has a **QR code** printed on the side panel. Scan it with any smartphone or tablet. The browser opens — no app download. Grant webcam access. The flat cereal box illustration you were just looking at is now **alive in 3D**.

The mascot (a cartoon bird named **Crux**) is no longer painted on cardboard. He stands inside a dimensional world visible through the box face. Tilt your head left — you see behind the tree he was standing next to. Lean forward — you fall into the scene. The kitchen table, the cereal bowl, the morning light all exist as real spatial geometry responding to your presence.

The technology running it is exactly Xiao Hai's stack: TensorFlow.js tracks your face position from the front camera, Three.js redraws the scene from the correct parallax angle — 60 times per second, entirely on-device, with zero cloud dependency.

---

## Box Design

```
┌──────────────────────────────┐
│  D E P T H C R U N C H      │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░  [CRUX illustrated in  ░  │
│  ░   layered 3D artwork]  ░  │
│  ░   depth cues: shadows  ░  │
│  ░   parallax layers      ░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                              │
│  ┌──────────────┐            │
│  │   [QR CODE]  │            │
│  │              │            │
│  └──────────────┘            │
│  Point your camera here      │
│  No app. Just your browser.  │
└──────────────────────────────┘
```

Side panel copy:

> Crux lives inside your box. He's been waiting.
> Scan the code. Give your camera access.
> Then lean in.

---

## How the Experience Works (Technical Flow)

```
User scans QR → Browser opens PWA → Requests camera permission
       ↓
TensorFlow.js loads face landmark model (runs fully on-device)
       ↓
Webcam stream → 468 facial landmarks detected per frame
       ↓
Eye midpoint extracted → azimuthal + polar angle computed
       ↓
Three.js camera position updated each frame
       ↓
Scene redraws from correct parallax angle → spatial illusion
```

No backend. No account. No data leaves the device. Works on any modern smartphone from 2019+.

---

## Product Line Expansion

Each cereal variant unlocks a different 3D world:

| SKU | Flavor | 3D World |
|---|---|---|
| DC-01 | Honey Oat | Crux's forest at sunrise |
| DC-02 | Cocoa Puffs-style | Underground cave with glowing crystals |
| DC-03 | Strawberry | Underwater reef scene |
| DC-04 | Limited Edition | Outer space — parallax star fields + asteroid belts |

Seasonal boxes could unlock holiday scenes. Collector editions could feature collaboration artists (the box as a gallery).

---

## Why This Works as a Product

**1. Zero friction onboarding**
The barrier to magic is scanning a QR. No parent needs to install anything. The browser does everything. This is the key insight from Xiao Hai's demo — browser-based AI removes distribution friction entirely.

**2. Differentiates on shelf immediately**
Cereal is a commodity. The QR + 3D experience gives the product a story that fits in one sentence and creates genuine shareability. A child showing a parent "the box is 3D" is the marketing.

**3. No recurring cost**
The experience is a static PWA. Hosting cost is negligible. Unlike AR apps that require SDK subscriptions or cloud rendering, the entire compute runs on the user's phone.

**4. Extends dwell time**
Average breakfast is 10–15 minutes. A spatial experience that rewards movement and exploration naturally extends attention. This is attention that currently goes to YouTube.

**5. Ethically sound**
All face tracking is on-device via TensorFlow.js. No biometric data is collected, transmitted, or stored. This is a selling point to privacy-conscious parents.

---

## Competitive Positioning

| | DepthCrunch | Snap AR packaging | Traditional AR apps |
|---|---|---|---|
| App install required | No | No | Yes |
| Works in browser | Yes | Yes | No |
| Headset required | No | No | No |
| On-device AI | Yes | Yes | Varies |
| 3D parallax (head tracking) | **Yes** | No | Rare |
| Data collection | None | Some | Often |

The differentiator is the **head tracking parallax** — no other packaging experience responds to your physical body position in real time. It's the difference between looking *at* a 3D image and looking *through* a spatial window.

---

## Go-to-Market

**Phase 1 — Direct-to-consumer online**
Sell via own site + Amazon. Content creators in food/tech/parenting niches are natural evangelists. The demo sells itself on video.

**Phase 2 — Grocery pilot**
Target specialty / health grocery chains (Whole Foods, Trader Joe's) where the design-conscious buyer notices QR codes and unusual packaging claims.

**Phase 3 — Licensing**
License the packaging format + browser experience generator to other CPG brands. DepthCrunch becomes both a product and a platform.

---

## Closest Technical Analogue: off-axis-sneaker

[icurtis1/off-axis-sneaker](https://github.com/icurtis1/off-axis-sneaker) is a real-time 3D sneaker viewer using the same head-coupled perspective technique — MediaPipe FaceMesh + Three.js + off-axis camera projection. It proves the concept works in a commercial context (retail product visualization) and adds two refinements worth adopting:

1. **Physical calibration wizard** — user measures screen dimensions + viewing distance once; stored locally to compute accurate real-world head position. Makes the parallax geometrically correct rather than just "close."
2. **Independent render loops** — MediaPipe and Three.js run decoupled, so face tracking latency never blocks frame rendering.

DepthCrunch can adopt both: the calibration prompt runs once on first scan and is stored in localStorage. The experience gets noticeably more accurate on repeat visits — a meaningful reason to scan again.

The sneaker use case (convert browsers to buyers) is also instructive. If this level of spatial fidelity is convincing enough for purchase decisions, it is more than compelling enough for breakfast table entertainment.

---

## Credits

- **Original demo:** Xiao Hai (@xiaowo1800)
- **Concept surfaced by:** Ulrich Buckenlei, VISORIC GmbH
- **Core tech:** TensorFlow.js / MediaPipe FaceMesh + Three.js + browser webcam API
- **Related prior art:** icurtis1/off-axis-sneaker, vivien000/trompeloeil, Shopify WonkaVision, Johnny Lee's 2007 Wii head tracking demo, Daniel Habib / True3D Labs

---

*The screen was never flat. We just weren't looking at it right.*
