# Putting the demo on a permanent address (Kamatera)

The trycloudflare link only lives as long as the Mac and the tunnel do, and it
gets a new random address every restart. A small cloud server gives the demo one
fixed HTTPS link that survives reboots, closed laptops and hotel wifi.

Total: about ten minutes, and the app updates afterwards are a single command.

---

## 1. Create the server (in the Kamatera console — you do this part)

Sign in at <https://console.kamatera.com> and create a server:

| Field | Pick |
| --- | --- |
| Zone | Europe — Frankfurt or Amsterdam (closest to Budapest) |
| Image | Ubuntu Server 24.04 LTS 64-bit |
| CPU / RAM | 1 vCPU / 1 GB is plenty — this serves static files |
| Disk | 20 GB SSD |
| Networking | Public internet, **IPv4 address included** |
| Password | let it generate one, or upload your SSH public key |
| Billing | hourly is fine for a demo box |

When it finishes, note two things from the server's page: the **public IPv4
address** and the **root password** (or use your key).

> There is no "SSH" button anywhere in the Kamatera console, and there doesn't
> need to be. SSH is just how you reach any Linux box: open Terminal on the Mac
> and run `ssh root@<public-ip>`, with the root password the console showed at
> creation. (If you lost it, the server's page has *Reset root password*; the
> *Console* button opens an in-browser terminal that needs no SSH at all.)

Do this once so the deploy commands stop asking for a password:

```bash
ssh-copy-id root@<server-ip>
```

> If you already have the server, skip to step 2 — all that's needed is
> `ssh root@<ip>` working from your Mac.

## 2. Bootstrap it (once)

From the `splitabroad/` folder on the Mac:

```bash
scp deploy/server-setup.sh root@<server-ip>:/root/ && ssh root@<server-ip> 'bash /root/server-setup.sh'
```

That installs Node 22, registers the app as a systemd service (so it restarts on
crash and on reboot), and puts Caddy in front of it for automatic HTTPS.

**About the address:** a bare IP can't get an HTTPS certificate, so the script
picks a hostname for you — the machine's own Kamatera name if it resolves back
to this IP (they look like `103-240-147-64.eu-ml-cloud-xip.com`), otherwise
`<ip>.sslip.io`, a public resolver that maps the name straight to the IP. Either
way you get a real Let's Encrypt certificate. Own a domain? Point an A record at
the IP and run `DEMO_DOMAIN=demo.yourdomain.com bash /root/server-setup.sh`.

## 3. Push the app

```bash
./deploy/push-to-server.sh root@<server-ip>
```

It builds the web bundle locally and uploads it. Run the same command any time
you change the code — new bundles go up first and the HTML is swapped last, so
the link never serves a half-updated page.

## 4. The links to share

```
https://<your-server-hostname>       ← the demo
https://<your-server-hostname>/pay   ← the second phone, for the tap
https://<your-server-hostname>/health ← "is it alive?" check
```

Add the first one to the iPhone home screen (Share → *Add to Home Screen*) and
it opens without the browser chrome, like an installed app.

---

## Everyday operations

```bash
ssh root@<server-ip> 'systemctl status splitabroad --no-pager'   # is it running?
ssh root@<server-ip> 'journalctl -u splitabroad -n 50 --no-pager' # what did it log?
ssh root@<server-ip> 'systemctl restart splitabroad'              # kick it
```

The service is `enabled`, so a reboot of the server brings the demo back on its
own. Nothing is stored on disk except the app itself — the tap-relay codes live
in memory and disappear on restart, which is exactly what you want.

## Security notes for a public box

- The relay endpoints have no auth: anyone who guesses a 4-character code can
  mark a demo payment as paid. That is fine for a stage prop and not fine for
  anything else — don't put real money behind this server.
- Don't put a live Stripe key on it. The server refuses to start on one anyway;
  test keys (`sk_test_…`) only.
- Keep `.env-server` out of git (it already is) and rotate that console password
  if it has ever been pasted into a chat, a ticket or a shared document.
