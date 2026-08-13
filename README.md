# splitabroad

Split a restaurant bill with people who all pay differently, in a country where
none of you live. You photograph the receipt, say who had what, and everyone
gets their own way to pay you back — a QR code, a link to their own app, cash,
or tapping a card straight onto your phone.

Built for international students. Runs on **iPhone, Android and in a browser**
from a single codebase.

> **This is a demo build.** The bill splitting and the payment links are real.
> The receipt scan and the contactless tap are simulated, and no money moves
> anywhere. [What's real and what isn't](#whats-real-and-what-isnt) has the
> details.

---

## Opening it

There's nothing to install. Open the link you were given in Safari or Chrome on
your phone. To make it look and behave like an app, use **Share → Add to Home
Screen** — it then opens full-screen, without the browser bar.

Running it yourself is in [Running the demo](#running-the-demo) further down.

---

## The journey, screen by screen

```
   Launch                                        ┌─ tap the reader ──┐
     │                                           │                   │
     ▼                                           ▼                   │
  Start ──┬── Scan the receipt ──┐         Tap to pay ──────────► Success
          │                      │              ▲                    │
          ├── Type the items ────┼──► 1 Bill ──►│2 You ──► 3 Split ──►│4 Collect
          │                      │                                    ▲
          └── Just the total ────┘                                    └── QR / link / cash
```

### Launch

A single ÷ mark, breathing gently.

| You can | What happens |
| --- | --- |
| **Tap the mark** | It pulses, and the app opens. |

### Start — "How's the bill?"

Three ways to get the bill into the app. Pick whichever is easiest at the table.

| Button | What it's for | Goes to |
| --- | --- | --- |
| **🧾 Scan the receipt** | Fastest. Reads the individual lines off the paper bill. | Scan |
| **✏️ Type the items** | You enter each line yourself. Best when the receipt is unreadable. | Step 1 |
| **💶 Just the total** | One number. Quickest when nobody cares who had what. | Step 1 |

Choosing again later starts the bill over — the app won't mix a scanned receipt
with hand-typed lines.

### Scan (only if you chose "Scan the receipt")

A camera viewfinder with a sweeping scan line.

| Button | What happens |
| --- | --- |
| **Scan receipt** | "Analyzing receipt…" for about two seconds, then the lines appear. |
| **Rescan** | Throws the result away and points the camera again. |
| **Use these items →** | Accepts the lines and takes you to Step 1. |
| **Cancel ✕** (top right) | Backs out without scanning. |

### Step 1 — The bill

| Field / button | What it does |
| --- | --- |
| **Restaurant** | The name — it appears on every payment link people receive. |
| **Where are you?** | Opens a picker: choose a **region** first, then a **country**. The currency is set for you. There's a search box if you'd rather type. |
| **Total bill** | Only in "Just the total" mode. |
| **The item list** | Only in the item modes. Each row is a name and a price. |
| **+ Add item** | Adds an empty row. |
| **✕** next to a row | Removes that line. |
| **Rescan the receipt** | Only after a scan — runs the scan again. |
| **Next → Your details** | Greyed out until there's a restaurant name and a total above zero. |

The total adds itself up from the items — you never type it twice.

### Step 2 — You paid

Who is collecting, and how people can pay them back.

| Field / button | What it does |
| --- | --- |
| **Your name** | Shown to everyone as the person they owe. |
| **Revolut / PayPal / Wise / Venmo** | Your username or link for each. **Leave blank to skip an app** — only the ones you fill in are offered to anyone. |
| **Next → Split it** | Needs your name. The handles are all optional. |

Cash and Tap to Pay need no setup and are always available.

### Step 3 — Who owes what

A progress bar at the top tracks how much of the bill has been handed out. It
turns green when the shares add up exactly.

| Control | What it does |
| --- | --- |
| **Split by item / Enter amounts** | Only when there are line items. Switch between assigning lines and typing amounts directly. Switching keeps the numbers you were just looking at. |
| **The avatars under each line** | Tap a face to say that person shared that line. Tap again to remove them. A line with nobody on it is split by the whole table. |
| **Your card (marked "YOU PAID")** | Your own share, taken off the bill before anyone pays you. Nobody is asked for this. |
| **Each person's name and amount** | Editable. |
| **The payment chips** | How that person is paying: only the apps you set up in Step 2, plus Cash and Tap to pay. Each person needs one. |
| **✕** | Removes that person. |
| **+ Add person** | Adds another. |
| **÷ Split equally** | Divides the bill evenly across you and everyone else, to the cent. |
| **Collect →** | Needs everyone to have a payment method and the shares to add up. |

### Step 4 — Collect

**One person at a time fills the screen.** The QR stays big enough to actually
scan, and the person paying can tell at a glance that it's theirs.

| Control | What it does |
| --- | --- |
| **Swipe left / right** | Moves to the next or previous person. |
| **← →** arrows and the dots | The same thing, if swiping is awkward. A dot turns green once that person has settled. |
| **The QR code** | They scan it with their phone camera; it opens their app with the amount already filled in. |
| **tap to copy link** | Copies the payment link so you can send it in a message instead. |
| **open Revolut ↗** | Opens the app on *your* phone — handy for checking the link is right. |
| **Tap to pay →** | Only for people paying by card. Opens the contactless screen. |
| **mark as settled** | Ticks someone off by hand, e.g. once cash is in your hand. Tap again to undo. |
| **Start over** | Clears the bill and returns to the launch screen. |

The header counts what's in: `€64.24 / €101.25` and `settled 2/3`.

### Tap to pay

The contactless screen. Rings pulse outward while it waits for a card — **it
waits as long as you need, it doesn't run on a timer.**

| To complete the payment | How |
| --- | --- |
| **Tap the pulsing circle** | On your own phone. Always works. |
| **From a second phone** | The screen shows a four-character code. On the other phone open the same link with **/pay** on the end, type the code, and press *Hold to pay*. |
| **Cancel** | Backs out without charging. |

### Success

A wave ripples out across the screen, and the amount lands with a tick.

| Button | What happens |
| --- | --- |
| **Back to the bill** | Returns to Step 4, with that person marked settled. |

It also tells you who's left: *"2 people left · €64.25 still to collect"*.

### The hidden switch

**Long-press the logo** in the header for about a second, on any screen. It
flips between the **simulated reader** (the default, works everywhere) and the
**real hardware reader**. A banner confirms which, and an amber `NFC` badge sits
next to the wordmark while hardware mode is on.

This exists because Tap to Pay on iPhone can be blocked by region or Apple ID
restrictions, and a live pitch is the worst place to find that out. The app
always starts in simulated mode.

---

## What's real and what isn't

| | In this build |
| --- | --- |
| Splitting, item assignment, the arithmetic | **Real.** Shares always add up to the bill exactly — spare cents are handed out, never rounded away. |
| QR codes and payment links | **Real.** Genuine Revolut / PayPal / Wise / Venmo links with the right amount and reference. |
| Country and currency handling | **Real.** 50 countries, and currencies are formatted the way each country writes them. |
| Receipt scanning | **Simulated.** Always returns the same eleven-line sample receipt after two seconds. |
| The contactless tap | **Simulated.** See below. |
| Money moving | **Never.** There are no live payment keys anywhere in this build. |

### Why the tap is simulated

A web browser has no access to contactless payment. That isn't a shortcut in
this build — it's how phones work. Safari on iOS has no Web NFC at all, and on
Android the browser can only read NFC *tags*, never accept a card.

Real tap-to-pay needs a natively installed app. On iPhone it additionally needs
Apple's `com.apple.developer.proximity-reader.payment.acceptance` entitlement,
which Apple grants per account on request — a review measured in weeks.

**The Stripe Terminal integration is written and wired up** (see
[TECHNICAL.md](TECHNICAL.md)). What's missing is Apple's permission, not the
software. If it comes up in the room, that's the honest answer.

### QR is not the tap

The QR codes are the *alternative* payment route — Revolut, PayPal, Wise,
Venmo. They have nothing to do with the contactless tap, which is why the tap
screen shows a typed code rather than a QR. Two features, kept visibly separate.

---

## Running the demo

Both commands from the `splitabroad/` folder, each in its own terminal tab.

```bash
node server/index.mjs
```

```bash
cloudflared tunnel --url http://localhost:4242
```

The second prints a public `https://….trycloudflare.com` address — that's the
link to share. The Mac has to stay awake and online while the demo is running.

If you changed anything in the app, rebuild before starting the server:

```bash
npx expo export --platform web --output-dir dist --clear
```

Step-by-step handover notes, including what to do if something breaks mid-demo,
are in [HANDOVER.md](HANDOVER.md). How the code is put together is in
[TECHNICAL.md](TECHNICAL.md).

---

## Where the design came from

The interface follows a Figma prototype
([filter-clever-78342671.figma.site](https://filter-clever-78342671.figma.site)).
Colours, type, spacing, corner radii and the per-person colour ramp were read
off the published prototype and live in one file,
[`src/theme/tokens.ts`](src/theme/tokens.ts), so the whole app can be
re-skinned from a single place.
