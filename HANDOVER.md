# splitabroad — demo handover

Everything runs in a phone browser. Nothing to install on any device.

---

## 1. Start it (on the Mac, ~30 seconds)

Two commands, each in its own terminal tab, both from `splitabroad/`:

```bash
node server/index.mjs
```

```bash
cloudflared tunnel --url http://localhost:4242
```

The second one prints a public HTTPS address like
`https://something-random.trycloudflare.com`. **That link is the demo.** Open it
in Safari on the iPhone.

If `dist/` is missing or you changed any code, rebuild first:

```bash
npx expo export --platform web --output-dir dist --clear
```

> The Mac has to stay awake and online for the whole demo — the link points at
> it. Plug it in and turn off sleep.

### Same-wifi alternative (no tunnel)

If both phones are on the same network as the Mac, skip cloudflared and use
`http://<mac-ip>:4242` — find the address with `ipconfig getifaddr en0`. Faster,
but many venue and conference wifis isolate clients from each other, so the
tunnel is the safer bet in a room you don't control.

---

## 2. Share it

Send the `trycloudflare.com` link by message or email. Anyone who opens it gets
the app; no login, no install, no app store.

**Add it to the home screen** for a cleaner demo — in Safari: Share → *Add to
Home Screen*. It then opens without the browser address bar and looks like a
real app on the slide.

> The link is public to anyone who has it, and it's a fresh random address each
> time you start the tunnel. Nothing is stored server-side except the live
> payment codes, which are in memory and vanish when you stop the server.

---

## 3. The demo, step by step

1. Open the link. Optionally long-press the logo once to confirm the banner says
   **simulated reader** — that's the default and the one you want.
2. **Scan the bill** → wait ~2s → 11 line items appear → *Use these items*.
3. Type your name and one payment handle (Revolut is quickest).
4. Step 2: name the people, hit **÷ Split equally**, and give each a different
   payment method. Make at least one of them **Tap to pay**.
5. Step 3: the QR codes are real, working payment links. The Tap to Pay card is
   the finale.
6. **Tap to pay →**. The reader wakes and then *waits* — it does not run on a
   timer, so take as long as you like talking over it.

### Completing the payment

The screen stays on "Hold card or phone near the top of this device" until one
of these happens:

- **You tap the pulsing reader circle** on your own phone. Discreet, reads to
  the audience as the card being detected. This always works.
- **A second phone triggers it.** The screen shows a 4-character code. On the
  other phone open `<link>/pay`, type the code, and press *Hold to pay*. Your
  screen moves to Authorising → success → confetti.

Do a dry run of whichever one you plan to use before you're on stage.

---

## What is and isn't real

| | Status in this demo |
| --- | --- |
| Bill splitting, item assignment, the maths | **Real.** Shares always add up to the bill to the cent. |
| QR codes and payment links | **Real** Revolut / PayPal / Wise / Venmo deep links with the right amount. |
| Receipt scanning | **Simulated.** Always returns the same 11-line sample receipt after 2s. |
| Contactless tap | **Simulated.** See below. |
| Money moving | **Never.** No live keys anywhere in this build. |

### Why the tap is simulated

A browser has no access to contactless payment — that isn't a limitation of this
build, it's how phones work. Safari on iOS has no Web NFC at all, and even on
Android, Web NFC only reads NFC *tags*; it cannot accept a card.

Real tap-to-pay needs a natively installed app, and on iPhone it additionally
needs Apple's `com.apple.developer.proximity-reader.payment.acceptance`
entitlement, which Apple grants per-account on request — a review process
measured in weeks, not minutes. The code for it is already written and wired up
(`src/payments/HardwareBridge.tsx`); it's the signing and the entitlement that
aren't there.

**If asked in the room:** the honest line is that the contactless leg is
simulated for this demo, the payment SDK integration is built, and the blocker
is Apple's entitlement rather than the software.

### Note on the QR code

The QR codes are the *alternative* payment rail — Revolut, PayPal, Wise, Venmo.
They have nothing to do with the contactless tap, which is why the tap screen
deliberately shows a short typed code rather than a QR. Keeping them visually
separate is what makes the two features legible as two features.

---

## If something breaks mid-demo

| Symptom | Fix |
| --- | --- |
| Link doesn't load on the phone | Check the cloudflared terminal is still running; restart it and re-send the new link. |
| Second phone can't find the code | The code resets whenever you leave the tap screen. Go back in and read the new one. Or just tap the reader circle. |
| Tap screen seems stuck | It's meant to wait. Tap the pulsing circle. |
| Everything looks wrong | Reload the page. The bill resets, so re-enter it — takes about 20 seconds via *Scan the bill*. |

Keep a screen recording of a successful run on your phone as a last resort.

---

## Picking it up later

Real contactless, on a real device, needs:

1. An Apple Developer Program account, and the Tap to Pay entitlement requested
   at <https://developer.apple.com/contact/request/tap-to-pay-on-iphone/>.
2. `eas build --profile development --platform ios` — builds in the cloud, no
   Xcode needed locally. (This Mac can't install current Xcode anyway: it wants
   macOS 26, and the machine is on 15.7.9.)
3. `STRIPE_SECRET_KEY=sk_test_… node server/index.mjs` plus
   `EXPO_PUBLIC_TERMINAL_BACKEND_URL` pointing at it, so Terminal can mint
   connection tokens.
4. Long-press the logo in the app to switch to **hardware** mode.

Android is a shorter path if it comes up — a sideloadable APK from
`eas build --profile preview --platform android`, and no per-app entitlement to
wait on.

Full detail in [README.md](README.md).
