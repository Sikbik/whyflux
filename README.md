<img src="assets/icon.svg" width="64" height="64" alt="">

# whyflux

**Why Flux**: an interactive case for the [Flux](https://runonflux.com) decentralized cloud.
Live on Flux at **https://whyflux.app.runonflux.io** (also at https://whyflux.stache.beer)

Pull the plug, it keeps running. The page walks through why web2 hosting is fragile, how Flux
works as a decentralized Kubernetes, how a deployment goes from a Docker image, a Git repo or an
AI agent to copies on independent nodes, and who runs the network. Along the way you can try to
take an app down, see what a node operator can and cannot reach on ArcaneOS, compare Flux with
other DePIN networks and the big clouds, and price the same app on each.

Every number comes from `src/data` (sourced and dated, notes in `research/`) or straight from the
live network APIs, and refreshes while the page is open.

## Develop

```sh
npm install
npm run dev        # http://127.0.0.1:5190
npm run typecheck
npm run build      # static site in dist/
```

## Data

- `src/data/flux.ts`, `src/data/compare.ts`: the facts behind the page, each with sources.
- `src/lib/live/`: the live layer (node counts, chain height, capacity) with a bundled fallback.
- `npm run snapshot`: refresh `public/data/network-snapshot.json` from the network.

## Deploy

The site runs on Flux itself, at https://whyflux.app.runonflux.io: two instances of the
`littlestache/whyflux` image on independent nodes.

```sh
docker build -t littlestache/whyflux:latest .   # static build served by unprivileged nginx on 8080
docker run --rm -p 8080:8080 littlestache/whyflux:latest
```

The Flux app pulls `:latest`, so shipping a build is a push and a soft redeploy.

`deploy/deploy.sh` refreshes the snapshot, builds and publishes the same site to whyflux.stache.beer.
See `deploy/README.md`.

## Docs

- `docs/DESIGN.md`: art direction, rules for copy and accuracy, the UI kit and the storyboard.
- `research/`: sourced notes on Flux, privacy and ArcaneOS, and the comparison with other platforms.
- `tools/audit.mjs`: checks the rendered page against the house rules.
