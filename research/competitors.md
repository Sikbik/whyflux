# Why Flux: comparison research (competitors, prices, incidents, market share)

Owner: comparison research pass. Data: `src/data/compare.ts`. All research done and every source read on **2026-10-24**. Live figures come from each platform's own public API or dashboard backend on that date. Where a number is a company claim rather than a live, checkable figure, it is labelled as such.

Contents:
1. Method and scoring rubric
2. The platform set (and what was left out)
3. Flux baseline (what every row is compared against)
4. Head-to-head summary
5. Prices: two reference workloads
6. Cloud market concentration
7. Incidents chosen for the site
8. Fair play: where competitors genuinely beat Flux
9. Discrepancies, stale claims and things to avoid saying
10. Data gaps
11. Notes for the UI (colours, best "versus" stories)
12. Appendix A: DePIN platform notes, set A (Akash, ICP, Render, Golem, Fluence, Filecoin, Arweave)
13. Appendix B: DePIN platform notes, set B (Aethir, io.net, Spheron, Theta, Nosana, Phala and others)
14. Appendix C: web2 pricing, egress, market share and platform facts
15. Appendix D: outage and deplatforming incidents (full notes)

---

## 1. Method and scoring rubric

- I took facts from primary sources first, in this order: official docs, source code, live APIs and dashboards, and the provider's own post-incident reports. Reputable press came second. Four parallel research passes gathered the notes in the appendices. I spot-checked the most surprising and newest claims myself against the primary source: every 2026 incident, Synergy Q2 2026, and the Akash, ICP, Golem, io.net and Nosana live counts.
- **Score rubric (0–5)**, applied to every cell:
  - **5**: yes, by default, no assembly required
  - **4**: yes, with a real caveat
  - **3**: partial (exists, but opt-in, limited or DIY)
  - **2**: weak (possible only with significant work, or for a narrow workload)
  - **1**: essentially no
  - **0**: no or not offered
- Verdicts follow the score: `yes` is ≥4, `partial` is 2–3, `no` is ≤1, and `na` (scored 0) means the question doesn't apply. A script checks this rule, along with full coverage: 16 platforms × 14 dimensions = 224 cells, every cell sourced.
- Web2 clouds are scored on what you get **by default for one deployment**. Multi-AZ replication on AWS is real and mature, but you configure it, and every replica is still an AWS machine. That is why AWS gets a 2 for "replicated across operators" and a 3 for "automatic failover", not a 0.
- Flux is scored by the same rubric, including its weak spots: deplatforming 3 (team blocklist), GPUs 2, ecosystem 2, open source 4 (fluxbench and the ArcaneOS attestation service are closed).

Average score per platform (sum / 14), for orientation only:

| Platform | Avg | Platform | Avg |
|---|---|---|---|
| Flux | 4.21 | AWS / GCP / Azure | 3.00 |
| Internet Computer | 3.21 | DigitalOcean | 2.64 |
| Akash | 3.00 | Theta EdgeCloud | 2.64 |
| Phala Cloud | 2.57 | Vercel | 2.29 |
| io.net / Fluence | 2.07 | Aethir / Render / Golem / Hetzner | 2.00 |

The averages are not meant to be shown as a "league table". The dimensions are not equally important for every buyer: a GPU buyer should weight `gpu-depth` far above `built-in-networking`.

## 2. The platform set

**Final set (16):**
- Flux.
- 9 DePIN: Akash, io.net, Aethir, Internet Computer, Render, Fluence, Golem, Theta EdgeCloud, Phala Cloud.
- 6 web2: AWS, Azure, DigitalOcean, Vercel, Google Cloud, Hetzner.

Why these:
- **Akash** is the closest structural competitor: a permissionless container marketplace, but one provider per lease.
- **ICP** is the one DePIN that replicates by default, but with permissioned operators and WebAssembly only.
- **Render, Aethir, io.net** are the GPU and AI heavyweights. They show where Flux is not trying to win.
- **Fluence** is a former "cloudless compute" protocol, now a vetted data-centre marketplace whose rollup shut down on 2026-04-01.
- **Golem** is the oldest permissionless compute market and is batch-only.
- **Theta EdgeCloud** puts much of its high-end GPU capacity on Google Cloud and AWS.
- **Phala Cloud** is the closest functional overlap with Flux for "run my Docker Compose app" (in TEEs), and was recommended by the set-B pass as more relevant than Nosana or Spheron in 2026.
- **Web2:** the big three (63% of the market between them), DigitalOcean (the "simple cloud" alternative), Vercel (frontend default, runs on AWS regions), and Hetzner (cheap, and it hosts 25% of Flux's own nodes plus a history of banning crypto nodes).

**Left out, with reasons:**
- **Spheron:** in March 2026 it announced it is "phasing out protocol operations to focus entirely on enterprise GPU procurement and aggregation", and its docs now say "Spheron is not a blockchain network". It is useful as a one-line cautionary note ("DePIN that stopped being decentralized"), not as a platform. See Appendix B.
- **Nosana:** small (359 of 478 nodes active, 2026-10-24) and GPU-inference-only. Its own docs say it is "not the right tool for … general web hosting". It does auto-replace replicas (INFINITE strategy), which is worth knowing if anyone claims "only Flux self-heals". See Appendix B.
- **Filecoin, Arweave:** storage-only, so they would score `na` on most dimensions. Notes are in Appendix A.
- **Cloudflare:** shown through its incidents (four in the list). Workers and Containers are not a VM or container-host comparison in the same sense. Facts are in Appendix C.

## 3. Flux baseline (what every row is compared against)

Flux-side facts are owned by the Flux researcher (`research/flux.md`). The items below are the ones the comparison cells depend on, which I verified myself on 2026-10-24. Our numbers agree with `research/flux.md`.

- **Operators are permissionless.** "FluxNodes are permissionless and open to everyone: anyone with the required hardware specs and FLUX collateral can join the network" ([docs](https://docs.runonflux.com/fluxnodes/what-are-fluxnodes)). Collateral is 1,000, 12,500 or 40,000 FLUX (Cumulus, Nimbus, Stratus) plus a benchmark.
- **Live size.** 6,854 confirmed nodes: Cumulus 3,349, Nimbus 1,661, Stratus 1,844 ([getfluxnodecount](https://api.runonflux.io/daemon/getfluxnodecount)). They benchmark about 56,900 logical cores, 192 TB RAM and 3.37 PB SSD (`research/flux.md`), and about 1,155 operator identities run them.
- **Geography and networks** ([stats fluxinfo geolocation](https://stats.runonflux.io/fluxinfo?projection=geolocation), my own count over 6,855 rows):
  - 57 countries on 6 continents, and 234 ASNs (84 rows have no geo).
  - Europe 4,854 (≈71%), North America 1,559, Asia 214, South America 65, Oceania 48, Africa 31.
  - 3,486 nodes (50.9%) are on IPs that ip-api classes as *not* hosting or data-centre; 3,285 (47.9%) are on hosting IPs.
  - Hyperscalers: AWS 0 nodes, Microsoft 0, Google 6.
  - **Concentration caveat:** Hetzner (AS24940) has 1,733 nodes (25.3%) and the top 10 ASNs hold 57.5%. FluxOS spreads replicas of stateful apps across fault domains (hosting organisation, else allocation block, else /16) ([placementFeasibility.js](https://github.com/RunOnFlux/flux/blob/master/ZelBack/src/services/appPlacement/placementFeasibility.js)).
- **Replication:**
  - Instances range from 1 to 100 for v8 specs; single instances have been allowed since block 2,176,519 (2025-12-19) (`minimumInstancesV8: 1` in [config/default.js](https://github.com/RunOnFlux/flux/blob/master/ZelBack/config/default.js)).
  - The custom-deploy wizard defaults to **1**; the cost calculator and marketplace default to **3** ([fluxos-frontend](https://github.com/RunOnFlux/fluxos-frontend)).
  - In practice, 1,815 of 2,115 running apps (86%) have two or more live copies (`research/flux.md`, from [apps/locations](https://api.runonflux.io/apps/locations)).
- **Self-healing.** Every node's spawner "continuously checks for applications that need more instances" and installs missing copies ([appSpawner.js](https://github.com/RunOnFlux/flux/blob/master/ZelBack/src/services/appLifecycle/appSpawner.js)). The honest caveat: a sudden node loss is noticed when its location record expires, which takes up to 125 minutes (7 minutes on a clean shutdown). With two or more copies, Flux Domain Manager routes around the failure within seconds.
- **Replicated data.** Volumes prefixed `r:` sync between copies, and `g:` gives a primary with standbys. Unprefixed volumes are local and "non-persistent and not synchronized" ([components docs](https://docs.runonflux.com/fluxcloud/register-new-app/deploy-with-docker/components)).
- **Networking.** Each app gets an automatic `*.app.runonflux.io` domain, custom domains work by CNAME with automatic Let's Encrypt, and FDM (HAProxy) does round-robin load balancing with sticky sessions and health checks ([FDM](https://github.com/RunOnFlux/flux-domain-manager), [custom domain docs](https://docs.runonflux.com/fluxcloud/register-new-app/custom-domain-setup)).
- **Pricing.** A public USD rate card: $0.15 per 0.1 core, $0.05 per 100 MB RAM, $0.02 per GB SSD, per month ([cost calculator docs](https://docs.runonflux.com/fluxcloud/cost-calculator), [getappspecsusdprice](https://stats.runonflux.io/apps/getappspecsusdprice)).
  - How the total is built ([appUtilities.js](https://github.com/RunOnFlux/flux/blob/master/ZelBack/src/services/utils/appUtilities.js), [appSpecHelpers.js](https://github.com/RunOnFlux/flux/blob/master/ZelBack/src/services/utils/appSpecHelpers.js)):
    - The total for one app is divided by 3, which gives the price per instance; that is multiplied by the number of instances.
    - Small apps (fewer than 4 instances) get 20% off.
    - The result is rounded up to a .49 or .99 price.
    - Paying in FLUX takes 5% off.
  - "No ingress or egress fees" ([FluxCloud intro](https://docs.runonflux.com/fluxcloud/introduction)).
- **Live quotes** (`POST /apps/calculatefiatandfluxprice`, identical on 5 unrelated nodes, 2026-10-24):

  | Spec | 1 instance | 3 instances | 10 instances |
  |---|---|---|---|
  | 2 cores / 4,000 MB / 50 GB | **$1.99** (30.05 FLUX) | **$4.99** (75.36 FLUX) | **$20.49** (309.43 FLUX) |
  | 2 cores / 8,000 MB / 100 GB | $2.99 (45.18 FLUX) | $8.49 (128.3 FLUX) | – |

  - The FLUX figures include the 5% discount, which implies FLUX ≈ $0.0629. CoinGecko showed $0.0636 the same day.
  - To reproduce: POST a v8 spec (`instances`, one compose component with `cpu: 2, ram: 4000, hdd: 50`, a non-enterprise port such as 31111, `expire: 88000`) to `http://<any node ip>:<api port>/apps/calculatefiatandfluxprice`. `api.runonflux.io` timed out on POST, so I hit nodes directly.
- **Network-wide blocklist (honesty item):**
  - Every node fetches and enforces the signed policy in [RunOnFlux/fluxos-network-policy](https://github.com/RunOnFlux/fluxos-network-policy): "a merge here changes the behaviour of the whole fleet immediately".
  - `blocklist.json` held 312 entries (187 owner, 85 app hash, 21 image, 19 registry org). The reasons are public and are mostly abuse, such as owners mass-registering proxy deployments.
  - So the core team can remove an app network-wide. Score: deplatforming 3/5.
- **GPUs.**
  - FluxEdge is a separate single-machine rental marketplace. Community GPUs (e.g. RTX 4090) sit alongside a "Premium" tab of H100, A100 and Blackwell GPUs "sourced from trusted third-party providers, such as Hyperstack", which requires KYC1 ([FluxEdge docs](https://docs.runonflux.com/fluxedge/projects/rent-machine)).
  - FluxEdge local storage is lost if the deployment migrates.
- **Open source.** FluxOS is AGPL-3.0; the daemon, FDM and FluxCloud UI are public. The benchmark daemon and the ArcaneOS System Attestation Service are closed (`research/flux.md`).

## 4. Head-to-head summary

| | Who can host | One deployment runs on | If the host dies | Workloads | Domains / TLS / LB | Live size (2026-10-24) |
|---|---|---|---|---|---|---|
| **Flux** | Anyone + collateral + benchmark | 1–100 nodes (marketplace default 3) | Respawned automatically; other copies keep serving | Any Docker image, ≤10 components | Built in (FDM) | 6,854 nodes, 57 countries |
| Akash | Anyone (bid deposit) | One provider per lease | Close lease, redeploy by hand | Any Docker (SDL/K8s) | Provider hostname; TLS via third parties; no cross-provider LB | 58 providers, ~14.2k cores, 376 GPUs |
| ICP | NNS-approved providers; no new nodes onboarded | Every node of a 13-node (or larger) subnet | BFT keeps running with <⅓ faulty | WebAssembly canisters only | Built in, automatic TLS | 1,280 nodes, 101 DCs, ~33 countries |
| Render | Application or waitlist | Frames fanned out to ≤100 nodes; compute jobs on 1 | Rejected frames re-rendered | GPU rendering; Docker on CUDA (Dispersed) | None | 5,600 nodes ever (cumulative) |
| Golem | Anyone (Linux + KVM) | Parallel tasks on many providers | Task API retries on another provider | Batch tasks (VM from Docker, WASM) | None; no inbound | 792 providers, 5,015 cores, 0 GPUs |
| Aethir | Application, enterprise bare metal, stake, KYC | One rented server | Host repairs within 4 h; no migration | Bare-metal GPU servers | Public IP + SSH | ~$66M fees/yr; "435k containers" (claim) |
| io.net | Sign-up, proof of work, stake | One node per container | Health checks are monitoring only | HTTP GPU containers, GPU VMs | Public URL per container | **1,307 active GPUs** (vs "320k+" marketing) |
| Fluence | Tier 3/4 DCs with KYB | One provider per instance | Instance and data lost | CPU VMs, GPU containers | Domain + ports on GPU containers | "1,400+ GPUs" (claim) |
| Theta EdgeCloud | Community GPUs; high end hosted on GCP/AWS | Replica counts (placement undocumented) | Hybrid jobs reroute | Containers, one port mapped to 443 | HTTPS endpoint | "30,000+ edge nodes" (GPU optional) |
| Phala Cloud | Team-verified GPU workers + collateral | Replicas, separate endpoints | Others keep serving; no LB | Docker Compose in TEEs | Auto HTTPS + custom domains | Not published |
| AWS / GCP / Azure | Owner only | 1 VM unless you build multi-AZ | Auto Scaling, MIGs or VMSS repairs, if configured | Anything | Separate paid products | 28% / 15% / 20% of a $143B quarter |
| DigitalOcean | Owner only | 1 Droplet (per-Droplet SLA) | DIY / Kubernetes | Anything | App Platform or $12 LB | 16 DCs, 13 regions |
| Vercel | Owner only (on AWS regions) | Multi-AZ functions by default | CDN reroutes; function failover Enterprise-only | Serverless functions; containers in beta | Built in, the best of the lot | 126 PoPs, 19 regions |
| Hetzner | Owner only | 1 server (spread groups only split hosts) | DIY | Plain VMs | LB sold separately | 6 locations, 4 countries |

## 5. Prices: two reference workloads (all 2026-10-24, USD per month)

**Workload 1: 2 vCPU / 4 GB RAM / 50 GB SSD, one server, always on (730 h).** Each figure includes what is needed to be reachable on the internet (an IPv4 address where it is billed). Egress is extra unless stated.

| Platform | $/mo | What it is |
|---|---|---|
| Flux | **1.99** | 1 instance; domain + TLS + zero egress included; self-respawns (with downtime for a single copy) |
| Hetzner | 7.09 | CX23 €5.99 incl. IPv4, excl. VAT; 40 GB disk; EU only; listed "currently unavailable"; US nearest is CPX21 ≈ $38 |
| Akash | 7.90 | Default provider price script (2×1.60 + 4×0.80 + 50×0.03); real 2 vCPU/4 GiB leases ran $0.98–$14.28, median $3.99, without 50 GB of persistent storage; one provider |
| DigitalOcean | 24.00 | Basic Droplet, 80 GiB SSD, IPv4 and 4,000 GiB transfer included |
| GCP | 33.11 | e2-medium $24.46 (shared core, no sustained-use discount) + pd-balanced $5.00 + IPv4 $3.65 |
| AWS | 38.02 | t3.medium $30.37 (20% baseline) + gp3 $4.00 + IPv4 $3.65; full-load CPU credits can add $58.40 |
| Azure | 38.82 | B2s $30.37 (20% baseline, End of Life series) + E6 64 GiB $4.80 + IPv4 $3.65 |

Not priced: Linode ($24) and Vultr ($20) are in Appendix C. Vercel and Cloudflare are not VM providers. ICP, Render, Golem, Aethir, io.net, Theta and Phala don't sell a comparable CPU VM, or don't publish a price for one; Fluence's CPU VM prices weren't researched.

**Workload 2: three replicas of that server behind a load balancer.** This is the like-for-like comparison for what Flux gives by default with 3 instances.

| Platform | $/mo | Breakdown |
|---|---|---|
| Flux | **4.99** | 3 instances on 3 nodes; FDM load balancing, health checks, domain, TLS, respawn; no egress fees (10 instances: $20.49) |
| Akash | 23.70 | 3 × $7.90 on 3 providers; **no** cross-provider load balancing or TLS included |
| DigitalOcean | 84.00 | 3 × $24 + $12 regional LB (1 node) |
| GCP | 106.63 | 3 × ($24.46 + $5.00) = $88.38 + forwarding rule $0.025/h = $18.25 (+$0.008/GiB processed, + egress) |
| Azure | 127.41 | 3 × ($30.37 + $4.80) = $105.51 + Standard LB $0.025/h = $18.25 + LB public IP $3.65 (+ data processed, + egress) |
| AWS | 132.68 | 3 × ($30.37 + $4.00) = $103.11 + ALB $0.0225/h = $16.43 + 1 LCU $0.008/h = $5.84 + ALB's 2 public IPv4 $7.30 (+ extra LCUs, + egress) |

Load-balancer price sources:
- AWS ALB: $0.0225/ALB-hour and $0.008/LCU-hour ([ELB pricing](https://aws.amazon.com/elasticloadbalancing/pricing/)). An ELB's public IPv4 addresses are billed at $0.005/h each ([VPC pricing](https://aws.amazon.com/vpc/pricing/): "One Elastic load balancer with two in-use public IPv4 address").
- GCP: "First 5 forwarding rules $0.025 / 1 hour", data processed $0.008/GiB, and no charge for IPs attached to forwarding rules ([network pricing](https://cloud.google.com/vpc/network-pricing)).
- Azure: Standard "Included LB Rules and Outbound Rules" at $0.025/hour ([Retail Prices API](https://prices.azure.com/api/retail/prices?$filter=productName%20eq%20%27Load%20Balancer%27)).
- DigitalOcean: "Regional HTTP load balancers cost $12.00 per month per node" ([DO docs](https://docs.digitalocean.com/products/networking/load-balancers/details/pricing/)).

Headline ratios (W1, single server):
- AWS $38.02 against Flux $1.99 is 19×.
- Against three self-healing Flux copies ($4.99), AWS is 7.6× for one copy, and 26.6× ($132.68) for a comparable redundant setup.

Keep the burstable and shared-CPU caveat visible. The AWS, Azure and GCP machines above are burstable or shared-core. A Flux instance's "2 cores" are reserved on a benchmarked node, but are not a dedicated physical core either, so don't claim performance parity.

**FluxCloud site claim to correct:** `research/flux.md` quotes the FluxCloud page as "$2.29 vs AWS $79.92 (2 vCPU/8 GB/100 GB)". The live API returns **$2.99** for that spec on one instance, or $8.49 for three. AWS for 2 vCPU / 8 GiB / 100 GB is about $72–85 depending on instance family:
- t3.large $60.74 + gp3 $8.00 + IPv4 $3.65 = $72.39.
- m7i.large $73.58 + $8.00 + $3.65 = $85.23.

Use our numbers, not the site's.

**Flux's own competitor table:** `fluxos-frontend/src/composables/usePricingComparison.js` hard-codes "July 2026" list prices for 2 vCPU / 4 GB / 20 GB: AWS $33.12, GCP $29.80, Azure $31.39, DigitalOcean $24, Linode $24, Vultr $21, Akash ~$8. These are consistent with ours once storage and IPv4 are accounted for.

## 6. Cloud market concentration

- Synergy Research, **Q2 2026** (published 2026-07-30) ([source](https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years)).
  - Enterprise spending on cloud infrastructure services was $143.4B in the quarter, up 43% YoY.
  - Shares: **Amazon 28%, Microsoft 20%, Google 15%**, so 63% together, leaving 37% for everyone else.
  - In public cloud (IaaS + PaaS) alone, "the top three account for 67% of the market".
- Trend: Q2 2024 was 32/23/12 (67%) of $79B; Q3 2025 was 29/20/13 (63%) of $107B. The big three's combined share is flat-to-down as neoclouds (CoreWeave, Oracle, Nebius and others) grow, but the absolute dollars concentrated in three companies keep rising.
- Q3 2026 had not been published as of 2026-10-24. Synergy usually publishes it in late October or November.

## 7. Incidents chosen for the site (16)

Ranked by how well they make the case, with what each one proves:

1. **AWS UAE/Bahrain drone strikes (2026-03-01 onward):** physical and geopolitical concentration. Two of three availability zones failed together, AWS told customers to migrate away, and some single-AZ data was later reported unrecoverable (paraphrase; see the gaps section).
2. **AWS us-east-1 DynamoDB DNS (2025-10-20):** 14.5 h, 17M+ Downdetector reports, and $38M–$581M insured loss. It took down Coinbase, Robinhood, Snapchat, Reddit and Vercel.
3. **Google Cloud suspends Railway (2026-05-19):** an automated wrongful suspension with no notice, which defeated a multi-cloud setup because the control plane sat on GCP. The best deplatforming story for developers.
4. **Cloudflare Nov 18 and Dec 5, 2025:** "worst outage since 2019", followed by "we let the Internet down again" 17 days later.
5. **Google Cloud June 12, 2025:** one null pointer took Google global and then Cloudflare's Workers KV with it. The best cascading-dependency example.
6. **Hetzner and Solana (2022-11-02):** one host's crypto policy took 1,000+ validators offline. The most on-message case for DePIN, and Hetzner hosts 25% of Flux nodes today.
7. **CrowdStrike (2024-07-19):** 8.5M devices and $5.4B in losses. Frame it as single-vendor concentration, not a hosting outage.
8. **OVHcloud SBG2 fire (2021-03-10):** a physical single point of failure that put 3.6M websites offline and permanently lost some customers' data.
9. **Others in the data:**
   - Azure Front Door (2025-10-29).
   - Azure policy misfire hitting GitHub Actions (2026-02-02).
   - GCP London power failure (2026-10-20, four days before this research).
   - Cloudflare BYOIP withdrawal (2026-02-20).
   - AWS 2021-12-07.
   - Fastly 2021-06-08.
   - AWS and Parler (2021-01-11), framed neutrally as "one provider's ToS decision took a whole platform offline within 24 hours".

Durations use the provider's own timeline:
- Where Google contradicts itself (2025-06-12: dashboard 7h27m vs mini-report "3 hours"), the data uses 7.5 h, and the impact text says most regions recovered within about 3 h.
- CrowdStrike, OVH, Parler, Hetzner and the AWS Middle East event have no `durationHours`: they ran for days, weeks or permanently, and a number would wreck a duration chart. The impact text carries the timescale instead.

## 8. Fair play: where competitors genuinely beat Flux

Use these on the page; they make the rest believable.

- **GPU depth.**
  - Aethir (H100/H200/B200/GB200 clusters up to 4,000 GPUs, about $66M of customer fees a year), io.net (640 hired H100s), Render, Fluence, Theta and Phala all have deeper high-end GPU pools than Flux.
  - The hyperscalers (P5, A3/A4, ND H100 v5) and even DigitalOcean (H100/H200/B300) beat FluxEdge, which sources H100s from partners such as Hyperstack.
- **Ecosystem and managed services.** AWS, Azure and GCP have hundreds of managed services, compliance programmes and support. DigitalOcean and Vercel have far better developer experience for their niches.
- **Size and resources.** On CoinGecko, 2026-10-24, market caps were about $1.47B for ICP, $876M for Render and $194M for Akash, against $27M for FLUX. Bigger treasuries and communities mean more tooling and integrations.
- **Consistency of replicated state.** ICP replicates canister state by Byzantine-fault-tolerant consensus across 13+ nodes. That is stronger than Flux's Syncthing-based file sync, and ICP keeps running instantly with up to a third of nodes faulty.
- **Deplatforming resistance.**
  - Akash documents **no network-wide blocklist**: a refused tenant goes to another provider. Flux nodes enforce a team-published blocklist (312 entries).
  - Akash scores 4 here and Flux 3. Say so; it's the honest framing ("public and reasoned, but it exists").
- **Default redundancy is now a choice on Flux.** Since December 2025 a v8 app can run a single instance, and the custom-deploy wizard defaults to 1. A single-copy Flux app is down until the network notices (up to 125 min) and respawns it. The redundancy story is "built in and one number away; marketplace apps default to 3; 86% of running apps use 2+", not "always 3".
- **Hetzner concentration.** 25% of Flux nodes sit on Hetzner, whose terms ban crypto mining and which cut off Solana validators in 2022.
  - If Hetzner ever extended that to Flux nodes, a quarter of capacity would go at once.
  - Apps with copies elsewhere would survive. Stateful apps are spread across hosting organisations; for stateless apps there is no such guarantee.
- **Vercel** has the best frontend developer experience and CDN (126 PoPs). **DigitalOcean** has simple, flat pricing with 4 TB of transfer. **Hetzner** is the cheapest raw compute in the EU, even after two increases in 2026.
- **Big-cloud SLAs.** 99.99% for multi-AZ (AWS, GCP), and per-Droplet 99.99% (DigitalOcean). Flux has no contractual SLA in the docs we read.

## 9. Discrepancies, stale claims and things to avoid saying

- **"Flux always runs at least 3 copies":** false since 2025-12-19 for v8 specs. The docs ([general settings](https://docs.runonflux.com/fluxcloud/register-new-app/deploy-with-docker/general), [cost calculator](https://docs.runonflux.com/fluxcloud/cost-calculator), [intro](https://docs.runonflux.com/fluxcloud/introduction)) still say "minimum 3", and `/apps/deploymentinformation` still reports `minimumInstances: 3` because it reads the legacy key.
- **"10,000+ FluxNodes"** (docs intro) is stale. The live count is 6,854.
- **"$2.29 vs AWS $79.92"** (FluxCloud page) doesn't match the live API (see §5).
- **"Uncensorable" or "nobody can take your app down":** too strong, because of the network policy blocklist and the team-run default FDM. Say "no single host or account review can take it down".
- **Competitor marketing numbers** to use only as labelled claims:
  - io.net "320,000+ GPUs" (live: 1,307 active).
  - Aethir "435,000+ GPU containers" (includes phones and PCs).
  - Theta "30,000+ edge nodes" (GPU optional).
  - Fluence "1,400+ GPUs" / "6,000+ in clusters".
  - Render "5,600 nodes" (cumulative since inception).
- **Akash's own price estimator** ($18.66 vs AWS $75.82) compares Akash to Fargate, GKE and ACI, not VMs. Don't set it against EC2 figures.

## 10. Data gaps

- No public node or country counts for Phala; no GPU counts for Theta or Aethir (physical); no live geography for Render, Golem, Akash or io.net. The `geographic-spread` scores for those rest on what is published, and say so.
- Egress policies are undocumented for io.net, Theta, Nosana and Phala, and Akash has no first-party statement. Fluence's and Aethir's "zero egress" are vendor claims.
- The 2026-03 AWS Middle East status "unable to restore … data in mec1-az2" (Sept 2026) is a W.Media paraphrase of an AWS Health Dashboard update that we could not load. The data uses only the verified heise quote from May 2026.
- The AWS us-east-1 thermal event of 2026-05-07 is excluded because there is no AWS post-event summary and the duration is uncertain (19–28 h by secondary trackers).
- Ookla's 17M (AWS) and 3.3M (Cloudflare) Downdetector figures come via FoneArena's summary of Ookla's year-end report; the original page was not fetchable.
- Synergy Q3 2026 was not yet published.
- Hetzner CX23 showed "currently unavailable" for ordering on 2026-10-24.
- Hetzner's Volume per-GB price wasn't found, so the CX23 price uses its 40 GB disk rather than 50 GB.
- Mission 70 adoption (ICP tokenomics), ICP Cloud Engines status, and Fluence's pre-sunset chain dates are unresolved, but none is used in the data.

## 11. Notes for the UI

- **Colours** were validated with the dataviz palette checker on `#080a0f` (OKLCH lightness band 0.48–0.67, chroma ≥0.10, CVD ΔE ≥8 and normal-vision ΔE ≥15 for neighbours in array order, contrast ≥3:1). Every competitor colour also separately clears both Flux blues (#2B61D1, #4F7AD4); purple was avoided because it collapses into Flux blue under protanopia.
  - DePIN, in order: Akash `#d72828`, io.net `#af9100`, Aethir `#008c57`, ICP `#d740a2`, Render `#db7300`, Fluence `#b82771`, Golem `#9c622f`, Theta `#18a7a1`, Phala `#639900`.
  - Web2, in order: AWS `#d77900`, Azure `#00a7af`, DigitalOcean `#979c00`, Vercel `#db428c`, GCP `#30ad51`, Hetzner `#d01c29`.
  - **Colours are unique within a kind, not across kinds.** Akash/Hetzner (red), Render/AWS (orange) and Theta/Azure (teal) share hue families. Charts that mix kinds should direct-label series, or give web2 a secondary encoding (dashed strokes or hatching), and should never show more than about 8 series at once.
- **Best "versus" stories**, ranked:
  1. **Flux vs Akash on `multi-operator-redundancy` + `self-healing` + `built-in-networking`** (5/5/5 vs 1/1/2): the clearest demonstration that a marketplace is not a cloud.
  2. **Flux vs AWS on `predictable-pricing` + the W2 price** ($4.99 for three self-healing copies vs $132.68).
  3. **Flux vs io.net on `network-scale`** (live, checkable numbers vs "320,000+ GPUs" against 1,307 active).
  4. **Flux vs ICP on `permissionless-operators` + `any-container`** (both replicate; only one lets anyone host, and only one runs Docker).
  5. **Flux vs Vercel / Theta:** "your decentralized-looking stack is on AWS" (Vercel's iad1 is us-east-1; Theta's H100s are on GCP/AWS).
- Where Flux loses (keep them visible in the radar): `gpu-depth` (every GPU network and every hyperscaler), `ecosystem` (web2), `deplatforming-resistance` (Akash 4 vs Flux 3), `replicated-data` (ICP 5 vs Flux 4).
- `cells[].short` is ≤60 characters. `detail` is 1–3 sentences, with quotes in double quotes copied from the source.
- `prices` holds two workloads; group them by the `workload` string, which is identical within a group. Flux appears once in each.
- `incidents[].durationHours` is absent for multi-day or permanent events; render those as "days", "weeks" or "permanent" from `impact`.
- `cloudMarketShare` is the latest quarter only, and sums to 100.

---

## 12. Appendix A: DePIN platform notes, set A

_Research pass A, 2026-10-24. Live figures re-checked by the comparison researcher: Akash 58 providers / 376 GPUs / ~14.2k cores; ICP 1,280 nodes, 76 providers, 101 DCs; Golem 792 providers, 0 GPUs. Note: the Akash custom-domain guide URL in item 5 now returns 404; see Appendix C for the replacement sources._


Researched 2026-10-24. "Live API" figures were pulled on 2026-10-24 from the official dashboard backends named in each bullet. Quotes are verbatim from the linked page.

---

### Akash Network

1. **Operator access: permissionless.** The docs describe leasing "in a permissionless and open environment", and say providers can "Control what workloads you accept". Requirements are hardware, a domain/public IP, and AKT for bid deposits ("0.5 AKT per bid") ([should-i-run-a-provider](https://akash.network/docs/providers/getting-started/should-i-run-a-provider/), [hardware reqs](https://akash.network/docs/providers/getting-started/hardware-requirements/)). There is no stake or KYC. An optional third-party "audited" attribute exists, and tenants can restrict to it with `signedBy` ([providers-leases](https://akash.network/docs/learn/core-concepts/providers-leases/)). A consumer-GPU "Homenode" beta opened sign-ups in Q1 2026 for RTX 4090/5090/6000 Ada ([Q1 2026 report](https://akash.network/blog/akash-network-q1-2026-report)).
2. **Placement: one provider per lease.** The docs list "Provider/Lease (tied to specific provider)" as not updatable. Separate groups in a multi-group SDL can land on different providers ([deployments](https://akash.network/docs/learn/core-concepts/deployments)). High availability is left to the user: "For high availability, deploy to multiple providers" ([providers-leases](https://akash.network/docs/learn/core-concepts/providers-leases/)).
3. **Failure behaviour: manual.** Docs: "If persistent, close and redeploy to different provider" and "If no response within 24h, close lease and redeploy" ([providers-leases](https://akash.network/docs/learn/core-concepts/providers-leases/)). On close, "Unused escrow returned to you". When escrow hits zero the deployment closes automatically ("insufficient_funds"), and "Cannot restart without new deployment" ([deployments](https://akash.network/docs/learn/core-concepts/deployments)). I found no doc describing automatic rescheduling to another provider. An old AEP-2 spec describes collateral transfer and re-ordering on provider failure, but I could not confirm it is live ([AEP-2](https://akash.network/roadmap/aep-2/)).
4. **Workloads.** Any Docker container, described in SDL and run on Kubernetes. That covers long-running services, GPU workloads ([gpu-deployments](https://akash.network/docs/learn/core-concepts/gpu-deployments)) and AI inference. AkashML managed inference launched on 2025-11-22 ([blog](https://akash.network/blog/akashml-managed-ai-inference-on-the-decentralized-supercloud)). Confidential compute (Intel TDX / AMD SEV-SNP, NVIDIA CC, Kata micro-VMs) launched on 2026-07-28 with `params.tee`, but attestation tooling is "still in development" ([blog](https://akash.network/blog/confidential-compute-comes-to-akash)).
5. **Networking.**
   - The default is a provider-assigned hostname via the provider's ingress ([ip-leases](https://akash.network/docs/learn/core-concepts/ip-leases)).
   - Custom domains work by CNAME to the provider hostname, with TLS handled by the user (Cloudflare or Caddy) ([custom-domain guide](https://akash.network/docs/guides/network/custom-domain)).
   - Automatic per-tenant custom-domain certificates exist only as a proposal: AEP-66 is in **Draft** status, last updated 2025-07-07 ([AEP-66](https://akash.network/roadmap/aep-66/)).
   - Dedicated IPv4 "IP leases" are available but "can't move between providers". The docs suggest "Use your own load balancer pointed at the IP" ([ip-leases](https://akash.network/docs/learn/core-concepts/ip-leases)).
   - There is no built-in cross-provider load balancing.
6. **Persistent storage: yes, but provider-local.** Docs: "Storage is tied to the provider"; "Data is lost when you close the deployment"; "Data may be lost if provider's storage fails". Classes are beta1/2/3, and volumes cannot be resized or shared between services ([persistent-storage](https://akash.network/docs/learn/core-concepts/persistent-storage)).
7. **Network size, live API on 2026-10-24** ([console-api dashboard-data](https://console-api.akash.network/v1/dashboard-data), [network-capacity](https://console-api.akash.network/v1/network-capacity), [gpu](https://console-api.akash.network/v1/gpu); this is the backend for [stats.akash.network](https://stats.akash.network)):
   - 58 active providers.
   - 375 GPUs total, 265 leased. By model: 200 A100 80GB, 69 H100 80GB, 16 B300, 25 RTX Pro 6000, and the rest mostly consumer cards.
   - About 14,226 CPU cores total, about 3,687 in use.
   - About 76 TB memory and about 375 TB persistent storage.
   - 656 active leases.
   - About 6,242 ACT/day spend (≈ US$6.2k/day, since ACT is USD-pegged).
   - CoinMarketCap reported a 57.5% QoQ drop in GPU supply in Q1 2026 (secondary source, [CMC](https://coinmarketcap.com/cmc-ai/akash-network/price-prediction/)).
8. **Chain.** Akash runs its own Cosmos SDK L1. The Q4 2025 report mentions a Cosmos SDK v0.53 refactor and WASM smart-contract support ([Q4 2025 report](https://akash.network/blog/q4-2025-report/)).
9. **Pricing.**
   - It is a reverse auction: "Qualifying providers submit bids automatically ... You choose" ([providers-leases](https://akash.network/docs/learn/core-concepts/providers-leases/)).
   - Since **BME / Mainnet 17 (2026-03-23, Proposal #318)**, tenants burn AKT to mint **ACT**, "a non-transferable, USD-pegged compute credit". ACT is then burned at settlement and AKT minted to pay providers ([BME blog, 2026-03-18](https://akash.network/blog/what-burn-mint-equilibrium-means-for-akash/)).
   - "Escrow is funded in ACT ... You can get ACT by burning AKT or via credit card in Console." AKT top-ups are possible when the circuit breaker pauses ACT minting ([deployments](https://akash.network/docs/learn/core-concepts/deployments)).
   - BME "replaces AEP-23", the earlier USDC payment path ([Q1 2026 report](https://akash.network/blog/akash-network-q1-2026-report)).
   - Egress: I found no protocol-level per-GB fee. The only "free egress" claim I found is from a third-party reseller ([digitalfrontier](https://digitalfrontier.so/pricing)), so this is unverified.
10. **Open source.** Apache-2.0 for node, provider and console, all actively pushed in Oct 2026 ([github.com/akash-network](https://github.com/akash-network), checked via the GitHub API).
11. **Censorship/takedown.** There is no foundation kill-switch in the docs. Each provider chooses ("Control what workloads you accept") and "Provider can close lease (rare)" ([should-i-run](https://akash.network/docs/providers/getting-started/should-i-run-a-provider/), [deployments](https://akash.network/docs/learn/core-concepts/deployments)). I found no explicit tenant-blocklist doc.
12. **Launch.** Mainnet 1 (staking and governance only) launched 2020-09-25 ([Forklog](https://forklog.com/en/akash-network-launches-mainnet-and-raises-about-640000-in-ieo/), [blog](https://www.akash.network/blog/mainnet-launch-update)). Mainnet 2 (the deployment marketplace) launched 2021-03-08 ([blog](https://akash.network/blog/akash-mainnet-2-update-april-29-2021)).
13. **2025-26 changes.**
    - AkashML launched Nov 2025. It is listed on OpenRouter at about 1.7B tokens/day per the Q1 2026 report.
    - BME and ACT went live 2026-03-23.
    - Q1 2026 compute spend was ">$5 million", which the report calls an all-time high.
    - Console Air, a self-hosted/self-custody console, arrived 2026-05-05.
    - Confidential compute launched 2026-07-28.
    - Homenode beta.
    - Sources: [blog index](https://akash.network/blog/), [Q1 2026 report](https://akash.network/blog/akash-network-q1-2026-report).
14. **Strengths vs Flux.**
    - Real datacenter GPU inventory, including H100, A100 80GB, B300 and RTX Pro 6000 (see item 7).
    - Kubernetes-native SDL.
    - A managed inference product (AkashML) and TEE/confidential GPU option.
    - USD-pegged billing via ACT plus credit card.
    - Fully Apache-2.0 stack and a large, well-known ecosystem.

---

### Internet Computer (ICP)

1. **Operator access: NNS-approved node providers only.** A registration proposal "records the legal entity behind the provider". It must include hashes of a self-declaration and proof-of-identity documents. Data centres also need a proposal, and the applicant needs 51 ICP ("a rejected proposal costs its neuron 50 ICP"). Also: "No new node machines are being onboarded at present — the network reached its target topology in December 2023" (page updated 2026-05-04; [node-provider-onboarding](https://internetcomputer.org/wiki/node-provider-onboarding/)).
2. **Placement: replicated by default across all nodes of a subnet.** "Each application subnet has 13 nodes"; "The fiduciary subnet has 34 nodes" ([subnet-selection](https://docs.internetcomputer.org/guides/canister-management/subnet-selection.md)).
   - Live dashboard API on 2026-10-24 ([ic-api subnets](https://ic-api.internetcomputer.org/api/v3/subnets)): 42 subnets in total.
   - 35 subnets have 13 nodes.
   - The NNS subnet (tdb26) has 40 nodes. The II system subnet (uzr34) has 34; the docs still say 28, which is stale.
   - The fiduciary subnet (pzp6e) has 34, and one more authorized-only application subnet (x33ed) also has 34.
   - Three 7-node subnets: a rented Swiss subnet, an SEV "confidential" subnet, and one authorized-only subnet.
   - One "European" 13-node subnet (bkfrj).
3. **Failure behaviour: automatic.** "the protocol continues making progress as long as fewer than one third of the nodes in a subnet are faulty". A failing node can be replaced: "an NNS proposal can be submitted to replace it with a spare node" ([evolution-scaling](https://docs.internetcomputer.org/concepts/evolution-scaling/)). The canister stays up with no user action. Node replacement itself is a governance action, not instant.
4. **Workloads.** WebAssembly canisters only (Rust, Motoko, etc.), with no Docker. Canisters are always-on and serve HTTP directly. No GPU subnets appear in the docs or dashboard. Limits: heap "4 GiB (wasm32), 6 GiB (wasm64)", Wasm module "100 MiB" ([resource-limits](https://docs.internetcomputer.org/references/resource-limits.md)).
5. **Networking.**
   - Every canister is reachable at `https://<canister-id>.icp.net`.
   - Custom domains: "The service handles TLS certificate provisioning, renewal, and routing automatically" through the HTTP-gateway custom-domain service ([custom-domains](https://docs.internetcomputer.org/guides/frontends/custom-domains.md)).
   - Requests can be answered by any replica in the subnet. The dashboard lists 20 NNS-managed API boundary nodes ([ic-api nodes](https://ic-api.internetcomputer.org/api/v3/nodes)).
6. **Persistent storage: built in.** Stable memory is "500 GiB" per canister and subnet capacity is "2 TiB" ([resource-limits](https://docs.internetcomputer.org/references/resource-limits.md)).
7. **Network size, live API on 2026-10-24** ([nodes](https://ic-api.internetcomputer.org/api/v3/nodes), [node-providers](https://ic-api.internetcomputer.org/api/v3/node-providers), [data-centers](https://ic-api.internetcomputer.org/api/v3/data-centers); UI at [dashboard.internetcomputer.org](https://dashboard.internetcomputer.org)):
   - 1,280 nodes: 618 assigned to subnets, 642 unassigned/spare, 20 API boundary nodes. 889 are Gen1 and 390 Gen2.
   - 76 node providers across 101 data centres in about 33 countries (my count from region codes).
   - About 1.27M canisters.
   - Cloud Engine fields exist in the API, but the counts are inconsistent between endpoints, so they are not reported here.
8. **Chain.** ICP is its own L1, with genesis in May 2021 ([Mission 70 paper](https://internetcomputer.org/whitepapers/mission70.pdf)).
9. **Pricing: cycles, paid by the canister/developer rather than end users** (the "reverse gas" model; that phrase is not used on the cited page).
   - "1 trillion cycles = 1 XDR", a peg set by the NNS.
   - Storage costs about 329B cycles per GiB-month (about US$0.45) on a 13-node subnet.
   - 34-node subnets cost about 2.6× ("cost_on_n_node_subnet = base_cost × n / 13").
   - There is no general egress charge. Ingress bytes, cross-subnet (XNet) bytes and HTTPS outcalls are charged per byte.
   - Sources: [cycle-costs](https://docs.internetcomputer.org/references/cycle-costs/) (XDR rate as of 2026-05-22), [subnet-types](https://docs.internetcomputer.org/references/subnet-types/).
   - Whole subnets can also be rented. The Swiss 7-node rental subnet costs 440T cycles/day ([ic-api subnets](https://ic-api.internetcomputer.org/api/v3/subnets) `rental_conditions`).
10. **Open source.** The [dfinity/ic](https://github.com/dfinity/ic) repo is mostly Apache-2.0. Some files are under the "Internet Computer Community Source License" ([LICENSE](https://raw.githubusercontent.com/dfinity/ic/master/LICENSE)).
11. **Censorship/takedown.**
    - DFINITY's icp0.io boundary-node Code of Conduct says content "will be filtered at the sole discretion of the icp0.io (ic0.app) boundary node operator", and "the Operator reserves the right to cease serving the canister(s) in question". Controllers "will not be notified". An appeal email exists ([code of conduct](https://dfinity.org/boundary-nodes/ic0-app/code-of-conduct)).
    - The filtering applies to the HTTP gateway, not to the canister on-chain. Other gateways can still reach it ([forum](https://forum.dfinity.org/t/content-filtering-via-boundary-nodes/18196)).
    - The NNS governs everything: protocol upgrades, node membership and subnet creation ([evolution-scaling](https://docs.internetcomputer.org/concepts/evolution-scaling/)).
12. **Launch.** Genesis was May 2021 ([Mission 70 paper](https://internetcomputer.org/whitepapers/mission70.pdf)). The commonly cited date is 2021-05-10.
13. **2025-26 changes.**
    - **Caffeine**, an AI app builder: alpha 2025-07-15, public around 2025-10-15 ([BusinessWire](https://www.businesswire.com/news/home/20250715119613/en), [VentureBeat](https://venturebeat.com/technology/dfinity-launches-caffeine-an-ai-platform-that-builds-production-apps-from)).
    - **Mission 70** paper (2026-02-06, v1.1.1). It targets "a reduction of ICP inflation by at least 70% by the end of 2026" by cutting voting and Gen-1 node rewards, and proposes revisiting cycle pricing ([PDF](https://internetcomputer.org/whitepapers/mission70.pdf)). Whether its proposals were adopted is unverified.
    - **Cloud Engines**: "a subnet you configure and operate yourself", choosing nodes, locations and replication factor, provisioned via opencloud.org (wiki page dated 2026-04-15, [cloud-engines](https://internetcomputer.org/wiki/cloud-engines/source.md)).
    - Swiss subnet: about 13 providers at launch in Jan 2026 per secondary press ([MEXC](https://www.mexc.com/news/524856)). The rented Swiss subnet in the API has 7 nodes.
14. **Strengths vs Flux.**
    - Replication and BFT fault tolerance by default.
    - Canisters are smart contracts with on-chain state, serving web content directly.
    - Automatic TLS and custom domains.
    - Deterministic, tamper-proof execution with large per-canister stable memory.
    - Huge canister count (about 1.27M).
    - AI-native app creation (Caffeine).
    - Weaknesses for the comparison: no Docker, no GPU, and a permissioned operator set.

---

### Render Network (plus Dispersed compute subnet)

1. **Operator access: application/waitlist.**
   - Rendering nodes: "complete the Render Network Interest Form ... added to the on-boarding queue" ([KB](https://know.rendernetwork.com/general-render-network/what-role-am-i/how-to-get-started-1)). Nodes inactive for 3+ months expire and must re-apply ([KB](https://know.rendernetwork.com/general-render-network/what-role-am-i/how-to-get-started-1/running-multiple-programs-or-tasks)).
   - Compute subnet (RNP-019): "The Render Foundation will oversee demand-driven onboarding until a permissionless system is implemented". Only approved GPU models qualify, via a waitlist ([RNP-019](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-019.md)). Enterprise nodes are "limited to verified operators" ([RNP-021](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-021.md)).
   - Dispersed node operators "apply here" (May 2026 report, [Medium feed](https://rendernetwork.medium.com/render-network-foundation-monthly-report-may-2026-c98f71306a0d)). The Dispersed node registration docs exist ([docs](https://otoyinc.mintlify.app/node-operators/node-operators-register-node.md)).
2. **Placement.**
   - Rendering jobs are split by frame across many nodes: "up to 100 nodes per job" (Performance), 50 (Standard), 25 (Economy) ([pricing](https://rendernetwork.com/pricing)).
   - A Dispersed job is matched to a node and run "in isolated Docker containers". I found no multi-node replication for services ([how-it-works](https://otoyinc.mintlify.app/how-it-works.md)).
3. **Failure behaviour.**
   - Rendering: "Once a Frame is Rejected, it will automatically be sent to another node on the network to be re-rendered"; "After three failed re-renders, a job will be terminated" ([KB](https://know.rendernetwork.com/getting-started/how-to-get-started/requesting-a-new-node)).
   - Dispersed: troubleshooting lists FAILED jobs with user-side fixes. No automatic failover is documented ([troubleshooting](https://otoyinc.mintlify.app/troubleshooting.md)).
4. **Workloads.**
   - Rendering network: GPU rendering with "Octane Render, Redshift and Blender Cycles" ([FAQ](https://renderfoundation.com/faq)).
   - Dispersed: Docker on NVIDIA/CUDA, in two types. BATCH jobs run "until completion or timeout". PERSISTENT jobs run "indefinitely until explicitly stopped", billed hourly, "SSH access, dev environments, long-running services" ([job-types](https://otoyinc.mintlify.app/service-consumers/job-types.md)). Use cases are AI inference and training.
5. **Networking.** Dispersed returns `node_urls` with hostname and port, and supports `allowed_ips` ([troubleshooting](https://otoyinc.mintlify.app/troubleshooting.md)). I found no custom domains, automatic TLS or load balancing in the docs.
6. **Persistent storage.** Dispersed jobs specify `min_storage_gb` ([create-job](https://otoyinc.mintlify.app/service-consumers/service-consumers-create-job.md)). I found no persistent volumes that outlive a job.
7. **Network size.**
   - The official stats page on 2026-10-24 shows "Total Nodes Since Inception: 5,600" (cumulative, not currently active) and 82,560,402 frames rendered ([stats.renderfoundation.com](https://stats.renderfoundation.com/)).
   - The network passed 80M frames in Sep 2026 ([Sep 2026 report](https://rendernetwork.medium.com/render-network-foundation-monthly-report-sep-2026-32da2c33e5be)).
   - Salad claims "60,000 daily heartbeating GPUs" and is integrating as a subnet ([RNP-023](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-023.md)).
   - I found no official current active-node or GPU count.
8. **Chain.** Render runs on Solana. Upgrades from ETH RNDR to SPL RENDER started 2023-11-02 under RNP-002 ([upgrade portal](https://renderfoundation.com/upgrade), [KB FAQ](https://know.rendernetwork.com/the-solana-shift-what-you-need-to-know/render-network-upgrade-portal-faq)). 77% of tokens (423M RENDER) had been upgraded by Oct 2025 ([RNP-022](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-022.md)).
9. **Pricing: fixed price, euro-denominated, plus BME burns.**
   - Rendering tiers, per 400 OctaneBench-hours: Performance €2.40, Standard €1.20, Economy €0.60; Enterprise €4.00 is "To Be Released". Billing is "down to the minute" ([pricing](https://rendernetwork.com/pricing)).
   - Bandwidth: 0.09 credits per GB of scene assets sent to each node ([pricing](https://rendernetwork.com/pricing)).
   - Compute: "Customers fund jobs in fiat (USD) or RENDER ... 95% of credits procure RENDER on open markets, burned" ([RNP-019](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-019.md)). Dispersed credit purchases are in EUR via Stripe ([API](https://otoyinc.mintlify.app/api-reference/compute-ledger/create-credit-purchase.md)).
   - RNP-021 proposes moving toward a "Dynamic Auction System" ([RNP-021](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-021.md)).
10. **Open source: core is closed (OTOY).** The [rendernetwork GitHub org](https://github.com/rendernetwork) holds only RNPs, a C4D plugin and similar. The [dispersednetwork org](https://github.com/dispersednetwork) holds examples only.
11. **Censorship/takedown.** Onboarding, job allocation and payments are run centrally by the Render Foundation and OTOY: "Rotational assignment" ([RNP-019](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-019.md)). Nodes can be quarantined ([KB](https://know.rendernetwork.com/general-render-network/what-role-am-i/how-to-get-started-1/running-multiple-programs-or-tasks)). I could not retrieve the ToS content clause (JS-rendered page).
12. **Launch.** "The Render Network token was launched in 2017 and the network launched to the public in 2020" ([FAQ](https://renderfoundation.com/faq)).
13. **2025-26 changes.**
    - RNP-019, the Render Compute Network, was created 2025-03-31 and is now Implemented.
    - RNP-021 adds enterprise GPUs (H100/H200/A100/MI300), "up to 1,200 NVIDIA H200" equivalent, and is Implemented.
    - Dispersed launched in Q4 2025 ([June 2026 report](https://rendernetwork.medium.com/render-network-foundation-monthly-report-june-2026-d03f6be54fe9)).
    - RNP-023 makes Salad an exclusive RENDER subnet. It was approved Apr 2026, and Salad had shipped RENDER customer payments by Jun 2026 ([RNP-023](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-023.md), [June report](https://rendernetwork.medium.com/render-network-foundation-monthly-report-june-2026-d03f6be54fe9)).
    - RNP-024 "Forth" AI gateway (x402 on Solana with RENDER/USDC) is a Draft dated 2026-10-16 ([RNP-024](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-024.md)).
14. **Strengths vs Flux.**
    - Best-in-class distributed GPU rendering, with OctaneRender, Redshift and Blender integration through OTOY.
    - Can fan a job out to 100 nodes.
    - Real artist and studio case studies (Latin Grammys visuals, SUBMERGE at 18K).
    - Euro fixed pricing.
    - Salad's large consumer-GPU fleet coming on board.
    - Weaknesses for the comparison: not a general always-on web host with domains, TLS or HA, and the stack is closed source and centrally coordinated.

---

### Golem Network

1. **Operator access: permissionless.** "In general, almost any computer might act as a provider" ([overview](https://docs.golem.network/docs/golem/overview)). The requirements are x86-64 Linux with `/dev/kvm`. The install docs mention no KYC or stake ([provider-installation](https://docs.golem.network/docs/providers/provider-installation)).
2. **Placement.** One requestor rents activities from individual providers. "one requestor can use the hardware from many providers at the same time" ([overview](https://docs.golem.network/docs/golem/overview)). There is no automatic replication of a single service.
3. **Failure behaviour.**
   - The Task API retries automatically: "by default, a retry mechanism will relaunch the task on a different provider" ([error handling](https://docs.golem.network/docs/creators/javascript/guides/error-handling)). Defaults differ by version: maxTaskRetries 3 ([TaskModel](https://github.com/golemfactory/golem-sdk-task-executor/blob/HEAD/docs/TaskModel.md)).
   - I found no documented auto-migration for long-running services.
4. **Workloads.** VM runtime using a "Golem VM Image, which is derived from the Docker image" ([overview](https://docs.golem.network/docs/golem/overview)), plus WASM (wasmtime). Covers batch tasks and services, with Ray and Golem-Workers APIs. A GPU provider exists (beta since 2024), but the live stats show 0 GPUs (item 7).
5. **Networking.**
   - Outbound access is off unless the provider allows it, by whitelist or signed manifest ([accessing-internet](https://docs.golem.network/docs/creators/javascript/guides/accessing-internet)).
   - Inbound access goes through a requestor-side socket proxy over the Golem VPN, which "does not enable direct, inbound access" to the provider's IP ([yagna 0.12 blog](https://blog.golem.network/golem-yagna-0-12-a-vast-new-world-of-exciting-possibilities-2/)).
   - No custom domains, TLS or load balancing.
6. **Persistent storage.** I found no persistent volumes documented (unverified).
7. **Network size, live API on 2026-10-24** ([api2.stats.golem.network/v2/network/online/stats](https://api2.stats.golem.network/v2/network/online/stats), the backend for [stats.golem.network](https://stats.golem.network)):
   - 792 providers online, 5,015 cores, about 7,713 GiB RAM, about 39,215 GiB storage, and **0 GPUs**.
   - Provider earnings were about 664 GLM in the last 24h and about 18,372 GLM in the last 30 days ([earnings](https://api2.stats.golem.network/v1/network/earnings/overviewnew)).
8. **Chain.** GLM is an ERC-20 on Ethereum and Polygon ([golem.network](https://golem.network/)). Payments are "most commonly executed through Polygon" ([overview](https://docs.golem.network/docs/golem/overview)). The GNT to GLM migration portal is [migrate.golem.network](https://migrate.golem.network). Arkiv, a Golem "owned, queryable data" chain "Powered by $GLM", is "currently available on testnet only" ([arkiv.network](https://arkiv.network/)).
9. **Pricing: open market.** Providers set CPU/h, Env/h and start prices in GLM, and requestors choose offers ([requestor FAQ](https://docs.golem.network/docs/golem/overview/requestor-faq)). Payment is pay-as-you-go ("payu" scheme in the provider offers in the stats API). Everything is GLM-denominated, with no USD or stablecoin option found.
10. **Open source.** [golemfactory/yagna](https://github.com/golemfactory/yagna) is GPL-3.0 (GitHub API).
11. **Censorship/takedown.** The provider side controls outbound rules and can restrict by requestor or "audited-payload" signatures ([accessing-internet](https://docs.golem.network/docs/creators/javascript/guides/accessing-internet)). Golem Factory blocked providers on vulnerable versions from the marketplace in 2026 ([security update](https://blog.golem.network/golem-network-security-review-update/)), so the marketplace has a central control point.
12. **Launch.** The new Golem (Yagna) Beta I mainnet launched 2021-03-11 ([blog](https://blog.golem.network/mainnet-release-beta-i/)). The original Brass Golem Beta mainnet launched 2018-04-10 ([blog](https://blog.golem.network/ready--set--launch-/)).
13. **2025-26 changes.**
    - Golem Ecosystem Fund one-year report, 2025-10-10 ([blog](https://blog.golem.network/golem-ecosystem-fund-one-year-in-highlights-allocations-and-whats-next/)).
    - Security review: 36 vulnerabilities fixed, 1 critical sandbox file-access bug, fixes in v0.17.10+/v0.18.0, and old versions blocked (2026-09-23, [blog](https://blog.golem.network/golem-network-security-review-update/)).
    - Salad "began a test with Golem Network (GLM)" in early 2026, then chose Render exclusively ([RNP-023](https://raw.githubusercontent.com/rendernetwork/RNPs/main/RNP-023.md)).
    - Arkiv is on testnet.
14. **Strengths vs Flux.**
    - Oldest DePIN compute project (2016).
    - Genuinely permissionless, GPL-licensed.
    - Built-in task retry across providers suits batch, embarrassingly parallel jobs (rendering, Ray).
    - Weaknesses: small and shrinking supply, no GPUs online, and not a web-hosting platform (no inbound endpoints or domains).

---

### Fluence (now branded fluence.ai)

1. **Operator access: vetted datacentres only.** "Providers must operate Tier 3 or Tier 4 data centers and complete a KYB review before joining" ([connect_servers](https://fluence.dev/docs/connect_servers/llms.txt)). Bare metal is managed through a "centralized application, developed and securely hosted by the Fluence team" (Talos Linux plus Kubernetes) ([provider overview](https://fluence.dev/docs/connect_servers/overview.md)).
2. **Placement: one provider per instance.** An offer is "one or more compute peers ... in the same data center". A peer "is the actual machine that runs your workload" ([cpu_cloud concepts](https://fluence.dev/docs/build/cpu_cloud/overview.md)). VPC for multi-VM deployments arrived 2026-09-08 ([blog](https://fluence.ai/blog/fluence-vpc/)).
3. **Failure behaviour: manual.** "Terminated instances are no longer accessible, and data stored on them is lost". The user must remove the record to release the reserved balance ([manage_vm](https://fluence.dev/docs/build/cpu_cloud/manage_vm.md)). Unused funds are refunded on stop or termination. If GPU provisioning fails, "funds are returned" ([gpu_cloud concepts](https://fluence.dev/docs/build/gpu_cloud/overview.md)). No automatic failover is documented.
4. **Workloads.**
   - CPU VMs (custom qcow2/raw images) ([cpu_cloud](https://fluence.dev/docs/build/cpu_cloud/overview.md)).
   - GPU containers (Docker), GPU VMs and bare metal ([gpu_cloud](https://fluence.dev/docs/build/gpu_cloud/overview.md)).
   - Always-on services and inference/training.
   - GPU Cluster Auctions for reserved clusters (2026-08-04, [blog](https://fluence.ai/blog/gpu-cluster-auctions/)).
5. **Networking.**
   - GPU containers get "a domain and maps your ports to externally accessible forwarded ports", plus an HTTP URI if port 80 is enabled ([manage_instances](https://fluence.dev/docs/build/gpu_cloud/manage_instances.md)).
   - VMs get a public IP. Public IP management arrived 2026-04-20 ([blog](https://fluence.ai/blog/persistent-storage-volumes-public-ip-management/)).
   - I found no automatic TLS, custom domains or load balancer in the docs.
6. **Persistent storage.** Persistent volumes for VMs since 2026-04-20 ([blog](https://fluence.ai/blog/persistent-storage-volumes-public-ip-management/)).
7. **Network size.**
   - "1400+ GPUs across 32 regions and 71 data centers" (Telegram 2026-02-26, [t.me](https://t.me/s/fluence_official); [PR 2026-03-12](https://fortune.com/press-releases/fluence-gpu-cloud-public-access-ai-infrastructure-2026-03-12/), a paid release).
   - GPU Cluster Auctions launched "with 6,000+ GPUs in clusters available" (2026-08-04, [t.me](https://t.me/s/fluence_official)).
   - Q3 2026 auctions "facilitated multiple deals worth a combined $26.9M+" (2026-10-05, [t.me](https://t.me/s/fluence_official)).
   - I found no live public explorer count.
8. **Chain.**
   - FLT is an ERC-20 on Ethereum, launched Feb 2024 with the platform on Filecoin's IPC ([mpost](https://mpost.io/fluence-launches-flt-token-on-ethereum-mainnet-alongside-cloudless-computing-platform)).
   - The platform later moved to an Arbitrum Orbit Optimium. That rollup was **shut down 2026-04-01**, and FLT and USDC were migrated to Ethereum L1, claimable until 2027-04-01 ([L2BEAT](https://l2beat.com/layer2s/projects/fluence), [blog 2026-03-31](https://fluence.ai/blog/ai-focus-flt-updates/)).
   - The docs index still says "Built on an Arbitrum Orbit L2 appchain", which is stale ([fluence.dev/llms.txt](https://fluence.dev/llms.txt)).
   - Governance moved from Tally to the Token App in May 2026 ([t.me](https://t.me/s/fluence_official)).
9. **Pricing: USD-denominated, with providers setting prices.**
   - "CPU Cloud uses daily billing in USD"; "GPU Cloud uses hourly pre-paid billing in USD".
   - Top-ups by card (Stripe) or crypto (NOWPayments) ([balance](https://fluence.dev/docs/build/balance.md)). x402 USDC on Base for agents (2026-09-28, [docs](https://fluence.dev/docs/build/api/x402.md)).
   - GPU clusters are priced by reverse auction ([blog](https://fluence.ai/blog/gpu-cluster-auctions/)).
   - The homepage claims "Zero egress fees and unlimited bandwidth" ([fluence.ai](https://fluence.ai/)), a vendor claim.
   - Sample prices: H100 80GB from $1.24/h, H200 from $2.96/h (Mar 2026 PR).
10. **Open source: mostly no longer.**
    - The legacy stack (Nox AGPL-3.0, Aqua, Marine) is archived on GitHub as of mid-2025.
    - The current console and provider stack has no licensed public repo. Only infra repos and a Terraform provider are public ([github.com/fluencelabs](https://github.com/fluencelabs), via the GitHub API).
11. **Censorship/takedown.** Providers terminate for "Violating the terms of service" or "illegal activities or running malicious workloads" ([manage_vm](https://fluence.dev/docs/build/cpu_cloud/manage_vm.md)). The Fluence team hosts the provider app and console centrally.
12. **Launch.** FLT and the "Cloudless" platform went live in Feb 2024 ([mpost](https://mpost.io/fluence-launches-flt-token-on-ethereum-mainnet-alongside-cloudless-computing-platform)). The GPU marketplace was announced 2025-10-02 ([2025 recap](https://fluence.ai/blog/fluence-2025-year-end-recap/)), and public GPU console access opened 2026-02-26.
13. **2025-26 changes.**
    - Pivot to AI/GPU and rollup sunset.
    - Provider incentive programme "complete"; FLT staking moved to Ethereum L1 ([blog](https://fluence.ai/blog/ai-focus-flt-updates/)).
    - Domain changed to fluence.ai (2026-08-20).
    - VPC, x402 payments, MCP server (2026-10-01).
    - Cumulative network revenue hit $1M on 2025-12-26 ([recap](https://fluence.ai/blog/fluence-2025-year-end-recap/)).
14. **Strengths vs Flux.**
    - Enterprise Tier 3/4 hardware with KYB, plus H100, H200 and B200 offers.
    - USD billing with card payments.
    - Multi-million-dollar reserved GPU cluster deals.
    - VPC and private networking.
    - Weaknesses for the comparison: permissioned supply, mostly closed source, essentially a centrally run marketplace after the rollup sunset, and no replication or failover.

---

### Filecoin (storage-only)

- **Operators.** Storage providers seal sectors and post FIL collateral ("take FIL collateral"). They face "automatic financial penalties if you cannot demonstrate data availability" and need 10 TiB of raw byte power to win block rewards ([SP basics](https://docs.filecoin.io/storage-providers/basics/)). There is no approval at protocol level.
- **Filecoin Onchain Cloud** went live on mainnet on 2026-03-26. Its storage providers are "onboarded, tested, and approved", and are removed if they miss thresholds. It stores "two independent copies by default", priced from "$2.50 per TiB per month per copy", with PDP proofs every 24h and payments that "halt automatically if proofs stop" ([blog](https://filecoin.io/blog/filecoin-onchain-cloud-is-live-on-mainnet)).
- **Network size, live API on 2026-10-24.** About 1.47 EB (≈1.27 EiB) raw byte power, about 13.4 EB quality-adjusted power, and 459 active miners ([filfox overview API](https://filfox.info/api/v1/overview)).
- **Chain and launch.** Filecoin is its own L1. Mainnet launched 2020-10-15 at block 148,888 ([The Block](https://www.theblock.co/post/81183/decentralized-storage-project-filecoin-launches-long-anticipated-mainnet)).
- **Open source.** [filecoin-project/lotus](https://github.com/filecoin-project/lotus) is dual-licensed MIT/Apache-2.0 (the repo root has LICENSE-MIT and LICENSE-APACHE).
- **Relevance.** Storage only, with no general compute. It is a plausible backing store, not a container cloud.

### Arweave (storage-only)

- **Model.** "Users pay for 200 years' worth of replicated storage at present prices". The fee goes into an endowment that pays miners over time. The network "collectively store[s] multiple copies of all data" ([dev overview](https://docs.arweave.org/developers/development/overview)).
- **Content policy.** "every participant is able to choose what data they would like to store and serve". Miners use blacklists and Shepherd policies ([dev overview](https://docs.arweave.org/developers/development/overview), [mining blacklist](https://docs.arweave.org/developers/mining/overview/blacklist)). AR.IO gateways can each blocklist content, ArNS names or addresses ([ar.io moderation](https://docs.ar.io/gateways/moderation)).
- **Size, live node on 2026-10-24.** Weave size about 392 TB (0.39 PB), block height 2,028,079 ([arweave.net/block/current](https://arweave.net/block/current)). I found no official miner count.
- **Chain and launch.** Arweave is its own chain, with mainnet in June 2018 (secondary source: [CrowdfundInsider](https://www.crowdfundinsider.com/2020/03/158386-blockchain-startup-arweave-a-permanent-storage-solution-provider-secures-8-3-million-in-funding-from-andreessen-horowitz-coinbase-ventures-others/)). The AO compute layer went live on mainnet 2025-02-08 ([The Block](https://www.theblock.co/news/ecosystems/2025-02-08-arweaves-computing-platform-ao-goes-live-on-mainnet-339450)).
- **Open source.** [ArweaveTeam/arweave](https://github.com/ArweaveTeam/arweave) is GPL-2.0 (GitHub API).
- **Relevance.** Permanent, immutable storage that fits static assets and archives. It is not mutable app hosting.

---

### Gaps / uncertain

- **Akash egress.** I found no first-party statement on bandwidth or egress billing. The "free egress" claim is from a reseller.
- **Akash tenant blocklist.** I found no doc for a provider-side tenant/address blocklist. Only "Control what workloads you accept" is confirmed.
- **Akash payment units in the API.** The console API labels `totalUUsdcSpent` with the same value as ACT. Treat daily spend as ACT, which is ≈USD.
- **ICP Mission 70 adoption.** I could not confirm which Mission 70 measures passed as NNS proposals, or when.
- **ICP Cloud Engines.** Status, pricing and live counts are unclear, and the dashboard API fields disagree with each other. The Swiss subnet node count (13 per press vs 7 in the rented subnet in the API) is unreconciled.
- **ICP launch date.** The exact day 2021-05-10 is common knowledge; the official paper I cite says only "May 2021".
- **ICP GPU / "AI nodes".** I found no live GPU capability, so do not claim ICP has GPUs.
- **Render node counts.** There is no official current active-node or GPU count. 5,600 is cumulative since inception, and the monthly report metrics are images.
- **Render other gaps.** The ToS takedown clause was not retrieved. Dispersed failover, domains and TLS are undocumented.
- **Golem.** GPU provider status in 2026 is unclear (stats show 0 GPUs). Persistent storage and service auto-recovery are not documented. Earnings units are assumed to be GLM.
- **Fluence chain dates.** The date of the move from IPC to Arbitrum Orbit was not found.
- **Fluence console status.** The docs still say Console is "only available to participants of the Alpha VM testing program", which conflicts with the Feb 2026 public launch. The docs are stale.
- **Fluence GPU figures.** These are company claims, partly from a paid press release. "6,000+ GPUs in clusters" refers to auction-listed provider clusters, not on-demand inventory.
- **Arweave miner count.** Not found. The mainnet date comes from a secondary source.

## 13. Appendix B: DePIN platform notes, set B

_Research pass B, 2026-10-24. Re-checked: io.net explorer active_gpu 1,307 (total_gpu 1,061,267); Nosana 46 countries in the nodes-country API._


Researched 2026-10-24. "Live" numbers come from the platform's own public APIs or dashboards, fetched 2026-10-24 unless another date is given. Marketing claims are labelled as such. Where something could not be verified, it says so.

---

### Aethir

1. **Operator access: application-gated, enterprise bare metal, staked, KYC for payouts.**
   - Cloud Hosts must "Fill out our Cloud Host Application Form", then register servers and stake ATH ([Get Started](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/cloud-host-portal-guide/get-started.md)).
   - Hardware rules: x86, "bare-metal servers (i.e., non-virtualized physical machines)", Ubuntu 20.04/22.04, a public IP, SSH, and "Only enterprise-grade GPUs that meet our benchmarked performance metrics". GPUs from China or OFAC/UN-sanctioned regions are refused ([Operational Requirements](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts.md)).
   - SLO: 99% monthly uptime, under 30 min offline per day, 15-minute response to P0 incidents. Penalties slash the stake ([same](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts.md); [Slashing](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts/slashing-mechanism.md)).
   - Stake = K-Value × coefficient. As of 22 Dec 2025: 1×H100 = 45,095 ATH, 8×H100 = 360,763 ATH. Unstaking takes 180 days ([Staking](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts/staking-as-cloud-host.md); [Staking Parameters](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts/staking-as-cloud-host/staking-parameters.md)).
   - The same K-Value table also lists consumer RTX cards, "PC-L1..L4", "Mobile/Phone" tiers, RK3588 and Snapdragon 865. So the "GPU containers" Aethir counts include non-data-centre devices such as cloud phones and gaming hardware ([Staking Parameters](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts/staking-as-cloud-host/staking-parameters.md)).
   - KYC through ComPilot is required to claim or withdraw. US persons are excluded ([KYC](https://docs.aethir.com/aethir-tokenomics/complete-kyc-verfication.md)).
   - Checker Nodes only verify Containers. They are licence NFTs, and the sales are closed ([What is the Checker Node](https://docs.aethir.com/checker-guide/what-is-the-checker-node.md)).
2. **Placement: one rented server, no replication.** On Aethir Earth you "Browse the list of available servers... Select the server". Minimum rental is 1 week ([Aethir Earth portal](https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/cloud-customer-portal-guide/aethir-earth.md)). Atmosphere (gaming) uses an Indexer to match users to Containers ([FAQ](https://docs.aethir.com/aethir-introduction/faq.md)).
3. **Failure: the host must repair it manually; no migration is documented.**
   - Reprovisioning a node that is out of service is a host P0 task, resolved in "Up to 4 hours" ([Operational Requirements](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts.md)).
   - Refunds: if a container goes down, OnDemand fees for the affected period are not charged. For Reserve orders, the current 24-hour fee is not charged ([Service Fees](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/rewards-and-service-fees-for-cloud-hosts/service-fees-for-cloud-host.md)).
   - Slashed stakes go to a "compensation" pool for tenants ([Slashing](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts/slashing-mechanism.md)).
   - Marketing says the network "eliminates single points of failure" ([buyer guide, 8 Jun 2026](https://aethir.com/blog-posts/aethirs-gpu-as-a-service-in-2026-a-compute-buyer-guide)).
4. **Workload: bare-metal GPU servers with SSH. You manage orchestration yourself.**
   - Earth targets AI training, fine-tuning and inference. "Slurm, Kubernetes, or Nomad" are out of scope and the customer's job ([Earth Service Guide](https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/aethir-cloud-products/aethir-earth-service-guide.md)).
   - Atmosphere covers cloud gaming ([Products](https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/aethir-cloud-products.md)).
   - Newer products: Aethir Mesh, an LLM API ([Mesh](https://docs.aethir.com/aethir-mesh.md)), and Aethir Claw, hosted OpenClaw agents ([Claw](https://docs.aethir.com/aethir-claw.md)).
   - There is no managed container platform. Always-on services work only in the sense that you rent a whole server.
5. **Networking:** each server gets a public IP and SSH ([Operational Requirements](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts.md)). No managed load balancing, custom domains or TLS are documented.
6. **Network size: self-reported "GPU containers", not physical data-centre GPUs.**
   - Docs FAQ (undated): "over 435k GPUs" of container capacity, $147M ARR, 1.3B+ compute hours ([FAQ](https://docs.aethir.com/aethir-introduction/faq.md)).
   - 10 Oct 2025: "435,000+ GPU containers across 93 countries", Q3 2025 revenue $39.86M, "ARR reached $166M" ([Q3 blog](https://ecosystem.aethir.com/blog-posts/aethirs-record-breaking-q3)).
   - 8 Jun 2026: 94 countries, 200+ locations ([buyer guide](https://aethir.com/blog-posts/aethirs-gpu-as-a-service-in-2026-a-compute-buyer-guide)).
   - I found no public count of H100, H200 or B200 units.
   - Independent figures from DefiLlama service fees (gross customer fees, of which 20% is protocol revenue):
     - Trailing 30 days to about 22 Oct 2026: $6.80M. Trailing 1 year: $66.2M.
     - Q3 2026 (Jul–Sep) about $12.7M, against Q3 2025 about $39.9M, a drop of about 68%.
     - Monthly peak was Sep 2025 at $13.9M ([DefiLlama API](https://api.llama.fi/summary/fees/aethir?dataType=dailyFees); [DefiLlama page](https://defillama.com/protocol/aethir)).
     - The Q3 2025 DefiLlama figure matches Aethir's own reported $39.86M.
7. **Chain:** ATH is an ERC-20 on Ethereum (canonical). Arbitrum handles Checker and compute rewards. A Solana copy exists ([Token Overview](https://docs.aethir.com/aethir-tokenomics/token-overview.md)). A "wATH" contract on Base is flagged as fake ([Official Bridges](https://docs.aethir.com/aethir-tokenomics/official-ath-bridges.md)).
8. **Pricing: USD prices, settled in ATH.**
   - "priced in fiat currency but settled in ATH tokens". The platform sets uniform prices per region and spec, with Reserve and OnDemand modes and a 20% protocol fee ([Service Fees](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/rewards-and-service-fees-for-cloud-hosts/service-fees-for-cloud-host.md)).
   - Self-serve customers "need ATH to purchase compute" ([Get Started](https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/cloud-customer-portal-guide/get-started.md)).
   - H100 at **$1.25/GPU-hr** in the enterprise cost calculator, fetched 2026-10-24 ([enterprise.aethir.com](https://enterprise.aethir.com)).
   - "no egress fees" ([buyer guide, Jun 2026](https://aethir.com/blog-posts/aethirs-gpu-as-a-service-in-2026-a-compute-buyer-guide)).
   - A floating network fee and daily ATH burn go live in November 2026 ([Burn Mechanism](https://docs.aethir.com/aethir-tokenomics/ath-burn-mechanism.md)).
9. **Open source: no.** The GitHub org only holds `checker-client` and `HostAgent` repos with versioned release folders and no licence ([github.com/AethirCloud](https://github.com/AethirCloud)).
10. **Censorship and takedown: renters are vetted.**
    - Renters apply through a "Cloud Customer Application Form" ([Get Started](https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/cloud-customer-portal-guide/get-started.md)). Enterprise access goes through a HubSpot form ([enterprise.aethir.com](https://enterprise.aethir.com)).
    - Aethir runs 24/7 operations and can reset or reprovision servers ([Earth Service Guide](https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/aethir-cloud-products/aethir-earth-service-guide.md)).
11. **Launch:** ATH listed 12 June 2024 ([Token Overview](https://docs.aethir.com/aethir-tokenomics/token-overview.md)).
12. **2025–26 changes:**
    - Predictive Oncology launched an ATH treasury on 29 Sep 2025, with about $343.5M of PIPEs closing 8 Oct 2025. It was renamed Axe Compute (Nasdaq: AGPU) on 11–12 Dec 2025 ([Nasdaq PR](https://www.nasdaq.com/press-release/predictive-oncology-becomes-axe-compute-expanding-high-performance-ai-infrastructure); [10-Q](https://www.sec.gov/Archives/edgar/data/0001446159/000117184326003484/agpu20260331_10q.htm)).
    - The ATH bridge (AethirOFTAdapter) was exploited on 9–10 Apr 2026. Aethir says losses were under $90K ([Cointelegraph](https://cointelegraph.com/news/aethir-bridge-exploit-halt-user-compensation-90k-loss)).
    - Mesh and Claw products launched ([Mesh](https://docs.aethir.com/aethir-mesh.md)). The burn and floating fee start in Nov 2026 ([Burn](https://docs.aethir.com/aethir-tokenomics/ath-burn-mechanism.md)).
    - Revenue is down about 68% year on year ([DefiLlama](https://api.llama.fi/summary/fees/aethir?dataType=dailyFees)).
13. **Genuine strengths compared with Flux:**
    - By a wide margin the largest DePIN compute network by customer fees. On DefiLlama, Aethir's 30-day fees were $6.8M, against Render BME $0.54M and Akash (chain fees) $0.21M ([DefiLlama fees overview](https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyFees)).
    - Catalogue covers H100, H200, B200 and GB200 bare metal ([Staking Parameters](https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts/staking-as-cloud-host/staking-parameters.md)) and clusters up to "4K-GPU" ([enterprise](https://enterprise.aethir.com)).
    - SLA-bound enterprise hosts, and "150+ partners and clients" ([Mesh](https://docs.aethir.com/aethir-mesh.md)).

### io.net

1. **Operator access: permissionless sign-up, plus proof of work and staking. Some inventory comes from partners.**
   - Anyone signs up at worker.io.net with Google, Apple, X or Worldcoin ([Intro](https://io.net/docs/guides/workers/intro.md)).
   - Devices must pass Proof of Work. There is a 12-hour wait after first onboarding, and "Your must stake to your device to make it eligible for block rewards and to be hired for jobs" ([Device Onboarding](https://io.net/docs/guides/workers/device-onboarding.md); [Proof of Work](https://io.net/docs/guides/workers/proof-of-work.md)).
   - Minimum stake is 200 IO per GPU × earning multiplier; the docs' example is 8×H100 = 16,000 IO. Unstaking has a 14-day cooldown, and slashing applies for spoofing or "inadequate service" ([Staking](https://io.net/docs/guides/staking/io-staking.md)).
   - Suppliers have needed 3 self-custodial Solana wallets since 30 Apr 2025 ([Payments](https://io.net/docs/guides/payment/io-cloud-payments.md)).
   - Mining is detected and the device is auto-banned ([Device Onboarding](https://io.net/docs/guides/workers/device-onboarding.md)).
   - VM listings distinguish "Partner-provided clusters" from io.net-supplied ones ([VM on Demand](https://io.net/docs/guides/clouds/deploy-vm-on-demand.md)).
2. **Placement: a single node per container or VM.** The CaaS API says containers "must run within a single node... Multi-node GPU configurations are not supported" ([Deploy a Container API](https://io.net/docs/reference/caas/deploy-a-container.md)). You can request N "Replicas", and each container gets its own Public URL ([Deploy Containers](https://io.net/docs/guides/clouds/deploy-containers.md)).
3. **Failure: no documented automatic rescheduling while running.**
   - Health checks are "monitoring only: a failing check never stops your container" ([Deploy Containers](https://io.net/docs/guides/clouds/deploy-containers.md)).
   - Under pay-as-you-go, the first hour is non-refundable. Prepaid time is refunded only if a booking "fails for a reason on our side" ([Pay-As-You-Go](https://io.net/docs/guides/payment/pay-as-you-go.md)).
   - At deploy time you choose what happens if not all GPUs can be obtained: extend, refund, or fail ([Deploy Containers](https://io.net/docs/guides/clouds/deploy-containers.md)).
   - The legacy Ray-cluster page claims "Self-healing" ([Monitor Clusters](https://io.net/docs/guides/clouds/monitor-manage-clusters.md)).
4. **Workload: GPU HTTP containers, GPU VMs, and managed clusters through sales.**
   - CaaS: "Only HTTP server containers are supported. Only a single traffic port is allowed. Each container must use a minimum of 1 GPU" ([API](https://io.net/docs/reference/caas/deploy-a-container.md)).
   - VMs: Ubuntu 24.04 with SSH ([VM on Demand](https://io.net/docs/guides/clouds/deploy-vm-on-demand.md)).
   - Bare Metal, Kubernetes, Ray and Confidential Compute (TDX/SEV-SNP on H100/H200/B200) are managed services via business@io.net. "Self-service deployment for these cluster types is no longer available. Bare Metal on Demand was withdrawn on Wednesday, October 1, 2025" ([Managed Services](https://io.net/docs/guides/clouds/managed-services.md)).
   - IO Intelligence provides LLM APIs and agents ([Intelligence payments](https://io.net/docs/guides/payment/io-intelligence-payments.md)).
5. **Networking:**
   - Containers get an unauthenticated Public URL per container. No load balancer across replicas is documented ([Run a Model](https://io.net/docs/guides/clouds/run-a-model-on-containers.md)).
   - VMs expose ports through "Network Services" ([VM](https://io.net/docs/guides/clouds/deploy-vm-on-demand.md)).
   - On managed Kubernetes it is do-it-yourself: ingress-nginx, ExternalDNS, cert-manager. The docs note "No automatic failover without additional tools" ([K8s exposing](https://io.net/docs/guides/clouds/kubernetes/exposing-to-the-internet.md)).
6. **Network size: the gap between marketing and live supply is huge.** From io.net's own explorer API on 2026-10-24:
   - `network/info`: total_gpu 1,061,267, verified_gpu 327,085, **active_gpu 1,309** ([API](https://api.io.solutions/v1/io-explorer/network/info)).
   - `inventory-aggregated`: 2,101 GPUs (1,319 active plus 782 "passive") ([API](https://api.io.solutions/v1/io-explorer/network/inventory-aggregated)).
   - `devices/hardware`: 1,309 GPUs, 1,307 of them hired. These include 640 H100 80GB HBM3 (all hired), 616 RTX 4090 and 8 B300 ([API](https://api.io.solutions/v1/io-explorer/devices/hardware)).
   - 19 running clusters. Cumulative cluster earnings $29.0M ([API](https://api.io.solutions/v1/io-explorer/network/info/clusters)).
   - Last 30 days of cluster earnings to 23 Oct 2026: about **$1.03M**, roughly $35K per day, or about $12.4M annualised. Monthly figures for Apr–Sep 2026 ranged $0.36M–$1.10M ([API](https://api.io.solutions/v1/io-explorer/network/info/cluster/total-earnings-summary)).
   - Marketing claims "320,000+ GPUs ... 130+ countries" ([io.net blog page](https://io.net/p/h100-gpu-cloud-where-to-rent-complete-pricing-guide-for-2026)) and "138 countries" ([PR, 11 Jun 2026](https://www.coindesk.com/press-release/2026/06/11/io-net-to-burn-up-to-12m-tokens-as-network-closes-usd8m-deal-and-hits-4-billion-daily-ai-tokens)).
   - An independent tracker logged 1,305 active on 20 Oct 2026 ([ownyourmind.ai](https://ownyourmind.ai/projects/io-net/)).
   - [explorer.io.net](https://explorer.io.net) is the UI for this data.
7. **Chain:** Solana. The docs say "Powered by Solana", and block rewards go to Solana wallets ([Overview](https://io.net/docs/guides/getting-started.md); [Staking](https://io.net/docs/guides/staking/io-staking.md)).
8. **Pricing: prepaid USD credits.**
   - Compute is paid "only with IO Credits": by card with a 5% fee, or with IO or USDC at no fee, "current as of October 2026" ([Payments](https://io.net/docs/guides/payment/io-cloud-payments.md)).
   - The supplier can change the price of a booking while it runs ([PAYG](https://io.net/docs/guides/payment/pay-as-you-go.md)).
   - H100 SXM from $2.60/GPU-hr (2× in the US) to $4.81 (8× in Finland), third-party data updated 24 Oct 2026 ([computeprices.com](https://computeprices.com/providers/ionet/gpus/h100)). io.net's own blog quotes inconsistent figures ($1.49–$3.50).
   - Egress fees are not documented.
9. **Open source: core is not open.** The worker ships as binaries with no licence ([ionet-official/io_launch_binaries](https://github.com/ionet-official/io_launch_binaries)). Only demos and an attestation agent carry MIT or Apache licences ([org](https://github.com/ionet-official)). Even so, the homepage title reads "The Open Source AI Infrastructure Platform".
10. **Censorship and takedown:**
    - Renters sign up with social login. I could not verify whether renters face KYC: the [Terms page](https://io.net/terms) is JavaScript-rendered and would not load.
    - Managed clusters are gated by sales ([Managed Services](https://io.net/docs/guides/clouds/managed-services.md)).
    - Scheduling, payments and bans are run centrally ([Device Onboarding](https://io.net/docs/guides/workers/device-onboarding.md)).
11. **Launch:** started at a Solana hackathon in Feb 2023 ([Overview](https://io.net/docs/guides/getting-started.md)). IO listed on Binance 11 Jun 2024 via Launchpool ([BeInCrypto](https://beincrypto.com/binance-announces-launchpool-for-io-net/)).
12. **2025–26 changes:**
    - IO Intelligence launched 17 Feb 2025 ([Decrypt](https://decrypt.co/306329/io-net-launches-generative-intelligence-platform-for-developers?amp=1)).
    - Self-serve Bare Metal was withdrawn 1 Oct 2025 ([Announcements](https://io.net/docs/guides/announcements/announcements.md)).
    - The Incentive Dynamic Engine (IDE) and revenue-linked burn launched 11 Jun 2026. The company claims an $8M enterprise contract worth about $650K a month and "over 4 billion tokens processed per day" ([PR](https://www.coindesk.com/press-release/2026/06/11/io-net-to-burn-up-to-12m-tokens-as-network-closes-usd8m-deal-and-hits-4-billion-daily-ai-tokens)).
    - An independent review argues the burn "is emission-funded rather than the revenue buyback marketed" ([ownyourmind.ai](https://ownyourmind.ai/projects/io-net/)).
13. **Genuine strengths:**
    - Real data-centre H100s in use: 640 hired H100 SXM in the live API ([API](https://api.io.solutions/v1/io-explorer/devices/hardware)).
    - Managed Kubernetes, Ray and confidential-compute clusters ([Managed Services](https://io.net/docs/guides/clouds/managed-services.md)).
    - An OpenAI-compatible inference API, which is also on OpenRouter ([PR](https://www.coindesk.com/press-release/2026/06/11/io-net-to-burn-up-to-12m-tokens-as-network-closes-usd8m-deal-and-hits-4-billion-daily-ai-tokens)).
    - About $12M a year of cluster earnings ([API](https://api.io.solutions/v1/io-explorer/network/info/cluster/total-earnings-summary)).

### Spheron Network (now positioned as "Spheron", a GPU marketplace and broker)

1. **Operator access: approved data-centre partners only. The permissionless protocol is being phased out.**
   - "All infrastructure comes from Tier 2/3/4 compliant facilities (not consumer hardware)" ([site llms.txt](https://www.spheron.network/llms.txt)).
   - Six providers: Verda, Spheron AI, Spheron ES, Spheron MS, Spheron AM and Massed Compute ([Regions & Providers](https://docs.spheron.ai/concepts/regions-providers)).
   - Suppliers integrate through an orchestrator API contract ([Provider integration](https://docs.spheron.ai/provider-integration)) or are introduced to buyers through the GPU demand board ([GPU demand](https://docs.spheron.ai/gpu-demand)).
   - The GitHub README was changed on 4 Mar 2026. It used to say "Spheron is not a product — it's a permissionless protocol". It now says: "Spheron's earlier protocol-based infrastructure (Fizz Node, Provider Node, Protocol CLI, SDK...) is no longer actively maintained. We are gradually phasing out protocol operations to focus entirely on enterprise GPU procurement and aggregation" ([README](https://github.com/spheron-core/.github/blob/main/profile/README.md); [commit history](https://github.com/spheron-core/.github/commits/main/profile/README.md)).
2. **Placement: one instance on one provider.** "Spheron is not a single cloud provider. It is a marketplace" ([site llms.txt](https://www.spheron.network/llms.txt)). For reliability, "you can redeploy to a different provider if one has availability issues", which is manual ([Overview](https://docs.spheron.ai/overview)).
3. **Failure: manual. The SLA is whatever the provider gives.**
   - Spot instances can be reclaimed "at any time, with no warning". Dedicated instances "carry a 99.95% SLA" ([Instance Types](https://docs.spheron.ai/concepts/instance-types)).
   - The ToS contradicts that: "does not provide any independent or additional Service Level Agreement", availability is "up to 99.5%" and depends on the provider, and spot interruptions carry no refund ([Terms](https://www.spheron.network/terms/)).
   - Credits are non-refundable. Refund requests are only considered above $10,000, within 30 days, at Spheron's discretion ([Terms §5.2–5.3](https://www.spheron.network/terms/)).
4. **Workload:** VMs or bare metal with root SSH; anything goes. Covers training, inference, CPU nodes from $0.09/hr, monthly reserved clusters, and a managed LLM inference API priced on request ([Overview](https://docs.spheron.ai/overview); [site llms.txt](https://www.spheron.network/llms.txt)).
5. **Networking:** a dedicated public IP; "All ports on your instance are open by default". No load balancing, domains or TLS are documented ([Networking](https://docs.spheron.ai/concepts/networking)).
6. **Network size:**
   - The live offers API on 2026-10-24 lists 30 GPU or CPU types across the six providers, with Verda appearing as `data-crunch`. It does not give unit counts ([app.spheron.ai/api/gpu-offers](https://app.spheron.ai/api/gpu-offers); [OpenAPI](https://www.spheron.network/openapi.json)).
   - Protocol-era claims: "44,000 nodes", "170+ locations", "$10M ARR" ([TGE PR, 25 Jul 2025](https://thedefiant.io/news/press-releases/spheron-to-launch-tge-with-spon-token-tier-1-listings)). Messari reported ARR above $12M by end of Aug 2025 ([Messari](https://messari.io/report/understanding-spheron-a-comprehensive-overview), via search, not fetched).
7. **Chain:** the protocol ran on Base Mainnet ([migration post](https://foundation.spheron.network/knowledge-gallery/migration-to-the-new-phase-the-road-ahead-for-fizz-and-provider-nodes)), and SPON is a Base token ([CoinGecko](https://www.coingecko.com/en/coins/spheron-network)). The docs now say "Spheron is not a blockchain network" ([Overview](https://docs.spheron.ai/overview)).
8. **Pricing: USD credits, per-second billing.**
   - Pay by card via Stripe or USDC/USDT via CopperX; $15 minimum ([Billing](https://docs.spheron.ai/billing)).
   - The provider's price change applies to running instances ([Terms](https://www.spheron.network/terms/)).
   - "Zero ingress/egress charges" ([Overview](https://docs.spheron.ai/overview)).
   - Live API snapshot 2026-10-24, per GPU-hour ([gpu-offers](https://app.spheron.ai/api/gpu-offers)):

     | GPU | Cheapest spot | Cheapest dedicated |
     |---|---|---|
     | H100 SXM5 | $2.79 | $4.20 (Noida, India) |
     | H100 PCIe | – | $2.64 |
     | H200 SXM5 | $3.35 | $4.80 |
     | B200 | $5.34 | $10.29 |
     | RTX 4090 | – | $0.48 |

9. **Open source:**
   - The current org has only a SkyPilot fork ([spheron-core](https://github.com/spheron-core)).
   - The old protocol was largely built on Akash forks, now archived: akash-node and akash-provider. protocol-sdk is Apache-2.0. Nothing was pushed after Jul 2025 ([spheronFdn](https://github.com/spheronFdn)).
10. **Censorship and takedown:** the company is Beta360 Pte Ltd, Singapore. It "may suspend or terminate a User's account at any time, with or without cause" and bans uses that violate export controls or sanctions ([Terms](https://www.spheron.network/terms/)).
11. **Launch:** SPON TGE on 29 Jul 2025 (Bitget, Gate, MEXC) ([PR](https://thedefiant.io/news/press-releases/spheron-to-launch-tge-with-spon-token-tier-1-listings)).
12. **2025–26 changes:**
    - Pivoted from a permissionless protocol to a centralised aggregator (README 4 Mar 2026, linked above). ToS v1.1 for a "GPU Compute Marketplace" took effect 6 Nov 2025 ([Terms](https://www.spheron.network/terms/)).
    - SPON is at about $0.00057, with a market cap of about $126K (CoinGecko, updated 19 Oct 2026). Its all-time high was $0.088 on 28 Aug 2025 ([CoinGecko](https://www.coingecko.com/en/coins/spheron-network)).
13. **Genuine strengths:**
    - One bill across several real data-centre providers.
    - Frontier and rare hardware: B300, B200, H200, GB200/GB300 reservations, Vera Rubin pre-orders, AMD MI300X ([site llms.txt](https://www.spheron.network/llms.txt); [Regions](https://docs.spheron.ai/concepts/regions-providers)).
    - Compliance-certified providers: Verda (ISO 27001) and Massed Compute (SOC 2, HIPAA) ([Overview](https://docs.spheron.ai/overview)).
    - For the comparison site: Spheron is no longer a decentralised network.

### Theta EdgeCloud

1. **Operator access: hybrid model.**
   - Community: "anyone with idle GPUs" can run the EdgeCloud Client, set their own hourly rate, and get paid in TFUEL ([Client Guide](https://docs.thetatoken.org/docs/theta-edgecloud-client-guide.md)).
   - The legacy Edge Node is open to anyone. Elite Edge Nodes must stake 10,000–500,000 TFUEL ([Elite staking](https://docs.thetatoken.org/docs/elite-edge-node-staking-process.md); [Edge Node](https://docs.thetatoken.org/docs/setup-theta-edge-node.md)).
   - "Hosted" capacity is run by Theta through "partner data centers and enterprise cloud infrastructure from Google Cloud and AWS" ([What is Theta, 8 Jul 2026](https://blog.thetatoken.org/what-is-theta/)).
   - Blockchain validators are enterprises: Google, Samsung, Sony, CAA, Binance, Deutsche Telekom, Docomo Global, Cloudician, and ZAN, which joined Jun 2026 ([RSS: July 2026 roundup](https://medium.com/theta-network/theta-roundup-july-2026-833641dcd27b)). The blog nonetheless says anyone can run a validator by staking THETA ([What is Theta](https://blog.thetatoken.org/what-is-theta/)).
2. **Placement:**
   - Dedicated and custom container deployments take a replica count (`min_replicas`/`max_replicas`) ([API deployments](https://docs.thetatoken.org/docs/use-edgecloud-api-keys-to-manage-deployments.md); [Generic containers](https://docs.thetatoken.org/docs/running-generic-containerized-workload.md)).
   - A community GPU Node is one machine the user picks ([Community nodes](https://docs.thetatoken.org/docs/run-your-tasks-on-community-edgecloud-nodes.md)).
   - GPU clusters must be the same type in the same region ([Clusters](https://docs.thetatoken.org/docs/edgecloud-ai-training-with-gpu-clusters.md)).
3. **Failure:** the Hybrid Beta FAQ promises "Automatic failover... If a node goes offline mid-task, the system will reroute the job to another available GPU" ([Community FAQ](https://docs.thetatoken.org/docs/community-faq.md)). It is not documented for SSH GPU Nodes, and I found no refund policy.
4. **Workload:**
   - "any containerized workload". One container port is mapped to HTTPS 443, and "In the future, we may support multiple ports" ([Generic containers](https://docs.thetatoken.org/docs/running-generic-containerized-workload.md)).
   - Also: SSH GPU nodes, distributed-training clusters, Jupyter, on-demand model APIs, video and livestream services, RAG agents ([Overview](https://docs.thetatoken.org/docs/theta-edgecloud-overview.md)), and AI Characters for gaming (Jul 2026) ([roundup](https://medium.com/theta-network/theta-roundup-july-2026-833641dcd27b)).
5. **Networking:** each deployment gets an HTTPS inference endpoint (`*.onthetaedgecloud.com`) with optional basic auth ([API deployments](https://docs.thetatoken.org/docs/use-edgecloud-api-keys-to-manage-deployments.md)). Replicas sit behind one endpoint, which implies load balancing, but the docs do not say so explicitly. Custom domains are not documented.
6. **Network size:**
   - "more than 30,000 edge nodes", up from about 10,000 in early 2024 ([What is Theta](https://blog.thetatoken.org/what-is-theta/); [Chiba Tech post, 11 Aug 2026](https://medium.com/theta-network/chiba-institute-of-technology-joins-theta-edgeclouds-academic-network-2688a59f0c4b)). Edge nodes do not need a GPU: the requirement is listed as "GPU (optional)" ([Edge Node](https://docs.thetatoken.org/docs/setup-theta-edge-node.md)), so this is not a GPU count.
   - 36 universities and research institutions as of 10 Jun 2026 ([post](https://medium.com/theta-network/the-future-of-academic-ai-research-is-on-theta-edgecloud-19466467dedf)).
   - I found no public count of GPUs.
7. **Chain:** its own EVM-compatible L1. Mainnet went live 15 Mar 2019 ([altFINS](https://altfins.com/crypto-screener/tfuel-theta_fuel)). The Metachain subchains followed in Dec 2022. TFUEL is gas and pays nodes; THETA is staked ([What is Theta](https://blog.thetatoken.org/what-is-theta/)).
8. **Pricing: USD per hour.**
   - Public VM list API on 2026-10-24, with prices in cents: **H100 80GB ×1 $2.29/hr, H200 ×1 $3.69/hr, A100 80GB $1.99, V100 $0.99, T4 $0.20** ([api.thetaedgecloud.com/resource/vm/list](https://api.thetaedgecloud.com/resource/vm/list)).
   - The homepage shows H200 at $2.29 (which conflicts with the API), RTX 4090 at $0.26, 5090 at $0.49 and 3090 at $0.14 ([thetaedgecloud.com](https://www.thetaedgecloud.com/)).
   - Community nodes set their own prices; the docs' example is a 4090 at $0.13 ([GPU Resources API](https://docs.thetatoken.org/docs/edgecloud-gpu-resources-api.md)).
   - Accounts can be topped up by TFUEL deposit ([Billing API](https://docs.thetatoken.org/docs/edgecloud-project-billing-api.md)).
   - Egress fees are not documented.
9. **Open source:** the ledger is open, GPL-3.0 ([theta-protocol-ledger](https://github.com/thetatoken/theta-protocol-ledger)). The EdgeCloud platform and client are not: the client installs from a script, with no repo ([Install](https://docs.thetatoken.org/docs/theta-edgecloud-client-installation-instructions.md); [org](https://github.com/thetatoken)).
10. **Censorship and takedown:** Theta Labs runs the platform centrally. Node operators cannot yet refuse jobs: "Job opt-out and preference settings for node operators" is "Coming soon" ([Community FAQ](https://docs.thetatoken.org/docs/community-faq.md)). KYC is not documented.
11. **Launch:** EdgeCloud phase 1 on 1 May 2024 ([TechFlow via search](https://www.techflowpost.com/en-US/newsletter/41512); [What is Theta](https://blog.thetatoken.org/what-is-theta/)). Hybrid Beta on 25 Jun 2025 ([Community FAQ](https://docs.thetatoken.org/docs/community-faq.md)).
12. **2025–26 changes:**
    - Hybrid Beta in Jun 2025; API v1 and an MCP server (docs updated Aug 2026) ([API](https://docs.thetatoken.org/docs/theta-edgecloud-api.md)); AI gaming vertical in Jul 2026 ([roundup](https://medium.com/theta-network/theta-roundup-july-2026-833641dcd27b)).
    - In Dec 2025, two former executives filed whistleblower lawsuits accusing Theta Labs and CEO Mitch Liu of token manipulation. Theta denies the claims, and no ruling was found ([Yahoo/Decrypt](https://finance.yahoo.com/news/former-theta-executives-accuse-crypto-045510956.html); [Cryptopolitan](https://www.cryptopolitan.com/theta-labs-faces-lawsuits-over-manipulation/)).
13. **Genuine strengths:**
    - High-end GPUs on demand (H100/H200 hosted on Google Cloud and AWS, plus AWS Trainium and Inferentia), alongside cheap community RTX cards ([What is Theta](https://blog.thetatoken.org/what-is-theta/); [VM list](https://api.thetaedgecloud.com/resource/vm/list)).
    - A real academic customer base of 36 institutions, plus sports and esports logos (Houston Rockets, Vegas Golden Knights, Cloud9, among others) ([homepage](https://www.thetaedgecloud.com/)).
    - Heritage in video infrastructure.

### Nosana

1. **Operator access: open registration with benchmark checks. Tiers depend on stake. Nosana assigns markets.**
   - Hosts need native Linux and a supported NVIDIA GPU, from RTX 3060 up to A100 and H100. "1 private key per GPU, 1 GPU per PC" ([Host GPUs](https://learn.nosana.com/hosts/grid)).
   - Registration asks for an email and acceptance of the T&C, then runs a hardware benchmark ([Running the Host](https://learn.nosana.com/hosts/grid-run)).
   - PREMIUM markets are "Hosts that have staked and passed benchmarking". COMMUNITY markets have "a lower stake requirement" ([pricing.md](https://nosana.com/pricing.md)).
   - New hosts have "skip[ped] the waitlist and begin in the Community Market" since 14 Jan 2025 ([The Block](https://www.theblock.co/post/334565/nosana-launches-gpu-marketplace-to-drive-ai-innovation)).
   - The API includes central admin endpoints: `/nodes/ban`, `/nodes/promote`, `/nodes/move-market` ([OpenAPI](https://api.nosana.com/openapi.json)).
2. **Placement:** a deployment runs N replicas of a job on one GPU market, and each replica holds a whole GPU on a host. Billing is "Per replica" ([Deployments](https://learn.nosana.com/deployments/intro); [pricing.md](https://nosana.com/pricing.md)).
3. **Failure: automatic replacement, but only with the INFINITE strategy.**
   - INFINITE "refills each stopped replica". A job that misses its startup timeout "is stopped and replaced on another node" ([OpenAPI](https://api.nosana.com/openapi.json)).
   - Nosana's own summary says "A deployment keeps replicas running and replaces them when a host drops" ([llms.txt](https://nosana.com/llms.txt)).
   - The Strategies doc page still marks INFINITE "(COMING SOON)", which contradicts the above ([Strategies](https://learn.nosana.com/deployments/strategies)).
   - Out of credits, a deployment stops rather than going into debt ([pricing.md](https://nosana.com/pricing.md)).
4. **Workload: GPU Docker containers, focused on inference and batch.**
   - "Nosana is not the right tool for CPU-only batch work, general web hosting, persistent databases, or anything needing stable storage between runs" ([llms.txt](https://nosana.com/llms.txt)).
   - TEE and confidential markets exist, for example "4090 SEV TEE" ([markets API](https://api.nosana.com/api/markets/)).
5. **Networking:** HTTPS endpoint URLs under `*.node.k8s.prd.nos.ci` ([Endpoints](https://learn.nosana.com/inference/endpoints)). The API describes "one load-balanced proxy per op" ([OpenAPI](https://api.nosana.com/openapi.json)). Custom domains are not documented.
6. **Network size: small.** As of 2026-10-24:
   - **478 nodes across 46 countries: 359 active, 119 offline** ([stats/nodes-country](https://api.nosana.com/api/stats/nodes-country)).
   - 4.23M jobs completed, and $2.49M cumulative host rewards in USD ([jobs/stats](https://api.nosana.com/api/jobs/stats)). About 1,000 jobs a day recently ([timestamps](https://api.nosana.com/api/jobs/stats/timestamps)).
   - The 4M jobs / 4M GPU-hour milestone was reported in Jul 2026 ([Monthly Jul 2026](https://nosana.com/blog/nosana-monthly-july-2026/)).
   - Solana Compass's "10,000 GPU providers" is unverified ([Solana Compass](https://solanacompass.com/projects/nosana)).
7. **Chain:** Solana. NOS is an SPL token with 100M supply, held by 14,165 stakers ([stats](https://api.nosana.com/api/stats/); [CoinGecko](https://www.coingecko.com/en/coins/nosana)).
8. **Pricing:**
   - Per second, per market, paid in credits or NOS. Prices are denominated in NOS per second, so the USD figure moves with the token ([pricing.md](https://nosana.com/pricing.md)).
   - Live 2026-10-24, host USD per hour (the network fee adds 10%): **H100 premium $1.36, H100 community $1.02, 8×H100 $18.20, A100 80GB premium $0.82, RTX 4090 premium $0.36, RTX 3060 community $0.03** ([markets API](https://api.nosana.com/api/markets/)).
   - Egress fees are not documented.
9. **Open source: mostly yes.**
   - nosana-programs is MIT. Dashboard, explorer and host UIs are GPL-3.0. nosana-node, nosana-cli and the deployment-manager source are public; package.json says ISC, but there is no LICENSE file ([github.com/nosana-ci](https://github.com/nosana-ci)).
   - All Solana programs became Verified Builds on 24 Jul 2026 ([Monthly Jul 2026](https://nosana.com/blog/nosana-monthly-july-2026/)).
10. **Censorship and takedown:** the docs say "Nosana is a fully permissionless network, which means that whatever model you want to run in our network you can" ([Job Execution Flow](https://learn.nosana.com/deployments/jobs/job_execution_flow)). The backend (credits, deployment manager, node bans) is centralised ([OpenAPI](https://api.nosana.com/openapi.json)). Client KYC is not documented.
11. **Launch:** NOS IDO in Jan 2022 ([ACN press release](https://www.acnnewswire.com/press-release/english/72509/)). Mainnet GPU marketplace on 14 Jan 2025 ([The Block](https://www.theblock.co/post/334565/nosana-launches-gpu-marketplace-to-drive-ai-innovation)).
12. **2025–26 changes:**
    - Mainnet in Jan 2025, after evolving from a CI/CD network ([Monthly Jul 2026](https://nosana.com/blog/nosana-monthly-july-2026/)).
    - NNP-001 tokenomics went live 22 Oct 2025 (same source).
    - MCP server and refreshed dashboard ([Monthly Sep 2026](https://nosana.com/blog/nosana-monthly-september-2026/)).
    - Windows hosts deprecated ([Host GPUs](https://learn.nosana.com/hosts/grid)).
13. **Genuine strengths:**
    - Cheapest consumer-GPU inference in this group, per-second billing, and replicas that are replaced automatically ([markets](https://api.nosana.com/api/markets/); [OpenAPI](https://api.nosana.com/openapi.json)).
    - Transparent public stats and mostly open code ([GitHub](https://github.com/nosana-ci)).
    - The network is small: 359 active nodes.

---

### Is anything else more relevant now?

**Recommend adding: Phala Cloud (Phala Network).** It is the closest functional overlap with Flux, because it runs general-purpose Docker apps, and it now has real traction.
- **What it runs:** "Move existing Docker Compose workloads into CPU or GPU confidential machines". GPU TEE options are H100, H200 and B300 ([phala.com](https://phala.com/); [GPU TEE](https://phala.com/gpu-tee)).
- **Networking:** automatic HTTPS endpoints and TLS, TCP and gRPC, and custom domains with automatic SSL ([Networking overview](https://docs.phala.com/phala-cloud/networking/overview.md); [Custom domain](https://docs.phala.com/phala-cloud/networking/setup-custom-domain.md)).
- **Replicas:** supported, but "Phala Cloud does not distribute traffic across replicas", which contradicts the overview's "Built-in load balancing" ([Multi-replica](https://docs.phala.com/phala-cloud/cvm/multi-replica-scaling.md)).
- **Traction (self-reported):** "183B confidential model tokens/day", dated 2026-10-23 and taken from its OpenRouter provider chart ([phala.com](https://phala.com/)). OpenRouter lists 22 Phala-served models ([OpenRouter](https://openrouter.ai/provider/phala)).
- **Prices:** H200 from $4.40/GPU-hr, B300 from $8.20 ([phala.com](https://phala.com/)).
- **Operators:** permissioned. The Phala team "will manually verify" each GPU worker, which then needs vPHA collateral (H100 1,250, H200 1,875, B200 2,250) ([Register worker](https://docs.phala.com/network/compute-providers/run-GPU-on-phala/register-work-onchain.md); [Compute providers](https://docs.phala.com/network/compute-providers/introduction.md)).
- **Chain:** migrated from the Polkadot parachain to an Ethereum L2 ([Compute providers](https://docs.phala.com/network/compute-providers/introduction.md)).
- **Open source:** the dstack TEE framework is Apache-2.0 with 569 stars and is co-developed with Flashbots ([Dstack-TEE/dstack](https://github.com/Dstack-TEE/dstack); [Phala Network docs](https://docs.phala.com/network/overview/phala-network.md)).

**Checked but not recommended:**
- **Chutes (Bittensor SN64):** serverless inference only. Volume data conflict sharply: 160B tokens/day self-reported against about 6.8B visible on OpenRouter in spring 2026 ([ownyourmind.ai](https://ownyourmind.ai/tokenomics/chutes-bittensor-revenue-machine/)). DefiLlama shows $3.7M in 1-year fees ([DefiLlama](https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true&dataType=dailyFees)).
- **Lium (SN51):** GPU rental. 1,670 GPUs listed and 1,571 rented on 15 Oct 2026, a secondhand figure ([vantaige.io](https://vantaige.io/ai-tool/lium-io)). Lium's live public feed on 2026-10-24 lists 61 rentable nodes and 315 GPUs ([feed](https://lium.io/api/public/v1/nodes); [docs](https://docs.lium.io/developers/public-nodes-feed)). Not a general hosting platform.
- **Aleph Cloud:** architecturally similar to Flux (VMs on CRNs, with no stake required but CCN sponsorship), claiming "640+ compute nodes". I found no evidence it is growing in prominence ([aleph.cloud glossary](https://aleph.cloud/glossary/); [docs](https://docs.aleph.cloud/about/how-it-works/)).
- **Gensyn:** the $AI TGE was 29 Apr 2026, but one review says the training network is still pre-mainnet. It is not a hosting platform ([ownyourmind.ai](https://ownyourmind.ai/projects/gensyn/)).
- **Hyperbolic, Exabits, Atoma:** no 2026 evidence found in the time available.

---

### Gaps / uncertain
- **Aethir:**
  - No public count of physical H100, H200 or B200 GPUs. "GPU containers" includes phones, PCs and edge devices.
  - No independent 2026 ARR figure. I used DefiLlama fees, which assume a 20% protocol take.
  - Whether enterprise customers can pay in fiat or USDC, rather than ATH, is not documented.
- **io.net:**
  - What "verified_gpu 327,085" and "total_gpu 1,061,267" actually mean is not documented. They are probably cumulative registrations.
  - What "passive" inventory means (782 GPUs, probably partner-listed) is unclear.
  - Terms of Service and renter KYC could not be retrieved.
  - Egress fees are not documented.
- **Theta:**
  - No public GPU count, community or hosted.
  - The homepage and the API disagree on the H200 price ($2.29 against $3.69).
  - Load balancing across replicas, refunds, KYC and egress are not documented.
  - Validator access is ambiguous: the blog says anyone can stake, but every named validator is an enterprise.
- **Nosana:**
  - Whether listed market prices are the host reward or the client price (about 10% higher) is not explicit.
  - Docs and API disagree on whether INFINITE is live.
  - No cumulative client-spend figure in USD. The $2.49M is host rewards.
- **Spheron:**
  - No live unit counts.
  - Which upstream providers sit behind Spheron AI, ES, MS and AM is not disclosed.
  - Whether the remaining protocol leases or Fizz nodes have been fully shut down is unconfirmed.
- **Phala:**
  - The tokens/day figure is self-reported; OpenRouter's page showed no volume.
  - The split between Phala-operated and third-party hardware is unclear.
- **Not re-verified from primary sources:** Messari figures (Spheron ARR; io.net Q1 2025 verified GPUs), Chutes revenue estimates, and the Lium 1,670-GPU figure.

## 14. Appendix C: web2 pricing, egress, market share and platform facts

_Research pass on pricing, 2026-10-24. Synergy Q2 2026 re-checked against the source._


Researched 2026-10-24. Unless a line says otherwise, every price was checked on 2026-10-24 against the official pricing page, the provider's machine-readable price feed, or a public API. Prices are USD, on-demand, Linux, and exclude tax.

Standard workload: **2 vCPU / 4 GB RAM / 50 GB SSD, always on (730 h), one instance, US region.**

---

### PART 1: Monthly price of the standard workload

#### Summary table (as of 2026-10-24)

| Provider / plan | Compute | 50 GB SSD | Public IPv4 | **Total / month** | CPU type |
|---|---|---|---|---|---|
| AWS t3.medium + 50 GB gp3 (us-east-1) | $30.37 | $4.00 | $3.65 | **$38.02** | Burstable (20% baseline per vCPU) |
| GCP e2-medium + 50 GB pd-balanced (us-central1) | $24.46 | $5.00 | $3.65 | **$33.11** | Shared core (2 vCPUs at 50% each) |
| Azure B2s + E6 Standard SSD (East US) | $30.37 | $4.80 (64 GiB tier) | $3.65 | **$38.82** (+ disk transaction fees) | Burstable (20% base); Bv1 series is End of Life |
| DigitalOcean Basic Regular 2 vCPU/4 GiB | $24.00 flat | included (80 GiB) | included | **$24.00** | Shared |
| DigitalOcean Basic Premium Intel/AMD 2/4 | $28.00 flat | included (80 GiB NVMe) | included | **$28.00** | Shared |
| Akamai/Linode "Linode 4GB" (shared) | $24.00 flat | included (80 GB) | included | **$24.00** | Shared |
| Vultr Regular Cloud Compute vc2-2c-4gb | $20.00 flat | included (80 GB) | included | **$20.00** | Shared |
| Hetzner CX23 (EU only: DE/FI) | €5.49 / $6.49 | 40 GB included (short of 50) | €0.50 / $0.60 | **€5.99 / $7.09** (excl. VAT) | Shared; currently "unavailable" |
| Hetzner CPX21 (US: Ashburn/Hillsboro; 3 vCPU/4 GB) | €31.99 / $37.49 | 80 GB included | €0.50 / $0.60 | **€32.49 / ~$38.09** | Shared AMD |
| Akash (bid market, one provider per lease) | see below | see below | optional $5 IP lease (default) | **~$4–$14 observed for 2 vCPU/4 GiB; ~$8 by the default provider price formula; $18.66 per Akash's own estimator** | Varies by provider |

#### AWS EC2, us-east-1 (as of 2026-10-24)
Source: AWS's public price-list files that feed the [EC2 On-Demand pricing page](https://aws.amazon.com/ec2/pricing/on-demand/). EC2 file published 2026-10-23T22:13:55Z: `https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps/ec2/USD/current/ec2-ondemand-without-sec-sel/US%20East%20(N.%20Virginia)/Linux/index.json`. EBS file published 2026-10-23. VPC file published 2026-10-16.

| Line item | Rate | Arithmetic | $/mo |
|---|---|---|---|
| t3.medium (2 vCPU, 4 GiB) Linux | $0.0416/h | 0.0416 × 730 | 30.37 |
| EBS gp3, 50 GB ([EBS pricing](https://aws.amazon.com/ebs/pricing/)) | $0.08/GB-mo | 0.08 × 50 | 4.00 |
| Public IPv4, in use ([VPC pricing](https://aws.amazon.com/vpc/pricing/)) | $0.005/h | 0.005 × 730 | 3.65 |
| **Total** | | | **$38.02** |

- **Burstable caveat:** t3.medium earns 24 CPU credits per hour, which is a **20% baseline per vCPU** ([AWS burstable baseline doc](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html)). T3 runs in Unlimited mode by default. Surplus credits cost "**$0.05 per vCPU-Hour for Linux**" ([EC2 On-Demand page](https://aws.amazon.com/ec2/pricing/on-demand/)); T4g surplus is $0.04. Worst case, 100% CPU on both vCPUs all month: (1.0 − 0.2) × 2 vCPU × $0.05 × 730 = **+$58.40/mo**.
- Other prices from the same feed ($/h, then compute × 730):
  - t4g.medium (Arm, 2/4 GiB): $0.0336/h = $24.53. Workload total **$32.18**.
  - t3a.medium (AMD): $0.0376/h = $27.45. Workload total **$35.10**.
  - **Non-burstable, 4 GiB match:** c7i.large (2 vCPU / 4 GiB): $0.08925/h = $65.15. Workload total **$72.80**. c7g.large (Graviton3, 2/4 GiB): $0.0725/h = $52.93. Workload total **$60.58**.
  - m7i.large (2 vCPU / **8 GiB**): $0.1008/h = $73.58. Workload total **$81.23**. No 4 GiB match.

#### Google Cloud, us-central1 (Iowa) (as of 2026-10-24)
Source: [GCP general-purpose machine pricing](https://cloud.google.com/products/compute/pricing/general-purpose) (E2 shared-core table, default region Iowa us-central1), [Disk pricing](https://cloud.google.com/compute/disks-image-pricing), and [Network pricing (external IP)](https://cloud.google.com/vpc/network-pricing).

| Line item | Rate | Arithmetic | $/mo |
|---|---|---|---|
| e2-medium (2 vCPU shared, 4 GiB) | $0.03350571/h | 0.03350571 × 730 | 24.46 |
| pd-balanced, 50 GiB | $0.000136986/GiB-h (= $0.10/GiB-mo) | 0.000136986 × 730 × 50 | 5.00 |
| External IPv4 in use on a standard VM | $0.005/h | 0.005 × 730 | 3.65 |
| **Total** | | | **$33.11** |

- **Shared-core caveat:** "e2-medium sustains 2 vCPUs, each at 50% of CPU time, totaling 100% CPU time." It can burst to 100% per vCPU for about 120 s at full load, and "Bursting doesn't incur any additional charges" ([GCP general-purpose machines doc](https://docs.cloud.google.com/compute/docs/general-purpose-machines)).
- **Sustained-use discounts do NOT apply to E2.** The docs say: "The E2 machine series doesn't offer sustained use discounts (SUDs); however, it provides consistently low on-demand and committed-use pricing" ([same doc](https://docs.cloud.google.com/compute/docs/general-purpose-machines)). The [SUD doc](https://docs.cloud.google.com/compute/docs/sustained-use-discounts) lists N1, N2, N2D, C2, M1 and M2 as eligible.
- **Non-shared alternative:** E2 custom 2 vCPU / 4 GB at $0.02290217/vCPU-h and $0.003069707/GB-h = $0.05808/h × 730 = $42.40. Workload total **$51.05**. e2-standard-2 (2 vCPU / 8 GB): $0.06701142/h = $48.92. Workload total **$57.57**.
- Third-party cross-check: [gcloud-compute.com e2-medium](https://gcloud-compute.com/e2-medium.html) (data updated 2026-10-18) shows $0.0335/h, $24.46/mo, and SUD not applicable. This matches.

#### Azure, East US (as of 2026-10-24)
Source: [Azure Retail Prices API](https://prices.azure.com/api/retail/prices) (official public API that feeds [Linux VM pricing](https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/), [Managed Disks pricing](https://azure.microsoft.com/en-us/pricing/details/managed-disks/), and [IP address pricing](https://azure.microsoft.com/en-us/pricing/details/ip-addresses/)).

| Line item | Rate | Arithmetic | $/mo |
|---|---|---|---|
| Standard_B2s (2 vCPU, 4 GiB) Linux (effective 2025-10-01) | $0.0416/h | 0.0416 × 730 | 30.37 |
| Standard SSD **E6 LRS** (64 GiB, the nearest tier above 50 GB) | $4.80/mo | flat | 4.80 |
| Standard static public IPv4 | $0.005/h | 0.005 × 730 | 3.65 |
| **Total** | | | **$38.82** |

- Standard SSD also bills **disk operations at $0.002 per 10K transactions** (same API), which is small for light workloads.
- **Burstable caveat:** B2s has a "Base CPU Performance of VM" of **20%** and banks 24 credits per hour ([Bv1 series doc](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/bv1-series)). The same page says Bv1 sizes "are in the End of Life lifecycle stage and have an announced retirement". A secondary listing gives the retirement date as **2028-11-15**, announced 2025-10-15 ([docs.azure.cn retired sizes list](https://docs.azure.cn/en-us/virtual-machines/sizes/lifecycle/retired-sizes-list)).
- Alternatives (same API):
  - B2als_v2 (2 vCPU / 4 GiB, burstable v2): $0.0376/h = $27.45. Workload total **$35.90**.
  - B2ls_v2: $0.0416/h, the same as B2s.
  - **Non-burstable** D2als_v6 (2 vCPU / 4 GiB): $0.0804/h = $58.69. Workload total **$67.14**.

#### DigitalOcean (as of 2026-10-24)
Source: [DigitalOcean Droplet pricing](https://www.digitalocean.com/pricing/droplets) (plan JSON embedded in the page) and [Droplet pricing docs](https://docs.digitalocean.com/products/droplets/details/pricing/).

| Plan (slug) | $/mo | $/h | SSD | Transfer |
|---|---|---|---|---|
| Basic Regular 2 vCPU / 4 GiB (`s-2vcpu-4gb`) | **$24** | $0.03571 | 80 GiB | 4,000 GiB |
| Basic Premium Intel 2/4 (`s-2vcpu-4gb-intel`) | **$28** | $0.04167 | 80 GiB NVMe | 4,000 GiB |
| Basic Premium AMD 2/4 (`s-2vcpu-4gb-amd`) | **$28** | $0.04167 | 80 GiB NVMe | 4,000 GiB |
| Premium Intel 2/4 with 120 GB (`s-2vcpu-4gb-120gb-intel`) | $32 | $0.04762 | 120 GiB | 4,000 GiB |

- Bundled plans: "Usage is capped at 672 hours (28 days) per month," so $0.03571 × 672 = $24.00. The plan includes the disk (80 GiB, more than the 50 GB needed) and the IPv4 address. Total **$24.00**.
- Basic Droplets are shared CPU. The new "v5 Droplets" (5th Gen AMD EPYC) are priced per resource and "do not have a monthly usage cap" ([docs](https://docs.digitalocean.com/products/droplets/details/pricing/)).

#### Hetzner Cloud (as of 2026-10-24; prices exclude VAT)
Sources: [Cost-Optimized plans](https://www.hetzner.com/cloud/cost-optimized), [Regular Performance plans](https://www.hetzner.com/cloud/regular-performance), [Price adjustment doc](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [IPv4 pricing doc](https://docs.hetzner.com/general/infrastructure-and-availability/ipv4-pricing).

- **Current name: CX23** (2 vCPU shared Intel/AMD, 4 GB, 40 GB NVMe, **20 TB traffic**). Only EU locations (FSN1, NBG1, HEL1) offer it.
  - Price excl. IPv4: **€5.49/mo (€0.0088/h) or $6.49/mo (USD)** (price-adjustment doc).
  - Primary IPv4: €0.50 or $0.60 per month.
  - Product page "incl. IPv4" price: **€5.99/mo (€0.0096/h)**. USD equivalent ≈ **$7.09/mo**.
  - **Status on 2026-10-24:** the product page marks every Cost-Optimized plan (CX and CAX) "currently unavailable. Please check back later."
- **The 40 GB disk is smaller than the 50 GB in the spec.** Hetzner Volumes start at 10 GB ([Volumes doc](https://docs.hetzner.com/cloud/volumes/overview/)). I could not find the per-GB Volume price on a public page.
- **2026 price increases:**
  1. Announced 2026-02-23, **effective 2026-04-01** for new and existing products. The reason given was rising IT costs ([Hetzner statement](https://www.hetzner.com/pressroom/statement-price-adjustment/)).
  2. Announced 2026-05-27, **effective 2026-06-15** for new orders and rescales only. The reason given was "ongoing challenges in the hardware procurement market" ([Hetzner press release](https://www.hetzner.com/pressroom/standardization-and-price-adjustment-of-our-server-products/)). Changes, excl. IPv4:
     - CX23: €3.99 → **€5.49** ($4.99 → $6.49)
     - CAX11: €4.49 → €5.99
     - CPX22: €7.99 → **€19.49** ($9.49 → $22.99)
     - US CPX11: €5.99 → €17.49
     - US CPX21: €11.99 → **€31.99** ($13.99 → $37.49)
- **US locations (Ashburn, Hillsboro):** no CX23. The nearest 4 GB plan is **CPX21** (3 vCPU AMD shared, 4 GB, 80 GB, **2 TB traffic**) at €31.99 or **$37.49** excl. IPv4. The page price incl. IPv4 is €32.49. **Hetzner in the US now costs about the same as AWS for this spec.**
- The EU Regular Performance alternative is **CPX22** (2 vCPU AMD, 4 GB, 80 GB, 20 TB) at €19.49 or $22.99 excl. IPv4 (€19.99 incl. IPv4).
- **Capacity:** Hetzner opened a capacity notice on 2026-06-26 citing "high demand and limited hardware components" ([status incident](https://status.hetzner.com/incident/0a75c7ae-3377-41dc-aabe-601063724d24), via a [secondary write-up](https://www.vincentschmalbach.com/hetzner-cheap-cloud-unavailable-price-increases/)). I did not open the status page myself.

#### Akamai/Linode and Vultr (as of 2026-10-24)
- **Linode 4GB (shared, `g6-standard-2`):** 2 vCPU, 4 GB, 80 GB, 4 TB transfer, **$24/mo ($0.036/h)**. Network transfer overage is **$0.005/GB**. Dedicated 4GB costs $36/mo. Source: official public API [api.linode.com/v4/linode/types](https://api.linode.com/v4/linode/types) and `/v4/network-transfer/prices`. Pricing page: [linode.com/pricing](https://www.linode.com/pricing/).
- **Vultr Regular Cloud Compute `vc2-2c-4gb`:** 2 vCPU, 4 GB, 80 GB SSD, 3 TB bandwidth, **$20/mo ($0.027/h)**. High Performance `vhp-2c-4gb` costs $24 (100 GB NVMe, 5 TB). Source: official public API [api.vultr.com/v2/plans](https://api.vultr.com/v2/plans). The [pricing page](https://www.vultr.com/pricing/) returned HTTP 403 to my fetcher.

#### Vercel and Cloudflare (not VM providers; one line each)
- **Vercel Pro: $20/mo per developer seat.** It includes a $20 usage credit and 1 TB/mo Fast Data Transfer (then from $0.15/GB) ([vercel.com/pricing](https://vercel.com/pricing), as of 2026-10-24). Functions are serverless with a max duration of 800 s on Pro (30 min in beta) ([duration docs](https://vercel.com/docs/functions/configuring-functions/duration), updated 2026-08-24). Always-on containers or VMs are not the model.
- **Cloudflare Workers Paid: $5/mo minimum per account.** It includes 10M requests and 30M CPU-ms. There are "no additional charges for data transfer (egress) or throughput (bandwidth)" for Workers ([Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), as of 2026-10-24). Containers on Workers Paid are billed per vCPU-second, GiB-second and GB-second, with egress at $0.025/GB after 1 TB in North America and Europe.

#### Akash Network (bid market) (as of 2026-10-24)
- **How pricing works.** Providers bid and the tenant picks a bid. "Bid price is per block (~6 seconds)", for example "10,000 uact/block" ([Providers & Leases doc](https://akash.network/docs/learn/core-concepts/providers-leases/)). **A lease is with one specific provider.** The docs say a lease is "tied to a specific provider", and changing provider requires closing the deployment and creating a new one ([Deployments doc](https://akash.network/docs/learn/core-concepts/deployments/)). If a lease is closed by the provider, that is a "permanent end state". If the provider stops responding, the docs advise to "close lease and redeploy" ([Providers & Leases](https://akash.network/docs/learn/core-concepts/providers-leases/)). There is no automatic failover.
- **Payment currency is now ACT, not AKT.**
  - Burn-Mint Equilibrium (AEP-76, Mainnet 17) was scheduled to go live **2026-03-23** ([Akash blog, 2026-03-18](https://akash.network/blog/what-burn-mint-equilibrium-means-for-akash/)). Tenants "burn AKT ... to mint ACT", which is "a non-transferable, USD-pegged compute credit".
  - In the managed Console, credits are "denominated in US dollars" and can be bought by credit card. Console "converts them to the network's ACT token behind the scenes" ([How funding works](https://akash.network/docs/getting-started/how-funding-works/)).
  - USDC was the earlier AEP-23 option. The default provider bid script still accepts the USDC IBC denom, but I found no 2026 doc confirming USDC is still offered to tenants.
  - In my sample of 2,261 recent CPU-only leases, the denominations were 2,164 `uact` and 97 `uakt` (older leases). There was no USDC.
- **Observed market prices** (my own analysis of on-chain lease data from the official Console API `https://console-api.akash.network/v1/providers/{addr}/deployments/0/100`, covering all 58 online providers, pulled 2026-10-24):
  - Conversion: uact/block × ~446,600 blocks/month ÷ 1e6 = USD/month. Block time is ~5.89 s, derived from block heights 29196301 → 29210971 over 24 h.
  - **2 vCPU / 4 GiB CPU-only leases created in the last 90 days: n=186, 20 providers. Min $0.98, median $3.99, max $14.28 per month.** These include small ephemeral storage but not 50 GB persistent storage.
  - Leases that were still active or ran 7 days or more: $3.09–$6.33/mo (n=9). Many sampled leases were short-lived tests.
- **Default provider price formula** (Akash's [provider helm chart bid script](https://github.com/akash-network/helm-charts/blob/main/charts/akash-provider/scripts/price_script_generic.sh), ACT support added 2026-03-23):
  - Targets: CPU $1.60/thread-mo, RAM $0.80/GiB-mo, ephemeral $0.02/GiB-mo, persistent SSD (beta2) $0.03/GiB-mo, NVMe $0.04, dedicated IP lease $5/mo.
  - Our workload: 2×1.60 + 4×0.80 + 50×0.03 = **$7.90/mo** (+$5 if a dedicated IPv4 lease is needed).
  - The script converts to per-block prices using 429,909 blocks/month. At the current ~5.89 s blocks, actual monthly cost is about 4% higher (~$8.20).
- **Akash's own estimator API** (`POST https://console-api.akash.network/v1/pricing`, spec 2 CPU / 4 GiB / 50 GiB) returns **akash $18.66**, aws $75.82, gcp $82.61, azure $87.67.
  - Caveat: the [source code](https://github.com/akash-network/console/blob/main/apps/api/src/pricing/services/pricing/pricing.service.ts) uses older fixed targets ($4.50/CPU, $1.25/GB RAM, $0.08/GB storage). It prices the competitors as **Fargate, GKE and Azure Container Instances**, not VMs.
  - Do not cite its AWS figure against the $38.02 EC2 figure above.
- **Network size on 2026-10-24** ([Console API dashboard-data](https://console-api.akash.network/v1/dashboard-data); also shown on [stats.akash.network](https://stats.akash.network/)): 58 active providers, 656 active leases, about $6,242/day spent (dailyUUsdSpent). The AKT price was ~$0.648 ([market-data](https://console-api.akash.network/v1/market-data)).

---

### PART 2: Egress (data transfer out to the internet, US, first tiers)

| Provider | Free allowance | First paid tier | Source / as-of |
|---|---|---|---|
| AWS (us-east-1) | 100 GB/mo free, aggregated across services | **$0.09/GB** for the first 10 TB, then $0.085 (next 40 TB), $0.07 (next 100 TB), $0.05 (over 150 TB) | Price-list file published 2026-09-16 ([EC2 On-Demand page, Data Transfer](https://aws.amazon.com/ec2/pricing/on-demand/)) |
| GCP (us-central1), Premium Tier (default) | Only 1 GiB in the table (plus the Free Tier program) | **$0.12/GiB** (1 GiB–1 TiB) to North America and Europe, then $0.11 (1–10 TiB), then $0.08 to NA / $0.085 to EU | [VPC network pricing](https://cloud.google.com/vpc/network-pricing), 2026-10-24 |
| GCP Standard Tier | First 200 GiB/mo free | **$0.085/GiB** up to 10 TiB, then $0.065, then $0.045 | same |
| Azure (from North America/Europe), Microsoft premium network (default) | First 100 GB/mo free | **$0.087/GB** (next 10 TB), then $0.083, $0.07, $0.05 | [Bandwidth pricing](https://azure.microsoft.com/en-us/pricing/details/bandwidth/) + Retail Prices API, 2026-10-24 |
| Azure, Routing Preference "Internet" | First 100 GB free | $0.08/GB (next 10 TB) | same |
| DigitalOcean | Plan allowance, pooled per team (4,000 GiB for the 2/4 Droplet) | **$0.01/GiB** overage; inbound free | [Bandwidth billing doc](https://docs.digitalocean.com/platform/billing/bandwidth/) |
| Hetzner | **20 TB** included in EU (CX23/CPX22); 2 TB on US CPX21; 1 TB on Singapore CPX22 | **€1.00 per extra TB** in EU and US (€7.40/TB in Singapore), excl. VAT | [Regular Performance page](https://www.hetzner.com/cloud/regular-performance), [Cost-Optimized page](https://www.hetzner.com/cloud/cost-optimized) |
| Linode | 4 TB pooled (Linode 4GB) | $0.005/GB | [Linode API](https://api.linode.com/v4/network-transfer/prices) |
| Cloudflare Workers | No egress charges | n/a | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| Vercel Pro | 1 TB Fast Data Transfer | from $0.15/GB | [vercel.com/pricing](https://vercel.com/pricing) |

**Free-egress-when-leaving policies (2024):**
- **Google Cloud** (announced 2024-01-11, [blog](https://cloud.google.com/blog/products/networking/eliminating-data-transfer-fees-when-migrating-off-google-cloud)). You submit an "Exit Notice" form and must "migrate all of your workloads and data from the relevant Google Cloud service". "You are not eligible ... if you are not terminating your agreement for the relevant Google Cloud services." The agreement for those services terminates after you file a Completion Notice ([Exit page](https://cloud.google.com/exit-cloud)).
- **AWS** (announced 2024-03-05, [blog](https://aws.amazon.com/blogs/aws/free-data-transfer-out-to-internet-when-moving-out-of-aws/), updated 2025-09-30 and 2026-10-08). You must contact AWS Support, and approved customers get credits. You do **not** have to close your account. Customers outside the EU have **180 days** to complete the move. The post says the waiver "follows the direction set by the European Data Act". EU customers follow the AWS EU Data Act Addendum. AWS also says over 90% of customers already pay nothing for egress because of the 100 GB free allowance.
- **Azure** (announced 2024-03-13, [Azure update mirror](https://mc.merill.net/message/AZ-now-available-free-data-transfer-out-to-internet-when-leaving-azure); FAQ on the [Bandwidth pricing page](https://azure.microsoft.com/en-us/pricing/details/bandwidth/)). You open a support request, and the credit is applied "when the data transfer process is complete and **all Azure subscriptions associated to the account have been canceled**." The update says it "aligns with the European Data Act". Trade press reports a 60-day window ([Virtualization Review](https://virtualizationreview.com/articles/2024/03/15/data-egress-fees.aspx)).
- **EU Data Act context (secondary sources):** the switching rules have applied since 2025-09-12. Until 2027-01-12, providers may charge only reduced, cost-based switching fees. From 2027-01-12, switching charges are banned, but ordinary egress stays chargeable ([Latham & Watkins](https://www.lw.com/en/insights/eu-data-act-significant-new-switching-requirements-due-to-take-effect-for-data-processing-services)).

---

### PART 3: Cloud infrastructure market share (Synergy Research Group)

**Latest: Q2 2026**, published **2026-07-30** ([Synergy: "Q2 Cloud Market Passes $143 Billion; Highest Growth Rate in Eight Years"](https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years)):
- Total market: **$143.4 billion** for the quarter, **+43% YoY**. This includes IaaS, PaaS and hosted private cloud. The trailing 12 months come to about $500 billion.
- Shares: **Amazon 28%, Microsoft 20%, Google 15%**. Combined, that is 63% of the total market.
- Synergy also says that in public cloud (IaaS + PaaS) "the top three account for 67% of the market".
- Synergy names CoreWeave, OpenAI, Oracle, Crusoe, Nebius, Anthropic and Nscale as the fastest-growing tier-two providers.
- **Q3 2026 is not yet published** as of 2026-10-24. Synergy usually publishes in late October or November.

**Trend data points:**

| Quarter | Market | Amazon | Microsoft | Google | Top 3 | Source |
|---|---|---|---|---|---|---|
| Q2 2024 | $79B (+22% YoY) | 32% | 23% | 12% | 67% (sum; a secondary repost says 73% of public cloud) | [Synergy, 2024-08-01](https://www.srgresearch.com/articles/cloud-market-growth-stays-strong-in-q2-while-amazon-google-and-oracle-nudge-higher) |
| Q3 2025 | $107B | 29% | 20% | 13% | 63% | [Synergy, 2025-11-19](https://srgresearch.com/articles/cloud-market-share-trends-big-three-together-hold-63-while-oracle-and-the-neoclouds-inch-higher) |
| Q2 2026 | $143.4B (+43% YoY) | 28% | 20% | 15% | 63% | [Synergy, 2026-07-30](https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years) |

---

### PART 4: Web2 platform facts (comparison matrix)

**AWS**
- **Size:** "124 Availability Zones within 39 Geographic Regions", with 2 more regions announced (Saudi Arabia, Chile) ([Global Infrastructure](https://aws.amazon.com/about-aws/global-infrastructure/), 2026-10-24).
- **Redundancy is configured by the customer.** AWS does not "automatically replicate resources across Regions". You protect against an AZ failure "By launching EC2 instances in multiple Availability Zones" ([EC2 Regions & Zones doc](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)).
- **SLA:** single instance 99.5%. 99.99% requires instances "across two or more AZs" ([EC2 SLA](https://aws.amazon.com/compute/sla/)).
- **Suspension:** Customer Agreement §4.1: "We may suspend your or any End User's right to access or use any portion or all of the Services" for security risk, adverse effect on AWS or other customers, material breach, or nonpayment. §5.2(a) allows termination "for any reason" with 30 days' notice. Last updated 2026-08-14 ([AWS Customer Agreement](https://aws.amazon.com/agreement/)). The AUP allows AWS to "remove or disable access to any content or resource that violates this Policy" ([AWS AUP](https://aws.amazon.com/aup/), last updated 2021-07-01).

**Google Cloud**
- **Size:** "43 global regions and 130 zones" ([Locations](https://cloud.google.com/about/locations), 2026-10-24).
- **Redundancy is configured by the customer.** SLA: single instance ≥99.9%; "Instances in Multiple Zones" ≥99.99% (Premium Tier) ([Compute Engine SLA](https://cloud.google.com/compute/sla), last modified 2026-10-14).
- **Suspension:** Terms §4.1: for AUP violations not fixed within 24 hours, "Google may Suspend all or part of Customer's use of the Services". §4.2 allows immediate suspension to protect the Services, for suspected unauthorized access, for legal compliance, or for breach of restrictions ([Google Cloud Terms](https://cloud.google.com/terms), [AUP](https://cloud.google.com/terms/aup)).

**Microsoft Azure**
- **Size:** "80+ Azure regions | 500+ datacenters" ([Azure global infrastructure](https://azure.microsoft.com/en-us/explore/global-infrastructure/), 2026-10-24).
- **Redundancy is configured by the customer.** "A zonal VM isn't resilient to zone outages". "VMs are single-region resources". For multi-region "you need to implement replication, load balancing, and failover". Reliability "is a shared responsibility" ([Reliability in Azure VMs](https://learn.microsoft.com/en-us/azure/reliability/reliability-virtual-machines)).
- **Suspension:** Online Subscription Agreement §3.c: "We may suspend your use of the Online Services if: ... (3) you do not pay amounts due ... (4) you do not abide by the Acceptable Use Policy or you violate other terms". Subscriptions can be terminated if the issue is not resolved within 60 days, or after more than two suspensions in 12 months ([Microsoft Online Subscription Agreement](https://azure.microsoft.com/en-us/support/legal/subscription-agreement/)). That page shows "Last updated: March 2019". Newer customers sign the Microsoft Customer Agreement.

**DigitalOcean**
- **Size:** "16 datacenters across 13 regions" ([Regional availability](https://docs.digitalocean.com/platform/regional-availability/)).
- **Redundancy is configured by the customer.** The SLA is 99.99% "for each individual Droplet instance", measured independently ([Droplet SLA](https://www.digitalocean.com/sla/cpu-droplets)). Nothing is replicated automatically across regions.
- **Suspension:** ToS §12: "we reserve the right, in our sole discretion, to terminate your access to all or any part of the Websites and/or Services ... at any time, with or without notice, effective immediately". Last updated 2026-08-22 ([ToS](https://www.digitalocean.com/legal/terms-of-service-agreement)). AUP: "we may ... suspend or terminate your use of the Services", "even if a violation is committed unintentionally". It also bans "Mining any cryptocurrency ... without explicit written permission" (last updated 2026-03-20) ([AUP](https://www.digitalocean.com/legal/acceptable-use-policy)).

**Vercel**
- **Size:** "126 PoPs" and "19 compute-capable regions". Functions default to iad1 (Washington, D.C.) ([Regions doc](https://vercel.com/docs/regions), updated 2026-08-11).
- **Redundancy is partial.** CDN traffic "is automatically rerouted" during a regional outage. Automatic function failover is for **Enterprise only** (same doc).
- **Suspension:** Terms §19.1: "Vercel may terminate your account and this Agreement at any time by providing thirty (30) days prior notice". It can also terminate "immediately if you exceed any Vercel limits". Hobby projects can be terminated "without notice for any reason or no reason". Last updated 2026-10-19 ([Vercel Terms](https://vercel.com/legal/terms), [AUP](https://vercel.com/legal/acceptable-use-policy)).

**Hetzner**
- **Size:** 6 cloud locations: Falkenstein, Nuremberg, Helsinki, Ashburn VA, Hillsboro OR, Singapore ([Locations doc](https://docs.hetzner.com/cloud/general/locations/)).
- **Redundancy is configured by the customer.** A server lives in one location. Spread placement groups only put servers "on different physical servers" ([Placement groups doc](https://docs.hetzner.com/cloud/placement-groups/overview/)).
- **Suspension:** T&Cs (v2.0.0, 2021-10-27): §2.6 lets either party terminate on 30 days' notice "without specifying any reasons". §2.7 reserves the right "to terminate the contractual relationship without notice for good cause", including "locking or terminating the Customer's services or account without notice". §8.3 allows locking access for non-compliance ([Hetzner T&Cs](https://www.hetzner.com/legal/terms-and-conditions/)). System Policies: "Hetzner Online has the right to suspend access to all of our products" ([System Policies](https://www.hetzner.com/legal/system-policies/)).
- **Crypto stance (current wording, verified 2026-10-24):**
  - T&Cs §8.3: "The operation of applications for mining cryptocurrencies remains prohibited. These include, but are not limited to, mining, farming and plotting of cryptocurrencies. We are entitled to lock the Customer's access to their Hetzner services or account in the event of non-compliance."
  - The US Special Terms §4 contain the same ban.
  - The T&Cs do not use the words "blockchain", "node" or "staking". However, in 2022 Hetzner told customers that the ban covers proof-of-stake and running even a single node, and later all crypto-related use including RPC nodes, with colocation excepted ([The Block](https://www.theblock.co/post/165976/host-of-10-of-ethereum-nodes-prohibits-crypto-usage-discussing-consequences), [CryptoSlate](https://cryptoslate.com/data-center-operator-hosting-17-of-ethereums-nodes-says-staking-is-not-permitted/)). Those are secondary sources reporting Hetzner statements.

**Cloudflare**
- **Size:** "348 cities" ([Cloudflare network](https://www.cloudflare.com/network/), 2026-10-24).
- **Distribution is automatic.** "By default, Workers ... run in a data center closest to where the request was received", on "Cloudflare's global network, not inside cloud provider regions" ([Smart Placement doc](https://developers.cloudflare.com/workers/configuration/smart-placement/)).
- **Suspension:** Self-Serve Subscription Agreement §8: "We may at our sole discretion terminate your user account or Suspend or terminate your use or access to the Service ... with or without notice for any reason or no reason at all." Last updated 2025-09-12 ([Cloudflare Terms](https://www.cloudflare.com/terms/)).

---

### Gaps / uncertain

1. **Akash:**
   - The market price comes from my own sample: the most recent 100 deployments per online provider. Most leases were short-lived and none of the 2/4 leases included 50 GB of persistent storage. I estimated storage from the default script ($0.03/GiB-mo SSD).
   - There is no official "average CPU price" page. akash.network/pricing redirects to a GPU-only page, and stats.akash.network renders in JavaScript, so I used its API instead.
   - I could not confirm whether USDC is still offered to tenants after BME. ACT is the current denomination.
2. **Hetzner:**
   - I did not find the Volume per-GB price, so I could not price the extra 10 GB that CX23 needs to reach 50 GB.
   - All plans showed "currently unavailable" to my fetcher. A third party reported that CPX plans were orderable in September 2026. Availability may depend on the account.
   - USD prices come from the price-adjustment doc. The product page showed only EUR.
3. **GCP:** the e2-medium and pd-balanced rates come from the server-rendered GCP pricing pages; the default table region is Iowa. The Premium Tier egress table is from the same kind of page. The "1 GiB free" row there is separate from the Free Tier program.
4. **Azure:** the "60 days" exit window is from trade press, not a Microsoft page I loaded. The Bv1 retirement date (2028-11-15) is from the docs.azure.cn mirror. Microsoft Learn confirms only "End of Life".
5. **Vultr:** the pricing page returned 403. Figures are from Vultr's public plans API. I did not verify the overage $/GB.
6. **Synergy:** Q3 2026 has not been released yet. Shares are rounded by Synergy. The top-3 figures for Q2 2024 and Q2 2026 are sums of the rounded shares, except Synergy's own 63% for Q3 2025 and its 67% public-cloud figure for Q2 2026.
7. **Hetzner crypto:** the "nodes/staking included" interpretation comes from 2022 press coverage of Hetzner statements. Current official text names only mining, farming and plotting.

### Additional web2 facts verified by the comparison researcher (2026-10-24)

**Self-healing.** All four big platforms below can heal, but only after you set it up, and only within that provider.
- **AWS:** "When Amazon EC2 Auto Scaling determines that an InService instance is unhealthy, it replaces it with a new instance to maintain the desired capacity of the group." This requires an Auto Scaling group ([AWS docs](https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-health-checks.html)).
- **Google Cloud:** "Health checks for autohealing detect unhealthy VMs and proactively recreate those VMs". To use it, "you must" create a health check and an autohealing policy on a managed instance group ([GCP docs](https://docs.cloud.google.com/compute/docs/instance-groups/autohealing-instances-in-migs)).
- **Azure:** Virtual Machine Scale Sets have "automatic instance repairs" (default action: Replace). It requires application health monitoring and an opt-in policy ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-automatic-instance-repairs)).
- **Vercel:**
  - "Vercel Functions have multiple availability zone redundancy by default. Multi-region redundancy is available depending on your runtime." Multi-region failover ("Function Failover", `functionFailoverRegions`) "available on Enterprise plans". Hobby gets a single region, Pro 5 regions ([Vercel docs](https://vercel.com/docs/functions/configuring-functions/region)).
  - The default function region is `iad1`, which Vercel's region table maps to `us-east-1`. All 19 compute regions carry AWS region codes. The CDN has 126 PoPs in 94 cities across 51 countries ([Vercel regions](https://vercel.com/docs/regions)).
  - Vercel published "Update regarding Vercel service disruption on October 20, 2025" ([blog](https://vercel.com/blog/update-regarding-vercel-service-disruption-on-october-20-2025)).

**Replicated storage.**
- **AWS EBS:** "When you create an EBS volume, it is automatically replicated within its Availability Zone to prevent data loss due to failure of any single hardware component." Snapshots go to S3, "stored redundantly in multiple Availability Zones" ([AWS docs](https://docs.aws.amazon.com/ebs/latest/userguide/EBSFeatures.html)).
- **Azure managed disks:** "Locally redundant storage (LRS) replicates your data three times within a single data center". Zone-redundant storage (ZRS) "synchronously replicates your Azure managed disk across three Azure availability zones" ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/virtual-machines/disks-redundancy)).
- **Google Cloud Persistent Disk:** "The data on each Persistent Disk volume is distributed across several physical disks". Regional PD "provides twice as many disk replicas as zonal Persistent Disk", with the replica in a second zone ([GCP docs](https://docs.cloud.google.com/compute/docs/disks/persistent-disks)).
- **Hetzner Volumes:** "every block of data is stored on three different physical servers"; "we do not provide Backups or Snapshots for Volumes" ([Hetzner docs](https://docs.hetzner.com/cloud/volumes/overview/)).
- **DigitalOcean Volumes:** the docs mention only "encrypted Ceph-backed durability" and give no replica count ([DO docs](https://docs.digitalocean.com/products/volumes/)).
- **Vercel:** "Nothing written to the local filesystem or process memory survives between instances". Storage is Vercel Blob, Global Config, or Marketplace databases such as Neon, Upstash and Supabase ([Vercel storage](https://vercel.com/docs/storage), [Docker guide](https://vercel.com/kb/guide/docker-monolith-workers-vercel)).

**Containers on Vercel (new in 2026, beta).**
- "Container images and Vercel Services are in beta and available on all plans." They are request-driven, "Each request is bound by the function's maxDuration, which defaults to 300s and goes up to 800s on Pro and Enterprise", and they scale to zero after 5 idle minutes ([Vercel KB](https://vercel.com/kb/guide/docker-monolith-workers-vercel)).
- "Vercel Daemons is available in Public Beta on all plans." Daemons run background containers that receive no inbound HTTP or TCP traffic and have no persistent local storage ([Vercel KB](https://vercel.com/kb/guide/vercel-daemons)).

**Load balancers.**
- **Hetzner:** Load Balancers "distribute traffic across multiple target servers" and are priced separately ([Hetzner docs](https://docs.hetzner.com/cloud/load-balancers/overview/)).
- **DigitalOcean:** "Regional HTTP load balancers cost $12.00 per month per node" ([DO docs](https://docs.digitalocean.com/products/networking/load-balancers/details/pricing/)).
- **DigitalOcean App Platform:** "deploys applications from Git repositories or container images", with an included subdomain plus custom domains ([DO docs](https://docs.digitalocean.com/products/app-platform/)).
- **AWS ALB:** $0.0225 per ALB-hour and $0.008 per LCU-hour in us-east-1 ([AWS](https://aws.amazon.com/elasticloadbalancing/pricing/)). "One Elastic load balancer with two in-use public IPv4 address" are billed at $0.005/h each ([VPC pricing](https://aws.amazon.com/vpc/pricing/)).
- **Google Cloud:** "First 5 forwarding rules $0.025 / 1 hour"; "Inbound data processed by load balancer $0.008 / 1 gibibyte" ([network pricing](https://cloud.google.com/vpc/network-pricing)).
- **Azure Standard LB:** "Standard Included LB Rules and Outbound Rules" cost $0.025/hour ([Retail Prices API](https://prices.azure.com/api/retail/prices?$filter=productName%20eq%20%27Load%20Balancer%27)).

**GPUs.**
- **AWS:** "P5 instances, powered by NVIDIA H100 Tensor Core GPUs, and P5e and P5en instances powered by NVIDIA H200 Tensor Core GPUs" ([AWS](https://aws.amazon.com/ec2/instance-types/p5/)).
- **Google Cloud:** A3 machines use H100 or H200, A4 uses B200, and A4X uses GB200 and GB300 ([GCP docs](https://docs.cloud.google.com/compute/docs/gpus)).
- **Azure:** "The ND H100 v5 series starts with a single VM and eight NVIDIA H100 Tensor Core GPUs … can scale up to thousands of GPUs" ([Microsoft Learn](https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series)).
- **DigitalOcean:** GPU Droplets with NVIDIA B300, H200, H100, RTX 4000/6000 Ada and L40S, and AMD MI350X, MI325X and MI300X. On-demand pricing "starts around $0.76 to $11.19 per GPU/hour" ([DO](https://www.digitalocean.com/products/gpu-droplets)).
- **Hetzner:** GEX dedicated servers with RTX PRO 4000 Blackwell (from €214/month) and RTX PRO 6000 Blackwell; no H100 ([Hetzner](https://www.hetzner.com/dedicated-rootserver/matrix-gpu/)).

**Akash custom domains.** SDL `expose` takes "Accepted hostnames" ([SDL syntax reference](https://akash.network/docs/developers/deployment/akash-sdl/syntax-reference/)). AEP-66 (Status: Draft) aims to give tenants custom domains with TLS "without relying on third party solutions such as Cloudflare" ([AEP-66](https://akash.network/roadmap/aep-66/)). The set-A notes cite a custom-domain guide URL that now returns 404; the data uses these two sources instead.

**AWS service count.** aws.amazon.com/what-is-aws no longer states a number of services, so the data says "vast catalogue" without a figure.

## 15. Appendix D: outage and deplatforming incidents (full notes)

_Research pass on incidents, 2026-10-24. Spot-checked against the primary sources: Railway incident report, The Register (AWS Middle East), Google incident Xs2XTHzAVC9YnafnPyzj, Azure PIR FNJ8-VQZ._


Researched 2026-10-24. Wherever a provider post-incident report (PIR) exists, its timeline is treated as authoritative. Times are converted to UTC (PDT = UTC-7, PST = UTC-8, CET = UTC+1, CEST = UTC+2).

**Access note:** my tools could not fetch reuters.com, apnews.com, bbc.com, theverge.com, arstechnica.com, ookla.com, or downdetector.com. Reuters and AP reporting is therefore cited through syndicated reprints, which are marked as such. Press citations otherwise lean on CNBC, Bloomberg, and The Register.

---

### 2025-10-20 AWS: DynamoDB DNS race condition takes down us-east-1

- **Provider:** Amazon Web Services, US-EAST-1 (N. Virginia)
- **Root cause:** A latent race condition in DynamoDB's automated DNS management (a "DNS Planner" plus several "DNS Enactors") left an empty DNS record for the regional DynamoDB endpoint, and the automation did not repair it. That failure then cascaded into EC2 (DWFM "congestive collapse"), NLB, Lambda, and other services. Sources: [AWS PES](https://aws.amazon.com/message/101925/), [The Register](https://www.theregister.com/2025/10/23/amazon_outage_postmortem/).
- **Impact:** DynamoDB, EC2 launches, Network Load Balancer, Lambda, ECS/EKS/Fargate, Amazon Connect, STS, IAM/console sign-in, Redshift, Support Center and more, all in us-east-1. Services elsewhere that depend on us-east-1 were also hit. AWS later disabled the DynamoDB DNS Planner/Enactor automation worldwide ([The Register](https://www.theregister.com/2025/10/23/amazon_outage_postmortem/)).
- **Duration (AWS PES):**
  - The event started 11:48 PM PDT Oct 19 (06:48 UTC Oct 20) and ended 2:20 PM PDT Oct 20 (21:20 UTC), so **~14.5 h**.
  - The DynamoDB DNS phase itself ran 06:48 to 09:40 UTC (~2h52m).
  - EC2 fully recovered at 20:50 UTC and NLB at 21:09 UTC.
  - Redshift tail: not fully restored until 4:05 AM PDT Oct 21 (11:05 UTC), ~28 h after the start.
  - Parametrix splits it into a severe first phase of "approximately 2 hours and 36 minutes" and a fragmented second phase of 7.5 h ([Insurance Edge](https://insurance-edge.net/2025/10/30/parametrix-estimates-aws-outage-costs/)).
  - The often-quoted "07:11 UTC" is AWS's first public status post (12:11 AM PDT). The PES puts the actual start at 06:48 UTC.
- **Affected services (reputable sources):**
  - Snapchat, Reddit: Reuters via [The Insurer](https://www.theinsurer.com/cyber-risk/news/amazons-aws-recovering-after-major-outage-disrupts-apps-services-worldwide-2025-10-20).
  - Robinhood, Coinbase, Perplexity: Reuters via [Jakarta Post](https://www.thejakartapost.com/culture/2025/10/20/amazons-cloud-unit-reports-outage-several-websites-down.html).
  - Fortnite, Alexa, Amazon Prime, Duolingo: AFP (via syndication, not fetched directly).
  - Crypto: Coinbase core functions were down for hours, and Base reported AWS was "affecting Base infrastructure" ([Fortune](https://fortune.com/crypto/2025/10/20/coinbase-robinhood-aws-outage-snapchat-hulu-crypto-services), [Decrypt](https://decrypt.co/345036/metamask-showing-zero-balances-base-network-struggling-aws-issues-persist)).
- **Downdetector:** Ookla's year-end analysis counts **over 17 million reports** across Amazon and dependent services, the largest outage of 2025, lasting "more than 15 hours". This is per [FoneArena summarising Ookla](https://www.fonearena.com/blog/471254/largest-outages-2025-ookla.html); the original is at ookla.com/articles/largest-outages-of-2025, which I could not fetch.
- **Economic impact:**
  - CyberCube: preliminary insured loss of **$38M to $581M**; ~2,000 large enterprises and ~70,000 organisations affected ([Risk & Insurance](https://riskandinsurance.com/aws-outage-loss-estimates-range-from-38m-to-581m-as-cyber-insurers-face-moderate-impact/)).
  - Parametrix: financial loss to US companies of **$500M to $650M** ([Insurance Edge](https://insurance-edge.net/2025/10/30/parametrix-estimates-aws-outage-costs/)).

### 2021-12-07 AWS: us-east-1 internal network congestion

- **Provider:** AWS, US-EAST-1
- **Root cause:** An automated capacity-scaling activity triggered unexpected behaviour in a large number of clients on AWS's internal network. That overwhelmed the devices connecting the internal and main networks, and a latent client back-off bug kept the congestion going ([AWS PES](https://aws.amazon.com/message/12721/)).
- **Impact:** All in us-east-1:
  - EC2 control plane and launches
  - Route 53 APIs
  - ELB APIs
  - Console login
  - STS
  - CloudWatch
  - API Gateway
  - EventBridge
  - Fargate, ECS, EKS
  - Amazon Connect
  - Support case creation
  - AWS's own Service Health Dashboard updates
- **Duration (AWS PES):**
  - Start 7:30 AM PST (15:30 UTC). Network devices fully recovered 2:22 PM PST (22:22 UTC), so **~6h52m**.
  - Tail: STS at 4:28 PM PST, Fargate at 5:00 PM PST, and EventBridge at 6:40 PM PST (02:40 UTC Dec 8). That is **~11h10m** to the last listed recovery.
- **Affected services:**
  - Disney+, Netflix, Slack, Ticketmaster, Robinhood, Coinbase ([CNBC](https://www.cnbc.com/2021/12/07/amazon-web-services-outage-causes-issues-at-disney-netflix-coinbase.html)).
  - Ring cameras ([CNBC Dec 10](https://www.cnbc.com/2021/12/10/aws-explains-outage-and-will-make-it-easier-to-track-future-ones.html)).
  - Amazon's own warehouse and delivery operations, confirmed by an Amazon spokesperson.
  - Bloomberg also names Adele ticket sales, Disney Parks, and Netflix ([Bloomberg](https://www.bloomberg.com/news/articles/2021-12-10/amazon-says-massive-cloud-outage-caused-by-unexpected-behavior)).
  - Kentik, via Reuters, estimated that Netflix lost ~26% of its traffic (reprint, not fetched directly).

### 2025-06-12 Google Cloud: Service Control null-pointer crash loop (global)

- **Provider:** Google Cloud, plus Google Workspace
- **Root cause:** A policy change containing unintended blank fields was written to regional Spanner tables and replicated globally. Service Control hit an unhandled null pointer in new code that had no error handling and no feature-flag protection, and its binaries crash-looped worldwide ([Google incident report](https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW)).
- **Impact:**
  - 503s on external API requests across dozens of products: IAM, Cloud Storage, Compute Engine, BigQuery, Cloud Run, Cloud SQL, Pub/Sub, Vertex AI, and others.
  - Workspace: Gmail, Drive, Calendar, Chat, Meet.
  - Global, with us-central1 slowest to recover.
- **Duration (Google):**
  - Dashboard header: 10:51 to 18:18 PDT, i.e. 17:51 UTC Jun 12 to 01:18 UTC Jun 13, so **~7h27m** including the Vertex AI tail.
  - Mini incident report: "Duration: 3 hours" (10:49 to 13:49 PDT); recovery in most regions "within 2 hours"; us-central1 took "up to ~2h 40 mins" to fully resolve.
  - The root cause was identified within ~10 minutes.
  - Suggested copy: **~3 h of broad impact, ~7.5 h until the last product recovered.**
- **Affected services:**
  - Spotify (>44,000 Downdetector reports), Discord (>8,000), Google Cloud (>10,000): Reuters via [BNN Bloomberg](https://www.bnnbloomberg.ca/business/technology/2025/06/12/google-cloud-spotify-down-for-tens-of-thousands-of-users-downdetector-shows/).
  - CNN reported ~46k Spotify and ~11k Discord reports ([CNN syndicated](https://abc17news.com/money/cnn-business-consumer/2025/06/12/internet-outages-show-signs-of-recovery-as-spotify-google-and-other-popular-online-services-are-down-for-thousands-of-users/)).
  - Cloudflare: see the next entry.

### 2025-06-12 Cloudflare: Workers KV fails because of its third-party cloud dependency

- **Provider:** Cloudflare, knocked over by the Google Cloud event above
- **Root cause:** Workers KV's central storage was "backed by a third-party cloud provider", which had an outage. Cloudflare's post does not name the vendor, but it coincided with the GCP event, and Cloudflare told CNN that a Google Cloud outage was behind it. Many Cloudflare products depend on KV ([Cloudflare blog](https://blog.cloudflare.com/cloudflare-service-outage-june-12-2025/)).
- **Impact:** Workers KV, WARP, Access, Gateway, dashboard login, Turnstile/Challenges, Browser Isolation, Images, Stream, Realtime, Workers AI, Pages/Workers Assets, Durable Objects, D1, Queues, AI Gateway, Zaraz, and reduced CDN efficacy in some regions.
- **Duration (Cloudflare):** Incident start 17:52 UTC, impact end 20:28 UTC (~2h36m). Cloudflare's text says "lasted 2 hours and 28 minutes"; the post itself has this mismatch.
- **Why it matters:** it is a clean example of one hyperscaler's bug taking down a second "independent" infrastructure provider.

### 2025-11-18 Cloudflare: oversized Bot Management feature file (global)

- **Provider:** Cloudflare
- **Root cause:** A ClickHouse database permissions change made a query emit duplicate rows into the Bot Management "feature file". The file roughly doubled in size, exceeded a hard-coded limit in the proxy, and crashed core traffic handling across the network ([Cloudflare blog](https://blog.cloudflare.com/18-november-2025-outage/)).
- **Impact:** HTTP 5xx errors for core CDN and security traffic globally, plus Turnstile, Workers KV, Access, and dashboard login (most users could not log in). Cloudflare: "Today was Cloudflare's worst outage since 2019."
- **Duration (Cloudflare):** Impact began 11:20 UTC (11:28 UTC reaching customers). Core traffic was "largely flowing as normal by 14:30" (**~3h10m**), and all systems were normal at 17:06 UTC (**~5h46m**).
- **Affected services:**
  - ChatGPT, Shopify, X ([CNBC](https://www.cnbc.com/2025/11/18/cloudflare-down-outage-traffic-spike-x-chatgpt.html)).
  - X and ChatGPT disrupted "for several hours" ([Bloomberg](https://www.bloomberg.com/news/articles/2025-11-18/chatgpt-x-among-sites-blocked-in-widespread-cloudflare-outage)).
  - Outage tracker Downdetector itself had problems (multiple outlets, e.g. [The Register](https://www.theregister.com/on-prem/2025/11/18/cloudflare-coughs-half-the-internet-catches-a-cold/2053619)).
- **Downdetector:** Ookla counts **over 3.3 million reports**, "nearly 5 hours" ([FoneArena/Ookla](https://www.fonearena.com/blog/471254/largest-outages-2025-ookla.html)).

### 2025-12-05 Cloudflare: WAF change for React CVE crashes older proxy (confirmed real)

- **Provider:** Cloudflare
- **Root cause:** To protect customers from React Server Components CVE-2025-55182, Cloudflare raised the WAF body buffer from 128KB to 1MB. It also used a global killswitch to disable an internal WAF test tool. In the older FL1 proxy, killswitching a rule with an "execute" action caused a Lua nil-index error ("attempt to index field 'execute' (a nil value)"), so affected requests returned HTTP 500 ([Cloudflare blog](https://blog.cloudflare.com/5-december-2025-outage/)).
- **Impact:** About **28% of all HTTP traffic** served by Cloudflare. Only customers on the FL1 proxy with the Cloudflare Managed Ruleset deployed were affected.
- **Duration (Cloudflare):** 08:47 to 09:12 UTC, **~25 minutes**. Cloudflare: "we let the Internet down again following the incident on November 18."
- **Affected services:**
  - Banking sites and Zoom ([Bloomberg Government](https://news.bgov.com/tech-and-telecom-law/cloudflare-says-it-fixed-outage-that-slowed-banking-sites-zoom)).
  - LinkedIn and Zoom widely reported ([CNBC](https://www.cnbc.com/2025/12/05/cloudlfare-is-investigating-issues-with-dashboard-and-related-apps.html), which I could not fetch; [Android Authority](https://www.androidauthority.com/cloudflare-down-december-2025-3622495)).
  - Longer lists (Coinbase, Canva, Shopify, Discord, Spotify, X) come from weaker outlets: unverified.

### 2022-06-21 Cloudflare: BGP policy change withdraws 19 data centers

- **Root cause:** A change to prefix-advertisement policy reordered terms so that a reject rule ran before the site-local prefixes, which withdrew them ([Cloudflare blog](https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/)).
- **Impact:** 19 data centers, only ~4% of the network, but they handle **~50% of total requests**.
- **Duration:** 06:27 to 07:42 UTC, **~1h15m** (closed 08:00 UTC).

### 2019-07-02 Cloudflare: catastrophic-backtracking regex in WAF

- **Root cause:** A single new WAF rule contained a regular expression that backtracked excessively and exhausted CPU on HTTP/HTTPS cores worldwide ([Cloudflare blog](https://blog.cloudflare.com/details-of-the-cloudflare-outage-on-july-2-2019/)).
- **Impact:** Global 502s; traffic dropped ~80%.
- **Duration:** 13:42 to 14:09 UTC, **27 minutes**.
- **For the site:** of the Cloudflare entries, Nov 18 2025 is the strongest. Jun 12 2025 is the best "dependency chain" story, and Dec 5 2025 is useful for "twice in 17 days".

### 2024-07-19 CrowdStrike: Falcon Channel File 291 crashes 8.5M Windows machines (plus the same-day Azure Central US outage)

- **Provider:** CrowdStrike, a security vendor rather than a cloud host. Present this as a "centralized vendor single point of failure", not as a hosting outage.
- **Root cause:**
  - A content update (Channel File 291) defined 21 input fields, but the sensor supplied only 20. The Content Validator did not catch it, and the result was an out-of-bounds read that crashed Windows.
  - The RCA says it was not caused by null bytes ([CrowdStrike RCA PDF](https://crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf)).
- **Impact:**
  - Microsoft estimated **8.5 million Windows devices**, "less than one percent of all Windows machines" ([Microsoft blog, David Weston, 2024-07-20](https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/)).
  - Hosts needed manual remediation because boot-looping machines could not download the fix. Linux and macOS were not affected.
- **Duration:**
  - The bad file was live from 04:09 to 05:27 UTC (78 min) ([CrowdStrike technical details](https://www.crowdstrike.com/en-us/blog/falcon-update-for-windows-hosts-technical-details/)).
  - Recovery took days: ~97% of Windows sensors were back online by Jul 24 and ~99% by Jul 29, compared with pre-incident levels ([CrowdStrike remediation hub](https://www.crowdstrike.com/falcon-content-update-remediation-and-guidance-hub/)).
- **Affected services:**
  - Airlines: OAG data shows the largest airlines cancelled ~9,650 flights over Jul 19 to 21, with Delta worst hit and United, American, and Spirit also affected ([Business Traveller](https://www.businesstraveller.com/business-travel/2024/07/22/worlds-largest-airlines-cancelled-10000-flights-in-three-days-due-to-it-outage/)).
  - Delta: the CEO put the cost at ~$500M, with disruption lasting through Jul 25 ([NPR via OPB](https://opb.org/article/2024/07/31/delta-s-ceo-says-the-crowdstrike-outage-cost-the-airline-500-million-in-5-days)).
  - Banks and hospitals were widely reported.
- **Economic impact (Parametrix):**
  - **$5.4B** in losses for Fortune 500 companies excluding Microsoft; about 1 in 4 Fortune 500 firms were disrupted.
  - By sector: healthcare ~$1.9B, banking ~$1.1B, airlines ~$860M.
  - Insured losses estimated at $540M to $1.08B.
  - Sources: [Axios](https://www.axios.com/2024/07/24/fortune-500-crowdstrike-outage-impact), [Insurance Business](https://www.insurancebusinessmag.com/us/news/reinsurance/parametrix-insured-losses-from-crowdstrike-outages-could-hit-1-08-billion-among-fortune-500-498761.aspx).
- **Same-day Azure event (separate cause):** Azure Central US, tracking ID 1K80-N_8 ([Azure PIR](https://azure.status.microsoft/en-us/status/history/?trackingId=1K80-N_8)).
  - It actually began **2024-07-18 UTC**.
  - Cause: an incomplete storage "allow list", generated from file servers that had become unreachable, was deployed region-wide. Storage then rejected VM disk requests and the VMs restarted.
  - Window: 21:40 UTC Jul 18 to 22:00 UTC Jul 19 (**~24h20m** to the last impact). Storage was restored at 02:55 UTC Jul 19 (~5h15m).
  - Affected: VMs, Azure SQL, Cosmos DB, ARM, Azure DevOps, Entra ID, App Service, plus Microsoft 365 and Dynamics 365 through dependencies.

### 2025-10-29 Microsoft Azure Front Door: global config defect

- **Provider:** Microsoft Azure Front Door (AFD) and its CDN. Tracking ID YKYN-BWZ.
- **Root cause:** Valid customer configuration changes made across two control-plane build versions produced incompatible metadata. That metadata hit a latent data-plane bug that crashed edge servers. The defect got past pre-production validation because not all features were tested across build versions ([Azure PIR](https://azure.status.microsoft/en-us/status/history/?trackingId=YKYN-BWZ)).
- **Impact:**
  - Azure Portal, App Service, Azure SQL Database, AAD B2C, Databricks, Communication Services, Static Web Apps, Entra ID, Dynamics 365, Power Platform, Purview, support case creation.
  - "Other Microsoft services were also impacted, including Microsoft 365."
  - Global. Customer config changes stayed blocked until 2025-11-05.
- **Duration (Azure PIR):** 15:41 UTC Oct 29 to 00:05 UTC Oct 30, **~8h24m**.
- **Affected services:**
  - AP reported problems with Office 365, Minecraft, Xbox Live, and Copilot via Downdetector, and Alaska Airlines check-in problems from the airline's own statement ([AP via ABC7](https://abc7.com/post/microsoft-azure-outage-today-technology-company-says-cloud-service-experiencing-issues/18086551/)).
  - Heathrow and Hawaiian Airlines were also reported (TechRepublic).
  - It came about nine days after the AWS outage and hours before Microsoft's earnings.

### 2021-06-08 Fastly: one customer config change takes out 85% of the CDN

- **Provider:** Fastly
- **Root cause:** A software bug shipped May 12 was triggered on June 8 by a valid customer configuration change, and **85% of Fastly's network returned errors** ([Fastly blog](https://www.fastly.com/blog/summary-of-june-8-outage)).
- **Duration (Fastly timeline, UTC):**
  - 09:47 onset; 10:27 customer config identified; 10:36 services began recovering.
  - "Within 49 minutes, 95% of our network was operating as normal."
  - 11:00 majority recovered; 12:35 mitigated; 12:44 resolved.
  - So **~49 min** of major impact, ~2h48m to full mitigation.
- **Affected services:**
  - Amazon, Reddit, Twitch, gov.uk, New York Times, Financial Times, Guardian, CNN, BBC, Bloomberg News, The Verge, PayPal, Spotify, GitHub ([TechCrunch](https://techcrunch.com/2021/06/08/numerous-popular-websites-are-facing-an-outage/), [CNBC via NBC Bay Area](https://www.nbcbayarea.com/news/business/money-report/reddit-and-global-news-sites-including-ft-new-york-times-and-bloomberg-experience-outage/2564453/)).
  - Downdetector: ~21,000 Reddit reports and >2,000 for Amazon (per press).

### 2021-03-10 OVHcloud: Strasbourg SBG2 data center destroyed by fire

- **Date note:** OVH says the fire broke out "10 March at 00:47" local time (CET). That is **2021-03-09 23:47 UTC**. The Register says 00:46.
- **Provider:** OVHcloud, Strasbourg campus (SBG1 to SBG4)
- **Root cause:**
  - Fire in the power room. The official cause has not been determined.
  - Octave Klaba pointed to UPS units; UPS 7 had been serviced the day before ([DCD](https://www.datacenterdynamics.com/en/news/ovh-fire-octave-klaba-says-ups-systems-were-ablaze/)).
  - The fire service report found no automatic extinguishing system and no electrical cutoff ([The Register](https://www.theregister.com/2022/03/22/ovhcloud_fire_datacenter_report/)).
- **Impact:**
  - **SBG2 destroyed (14,046 servers)** and 4 of 12 rooms in SBG1 destroyed. The whole site was powered down.
  - ~120,000 services fully or partially affected ([OVHcloud newsroom](https://corporate.ovhcloud.com/en/newsroom/news/informations-site-strasbourg/), [DCD](https://www.datacenterdynamics.com/en/news/ovh-fire-update-four-halls-sbg1-destroyed-well-all-sbg2/)).
  - Netcraft: **~3.6 million websites across 464,000 domains** offline ([Netcraft](https://www.netcraft.com/blog/ovh-fire)).
  - Some customers permanently lost data. A French court ordered OVHcloud to pay ~€250k to two customers whose backups were stored in the same location ([DCD](https://www.datacenterdynamics.com/en/news/ovhcloud-ordered-to-pay-250k-to-two-customers-who-lost-data-in-strasbourg-data-center-fire/)).
- **Duration:** Not an "hours" event.
  - SBG3 was operational from 18 March (~8 days).
  - SBG4 resumed 22 March (~12 days).
  - The first SBG1 racks returned 1 April. As of 23 April, 113,000 of 120,000 services had been recovered.
  - SBG2 never returned ([OVHcloud newsroom](https://corporate.ovhcloud.com/en/newsroom/news/informations-site-strasbourg/)).
- **Press:** [The Register](https://www.theregister.com/2021/03/10/ovh_strasbourg_fire/).

### 2021-01-11 AWS: Parler deplatformed (24-hour notice)

- **Provider:** Amazon Web Services
- **What happened:**
  - AWS emailed Parler on Jan 9 that it would "suspend Parler's account effective Sunday, January 10th, at 11:59PM PST", which is **2021-01-11 07:59 UTC**.
  - AWS said it had reported "98 examples" of posts that "clearly encourage and incite violence" and that "Parler does not have an effective process to comply with the AWS terms of service" ([TechCrunch](https://techcrunch.com/2021/01/09/amazon-web-services-gives-parler-24-hour-notice-that-it-will-suspend-services-to-the-company/)).
  - Apple and Google had already pulled the app.
- **Impact:** Parler went fully offline. A court denied Parler's injunction request on 2021-01-21 (Judge Barbara Rothstein) ([GeekWire](https://www.geekwire.com/2021/federal-judge-cites-u-s-capitol-breach-denial-parlers-initial-motion-reinstatement-aws/)).
- **Duration:** Back online **2021-02-15**, hosted by SkySilk, with earlier content missing. That is **~36 days** offline ([CNN](https://www.cnn.com/2021/02/15/tech/parler-returns), [The Register](https://www.theregister.com/2021/02/16/parler_back_online_hosted_by_skysilk/)).
- **Framing caution:** Parler is politically charged. A neutral framing for the site is "a single provider's ToS decision took an entire platform offline within 24 hours, with no technical recourse." The site should not imply Parler was in the right.

### 2022-11-02 Hetzner: Solana validators cut off

- **Provider:** Hetzner Online (Germany/Finland)
- **What happened:** Hetzner blocked server access for crypto-related workloads, and **"More than 1,000 Solana validators"** went offline. Solana's delinquent stake ratio hit **22%**, "the highest since May", though the network itself stayed up ([The Block, 2022-11-02](https://www.theblock.co/post/182283/1000-solana-validators-go-offline-as-hetzner-blocks-server-access)). [Decrypt (2022-11-03)](https://decrypt.co/113429) reports the same figure: "over 1,000 Solana validators offline".
- **ToS wording (verified on hetzner.com today):**
  - The Cloud and Dedicated Server agreements prohibit **"Operating applications that are used to mine crypto currencies"** ([cloud](https://www.hetzner.com/legal/cloud-server/), [dedicated](https://www.hetzner.com/legal/dedicated-server/)).
  - The written ToS mentions only mining. The broader ban came from Hetzner's public statement of Aug 2022: "Using our products for any application related to mining, even remotely related, is not permitted. This includes Ethereum" ([CryptoSlate](https://cryptoslate.com/data-center-operator-hosting-17-of-ethereums-nodes-says-staking-is-not-permitted/)).
  - Decrypt quotes a fuller version: "...This includes proof of stake and proof of work and related applications. It includes trading."
- **Context:** At the time, Ethernodes data showed Hetzner hosting ~16% of Ethereum mainnet nodes (CryptoSlate; headline says 17%).
- **Duration:** Permanent for those hosts. Operators had to migrate.

### 2021-10-04 Meta (Facebook, Instagram, WhatsApp): BGP and DNS withdrawal (self-hosted)

- **Flag:** Meta runs its own infrastructure, so this is **not a cloud-provider outage**. Use it only to illustrate centralization: one operator's backbone took Facebook, Instagram and WhatsApp offline together. No sourced user count was gathered, so don't quote one.
- **Root cause:**
  - A command meant to assess global backbone capacity "unintentionally took down all the connections in our backbone network". An audit-tool bug failed to stop it.
  - Meta's DNS servers then withdrew their BGP advertisements, which made Meta unreachable from the internet. Recovery was slowed because engineers had to get physical, on-site access ([Meta engineering](https://engineering.fb.com/2021/10/05/networking-traffic/outage-details/)).
- **Duration:**
  - Cloudflare saw routing changes peak around 15:40 UTC, DNS routes gone at 15:58 UTC, and renewed BGP activity around 21:00 UTC; facebook.com resolved again at 21:20 UTC ([Cloudflare](https://blog.cloudflare.com/october-2021-facebook-outage/)).
  - That is **~6 h**, and CNBC calls it a "six-hour outage" ([CNBC](https://www.cnbc.com/2021/10/04/facebook-workers-lose-access-to-internal-tools-following-outage.html)).
- **Affected:** Facebook, Instagram, WhatsApp, Messenger, and Meta's internal tools (employees were locked out). Facebook shares fell 4.9% that day ([CNBC](https://www.cnbc.com/2021/10/04/facebook-instagram-and-whatsapp-are-down.html)).

---

### 2026 events (Jan to Oct 2026)

### 2026-03-01 AWS: drone strikes knock out ME-CENTRAL-1 (UAE) and hit ME-SOUTH-1 (Bahrain); some data unrecoverable

- **Provider:** AWS, regions me-central-1 (UAE) and me-south-1 (Bahrain)
- **Root cause:**
  - Physical damage during the Iran conflict. The day after US and Israeli strikes on Iran, AWS said mec1-az2 "was impacted by objects that struck the data center, creating sparks and fire", and authorities cut power.
  - AWS later said **two UAE facilities were "directly struck" by drones**, and that "a drone strike in close proximity" to a Bahrain facility "caused physical impacts to our infrastructure".
  - Fire suppression caused further water damage ([The Register, 2026-03-02](https://www.theregister.com/2026/03/02/amazon_outages_middle_east/)).
- **Impact:**
  - UAE zones: mec1-az2 and then mec1-az3 went down.
  - Bahrain: mes1-az2 lost power.
  - S3 saw "high failure rates for data ingest and egress". Snowflake attributed regional disruption to it.
  - Reuters reported impact on financial institutions ([Reuters via Ada Derana](https://www.adaderana.lk/news.php?nid=119162)).
  - AWS told customers to "consider taking action now to backup data and potentially migrate your workloads."
- **Duration (from AWS status updates, via press):**
  - The disruption began at 12:51 UTC on 2026-03-01.
  - About two months later AWS said the region "is currently unable to reliably support customer applications". It advised customers to "migrate all accessible resources to other Regions" and "restore inaccessible resources from remote backups", and suspended billing ([heise, 2026-05-02](https://heise.de/-11279391)).
  - By mid-September AWS reported it was **unable to restore access to resources and data hosted exclusively in mec1-az2** ([W.Media, 2026-09-17](https://w.media/?p=43565)). That is a paraphrase of an AWS Health Dashboard update which I could not fetch directly.
  - So the outage lasted **months and is still ongoing as of Sep 2026**, with permanent data loss for single-AZ data.
- **Why it matters:** this is the strongest 2026 item. It shows physical and geopolitical concentration risk, and "availability zones" failing together.

### 2026-05-19 Google Cloud: suspends Railway's production account (automated, no notice)

- **Provider:** Google Cloud. Victim: Railway, a PaaS.
- **What happened:**
  - Railway: Google Cloud "suspended services on our production account" and "did not provide us a notice prior to this suspension". Railway says Google "placed Railway's production account into a suspended status incorrectly, as part of an automated action."
  - Railway's edge depended on a network control-plane API hosted in GCP. Once cached routes expired, Railway's workloads on AWS and its own hardware became unreachable too: "all Railway workloads across all regions were rendered unreachable" ([Railway incident report](https://blog.railway.com/p/incident-report-may-19-2026-gcp-account-outage)).
- **Duration (Railway):** 22:20 UTC May 19 to ~06:14 UTC May 20 (**~8 h**); resolved at 07:58 UTC.
- **Press:**
  - [The Register](https://www.theregister.com/off-prem/2026/05/20/google-cloud-suspended-major-customer-railwaycom-without-cause-causing-outage/5243111), which quotes Railway: "Our contacts at Google were confused, customers are irate."
  - [InfoQ](https://infoq.com/news/2026/05/railway-gcp-account-outage/).
- **Caveat:** DCD cites one anonymous source claiming a Railway project was flagged for a crypto-mining spike. This contradicts Railway's account and is unverified ([DCD](https://www.datacenterdynamics.com/en/news/google-unexpectedly-suspends-railwaycoms-cloud-account/)).
- **Why it matters:** it is a deplatforming-style failure caused by an automated account action rather than a technical fault, and it defeated a multi-cloud setup.

### 2026-05-07/08 AWS: thermal event in us-east-1 (use1-az4)

- **Provider:** AWS, US-EAST-1, single AZ use1-az4
- **Root cause:** A "thermal event resulting in a loss of power": a cooling shortfall in one data center, after which servers shut down when temperatures exceeded thresholds. Restoring cooling "is progressing slower than anticipated" ([AWS updates relayed on Broadcom's status page](https://status.broadcom.com/notices/xxpqglmvmv4dab7q-availability-zone-use1-az4-impacted), [TNW](https://thenextweb.com/news/aws-northern-virginia-cooling-outage-coinbase)).
- **Impact:** EC2/EBS impairments in use1-az4, with AWS shifting traffic away from the AZ. Coinbase moved all markets to cancel-only, and FanDuel was affected. CME reported issues at the same time but did not attribute them to AWS ([heise](https://heise.de/-11288092), [TNW](https://thenextweb.com/news/aws-northern-virginia-cooling-outage-coinbase)).
- **Duration (uncertain, no AWS PES published):**
  - Start ~4:20 PM PDT May 7 (~23:20 UTC); AWS's first post was 5:25 PM PDT (00:25 UTC May 8).
  - Coinbase was degraded ~7 h (heise).
  - As of 20:12 UTC May 9, AWS was still bringing racks back "rack-by-rack" and expected EC2/EBS normal "within 24 hours".
  - Secondary trackers give 19 to 28 h for majority recovery. Full recovery took about 2 days.

### 2026-10-20 Google Cloud: power event takes down London zone europe-west2-b

- **Provider:** Google Cloud, europe-west2 (London)
- **Root cause (Google preliminary report):**
  - "a power grid disruption occurred at the datacenter facility hosting availability zone europe-west2-b".
  - Backup generators did not take the load because both the primary and the backup PLC controllers failed to start the transfer. The UPS then drained.
  - Failover load spilled into zones a and c, so other zones were affected too ([Google incident](https://status.cloud.google.com/incidents/Xs2XTHzAVC9YnafnPyzj)).
- **Impact:** ~38 products listed, including Compute Engine, GKE, Cloud SQL, Spanner, Cloud Run, BigQuery, Cloud Storage, and Pub/Sub.
- **Duration (Google):** 23:00 PDT Oct 19 to 05:10 PDT Oct 20, i.e. **06:00 to 12:10 UTC Oct 20, ~6h10m**. The Register gives the start as 06:08 UTC.
- **Affected services:**
  - Revolut (card payments and ATM withdrawals), Lloyds, HSBC, Royal Mail, DPD, Rightmove, BT, Screwfix ([The Register](https://www.theregister.com/a/5304160)).
  - HM Courts and Tribunals Service (PA via [Irish News](https://www.irishnews.com/news/uk/banks-and-courts-affected-by-disruption-as-google-apologises-for-cloud-outage-NGVJFIJO7NK47DX5KKSFPTUGNQ/)).
  - The Lloyds and HSBC links are based on Downdetector spikes.

### 2026-02-20 Cloudflare: cleanup bug withdraws ~1,100 BYOIP prefixes via BGP

- **Root cause:** A cleanup sub-task in an Addressing API change queried the API with a bug that treated all BYOIP prefixes as queued for deletion. Cloudflare says it was not an attack ([Cloudflare blog](https://blog.cloudflare.com/cloudflare-outage-february-20-2026/)).
- **Impact:**
  - 1,100 of 6,500 prefixes, or 25% of the 4,306 BYOIP prefixes, were withdrawn between 17:56 and 18:46 UTC.
  - CDN, Spectrum, Dedicated Egress, and Magic Transit for those customers became unreachable. The 1.1.1.1 website returned 403s, but resolution itself was unaffected.
  - Laravel Cloud reported ~3h15m of impact ([Laravel](https://laravel.com/blog/laravel-cloud-incident-report-february-20-2026)).
- **Duration:** Cloudflare says "The total duration of the incident was 6 hours and 7 minutes", starting 17:48 UTC. Its timeline shows impact ending at 23:03 UTC (~5h15m), and I could not reconcile the two figures.

### 2026-02-02 Microsoft Azure: policy remediation breaks VM provisioning and GitHub Actions (multi-region)

- **Root cause:** A workflow meant to disable anonymous access on Microsoft-managed storage accounts targeted the wrong set of accounts. It hit accounts that host VM extension packages, so VM operations failed. When access was restored, the retry surge overloaded Managed Identities in East US and West US ([Azure PIR FNJ8-VQZ](https://azure.status.microsoft/en-us/status/history/?trackingId=FNJ8-VQZ)).
- **Impact:** VMs and scale sets, AKS, Azure DevOps and **GitHub Actions** hosted runners, Arc, PostgreSQL. In the second phase, Container Apps, Databricks, and others that use Managed Identity.
- **Duration (PIR):**
  - Main incident: 18:03 UTC Feb 2 to ~00:30 UTC Feb 3 (~6h27m).
  - Managed Identity impact: 00:08 to 06:05 UTC Feb 3.
  - So **~12 h total** ([Network World](https://networkworld.com/article/4127142/azure-outage-disrupts-vms-and-identity-services-for-over-10-hours.html) reports "over 10 hours").

### 2026 (ongoing) Google Cloud: retiring its Blockchain Node Engine (DePIN angle; not an outage)

- Google stopped new provisioning on 2026-06-15. It will delete Blockchain Node Engine and Blockchain RPC resources on **2026-12-15** and recommends migrating to Quicknode ([Google docs](https://docs.cloud.google.com/blockchain-node-engine/docs/migrate-to-quicknode)).
- This is useful as "centralized providers can exit crypto infrastructure on their own schedule."

### Other 2026 incidents (secondary tracker only, NOT verified against the provider unless noted)

Source: [Control Plane cloud outage tracker](https://controlplane.com/blog/post/cloud-outage-tracker).

- 2026-01-08 Cloudflare 1.1.1.1: a CNAME-ordering change.
- 2026-02-07/08 Azure West US: a transformer failure plus a generator transfer fault, ~20h26m.
- 2026-02-10 AWS CloudFront: DNS NXDOMAIN errors. AWS confirmed recovery at 2:34 PM PST per downstream status pages.
- 2026-04-24 Azure East US: networking control-plane lock contention, ~11h52m.
- 2026-05-29/30 Azure West US 2: lightning, then a cooling lockout, ~22h.
- 2026-07-15/16 Google Cloud europe-west4: power then cooling failure. Google's status page says 12h28m; DCD says 14h55m.
- 2026-09-01 Google Cloud us-central1: fiber unplugged during a router upgrade, ~4h.
- 2026-09-30 Azure multi-region gateways: **verified on the Azure status page** as tracking 7Q30-010, 20:30 UTC Sep 30 to 02:15 UTC Oct 1, 5h45m.
- 2026-10-08 Google Cloud Storage: write errors. Google's status summary lists a duration of "1 day, 6 hours".
- 2026-10-19 Cloudflare One/Gateway: no post-mortem yet.

### Late-2025 extra (anecdotal)

- **2025-07/08 AWS:** an open-source developer reports AWS terminated and wiped his 10-year account after a verification dispute ([The Register, 2025-08-06](https://www.theregister.com/2025/08/06/aws_wipes_ten_years/)). This is a single case based on the developer's own account; use with care.

---

### Crypto-specific centralized dependencies (DePIN angle)

### 2020-11-11 Infura: Ethereum mainnet API outage breaks MetaMask and exchange withdrawals

- **Root cause:** Infura components were pinned to old Geth versions (1.9.9 and 1.9.13), which hit a consensus bug at block 11234873. Infura ended up on a minority chain ([Infura status page](https://status.infura.io/incidents/syvkl4pr4mk2)).
- **Impact:** The Mainnet HTTPS and WebSocket JSON-RPC APIs failed. MetaMask, which uses Infura by default, broke. Binance and other exchanges suspended ETH and ERC-20 withdrawals ([The Block](https://www.theblock.co/post/84232/ethereum-infrastructure-provider-infura-is-down)).
- **Duration (Infura):** 08:12 UTC (investigating) to 14:42 UTC ("All service subsystems have recovered"), **~6.5 h**.

### Ethereum node hosting concentration

- **Cambridge CCAF ("Ethereum After the Merge"):** "the 3 largest providers – Hetzner, Amazon Web Services and OVH – host roughly 40% of the total node count", and ~64% of nodes are in cloud or enterprise data centres ([CCAF](https://www.jbs.cam.ac.uk/faculty-research/centres/alternative-finance/publications/ethereum-after-the-merge-a-change-in-power/)). The page shows no publication date.
- **Ethernodes (Aug 2022), via CryptoSlate:** AWS "over 53%" and Hetzner ~16% of mainnet nodes. The denominator is unclear and is likely hosted nodes only.
- **Later Ethernodes figures** (~28% AWS and ~15.6% Hetzner of execution nodes, cited around the Oct 2025 AWS outage) come only from crypto aggregators: unverified.
- Use the CCAF figure as the safest.

---

### Most compelling for the site (ranked top 8)

1. **AWS Middle East drone strikes (2026-03-01, ongoing):** months-long, region-wide, with permanent loss of single-AZ data, and AWS telling customers to leave the region. This is the clearest case against geographic concentration.
2. **AWS us-east-1 DynamoDB DNS (2025-10-20):** 14.5 h, over 17M Downdetector reports, $38M to $581M insured loss (CyberCube), and Coinbase/Base/Robinhood down. One automation bug in one region.
3. **Google Cloud suspends Railway (2026-05-19):** about 8 h of automated account suspension with no notice, which defeated multi-cloud because the control plane sat on one provider. Best deplatforming story for builders.
4. **Cloudflare bot-management file (2025-11-18):** "worst outage since 2019", X and ChatGPT down, 3.3M reports. The site can pair it with Dec 5 2025: two global outages in 17 days.
5. **CrowdStrike (2024-07-19):** 8.5M devices and $5.4B in Fortune 500 losses. A vendor single point of failure; the site should frame it as concentration risk, not hosting.
6. **Google Cloud Service Control (2025-06-12):** one null pointer taking down a global cloud and then Cloudflare's KV. The best "cascading dependency" example.
7. **OVHcloud SBG2 fire (2021-03-10):** a physical single point of failure; 3.6M websites offline and some data permanently lost.
8. **Hetzner and Solana (2022-11-02):** over 1,000 validators and 22% of stake knocked offline by one host's crypto policy. This is the most directly on-message deplatforming case for DePIN.

Honourable mentions:
- Azure Front Door (2025-10-29, 8.4 h).
- AWS 2021-12-07.
- Fastly 2021 (85% of a CDN down from one customer's config).
- Google London 2026-10-20 (backup generator failure, UK banks down).
- Parler (strong but politically loaded).

### Gaps and uncertainties

- Reuters, AP, BBC, The Verge, Ars Technica, Ookla, and Downdetector could not be fetched. Ookla's 17M (AWS) and 3.3M (Cloudflare) figures come via FoneArena, and Reuters/AP quotes come via syndicated reprints.
- **AWS 2025-10-20 duration:** quote "~14.5 h (AWS)". Ookla's ">15 h" and the 28 h Redshift tail use different end points.
- **GCP 2025-06-12:** Google's dashboard (7h27m) and mini-report (3h) disagree. Quote both, or say "about 3 hours, with some services down for 7+".
- **Cloudflare 2025-06-12 and 2026-02-20:** each post's stated duration does not match its own timestamps.
- **AWS 2026-05 thermal event:** there is no AWS post-event summary. Start time and total duration are uncertain (19 to 28 h majority recovery, ~2 days full).
- **AWS Middle East:** the "unable to restore ... data in mec1-az2" wording is a W.Media paraphrase of an AWS Health Dashboard update I could not load. The WSJ "still mostly offline after six months" report was seen only via an aggregator. Treat current status as unconfirmed after Sep 2026.
- **Railway:** the crypto-mining explanation is a single anonymous DCD source. Google has made no on-record statement.
- **Hetzner:** the 2022 customer emails were not found verbatim. The current ToS bans only "mining"; the broader ban rests on Hetzner's Aug 2022 public statements.
- **OVH:** the UTC date is technically 2021-03-09 23:47 UTC. The €105M fire cost (from IPO documents) was seen only in secondary summaries.
- **Long-tail lists:** affected-service lists for Cloudflare Dec 5 2025 and Azure AFD 2025 beyond the cited names come from weaker outlets.
- **Ethereum node shares:** these vary widely by source and denominator. Prefer the CCAF ~40%-top-3 figure.
- **2026 "other" list:** mostly from one tracker. Verify against provider PIRs before publishing any of those.
