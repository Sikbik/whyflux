# Deploying Why Flux

The site is static: `npm run build` writes `dist/`, nginx on `stache.beer` serves it as
https://whyflux.stache.beer from `/var/www/whyflux/html`.

## Every deploy

```sh
deploy/deploy.sh            # refresh the network snapshot, build, upload, reload nginx
deploy/deploy.sh --no-snap  # same, without refreshing public/data/network-snapshot.json
```

The upload lands in `html.next` and is swapped in whole; the previous build is kept as
`html.prev` for a quick rollback (`mv html html.bad && mv html.prev html` on the server).

## First deploy only (already done once)

1. DNS: an `A` record `whyflux` → `46.224.67.176` on the `stache.beer` zone (Namecheap).
2. nginx can't load the HTTPS server block before a certificate exists, so start with an
   HTTP-only server that answers the ACME challenge, then issue the certificate:

   ```sh
   certbot certonly --webroot -w /var/www/letsencrypt -d whyflux.stache.beer
   ```

3. Run `deploy/deploy.sh`, which installs `deploy/whyflux.stache.beer.conf`. Certbot's
   timer renews the certificate like the other stache.beer sites.

## Content Security Policy

The config allows `connect-src` to `api.runonflux.io` and `stats.runonflux.io` only: the
live network numbers come from there. If the live layer ever calls another host, add it
to the policy in `whyflux.stache.beer.conf`, or the browser will block it.
