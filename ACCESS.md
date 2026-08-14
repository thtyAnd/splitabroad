# Reaching the demo

The app lives on the Kamatera box at **103.240.147.64** and starts itself on
boot. There is nothing to launch, nothing to keep awake, and no laptop in the
chain any more — open a link and it's there.

## The links

| | |
| --- | --- |
| **Demo** | <https://103-240-147-64.eu-ml-cloud-xip.com> |
| **Backup name** | <https://103-240-147-64.sslip.io> |
| **Second backup** | <https://103-240-147-64.nip.io> |
| **Payer's phone** | <https://103-240-147-64.eu-ml-cloud-xip.com/pay> |
| **Is it alive?** | <https://103-240-147-64.eu-ml-cloud-xip.com/health> |
| **Last resort** | <http://103.240.147.64> (plain http, no certificate) |

All three names point at the same server and all have real certificates. Three exist
because ad blockers and filtered corporate DNS sometimes block wildcard-DNS
domains like `sslip.io`, `nip.io` and `…-xip.com` — and the lists disagree about
which. If
a phone shows a blank page on one, the other usually loads. A domain of your own
removes the problem entirely; see the last section.

## Put it on the phone's home screen

This is the shortcut worth making — it opens without the browser address bar and
looks like an installed app on stage.

**iPhone (Safari):** open the link → Share button (□↑) → *Add to Home Screen* →
name it `splitabroad` → *Add*.

**Android (Chrome):** open the link → ⋮ menu → *Add to Home screen* → *Install*.

**Mac:** in Safari, *File → Add to Dock*; in Chrome, ⋮ → *Cast, Save & Share →
Create Shortcut*. Or just bookmark it — ⌘D.

Nothing needs to be installed from an app store, and nobody needs a login.

## Sharing it in the room

Send the link in a message, or show a QR of it — every phone camera opens it
straight away. Any QR generator works; the address is short enough to scan from
a slide.

The `/pay` link is only for the second phone during the tap demo. It's the same
app, so sending the main link and telling someone to add `/pay` also works.

## When something looks wrong

```bash
curl https://103-240-147-64.eu-ml-cloud-xip.com/health
```

A JSON reply means the server is fine and the problem is the phone's network or
a content blocker — try the backup name, or mobile data instead of venue wifi.

No reply at all:

```bash
ssh root@103.240.147.64 'systemctl status splitabroad caddy --no-pager'
ssh root@103.240.147.64 'systemctl restart splitabroad'
```

The service is enabled, so even a full reboot of the server brings the demo back
on its own — the box was rebooted during setup and came back with no help.

## Shipping a new version

From `splitabroad/` on the Mac:

```bash
./deploy/push-to-server.sh root@103.240.147.64
```

It builds, uploads the hashed bundles first and swaps the HTML last, so the link
never serves a half-updated page. Safe to run while someone is using it.

## Giving it a name of your own

A domain with the app's name in it (`splitabroad.app`, or `splitabroad.` plus a
domain you already own) is better than either wildcard-DNS name above: no
blocklist lottery, and it reads properly on a slide. Two ways:

1. **A domain you already control** — add an `A` record pointing
   `splitabroad.<yourdomain>` at `103.240.147.64`.
2. **A new domain** — register one (Cloudflare, Namecheap, and Porkbun all sell
   `.app` for roughly €12–15 a year), then the same `A` record.

Either way, once the record resolves, one command switches the server over:

```bash
ssh root@103.240.147.64 'DEMO_DOMAIN=splitabroad.yourdomain.com bash /root/server-setup.sh'
```

Caddy fetches the certificate for the new name by itself, usually within a few
seconds. The old names keep working until you remove them from
`/etc/caddy/Caddyfile`.

> `.app` and `.dev` are HSTS-preloaded, so browsers force https on them. That is
> fine here — the server is https-only anyway — but it does mean a plain-http
> fallback won't work on those two.
