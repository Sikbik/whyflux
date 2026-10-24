# Flux research notes (Why Flux)

Owner: Flux research pass. Compiled 2026-10-24. Every live number below was read on **2026-10-24 between 17:00 and 17:30 UTC (chain height ≈ 3,065,587)**. Source code was read at the HEAD of each default branch on that day:

| Repo | Commit | Date | What it settles |
|---|---|---|---|
| [RunOnFlux/flux](https://github.com/RunOnFlux/flux) (FluxOS, v8.21.1) | `9bb1419` | 2026-10-14 | Orchestration: spawner, instances, health, storage, geolocation, enterprise |
| [RunOnFlux/fluxd](https://github.com/RunOnFlux/fluxd) (v9.1.0) | `8a60ee6` | 2026-09-08 | Consensus: collateral, Proof of Node, rewards |
| [RunOnFlux/flux-domain-manager](https://github.com/RunOnFlux/flux-domain-manager) | `a30f379` | 2026-10-05 | Load balancing, domains, TLS |
| [RunOnFlux/fluxos-frontend](https://github.com/RunOnFlux/fluxos-frontend) (FluxCloud UI) | `d7fa0de` | 2026-10-24 | What the deploy form defaults to |
| [RunOnFlux/fluxwhitepaper](https://github.com/RunOnFlux/fluxwhitepaper) | `6869738` | 2026-09-08 | Benchmark thresholds, monetary policy |
| [RunOnFlux/flux-docs](https://github.com/RunOnFlux/flux-docs) (docs.runonflux.com) | `71f936d` | 2026-10-21 | Official docs (several stale numbers, see "Claims to avoid") |

Cross-checked against the user's own research for Flux Atlas (`/tmp/whyflux-refs/Flux_Atlas/docs/research/flux-api.md`, 2026-09-30) and Flux Academy (`/tmp/whyflux-refs/flux-academy/docs/research/FACTS.md`, 2026-10-12/13). Where they and today's reading differ, today's reading wins and the difference is noted.

Rule of thumb when writing copy: **source code and live endpoints beat docs and marketing pages.** The official docs still carry 2025 numbers (10,000+ nodes, 66 countries, "three or more FluxNodes") that are no longer true.

---

## 1. The numbers (snapshot 2026-10-24)

| Fact | Value | How it was counted | Source |
|---|---|---|---|
| Confirmed FluxNodes | **6,854**: Cumulus 3,349 · Nimbus 1,661 · Stratus 1,844 | `getfluxnodecount` | [api](https://api.runonflux.io/daemon/getfluxnodecount) |
| Countries | **57** (6 continents) | distinct `geolocation.countryCode` over 6,855 stats rows (84 rows unreachable, no geo) | [stats fluxinfo](https://stats.runonflux.io/fluxinfo?projection=tier,geolocation.countryCode) |
| Continent split of nodes | EU 4,854 (70.8%) · NA 1,559 (22.7%) · AS 214 · SA 65 · OC 48 · AF 31 | `geolocation.continentCode` | same |
| Top countries | DE 1,538 · US 1,161 · FI 1,019 · FR 718 · CA 391 · DK 357 · PL 223 · RU 207 · GB 128 | same | same |
| CPU | **56,902 logical cores** (benchmark `cores` counts threads) | sum over benchmarked rows | [stats fluxinfo](https://stats.runonflux.io/fluxinfo?projection=tier,benchmark.bench.cores,benchmark.bench.ram,benchmark.bench.ssd) |
| RAM | **192.3 TB** | sum of benchmark `ram` (GB) | same |
| SSD | **3,372 TB ≈ 3.37 PB** | sum of benchmark `ssd` (GB) | same |
| Reserved by running apps | 17,089 cores (30%) · 34.9 TB RAM (18%) · 422 TB disk (13%) | `apps.resources` | [stats fluxinfo](https://stats.runonflux.io/fluxinfo?projection=apps.resources) |
| Apps registered on chain | **2,200** (1,909 on spec v8; 1,230 encrypted "enterprise") | `globalappsspecifications` | [api](https://api.runonflux.io/apps/globalappsspecifications) |
| Apps running now | **2,115** distinct apps on **8,827** instances (4,291 distinct hosts) | `apps/locations` | [api](https://api.runonflux.io/apps/locations) |
| Running apps with ≥2 live copies | **1,815 of 2,115 (86%)** | instances per app name in `apps/locations` | same |
| …of which span ≥2 countries / ≥2 continents | 793 (44%) / 347 (19%) | joined with node geolocation | same + stats |
| Requested instance counts | 2 copies: 1,288 apps · 3: 424 · 1: 337 · 6: 24 · 30: 24 · 100: 23 | spec `instances` | [api](https://api.runonflux.io/apps/globalappsspecifications) |
| Apps using geolocation rules | 1,557 of 2,199 (71%) | non-empty spec `geolocation` | same |
| App messages ever on chain | **75,692** register/update messages since block 694,307 (2020-09-25) | `apps/hashes` | [api](https://api.runonflux.io/apps/hashes) |
| Operator identities | **1,155** distinct Flux IDs (`flux.zelid`); 842 payment addresses; 2,797 distinct IPs | stats + node list | [stats](https://stats.runonflux.io/fluxinfo?projection=flux.zelid), [node list](https://api.runonflux.io/daemon/viewdeterministicfluxnodelist) |
| Networks | 234 ASNs; largest Hetzner AS24940 with 1,733 nodes (25%) | `geolocation.asn` | stats |
| Operator concentration | 14 IDs run >1/3 of nodes; 39 IDs run >1/2 | sorted `zelid` counts | stats |
| Data-centre flagged nodes | 3,285 of 6,855 (48%) | ip-api `dataCenter` flag | stats |
| ArcaneOS | **6,417 of 6,855 rows (94%)** report `arcaneVersion` | `flux.arcaneVersion` | stats |
| FluxOS version | 8.21.1 on 6,766 rows (98.7%; ~100% of rows reporting a version) | `flux.version` | stats; [release](https://github.com/RunOnFlux/flux/releases/tag/v8.21.1) |
| Collateral locked | **97,871,500 FLUX** | 3,349×1,000 + 1,661×12,500 + 1,844×40,000 | derived from counts + [fluxnode.h](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.h#L57-L63) |
| Supply | 422.5M circulating (CoinGecko); ≈431M issued on chain incl. shielded pools (Academy, 2026-10-12) | | [CoinGecko API](https://api.coingecko.com/api/v3/coins/zelcash) |
| FLUX price / market cap | $0.0637 / $26.9M (rank 686) at 17:15 UTC | | CoinGecko API. **Do not put the price on the page.** |
| Chain age | genesis 2018-01-26 (≈ 8.75 years) | block 0 timestamp | [getblock/0](https://api.runonflux.io/daemon/getblock/0/1) |
| Marketplace | 106 templates, 84 visible (Games, Hosting, Productivity, Blockchain, RPC Node, Front-end, …) | | [stats marketplace](https://stats.runonflux.io/marketplace/listapps) |

The homepage ([runonflux.com](https://runonflux.com/)) shows "6,623 nodes … 67 countries across 5 continents as of May, 2026 · 54.1K CPU cores · 186TB RAM · 3PB SSD". Our live counts are close on hardware and nodes but differ on countries (57 vs 67) and continents (6 vs 5); we count from the network's own geolocation data. Use our numbers and keep "as of" dates visible.

---

## 2. What Flux is

- **Positioning**: "Build and deploy scalable applications on Flux, a global, decentralized cloud computing network" ([runonflux.com](https://runonflux.com/)). Practically: you hand the network a Docker-based app spec and pay for it; independent node operators run N copies of it; no company sits between you and the machines except for the (optional, replaceable) domain/load-balancer layer (§5.6).
- **Company**: InFlux Technologies (UK), formerly Zel Technologies; founded under Zel in 2018, rebranded to InFlux in late 2022; CEO and co-founder Daniel Keller ([docs](https://docs.runonflux.com/home/influx-technologies)). Zel → Flux rebrand with FluxOS 1.0 on 2021-03-27 ([our story](https://shop.runonflux.com/pages/our-story)); the on-chain rebrand fork was block 835,554 (2021-04-11).
- **Open source**: FluxOS, fluxd, FDM and the FluxCloud front end are public on GitHub (214 public repos in the [RunOnFlux org](https://github.com/RunOnFlux)). Exceptions: the benchmark daemon (fluxbench) and ArcaneOS's System Attestation Service are closed (Academy FACTS §2.2, §2.6).

---

## 3. The network: nodes, tiers, consensus

### 3.1 Tiers and collateral (settled by consensus code)

fluxd [`src/fluxnode/fluxnode.h` L57-63](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.h#L57-L63):

```c
#define V1_FLUXNODE_COLLAT_CUMULUS 10000
#define V1_FLUXNODE_COLLAT_NIMBUS 25000
#define V1_FLUXNODE_COLLAT_STRATUS 100000

#define V2_FLUXNODE_COLLAT_CUMULUS 1000
#define V2_FLUXNODE_COLLAT_NIMBUS 12500
#define V2_FLUXNODE_COLLAT_STRATUS 40000
```

V2 amounts became the only valid ones after the transition ending at block 1,097,412 (2022-04-11). The node list's `amount` field confirms `"1000.00"`, `"12500.00"`, `"40000.00"` live.

| Tier | Collateral | Published minimum (docs) | Enforced benchmark (whitepaper, fluxbench `benchmarks.h`) | Payout per block now (from block 3,071,200) |
|---|---|---|---|---|
| Cumulus | 1,000 FLUX | 2 cores / 4 threads, 8 GB RAM, 220 GB SSD, ≥25 Mbit/s | 4 threads, ≥7 GB, 220 GB, **240 EPS**, 180 MB/s write, 25/25 Mbit/s | 1 FLUX (0.9) |
| Nimbus | 12,500 FLUX | 4 / 8, 32 GB, 440 GB, ≥50 Mbit/s | 8 threads, ≥30 GB, 440 GB, **640 EPS**, 180 MB/s, 50/50 | 3.5 FLUX (3.15) |
| Stratus | 40,000 FLUX | 8 / 16, 64 GB, 880 GB, ≥100 Mbit/s | 16 threads, ≥61 GB, 880 GB, **1,520 EPS**, 400 MB/s, 100/100 | 9 FLUX (8.1) |

Sources: [docs: What are FluxNodes](https://docs.runonflux.com/fluxnodes/what-are-fluxnodes/); [whitepaper 04-consensus.tex L418-431](https://github.com/RunOnFlux/fluxwhitepaper/blob/686973898157ab8af46ce28345d0064ed4ae94c9/paper/sections/04-consensus.tex#L418-L431); the [FluxNodes page](https://runonflux.com/fluxnodes/) shows the Nimbus row ("12,500 FLUX · 4 V-CORES · 8 THREADS · 32GB RAM · 440 GB SSD/NVME · 180 MB/S DWS · 640 EPS · 50 MBIT"). The 8/32/64 GB are the published requirement; machines sold as 8 GB measure about 7.7 GB, which is why the benchmark threshold is 7/30/61. FluxOS's own nominal tier sizes are 4/8/16 threads, 7,000/30,000/61,000 MB, 220/440/880 GB ([config L730-745](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L730-L745)), minus a locked reservation of 1 core, 2 GB RAM and 60 GB (+20 GB) per node for the system.

Biggest single app: 15 cores, 59,000 MB RAM, 820 GB SSD across all components (Stratus-sized; Academy FACTS §2.3 from `appValidator.js`).

**Permissionless**: "FluxNodes are permissionless and open to everyone: anyone with the required hardware specs and FLUX collateral can join the network" ([docs](https://docs.runonflux.com/fluxnodes/what-are-fluxnodes/)). Requirements beyond hardware: a public IP and about 97% uptime (docs). One node per VPS. Up to 8 nodes can share one public IP via UPnP ports 16127…16197 (Atlas research §3.2; today 6,854 nodes sit on 2,797 IPs).

Other ways in: **Titan** (stake from 50 FLUX into nodes InFlux runs on partner enterprise hardware such as Lumen and OVH, payouts twice a week; [docs](https://docs.runonflux.com/fluxnodes/titan-node-staking)) and third-party **managed node** services. These do not change how apps are placed.

### 3.2 Staying in the network

A node must send an on-chain confirmation within 640 blocks (≈5.3 h) of its last one or it expires; start transactions expire after 240 blocks; failed confirmations sit in a DOS list for 720 blocks ([fluxnode.h L31-39](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.h#L31-L39); Atlas research §1). Confirmations carry a signed benchmark result (whitepaper 04-consensus, `BenchmarkSign`). FluxOS itself puts a node "out of service" (DOS state) when it loses its peers, cannot be reached by other nodes, or its apps' ports fail external checks ([config L440-466](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L440-L466): reachability asked of peers every 5 min, app port check hourly by default).

### 3.3 Consensus: Proof of Node (marketed as PoUW v2)

- Activated at **block 2,020,000 on 2025-10-25 18:00:35 UTC** ([getblockchaininfo](https://api.runonflux.io/daemon/getblockchaininfo) reports upgrade `PON`, activation 2,020,000; [chainparams.cpp L103-158](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/chainparams.cpp#L103-L158): `nPonTargetSpacing = 30`, `nPONInitialSubsidy = 14`, `nPONSubsidyReductionInterval = 1051200`, `nPONMaxReductions = 20`).
- fluxd README: "**PoUW v2 (Proof of Useful Work)**: Also known as PON (Proof of Nodes), activated at block 2,020,000". The website and blog say PoUW v2; code says Proof of Node. There is **no hashing** any more; "useful work" is branding for "the nodes that host apps are the block producers".
- How it works: time is cut into 30 s slots; every confirmed node of any tier computes `hash(collateral, prevBlockHash, slot)`; nodes under the target are eligible, ranked by hash, and the first valid block wins. Block producer gets nothing extra. Payees are separate: **one node from each tier is paid in every block** from per-tier FIFO queues (Academy FACTS §1.4 from `pon.cpp`, `pon-minter.cpp`, `fluxnode.cpp`).
- Before: Equihash GPU proof-of-work with 2-minute blocks (2018 to 2025). The blog announcement: "[Forking Flux: Proof of Useful Work v2](https://runonflux.com/forking-flux-proof-of-useful-work-v2/)" (2025-10-23): "drops from 2 minutes to 30 seconds… deprecates mining pools".

### 3.4 Rewards and emission

- 14 FLUX per block at launch of PoN: **9 Stratus · 3.5 Nimbus · 1 Cumulus · 0.5 Flux Foundation dev fund** (64.29% / 25% / 7.14% / 3.57%). The website rounds to 64.5/25/7/3.5 ([FluxNodes page](https://runonflux.com/fluxnodes/)).
- Reduced **10% every 1,051,200 blocks (≈1 year)**, up to 20 times. **First reduction at block 3,071,200**, which at 30 s blocks lands around **2026-10-26** (5,613 blocks after our snapshot): 12.6 FLUX per block → 8.1 / 3.15 / 0.9 / 0.45 ([FluxNodes page](https://runonflux.com/fluxnodes/), [docs](https://docs.runonflux.com/fluxnodes/what-are-fluxnodes/)). `src/lib/live` exposes `blockReward(height)` and `nextRewardReduction(height)`.
- Operators are paid only from new issuance today; app payments go to a multisig app address and are not shared with nodes by the protocol (Academy FACTS §1.5). **Progressive Node Rewards** (app revenue to operators) is described in docs as live but is **not in the code**; the roadmap lists "PNR v2: App fees burn + pay operators" for H1 2027 ([timeline](https://runonflux.com/timeline/)).
- **Parallel assets** (full detail in §14.3): node operators also accrue FLUX on other chains (10% of payout per active chain, nine active since Ergo stopped on 2026-09-21), claimed via Zelcore's Fusion app ([docs](https://docs.runonflux.com/fluxnodes/claim-parallel-assets)). On 2026-09-21 Flux announced "[ten chains become two](https://runonflux.com/ten-chains-become-two)": Ethereum and BNB Chain survive behind an audited mint-and-burn bridge; Base, Polygon, Avalanche, Ergo, Algorand, Solana, Tron and Kadena are retired through August 2027, and PNR is slated to activate around July 2027.

### 3.5 Decentralization: the honest picture

Strong, and checkable:
- 6,854 nodes, 57 countries, 6 continents, 234 networks (ASNs), 1,155 operator identities, 2,797 distinct IPs.
- Anyone can join; there is no operator allow-list for ordinary nodes.
- Consensus is run by the same nodes that host apps; no mining pools.

Where it is concentrated (do not hide; phrase around it):
- **Europe has 71% of nodes**; Germany + Finland + France alone have 48%. Asia, South America, Oceania and Africa together have about 5%.
- **Hetzner (AS24940) hosts about a quarter of all nodes**; 48% are flagged data-centre IPs. "Your laptop in the cloud" imagery overstates the home-hosted share.
- **Operator concentration**: 39 Flux IDs run more than half of all nodes; the largest runs 371. "Thousands of independent operators" is wrong; "over a thousand operator identities" is right. Caveat found in the 18:33 UTC re-pull (§13): 511 of the 1,155 IDs are one-node IDs on a single network (GHOSTnet, Hesse) that pay out to just 3 addresses, so the number of independent people is well below a thousand. Say "operator identities", never "operators" as a head count.
- **FDM** (the `*.app.runonflux.io` load balancers and DNS) is run by the Flux team. It is open source and anyone can run their own, but most apps' traffic flows through Flux-run FDM today (§5.6).
- The **signed network policy** (blocklist of owners, images and hashes, maintained by Flux in [fluxos-network-policy](https://github.com/RunOnFlux/fluxos-network-policy)) lets nodes refuse to run specific apps. The chain still accepts the registration; nodes decline it. This is content moderation, which matters for the "uncensorable" framing (Academy FACTS §6.2, §15.3.3: e.g. 149 Orbit owner entries added 2026-09-30).

---

## 4. Deployment end to end

The sequence below is what the code does (FluxOS `9bb1419` unless stated), in the order the UI's lifecycle diagram should show it.

1. **Spec.** A v8 app spec: name, owner, `instances` (1 to 100), `geolocation[]`, `expire` (blocks), `nodes[]` (pinning, enterprise owners only), `staticip`, `enterprise` (encrypted blob), and up to 10 `compose[]` components each with `repotag`, `ports`, `containerPorts`, `domains`, `environmentParameters`, `commands`, `containerData`, `cpu`, `ram`, `hdd`. Latest spec version is 8 ([`latestspecificationversion`](https://api.runonflux.io/apps/latestspecificationversion)); v8 became mandatory at block 1,932,380 (2025-06-24) per [`deploymentinformation`](https://api.runonflux.io/apps/deploymentinformation).
2. **Validate and price.** Images must exist and be ≤5 GB (`maxImageSize: 5000000000`), ports must be outside the banned list, placement must be feasible. Price is USD-denominated (`cpu 0.15, ram 0.05, hdd 0.02, port 2, scope 4, staticip 2, fluxmultiplier 0.95, minUSDPrice 0.99` from [`getappspecsusdprice`](https://api.runonflux.io/apps/getappspecsusdprice)), roughly linear in instances, 5% off when paying in FLUX.
3. **Sign and register.** Owner signs with their Flux ID (Zelcore, SSP, or an Ethereum-style signature); the receiving node re-validates and gossips a temporary message (1 h lifetime).
4. **Pay.** A FLUX transaction to `t3NryfAQLGeFs9jEoeqsxmBN2QLRaRKFLUX` with the message hash in OP_RETURN, or Stripe/PayPal via FluxCloud, which pays on chain on the user's behalf. Every node scans each 30 s block, links the payment to the message and inserts the spec into the global registry.
5. **Nodes volunteer** ([appSpawner.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appLifecycle/appSpawner.js#L520-L575)). The file's first line is `// App Spawner - Handles automatic spawning of global applications`. Each node aggregates "the applications list names missing instances", filters by blocklist, pins, geolocation, hardware, ports and fault-domain share, then:
   ```js
   let random = Math.floor(Math.random() * globalAppNamesLocation.length);
   appToRunAux = globalAppNamesLocation[random];
   …
   log.info(`… Application ${appToRun} selected to try to spawn. Reported as been running in ${appToRunAux.actual} instances and ${appToRunAux.required} are required.`);
   …
   if (runningAppList.length + installingAppList.length >= minInstances) { … already spawned or being installed … }
   …
   // check if app not running on this device
   if (runningAppList.find((document) => document.ip.includes(localIp))) { … already running on this Flux IP … }
   ```
   So: **no central scheduler, random self-selection, at most one copy per host IP.** Bigger nodes deliberately wait (Nimbus 57 min, Stratus 87 to 117 min) before taking small apps, so small apps land on Cumulus first (Academy FACTS §2.4).
6. **Install.** Image pull, a pre-allocated ext4 volume (`fallocate`), a per-app Docker network, containers named `flux<component>_<app>`.
7. **Announce.** The node broadcasts a signed location record. `locationTtlS: 7500` ("A running-app location record: 125 minutes. It also SETS how often a node announces"). `GET /apps/location/<name>` lists the hosts publicly.
8. **Route.** FDM (§5.6) adds the instance to HAProxy behind `<name>.app.runonflux.io` with TLS.
9. **Run and heal** (§5).

Times: the UI says nodes "usually start installing within 1 to 3 minutes" and shows "Deployment time: up to 45 min after payment" as a static estimate; the code allows up to ~2 h for a small app to be picked up by the larger tiers (Academy FACTS §6.1, §6.6). Copy should say "minutes", not a guaranteed number.

**Instances: what is the default?** This settles a point the brief assumed.

- FluxOS validator ([appValidator.js L804-813](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appRequirements/appValidator.js#L804-L813)) and config ([default.js L430-434](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L430-L434)):
  ```js
  minimumInstances: 3,
  minimumInstancesV8: 1,
  minimumInstancesV8Block: 2176519, // block height where v8+ apps can have 1 instance - expected around December 19th 2025
  maximumInstances: 100,
  maxAppsPerNode: 200,
  ```
  Block 2,176,519 was mined 2025-12-19. **Since then a v8 app may run a single instance.** Before that, every app ran at least 3 copies. (`/apps/deploymentinformation` still reports `minimumInstances: 3` because it reads the legacy key.)
- FluxCloud's new register flow starts at **1 instance** (`instances: 1` in `pages/apps/register/configure.vue`; SimpleDeploy `props.spec.instances ?? 1`), and the form itself warns: "A single copy. If its node reboots, your app may briefly go offline." vs "Runs on {count} independent nodes. If one goes offline, your app stays up." ([SimpleDeploy.vue](https://github.com/RunOnFlux/fluxos-frontend/blob/d7fa0de808d7c6d60fb8dcab864e7fbf1b007aad/src/@core/components/SimpleDeploy.vue#L635-L681), en.json `core.simpleDeploy.reliabilityOne/Many`). Enabling replicated storage forces at least 2.
- Marketplace installs default to **3** (`instances: 3, // Minimum 3 instances as per FluxCloud requirements`, [InstallDialog.vue L2136](https://github.com/RunOnFlux/fluxos-frontend/blob/d7fa0de808d7c6d60fb8dcab864e7fbf1b007aad/src/components/Marketplace/InstallDialog.vue#L2136)). Orbit Starter is 1 instance; Standard and Pro are 2 "with failover" ([Orbit](https://runonflux.com/apps/orbit)).
- What people actually choose: 2 copies is by far the most common (1,288 apps), then 3 (424); only 337 of 2,199 registered apps ask for 1. **86% of running apps have 2+ live copies.**

Copy guidance: say "redundancy is one setting away, and most apps use it" or "runs on several independent nodes (most apps choose 2 or 3)". Do not say "every app runs on 3+ nodes by default".

---

## 5. Robustness: what keeps apps up

### 5.1 Replicas
`instances` 1 to 100, one per host IP, surplus trimmed every 11 blocks (`removeFluxAppsPeriod: 11 // every 11 blocks we check for more than maximum number of instances of an application`, [config L565-595](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L565-L595)).

### 5.2 Crash recovery on the node
[`appReconciler.js`](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appMonitoring/appReconciler.js#L19-L31): "The single, level-based actuator for app containers. Every trigger (docker die event, stream reconnect, hourly tick, boot, post-install, and the masterSlave/syncthing deciders) just enqueues a component identifier; one reconcile per identifier drives the actual Docker state toward the desired state." That is a Kubernetes controller in all but name. Restart backoff `crashBackoffDelaysMs: [0, 30000, 300000, 900000, 1800000]`, reset after `crashBackoffStableRunMs: 600000` (10 min) ([config L150-156](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L150-L156)). Docker's own restart policy is `no`; FluxOS manages restarts. Docker `HEALTHCHECK` is not consulted.

### 5.3 Losing a node (self-healing)
- Running copies are re-announced on a timer; the record lives **125 min** (`locationTtlS: 7500`). A node that announces its own shutdown has its records dropped after **7 min** (`sigtermExpiryS: 420`).
- When the record lapses the app counts as short and any eligible node claims it (§4 step 5). So **replacement takes minutes after a clean shutdown and up to ~2 h after a sudden death**, plus install time.
- Meanwhile **traffic fails over in seconds**: FDM health-checks each instance every 3 s and drops it after 2 failures (`inter 3s fall 2 rise 2`, [haproxyTemplate.js L289](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/haproxyTemplate.js#L220-L290)), with `retries 3` and `option redispatch`.
- Net: with 2+ instances, a node failure is a few seconds of retries for users; with 1 instance it is downtime until the replacement is up. This is exactly why the form warns about single copies.

### 5.4 Health monitoring
Three layers: (1) FDM checks each instance every 3 s (default `check: true`; `g:` apps are routed to the one elected primary instead, [custom.js](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/application/custom.js)); (2) nodes ask peers to confirm reachability every 5 min and test app ports hourly by default, and a node that keeps failing goes into DOS state (out of service) ([config L440-466](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L440-L466)); (3) node-level health is re-proved on chain every ≤640 blocks plus benchmarks.

### 5.5 Persistent data (Syncthing)
`containerData` grammar, primary mount first ([multiple-mounts-guide.md](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/docs/multiple-mounts-guide.md)):
- plain `/data`: a local volume on that node; survives restarts and soft redeploys, **not** replicated.
- `r:/data`: "Enable Syncthing replication across nodes"; every instance active, eventually consistent; new copies sync to 100% before serving.
- `g:/data`: "Primary/standby mode"; one elected primary runs, standbys hold synced copies; failover takes minutes (FDM waits 3 failed checks + 90 s; standby stagger 3 min per place, `masterSlaveStaggerMs: 180000`).
- `s:` Syncthing folder without the start gating.
Live usage (Academy, 2026-10-13, visible specs only): plain 643, `g:` 316, `r:` 111, `s:` 27 components.
Backups: manual backup/restore per component in FluxCloud; local backups live on the node and are not replicated (Academy FACTS §7.4).

### 5.6 Load balancing, domains, TLS: Flux Domain Manager
[FDM README](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/README.md): "FDM in its basics is HAProxy configurator connected to Flux network. Flux Team is running FDM on runonflux.io domain… **Anyone can stand up its own FDM on any domain** with default settings providing own cloudflare API keys or pDNS keys… FDM load balances all applications running on Flux network putting them behind YOURAPPNAME.app.yourroot.domain."
Details: `balance roundrobin`, sticky cookie `FDMSERVERID` (8 h), automatic Let's Encrypt for custom domains (CNAME to `<app>.app.runonflux.io`), per-port domains `<app>_<port>.app.runonflux.io`. The roadmap lists a "Domain Manager overhaul: rebuilt, one-click domains" for Q4 2026 ([timeline](https://runonflux.com/timeline/)).

### 5.7 Placement controls
- **Geolocation**: `// current geolocation style [acEU], [acEU_CZ], [acEU_CZ_PRG], [a!cEU], [a!cEU_CZ], [a!cEU_CZ_PRG]` ([hwRequirements.js L177](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appRequirements/hwRequirements.js#L175-L182)): allow or forbid continent, country, region. 71% of registered apps use it.
- **Fault domains** for synced apps ([placementFeasibility.js L1-25](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appPlacement/placementFeasibility.js#L1-L25)): counts distinct fault domains (hosting organisation, else allocation block, else /16) among eligible nodes and caps each domain at `ceil(instances / domains)`; "Every approximation in here errs toward counting MORE candidates and MORE domains, which pushes the share toward 1 and spreads instances, never toward stacking them." There are 262 fault domains network-wide ([placementlocations](https://api.runonflux.io/apps/placementlocations)).
- **Pinned nodes, static IP, data-centre flag**: enterprise-owner features.

### 5.8 Image updates
`imageUpdateCheckIntervalMs: 21600000` (6 h): each node compares the running image digest with the registry's digest for the tag and soft-redeploys (keeping data); first check 10 to 30 min after boot, apps 5 s apart ([config L715-719](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L715-L719)).

### 5.9 Security: ArcaneOS and enterprise apps
ArcaneOS: Ubuntu-24-based live installer, UEFI Secure Boot + TPM 2.0, encrypted disk partitions, closed-source System Attestation Service, auto-updates, operator has no root on app data ([docs](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/); announced for 2025-03-31, [IT Digest](https://itdigest.com/information-communications-technology/blockchain/fluxos-to-launch-arcane-update-elevating-network-security-and-privacy/)). Latest build "jolly wombat" `v1775071308` (2026-04-07). amd64 only. Enterprise (v8) specs are encrypted; FluxOS refuses to decrypt them elsewhere: `throw new Error('Application Specifications can only be validated on a node running Arcane OS.');` ([enterpriseHelper.js L7-23](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/utils/enterpriseHelper.js#L7-L23)). 1,230 of 2,200 registered apps are enterprise. Non-enterprise env vars and commands are public on chain.

---

## 6. Kubernetes ↔ Flux (for the concept map)

| Kubernetes | Flux | Notes |
|---|---|---|
| etcd / API server | Flux blockchain + global app registry | Desired state = signed, paid spec in a 30 s block |
| kube-scheduler | every node's spawner | Inverted: nodes pull work, random draw |
| ReplicaSet | `instances` 1-100 | surplus trimmed every 11 blocks |
| Controller / restartPolicy | appReconciler, crash backoff 0/30s/5m/15m/30m | "level-based actuator" |
| Liveness/readiness | FDM 3 s checks; peer reachability 5 min; app ports hourly | no Docker HEALTHCHECK |
| Node failure eviction | 125-min location TTL (7 min clean) → respawn | failover in seconds, rebuild ≤~2 h |
| Service + Ingress | FDM (HAProxy), `<app>.app.runonflux.io`, TLS, CNAME | anyone can run an FDM |
| PV / StatefulSet | `containerData` + Syncthing `r:`/`g:`/`s:` | `g:` = primary/standby |
| nodeAffinity | `geolocation` allow/forbid, `nodes[]`, `staticip` | |
| podAntiAffinity / topology spread | one copy per host IP; fault-domain caps | |
| Secrets | enterprise encrypted spec on ArcaneOS | plain env is public |
| Nodes / kubelet | FluxNodes + FluxOS, FluxBench | permissionless, collateralised |
| Image policy / rollout | 6-hourly digest check → soft redeploy | |

Where the analogy breaks (say so if asked): no namespaces/RBAC beyond owner keys, no HPA autoscaling (you set `instances`), no custom health probes (TCP/port checks only), no service mesh between apps (components of one app share a Docker network), rescheduling after sudden node loss is slower than Kubernetes' default 5-minute eviction (up to 125 min), and FluxEdge (the GPU product) is the part that literally runs Kubernetes ([FluxEdge](https://runonflux.com/fluxedge/): "Kubernetes Integration").

---

## 7. Ecosystem status (2026-10-24)

| Product | Status | Notes and sources |
|---|---|---|
| FluxCloud (cloud.runonflux.com) | live | Deploy console; home.runonflux.io redirects there. Pay FLUX, card, PayPal. "Zero egress fees" and "$2.29 vs AWS $79.92 (2 vCPU/8 GB/100 GB)" are site claims ([FluxCloud](https://runonflux.com/fluxcloud/)); the comparison researcher should verify price claims |
| FluxOS | live, v8.21.1 (2026-10-14) | The dashboard UI labels it "Flux Gravity" in places; docs call it FluxOS. Don't present "Flux Gravity" as a product |
| ArcaneOS | live, 94% of nodes | §5.9 |
| FluxNodes / Titan / managed | live | §3.1 |
| Orbit (Deploy with Git) | live | GitHub/GitLab/Bitbucket, Nixpacks detection, redeploy on push, rollback, from $0.99/mo, Starter 1 instance, Standard/Pro 2 with failover, first week free; old Free plan closed ([Orbit](https://runonflux.com/apps/orbit)). Roadmap still lists "Deploy from Git: push, build, live" in Q4 2026 consolidation |
| Marketplace / FluxPlay games | live | 106 templates; ~30 game titles on [games](https://runonflux.com/games/) |
| FluxEdge | live | GPU P2P marketplace; closed alpha 2024-03-29, public alpha 2024-06-26 ([CIO Influence](https://cioinfluence.com/machine-learning/flux-launches-fluxedge-alpha-ushering-in-a-new-era-of-decentralized-computing/)), full release 2025-04-11 incl. H100s via Hyperstack and Argo CD deploys ([blog](https://runonflux.com/fluxedge-full-release-expanded-features-for-enhanced-user-experiences/)). Roadmap: merge with FluxCloud into one account in Q4 2026 |
| FluxCore | live | Desktop app to rent a machine to FluxEdge ([docs](https://docs.runonflux.com/fluxcore/overview)) |
| FluxAI | live | FluxINTEL, Flux LLM Hub (OpenAI-compatible), FluxGPT, FluxONE, FluxAI API, FluxGrader, Beaver, VoiceDesk ([FluxAI](https://runonflux.com/flux-ai/)). Roadmap: "refocused: sellable inference, not chat" |
| Flux Cloud MCP server | live | [docs](https://docs.runonflux.com/fluxcloud/ai-agents-mcp); hosted `https://mcp.runonflux.com/mcp`, `/healthz` reports v0.2.8 today. The agent pays when it sets `confirm=true`; treat "autonomous agent deploys" carefully |
| Zelcore, SSP Wallet | live | Zelcore since 2018-05-31 ([our story](https://shop.runonflux.com/pages/our-story)); SSP introduced 2024; "SSP v2: full redesign, 12 chains" on the roadmap |
| FluxDrive | live | IPFS storage plans ([docs](https://docs.runonflux.com/fluxcloud/fluxdrive/)) |
| Flux XDAO | live (UI) | Governance app in FluxCloud; mechanics undocumented |
| CumulusVPN, Flux Console | live per roadmap | "135 gateways · 23 countries"; "enterprise control plane" |
| FluxOS v9 specs, managed databases, VPS tier, private overlay networks, one balance, PNR v2, supply proposal | announced | [timeline](https://runonflux.com/timeline/) (Q4 2026 to H2 2027). The whitepaper has a v9 spec chapter; no v9 in FluxOS source today |

---

## 8. Timeline (verified dates)

| Date | Event | Source |
|---|---|---|
| 2018-01-26 | Genesis block (ZelCash); project says launched 2018-01-31 | [block 0](https://api.runonflux.io/daemon/getblock/0/1), [our story](https://shop.runonflux.com/pages/our-story) |
| 2018-05-31 | ZelCore (ZelTreZ) wallet | our story |
| 2020-09-25 | First app message on chain, block 694,307 | [block](https://api.runonflux.io/daemon/getblock/694307/1), `/apps/hashes` |
| 2021-03-27 | Zel → Flux, FluxOS 1.0, parallel mining | our story, docs |
| 2021-04-11 | Rebrand fork, block 835,554 | chain |
| 2022-03-13 → 04-11 | Collateral cut to 1,000/12,500/40,000 (blocks 1,076,532 → 1,097,412) | chain, fluxnode.h |
| late 2022 | Zel Technologies → InFlux Technologies | [docs](https://docs.runonflux.com/home/influx-technologies) |
| 2024-01-05 | P2SH (multisig/delegated) node collateral, block 1,549,500 | chain, Academy FACTS §1.4 |
| 2024-06-26 | FluxEdge public alpha | CIO Influence |
| 2024-09-18 | FluxCloud wins Business Intelligence Group "Stratus Award for Cloud Computing" | docs (minor; use sparingly) |
| 2025-03-31 | ArcaneOS release (announced date) | IT Digest, docs |
| 2025-04-11 | FluxEdge full release | Flux blog |
| 2025-06-24 | Spec v8 (enterprise/encrypted apps) enforced, block 1,932,380 | `/apps/deploymentinformation`, chain |
| 2025-10-25 | Proof of Node / PoUW v2, block 2,020,000; 30 s blocks | chain, fluxd |
| 2025-12-19 | Single-instance v8 apps allowed, block 2,176,519 | config, chain |
| 2026-09-21 | "Ten chains become two" announced | Flux blog |
| 2026-10-14 | FluxOS v8.21.1 | GitHub release |
| ≈2026-10-26 | First 10% reward reduction, block 3,071,200 (14 → 12.6 FLUX) | chainparams, FluxNodes page |

Network size history (project's own figures, for colour only): >900 nodes Q3 2020, >1,100 Q2 2021, >1,400 Q3 2021 ([our story](https://shop.runonflux.com/pages/our-story)); the docs claimed 10,000+ "as of mid-2025" (unverified, likely counting a pre-PoN peak); 6,854 today. If a growth chart is wanted, `stats.runonflux.io/fluxhistorystats` only covers the last 30 days.

---

## 9. Live data layer (what `src/lib/live` uses)

All checked with `curl -H 'Origin: http://127.0.0.1:5190' -I` on 2026-10-24; every one returns `access-control-allow-origin: *`. FluxOS reports errors as HTTP 200 with `{"status":"error"}`, so the client checks the envelope.

| Endpoint | Size (wire / raw) | Cache | Used for | Where |
|---|---|---|---|---|
| `api.runonflux.io/daemon/getfluxnodecount` | 217 B | 30 s | tier counts, total, locked collateral | browser, every 60 s (visible tab only) |
| `api.runonflux.io/daemon/getblockcount` | ~40 B | 30 s | chain height (`blockReward`, countdowns) | browser, every 60 s |
| `stats.runonflux.io/fluxinfo?projection=tier,benchmark.bench.cores,benchmark.bench.ram,benchmark.bench.ssd,geolocation.countryCode,geolocation.continentCode` | ~19 KB br / ~0.6 MB | 10 min | cores, RAM, SSD, countries, continents, per-country counts | browser, on idle after ~4 s, then every 15 min |
| `/data/network-snapshot.json` (ours) | 15 KB | static | node points (536 cells), snapshot-only counts | browser, once |
| `stats.runonflux.io/fluxinfo?projection=…geo, zelid, arcane…` | ~60 KB br / ~1.3 MB | 10 min | points, operators, ASNs, ArcaneOS | snapshot script only |
| `api.runonflux.io/apps/locations` | ~315 KB br / 2.6 MB | 30 s | running apps, instances, multi-copy apps | snapshot script only (too heavy for the browser) |
| `api.runonflux.io/apps/globalappsspecifications` | ~1.2 MB br / 3.1 MB | 30 s | registered apps | snapshot script only |
| `api.runonflux.io/apps/hashes` | ~5 MB br / 16 MB | 30 s | app messages ever | snapshot script only |
| `api.runonflux.io/apps/placementlocations` | 4.5 KB | 30 s | nodes and fault domains per continent/country (table generated 2026-10-15, lags) | not used; handy for a fault-domain visual |
| `stats.runonflux.io/fluxhistorystats` | ~22 KB br | 15 min | 30 days of tier counts at ~15 min resolution | not used; good for a sparkline |

Notes: `api.runonflux.io` is a Flux-run balancer; node-local endpoints there describe one backend node, not the network. Stats rows for unreachable nodes are zero-filled placeholders and must be skipped (the script and client do).

---

## 10. Claims ledger (strongest true claims, with sources)

1. **"Over 6,800 nodes in 57 countries run Flux right now."** 6,854 confirmed nodes; 57 countries by IP geolocation. Say "nodes", not "servers" or "machines": they sit on 2,797 distinct IPs (UPnP lets up to 8 nodes share one address). [getfluxnodecount](https://api.runonflux.io/daemon/getfluxnodecount), [stats fluxinfo](https://stats.runonflux.io/fluxinfo?projection=geolocation.countryCode). Live-refreshable.
2. **"Anyone can run the cloud."** FluxNodes are "permissionless and open to everyone": hardware + collateral, no application. [docs](https://docs.runonflux.com/fluxnodes/what-are-fluxnodes/).
3. **"No master node: every machine schedules itself."** Each node's spawner picks apps missing instances at random. [appSpawner.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appLifecycle/appSpawner.js#L520-L575).
4. **"One setting runs your app on up to 100 machines at once."** `maximumInstances: 100`, one copy per host IP. [config](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L430-L434), appSpawner.js L568.
5. **"86% of apps running on Flux right now have two or more live copies."** 1,815 of 2,115. [apps/locations](https://api.runonflux.io/apps/locations).
6. **"If a copy stops answering, traffic moves to the others within seconds."** FDM: check every 3 s, out after 2 failures, retries + redispatch. [haproxyTemplate.js](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/haproxyTemplate.js#L220-L290).
7. **"Lose a node and the network rebuilds the missing copy on another one, automatically."** Location TTL 125 min / 7 min clean, then respawn by another node. [config](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L565-L595), appSpawner.js.
8. **"Crashed containers restart themselves via a reconcile loop."** appReconciler + backoff ladder. [appReconciler.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appMonitoring/appReconciler.js#L19-L31).
9. **"Data that follows your app: replicated volumes peer to peer."** Syncthing `r:` and `g:` modes. [multiple-mounts-guide.md](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/docs/multiple-mounts-guide.md).
10. **"Pick the continents and countries your app may run in, or ban them."** `acEU_DE`, `a!cNA`; 71% of apps use rules. [hwRequirements.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appRequirements/hwRequirements.js#L175-L182).
11. **"Replicated apps are spread across hosting providers, not stacked."** Fault-domain caps; "spreads instances, never toward stacking them". [placementFeasibility.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appPlacement/placementFeasibility.js#L1-L25).
12. **"Every node proves its hardware before it earns."** Benchmarks per tier (EPS, RAM, disk write, bandwidth) signed into confirmations. [whitepaper](https://github.com/RunOnFlux/fluxwhitepaper/blob/686973898157ab8af46ce28345d0064ed4ae94c9/paper/sections/04-consensus.tex#L418-L431).
13. **"Operators have 97.9 million FLUX at stake."** Collateral × tier counts. [fluxnode.h](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.h#L57-L63). Live-refreshable.
14. **"The machines that host apps also secure the chain."** Proof of Node since block 2,020,000: no mining, 30 s blocks, produced by FluxNodes. [chainparams.cpp](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/chainparams.cpp#L103-L158), [getblockchaininfo](https://api.runonflux.io/daemon/getblockchaininfo).
15. **"Every 30 seconds, one node in every tier gets paid."** Strict round-robin per tier, confirmed in code and on the live node list (§14.1). 1 / 3.5 / 9 FLUX (0.9 / 3.15 / 8.1 from block 3,071,200). [FluxNodes page](https://runonflux.com/fluxnodes/), [PoUW v2 post](https://runonflux.com/forking-flux-proof-of-useful-work-v2/).
16. **"56,900 CPU cores, 192 TB of RAM and 3.37 PB of SSD, benchmarked."** [stats fluxinfo](https://stats.runonflux.io/fluxinfo?projection=benchmark.bench.cores,benchmark.bench.ram,benchmark.bench.ssd). Live-refreshable.
17. **"2,115 apps running right now on 8,827 instances."** [apps/locations](https://api.runonflux.io/apps/locations).
18. **"On chain since January 2018; hosting apps since September 2020; 75,000+ deployments and updates recorded."** [block 0](https://api.runonflux.io/daemon/getblock/0/1), [block 694,307](https://api.runonflux.io/daemon/getblock/694307/1), [apps/hashes](https://api.runonflux.io/apps/hashes).
19. **"Hardened nodes: 94% run ArcaneOS with Secure Boot, TPM and encrypted disks."** [docs](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/), stats `flux.arcaneVersion`.
20. ~~"Secrets stay sealed: encrypted app specs only decrypt on hardened nodes."~~ **Superseded by `research/privacy.md`:** Flux's own load balancers (FDM) also decrypt private specs via an internal key service. Say instead: "Make an app private and it only ever runs on hardened nodes; its secrets, images and settings stay off the public record." [enterpriseHelper.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/utils/enterpriseHelper.js#L7-L23), [privacy.md](./privacy.md).
21. **"Every app gets a domain, HTTPS and load balancing out of the box."** [FDM README](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/README.md).
22. **"The whole stack is open source; you can even run your own load balancer."** RunOnFlux GitHub; FDM README "Anyone can stand up its own FDM on any domain".
23. **"Deploy from Git, or have an AI agent deploy for you."** [Orbit](https://runonflux.com/apps/orbit), [MCP docs](https://docs.runonflux.com/fluxcloud/ai-agents-mcp).
24. **"Over a thousand operator identities on 234 different networks."** 1,155 Flux IDs, 234 ASNs. Stats fluxinfo.

---

## 11. Claims to avoid (outdated, disputed or unverifiable)

| Claim seen | Where | Why to avoid | Say instead |
|---|---|---|---|
| "10,000+ nodes", "13,000+ nodes" | docs intro, Flux vs AWS page | Live is 6,854 | the live count |
| "66+ countries", "75+ countries", "67 countries" | docs, homepage (May 2026) | Our count from network data is 57 | "57 countries" with date, or live |
| "560 independent infrastructure providers" | docs | 1,155 operator IDs, 234 ASNs, ~360 org strings; "providers" undefined | "over a thousand operator identities on 234 networks" |
| "6,800 independent servers / machines" | inference from node count | 6,854 nodes share 2,797 IPs (up to 8 per IP via UPnP); some are VMs on one host | "6,800+ nodes" |
| "Thousands of independent operators" | Orbit page | ~1,155 IDs; 39 IDs run over half the nodes | "over a thousand operators" |
| "Every app runs on three or more nodes" / "3+ nodes" by default | docs intro, Orbit docs, old academy | Minimum is 1 for v8 since 2025-12-19; FluxCloud form defaults to 1; marketplace defaults to 3 | "runs on as many independent nodes as you choose; most apps use 2 or 3" |
| "Zero downtime", "zero points of failure", "no single point of failure" | homepage, docs, FluxEdge page | Single-instance apps go down with their node; FDM is Flux-run; g: failover takes minutes | "no single machine, provider or country your app depends on (with 2+ instances)" |
| "Workload seamlessly redistributed" instantly | docs | Traffic failover is seconds; rebuilding a lost copy can take up to ~2 h | "traffic fails over in seconds; the lost copy is rebuilt automatically" |
| "Deploys across continents" as a default | brief theme | Only 19% of multi-copy apps span 2+ continents; placement follows where nodes are (71% Europe) unless you set geolocation | "spread copies across countries and continents with one rule" |
| "Progressive Node Rewards: 80% of app revenue to ArcaneOS operators" (as live) | docs | No PNR code in fluxd/FluxOS; roadmap H1 2027 | "planned (PNR v2, 2027)" |
| Max supply 440M "fixed" / "560M cap" | MiCA whitepaper, FluxNodes page, PoUW post, CoinGecko max_supply | Two different caps published; consensus has no total cap (440M is a per-output sanity bound); roadmap Q4 2026 "Supply proposal: Cap, freeze, or tail" | avoid supply-cap claims |
| "37.5 FLUX block reward", "50% of block rewards to nodes" | docs ecosystem page | Pre-PoN numbers; now 14 (12.6 from ~Oct 26) with 96.4% to nodes | 14/12.6 split |
| "Mine FLUX with GPUs" / FluxCore "native FLUX mining" | docs | PoW ended at block 2,020,000 | "nodes secure the chain" |
| "Target inflation of 1% by 2036", "incentive-driven deflation" | FluxNodes page | Marketing projection, not in code | omit |
| Block time "2 minutes" | older material | 30 s since 2025-10-25 | 30 s |
| Collateral 10,000 / 25,000 / 100,000 FLUX | pre-2022 material | Changed 2022 | 1,000 / 12,500 / 40,000 |
| Nimbus 16 GB / Stratus 32 GB RAM | legacy guide | Now 32 / 64 GB (benchmark ≥30 / ≥61) | current table |
| "All enterprise nodes must be Stratus" | docs | Not enforced in code | omit |
| "Docker HEALTHCHECK / custom health probes" | assumption | FluxOS doesn't read HEALTHCHECK; checks are TCP/port | "health-checked every 3 s" |
| "FluxCloud is 90% cheaper than AWS", "$2.29 vs $79.92", "unlimited bandwidth" | FluxCloud page, docs | Vendor claims; comparison researcher must verify workload and inclusions | cite compare.ts numbers only |
| "25,000 applications deployed across 75+ countries by late 2025" | docs intro | Not reproducible; 2,200 registered now, 23,351 distinct names in history (Atlas, 2026-09-30) | "75,000+ deployments and updates since 2020" |
| "Flux Gravity" as a product | dashboard UI strings | UI label for FluxOS only | FluxOS |
| "Spec v9 enforced late October 2026" | web summaries | Not in FluxOS 8.21.1 (`latestAppSpecification: 8`); roadmap says "FluxOS v9 specs" Q4 2026 | "v9 is on the roadmap" |
| Total cores 91,370 / 6.8 PB storage | docs (old dashboard) | Live: 56.9K cores, 3.37 PB | live |
| "Deployment live in 30 seconds" / guaranteed 45 min | console copy | Static UI estimates | "minutes" |
| "Uncensorable" without qualification | general | Nodes enforce a signed blocklist of owners/images; FDM is Flux-run | "no single provider can switch you off; anyone can run nodes and FDM" |
| Stratus Award as major industry recognition | docs | Real but minor (Business Intelligence Group) | omit or footnote |

---

## 12. Open questions

- **Countries**: our 57 (ip-api via stats) vs homepage 67 (May 2026) vs placement table 58. Methods differ; we show ours with a date.
- **First FluxNode date**: "ZelNode economics established 2018-07-31" (our story) is not a launch date; not used.
- **InFlux rebrand exact date**: docs say "late 2022"; no precise date found, so it is not in the milestones array.
- **Titan launch date**: not found in sources read; omitted.
- **FDM independence**: how many apps use a non-Flux FDM is unknown.
- **Orbit plan instance counts** come from the vendor page (Starter 1, Standard/Pro 2); not checked against live specs today (Academy found 229 of 235 Orbit apps on 1 instance on 2026-10-13).

---

## 13. Addendum: concentration and hosting networks (computed 2026-10-24 18:33 UTC)

Feeds `concentration`, `hostingOrgs` and `analogyLimits` in `src/data/flux.ts`. Re-pulled live, about an hour after §1, at chain height 3,065,726.

**Inputs.** `stats.runonflux.io/fluxinfo?projection=tier,geolocation,flux.zelid,ip` (6,848 rows, 3.1 MB raw); `api.runonflux.io/daemon/getfluxnodecount` (6,851 confirmed: 3,352 / 1,660 / 1,839); `api.runonflux.io/daemon/viewdeterministicfluxnodelist` (6,851 entries, for IPs and payout addresses); RIPEstat `as-overview` for the registered holder of each ASN listed.

**Base.** 6,778 rows carry a geolocation, an ASN and an operator ID (the same rows: the other 70 stats rows, and 3 confirmed nodes with no row, were unreachable and are left out, not guessed). Every share below is of these 6,778, which is also the base `continentShares(live.byCountry)` uses, so the static and live Europe figures agree.

| Stat id | Value | How |
|---|---|---|
| `top-host-share` | 25.6% (Hetzner AS24940, 1,733 nodes: FI 986, DE 747; 97 operator IDs) | `geolocation.asn` first token, counted. Hetzner's other ASNs (AS213230, AS212317) have no nodes |
| `operators-for-half` | 39 IDs (3,394 nodes) | `flux.zelid` counts sorted descending, smallest k with cumulative > 50%. With confirmed nodes as the base it is 41 |
| `operators-for-third` | 14 IDs (2,313 nodes); top 8 run a quarter | same, > 1/3 |
| `largest-operator-nodes` | 371 (5.5%); next 268, 253, 222, 180 | same |
| `datacenter-share` | 48.5% (3,285 nodes) | ip-api `dataCenter` flag (identical to its `hosting` flag on every row) |
| `europe-share` | 71.7% (4,857); NA 23.0%, AS 3.2%, SA 1.0%, OC 0.7%, AF 0.4%; DE+FI+FR 48.4% | `geolocation.continentCode`. §1 had 70.8% because it divided by all 6,855 rows including unreachable ones |
| `distinct-ips` | 2,797 IPs behind 6,851 nodes (2.4 per IP; 1,929 IPs host one node; max 8) | node list `ip` minus port (stats rows give 2,796) |
| `distinct-asns` | 234 | distinct ASNs |
| `asns-for-half` | 7 networks hold 3,490 nodes | ASN counts sorted, as for operators |

**Payout addresses as a cross-check.** 842 distinct `payment_address` values in the node list; 40 of them receive the rewards of half the nodes, which matches the 39 IDs. The outlier: **GHOSTnet (AS12586) carries 511 nodes, each with its own Flux ID, on 64 IPs in Hesse, all paying out to 3 addresses (359 + 151 + 1).** That pattern looks like one managed-node or staking service, which we have not identified. It means 511 of the 1,155 "operator identities" are probably one business, so the 1,155 figure overstates the number of independent operators. This is in the `operators` stat note and the GHOSTnet `hostingOrgs` note.

**`hostingOrgs`.** The 15 largest networks by nodes, then two buckets (asn 0) so the list sums to 6,778:

| # | Name | ASN | Nodes | Share | Kind | Operator IDs |
|---|---|---|---|---|---|---|
| 1 | Hetzner | 24940 | 1,733 | 25.6% | datacenter | 97 |
| 2 | GHOSTnet | 12586 | 511 | 7.5% | datacenter | 511 (3 payout addresses) |
| 3 | OVHcloud | 16276 | 318 | 4.7% | datacenter | 27 |
| 4 | Stofa (holder Sinal A/S) | 39642 | 268 | 4.0% | isp | 1 |
| 5 | Cogent (one customer block, "Node Orbit", NC) | 174 | 254 | 3.7% | isp | 2 |
| 6 | Free | 12322 | 217 | 3.2% | isp | 41 |
| 7 | MEVSPACE | 201814 | 189 | 2.8% | datacenter (flag says no; it is a server host) | 33 |
| 8 | IONOS (incl. Strato) | 8560 | 172 | 2.5% | datacenter | 5 |
| 9 | netcup | 197540 + 214996 | 159 | 2.3% | datacenter | 17 |
| 10 | Tech Futures Interactive | 394256 | 123 | 1.8% | datacenter | 5 |
| 11 | PG-19 (Taganrog) | 60246 | 109 | 1.6% | isp | 1 |
| 12 | Bluebird Network (holder Missouri Network Alliance) | 62943 | 106 | 1.6% | datacenter | 7 |
| 13 | Orange (France) | 3215 | 100 | 1.5% | isp | 26 |
| 14 | TDS Telecom | 4181 | 96 | 1.4% | isp | 1 |
| 15 | Verizon | 701 | 91 | 1.3% | isp | 16 |
| | Other data centers (17 networks) | 0 | 177 | 2.6% | datacenter | |
| | Other home and business internet (201 networks) | 0 | 2,155 | 31.8% | isp | |

`kind` is the majority of ip-api's data-center flag per network, checked by hand; the one override is MEVSPACE ("Affordable Dedicated Servers and VPS Hosting", mevspace.com). Companies are merged across ASNs only when the holder is the same company (netcup). Orange's other national networks (Poland 12, Romania 3, Belgium 1) and AS5650 (Frontier, labeled "Verizon Business" by ip-api, 52) are separate networks and stay in the buckets. Contabo, often assumed big, has 24 nodes on three ASNs. No nodes on AWS or Azure; Akamai/Linode 7, Google Fiber 6, Scaleway 1.

Several single-ISP entries (Stofa 268, PG-19 109, TDS 96) are one operator ID each: one person or business with many nodes on a business line, not many households.

**`analogyLimits`** (5 rows). Checked against code at the pinned commits: FDM's default backend check is a plain `check` with no `option httpchk` (`custom.js` defaults `healthcheck: []`; HTTP checks are added only for apps matched by name, e.g. WordPress); `instances` is a fixed number in the spec with no autoscaler in FluxOS; location TTL 7,500 s vs Kubernetes' default `tolerationSeconds=300` taint-based eviction ([k8s docs](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)); per-app Docker networks with the 8.21.0 firewall between them, and private overlay networks only on the roadmap; FluxEdge is the only part with Kubernetes underneath. Namespaces/RBAC (no roles beyond the owner key plus Flux support) is true but left out to keep the list at five.

**Regenerate.** `node scripts/snapshot.mjs` now also writes a small `concentration` block (raw counts and the top 20 networks) into `public/data/network-snapshot.json`; `node scripts/snapshot.mjs --dry` prints it without writing anything. Its `distinctIps` counts only the base rows (2,752 at 18:44 UTC); the `distinct-ips` stat uses the full node list (2,797 for all 6,851 nodes). A dry run at 18:44 UTC reproduced every other figure above exactly. The full snapshot was not re-run, so `network-snapshot.json` and `snapshot.generated.ts` still hold the 17:23 UTC counts. Human names and `kind` in `hostingOrgs` stay hand-curated in `flux.ts`.


---

## 14. Addendum: the payout rotation and parallel assets (checked 2026-10-24 ~20:35 UTC)

Feeds `payoutRotation` and `parallelAssets` in `src/data/flux.ts` and `payoutCycle()` / `payoutCycles()` / `PARALLEL_MINING` in `src/lib/live`. Chain height ≈ 3,065,970; tier counts 3,350 / 1,659 / 1,839 (6,848).

**Inputs.** fluxd at the pinned `8a60ee6` (`src/fluxnode/fluxnode.{h,cpp}`, `src/main.cpp`, `src/pon/pon-minter.cpp`, `src/chainparams.cpp`); flux-docs at `71f936d` (2026-10-21); whitepaper at `6869738` (§6 parallel assets); [RunOnFlux/fusiondocs](https://github.com/RunOnFlux/fusiondocs) at `2d1edaa` (Fusion's public API spec; Fusion's own source is private); live `viewdeterministicfluxnodelist`, `getfluxnodecount`, block headers, and Fusion's public API (`/fees`, `/swap/activechains`, `/coinbase/summary`); blog posts "Ten chains become two" (2026-09-21) and "Four years, eighteen minutes" (2026-09-23).

### 14.1 Payout selection: strict round-robin per tier (confirmed)

The code, step by step:

1. **One queue per tier.** `FluxnodeCache::mapFluxnodeList` holds a `std::list<FluxnodeListData>` per tier, ordered by `nLastPaidHeight`, or `nConfirmedBlockHeight` for a node never paid ([fluxnode.h L313-336](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.h#L313-L336)). Ties: by collateral outpoint; a new node confirmed at the same height a node was paid sorts ahead of it.
2. **The front gets paid.** `GetNextPayment()` returns the front of the tier's list, skipping (and popping) entries that have since expired ([fluxnode.cpp L713-777](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.cpp#L713-L777)). The block template pays one node per tier ([L892-937](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.cpp#L892-L937)), and `CheckFluxnodePayout()` rejects any block that does not pay exactly those three outpoints the exact tier amount, with the remainder to the dev fund ([L789-890](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.cpp#L789-L890)).
3. **Then to the back.** On connect, each paid node gets `nLastPaidHeight = height`, is popped from the front and `emplace_back`-ed to the end of its list ([L1302-1336](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.cpp#L1302-L1336)).
4. **Amounts depend only on tier and height.** `GetFluxnodeSubsidy()`: 1 / 3.5 / 9 out of 14, times the current subsidy ([main.cpp L2886-2924](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/main.cpp#L2886-L2924)); unit test `pon_tests.cpp` checks 0.9 / 3.15 / 8.1 after the first reduction.
5. **The block producer earns nothing.** pon-minter writes the coinbase remainder to the dev fund address ([pon-minter.cpp L288-305](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/pon/pon-minter.cpp#L288-L305)). Production (hash of collateral, previous block, slot) and payment (queue front) are independent.

What puts a node in the queue or changes its place:

| Event | Effect on queue position | Code |
|---|---|---|
| START tx, then a benchmark-signed confirm within 240 blocks | Enters with `nLastPaidHeight = 0` and its confirm height as the sort key, i.e. **at the back**; first payout after ≈ one rotation | [L1154-1192](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.cpp#L1154-L1192) |
| START not confirmed in 240 blocks | Not in the queue; parked in a DoS list for 720 blocks before it may start again | [fluxnode.h L22-28](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.h#L22-L28) |
| Routine re-confirm (allowed after 500 blocks, due by 640) or IP change | Updates last-confirmed height and IP only; **place unchanged** | [L1251-1280](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.cpp#L1251-L1280), [fluxnode.cpp L669-688](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.cpp#L669-L688) |
| No confirm for 640 blocks (≈5.3 h: offline, failed benchmark, no signature) or collateral spent | Expires; lazily dropped from the list when it reaches the front | [L231-290](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/fluxnode.cpp#L231-L290) |
| Restart after expiry | New START + confirm: **back of the queue** | as first row |

Confirmations carry a benchmark signature from fluxbenchd ([activefluxnode.cpp L55-70](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/fluxnode/activefluxnode.cpp#L55-L70)), so "stays confirmed" means "stays online and passes its benchmark". There is no other uptime score in consensus.

**Live verification** (node list at height ≈3,065,965; `rank` is fluxd's queue position):

| Tier | Nodes | `rank` order matches (last paid ‖ confirm height) | Nodes sharing a payout block | Oldest last-paid | Never paid (new) |
|---|---|---|---|---|---|
| Cumulus | 3,350 | yes, all | 0 | 3,254 blocks ago | 172 |
| Nimbus | 1,659 | yes, all | 0 | 1,637 blocks ago | 25 |
| Stratus | 1,839 | yes, all | 0 | 1,835 blocks ago | 12 |

Every node that has been paid was paid within the last rotation; each block height appears once per tier. That is strict round-robin.

**Block time.** 1,045,968 blocks from 2,020,000 (2025-10-25 18:00:35 UTC) to 3,065,968 (2026-10-24 20:33:04 UTC): mean **30.08 s**; last 2,880 blocks 30.02 s. Block 3,071,200 at 30 s lands ≈ **2026-10-26 16:00 UTC**.

### 14.2 Formula and today's numbers

For a tier with N confirmed nodes, block time T = 30 s, per-payout amount A (from `blockReward(height)`):

- seconds between payouts ≈ **N × T**
- payouts per day = 2,880 / N
- FLUX per day = (2,880 / N) × A; per month = (87,600 / N) × A (87,600 = 1,051,200 / 12)

Churn makes the real interval a few percent shorter than N × T (nodes leaving ahead of you; joiners queue behind you). These are long-run averages: payouts arrive whole, once per rotation. `payoutCycle(tier, live)` computes all of it from the live counts and estimated height, plus `afterReduction` and `parallel`.

| Tier (N on 2026-10-24) | Hours between payouts | Per payout now → from 3,071,200 | FLUX/day now → after | FLUX/month now → after |
|---|---|---|---|---|
| Cumulus (3,350) | **27.9** | 1 → 0.9 | **0.86 → 0.77** | 26.1 → 23.5 |
| Nimbus (1,659) | **13.8** | 3.5 → 3.15 | **6.08 → 5.47** | 184.8 → 166.3 |
| Stratus (1,839) | **15.3** | 9 → 8.1 | **14.09 → 12.69** | 428.7 → 385.8 |

Parallel assets add up to 90% on top, in FLUX on other chains (§14.3): e.g. Stratus +12.7/day now, +11.4/day after the reduction, before claim fees. Note that Nimbus, the smallest tier, rotates fastest; "bigger tier, paid more often" is wrong.

### 14.3 Parallel assets

**What they are.** FLUX tokens on other blockchains, swappable with main-chain FLUX through Fusion (`fusion.runonflux.io`, operated by the team). Fusion's active swap chains today: main + `kda, eth, bsc, trx, sol, avax, algo, matic, base` ([/swap/activechains](https://fusion.runonflux.io/swap/activechains)). The docs list the same nine as "active parallel assets" with contract addresses ([claim-parallel-assets](https://docs.runonflux.com/fluxnodes/claim-parallel-assets)): Kadena `runonflux.flux`, Ethereum `0x720c…1495`, BNB Chain `0xaff9…e635`, Tron `TWr6…zb6`, Solana `FLUX1wa…XqXe`, Avalanche `0xc4B0…aF55`, Algorand `1029804829`, Polygon `0xA2bb…E99B`, Base `0xb008…dd44`. **Ergo** stopped being an active parallel asset on 2026-09-21, after Ergo's storage-rent rule let collectors sweep the 415M FLUX bridge reserve boxes (no user funds lost; balances at Ergo block 1,878,291 and accrued Ergo mining rewards are honoured 1:1 on the main chain through Fusion) ([docs](https://docs.runonflux.com/fluxnodes/claim-parallel-assets), [Flux blog](https://runonflux.com/four-years-eighteen-minutes-ergo-storage-rent/)).

**How they relate to block rewards.** Not part of the on-chain block reward and not a fluxd rule: fluxd only pays native FLUX. Fusion indexes every main-chain coinbase output and, since block **825,001 (2021-03-27)**, entitles its address to **10% of each output on every parallel chain** ([fusiondocs openapi L660-800](https://github.com/RunOnFlux/fusiondocs/blob/2d1edaa5bf702ab1d32a8ec6a29837091d705532/openapi/openapi.yaml#L660-L800); whitepaper §6.3 citing `coinbaseService.js`). Per block that is 1.4 FLUX-worth per chain across all outputs (1.35 for the three node payouts) at 14 FLUX, 1.26 (1.215) from block 3,071,200. Per node: 10% of each payout per chain, so 0.1 / 0.35 / 0.9 per chain per payout now (90% across nine chains). Funding: the main chain minted 22M FLUX to a swap pool ten times, every 21,600 blocks from block 837,714 (April 2021) ([chainparams.cpp L300-304](https://github.com/RunOnFlux/fluxd/blob/8a60ee6316371a120ae8546c8d42f4cb3bc71158/src/chainparams.cpp#L300-L304)); each chain's 22M splits into a 12.31M holder snapshot, a 1M fund and an **8.686M coinbase pool** that pays these rewards (whitepaper §6.6).

**Still active after Proof of Node: yes.** Evidence: (1) Fusion's live `/coinbase/summary` for a Stratus payout address shows 5,728 payouts of exactly 9 FLUX (all Proof-of-Node era) and 5,155.2 FLUX "possibleToClaim" on each chain, i.e. 10% ([example](https://fusion.runonflux.io/coinbase/summary?address=t1JgH2Q9o7tQH46wgHqcoVCUJm12X1Xsamq)); (2) the docs were updated on 2026-10-21 with Proof-of-Node amounts ("≈ 0.81 FLUX worth for each 8.1 FLUX Stratus payout"); (3) the whitepaper's depletion table accrues 1.4 per block from 2,020,000.

**Claiming.** Manual, in Zelcore: Apps → Fusion → ⋯ → Parallel Mining Claim → chain → mining address → Claim. Node operators need no whitelist (pool/miner addresses did). Each claim pays a flat fee in FLUX per chain; live [/fees](https://fusion.runonflux.io/fees) `mining`: kda 10, bsc 10, eth 12, trx 20, sol 10, avax 8, erg 10, algo 10, matic 32, base 10. A claim is only possible once the accrued amount exceeds the fee, so docs advise claiming monthly or quarterly. The whitepaper adds that the mining-claim endpoint accepts main-chain addresses and can pay in main-chain FLUX from a Fusion wallet (team-confirmed route); the docs describe delivery on the chosen chain. Titan stakers get native FLUX only, no parallel-mining accrual ([docs](https://docs.runonflux.com/fluxnodes/titan-node-staking)).

**Status and what changes** ("Ten chains become two", 2026-09-21; whitepaper §6.6 [L471-566](https://github.com/RunOnFlux/fluxwhitepaper/blob/686973898157ab8af46ce28345d0064ed4ae94c9/paper/sections/06-parallel-assets.tex#L471-L566)):

| When | Height | What | Status |
|---|---|---|---|
| before March 2027 | | Ethereum and BNB Chain move to new audited mint-and-burn contracts by snapshot; holders do nothing | planned |
| 2027-03-06 | 3,450,000 | The other eight (Base, Polygon, Avalanche, Ergo, Algorand, Solana, Tron, Kadena) go one-way: redeem out and claim mining still work, nothing swaps in | planned |
| ≈2027-07-01 | **3,787,502** | Per-chain coinbase pools exhausted: **parallel-asset rewards stop**; **PNR starts at the same block** | planned (computed by the whitepaper's emission model; no consensus constant) |
| 2027-08-02 | 3,880,000 | Retiring chains shut down; unclaimed balances on them go to the Flux Foundation | planned |

So: active today on nine chains; a fixed wind-down is announced. Roughly a quarter of what operators accrued has never been claimed (blog; whitepaper: ~1.89M on Ethereum).

**Stale or conflicting sources.** Docs "What are FluxNodes" still says "once all ten parallel assets are active … 100% … doubling total earnings" (nine are active, ten never will be again). Docs FluxCore overview still advertises GPU "parallel asset mining" (PoW ended at 2,020,000). Docs "Maintenance window" still uses 2-minute blocks and a 120-block window (now 30 s, re-confirm after 500 and by 640 blocks). fusiondocs' example fee table is from 2024.

### 14.4 Safe to say

- "Every 30 seconds, one node in every tier gets paid." (fluxd; one payout per tier per block)
- "Nodes are paid in turn: the node at the front of its tier's queue is paid, then goes to the back." Strict round-robin, code + live list.
- "Every confirmed node gets its turn, once per rotation." / "No lottery and no pools decide who gets paid."
- "A tier of N nodes pays each of them about every N × 30 seconds": today ≈ 28 h Cumulus, 14 h Nimbus, 15 h Stratus (live via `payoutCycle`; say "about").
- "Each turn pays the same for every node in a tier: 1, 3.5 or 9 FLUX (0.9, 3.15 or 8.1 from block 3,071,200)."
- "Making a block earns nothing extra; payouts follow the queue."
- "New nodes join at the back of the line; stay online and your turn always comes."
- "On top of every payout, node operators earn FLUX on other chains: 10% of the payout on each of nine chains, claimed in Zelcore's Fusion app." (as of 2026-10-24; true until the planned July 2027 cut-over)
- "FLUX also lives on Ethereum and BNB Chain." (durable past 2027)

### 14.5 Avoid

- "Random" or "lottery" payouts, "stake-weighted", "the block producer is rewarded".
- Exact payout times ("every 15 hours, guaranteed"); say "about", live.
- "Bigger tiers are paid more often." Frequency depends on node count; Nimbus is fastest today.
- "Parallel assets double your rewards" / "100% extra" / "ten chains". At most 90% today, in tokens on other chains, before claim fees.
- "Parallel assets are part of the block reward" or "paid automatically". They are a Fusion entitlement you claim.
- "Parallel assets forever" or any undated promise; it is planned to end ≈ July 2027 (block 3,787,502), with PNR planned at the same block. Don't claim PNR as live.
- Ergo as a parallel chain. Titan staking earning parallel assets.
- Fiat or APY figures (no prices on the page).

### 14.x Correction (2026-10-24, from the Flux team via the site owner)

Ergo is **being deprecated but still earns**: node payouts keep accruing the Ergo share, honoured
1:1 on the main chain through Fusion. So **ten chains earn** today (nine active plus Ergo), and
parallel assets match each payout in full: 10% × 10 chains = 100%. A Stratus payout of 9 FLUX
earns another 9 FLUX across the parallel chains, **18 FLUX in all**. `parallelAssets.activeChains`
and `PARALLEL_MINING.activeChains` are now 10, and Ergo's status is `deprecating`. This supersedes
"nine chains" and "up to 90%" above.
