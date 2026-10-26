# Privacy and security research: ArcaneOS, encrypted apps and what operators can see

Owner: security and privacy research pass. Compiled 2026-10-24. Builds on `research/flux.md` §5.9 and claims 19–20, which this file supersedes on security matters. Live numbers were read on 2026-10-24 (stats ~14:07 local). Source code was read at the HEAD of each default branch that day:

| Repo | Commit | Date | What it settles |
|---|---|---|---|
| [RunOnFlux/flux](https://github.com/RunOnFlux/flux) (FluxOS v8.21.1) | `9bb1419` | 2026-10-14 | Who may touch an app on a node, how enterprise specs are decrypted, container isolation |
| [RunOnFlux/flux-domain-manager](https://github.com/RunOnFlux/flux-domain-manager) (FDM) | `a30f379` | 2026-10-05 | TLS termination, the hop to the node, FDM's decryption of every enterprise spec |
| [RunOnFlux/fluxos-frontend](https://github.com/RunOnFlux/fluxos-frontend) (FluxCloud) | `d7fa0de` | 2026-10-24 | How the browser fetches the encryption key |
| [RunOnFlux/fluxwhitepaper](https://github.com/RunOnFlux/fluxwhitepaper) | `6869738` | 2026-09-08 | Flux's own account of ArcaneOS, SAS and their limits (ch. 14) |
| [RunOnFlux/flux-docs](https://github.com/RunOnFlux/flux-docs) (docs.runonflux.com) | `71f936d` | 2026-10-21 | ArcaneOS install guide, operator accounts |
| [RunOnFlux/arcaneos-releases](https://github.com/RunOnFlux/arcaneos-releases) | `f78075b` | 2026-04-06 | The only public ArcaneOS changelog (the OS source is private) |

Independent source: the [Halborn ArcaneOS assessment](https://www.halborn.com/audits/influx-technologies/arcaneos-0478c8) (engagement 2025-10-08 to 2025-11-18, page updated 2026-02-05). Halborn had access to the private ArcaneOS repository. This is the only third-party review found.

---

## 0. The honest answer

**Can a Flux node operator spy on my app?** On an ArcaneOS node (about 94% of the network), the operator has no root, no shell and, since FluxOS 8.18.0 (2026-09-08), no FluxOS API path into your app's files, logs, environment variables or terminal, and the disk is encrypted. That stops ordinary and opportunistic snooping. It is **not** confidential computing, though. There is no hardware enclave, so a determined operator who controls the hypervisor or the hardware could still read memory. Default web traffic reaches the node as plain HTTP across the operator's network. InFlux (Flux's company) can itself decrypt private app specs and open a shell in any app. On the ~6% of legacy nodes the operator is root and sees everything.

So the common belief ("ArcaneOS protects the apps and encrypts them so node operators can't even spy on the applications hosted") is **directionally right but too absolute**. Say "locked out", not "can't spy". Scope it to ArcaneOS and to private apps. Keep the three exceptions (hypervisor and physical access, traffic, Flux itself) in the fine print.

---

## 1. What ArcaneOS is

| Aspect | Fact | Source |
|---|---|---|
| What | "A major security and usability upgrade to FluxOS": a live-image installer plus the FluxOS System Attestation Service (SAS) | [docs: ArcaneOS FluxNode](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/) |
| Launched | 2025-03-31 (docs). Blog: [Bringing Arcane to FluxOS](https://runonflux.com/bringing-arcane-to-fluxos/), 2025-04-09 | docs |
| Base | Ubuntu 24-based image; current builds track "latest Ubuntu interim release"; amd64 only | docs; [release notes v1774117921](https://github.com/RunOnFlux/arcaneos-releases/releases/tag/v1774117921) |
| Secure Boot | Required. The installer enrolls **Flux's own Platform Key** (not Microsoft's or the vendor's); the hash is pinned in the enrollment binary, and the initrd powers the machine off if Secure Boot is off, the PK doesn't match, or no TPM 2.0 is present | [whitepaper ch. 14 L19-L45](https://github.com/RunOnFlux/fluxwhitepaper/blob/686973898157ab8af46ce28345d0064ed4ae94c9/paper/sections/14-attested-execution.tex#L1-L60); [docs: platform key](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/step-by-step-guide/platform-key-configuration) |
| Signed kernel | Unified Kernel Image (kernel + initrd + command line, signed) | Halborn exec summary |
| Read-only root | dm-verity root filesystem; SAS watchdog checks the running root hash against a list published by Flux | Halborn; whitepaper ch. 14 L100-L103, L206-L227 |
| Disk encryption | All selected disks form one "secure and encrypted LVM" (LUKS). Key enrolled to the TPM sealed against **PCR 7 only** (Secure Boot state); `systemd-pcrlock` policy over PCR 4/7/11 also ships on capable TPMs. With no TPM (some VPS), it falls back to a software token, "where the guarantee weakens" | [docs: OS installation](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/step-by-step-guide/os-installation); whitepaper ch. 14 L47-L99 |
| Measured boot / remote attestation | TPM PCRs are used for sealing, but **no TPM quote reaches anyone outside the node**. SAS "attestation" signs with keys "derived by a key-derivation function from static values compiled identically into every fluxsas binary", so it "does not demonstrate that a particular machine booted a particular image", and "there is also no tenant-facing verification path today" | [whitepaper ch. 14 L206-L260](https://github.com/RunOnFlux/fluxwhitepaper/blob/686973898157ab8af46ce28345d0064ed4ae94c9/paper/sections/14-attested-execution.tex#L206-L260); [ch. 11 L263-L290](https://github.com/RunOnFlux/fluxwhitepaper/blob/686973898157ab8af46ce28345d0064ed4ae94c9/paper/sections/11-one-platform.tex#L263-L290) |
| SAS | "A proprietary, closed‑source security protocol… file attestation, encryption/decryption based on hardware specs, live activity monitoring, and memory protection. SAS code is obfuscated" | docs |
| Operator accounts | Install creates `console` ("the only console-accessible user", "strict Role-Based Access Control"), which gets a list of permitted commands (`fluxd status`, `syncthing status`, `reconfigure`), "without exposing full root access". Optional SSH as `operator` (ed25519 key, "restricted command capabilities"); since 2026-03 also `fluxtui` with the same key | [docs: OS installation](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/step-by-step-guide/os-installation), [SSH](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/step-by-step-guide/configure-ssh-access), [accessing the system](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/step-by-step-guide/accessing-the-system); release notes |
| Updates | Automatic, signed by Flux's release key, installed between midnight and 06:00 local. The whitepaper: one signing key, "**Revocation** does not exist in any direction" | release notes v1774117921; whitepaper ch. 14 L150-L166 |
| Mandatory? | **No.** Legacy nodes "remain fully functional for earning native block and parallel mining rewards". The ArcaneOS-only revenue share (PNR) is planned, not live (flux.md §3.4) | [docs: legacy FluxNode](https://docs.runonflux.com/fluxnodes/legacy-fluxnode/) |
| Share of nodes | **6,429 of 6,854 stats rows (93.8%)** report `flux.arcaneVersion`, all on build `1775071308` ("jolly wombat", 2026-04-07). 346 report FluxOS without ArcaneOS, and 79 didn't answer. That's 94.9% of nodes reporting a version. By tier, ArcaneOS / legacy: Cumulus 3,063 / 219, Nimbus 1,598 / 59, Stratus 1,768 / 68 | [stats fluxinfo](https://stats.runonflux.io/fluxinfo?projection=tier,flux.arcaneVersion,flux.version), read 2026-10-24 |
| VM or bare metal | Both. **Flux's own step-by-step guide installs ArcaneOS as a Proxmox VM with an emulated TPM** (VirtualBox and VMware 17 also reported working). 3,117 ArcaneOS nodes (48%) sit on IPs flagged as hosting, and 4,775 (74%) share a public IP with another node. That fits several nodes per site, but doesn't show how many are VMs | [docs: create a VM](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/step-by-step-guide/create-a-virtual-machine); stats `geolocation.hosting`, `flux.ip` |
| TEE / confidential computing | **None.** Halborn: "Trusted Execution Environments (TEEs) are not currently used to protect sensitive runtime secrets"; standard Intel/AMD platforms "were unable to protect against physical RAM extraction (cold-boot attacks) or bus-sniffing attacks while the system was running" | [Halborn](https://www.halborn.com/audits/influx-technologies/arcaneos-0478c8) |

---

## 2. Who can see what (the threat model)

Seven parties, from least to most access:

1. **The public.** For a normal (non-private) app, the whole spec is public on every node's API: image, ports, commands, domains and **environment variables**. Live: of 969 non-private registered apps, 789 publish env vars and 48 have variable *names* that look like secrets (PASSWORD, TOKEN, API_KEY…). For a private (enterprise) app the public sees only `name, description, owner, instances, geolocation, expire, nodes, staticip` plus the encrypted blob ([globalappsspecifications](https://api.runonflux.io/apps/globalappsspecifications), read 2026-10-24). Anyone can also see which IPs host any app ([/apps/locations](https://api.runonflux.io/apps/locations)).
2. **Other apps on the same node.** Each app gets its own Docker network, the CPU and memory limits from its spec, and no `--privileged` ([dockerService.js L1191-L1222](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/dockerService.js#L1191-L1222), [L1060-L1080](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/dockerService.js#L1060-L1080)). Since FluxOS 8.21.0 (2026-10-14) the firewall drops traffic into any app network except on its own network or via a published port, and drops containers' traffic to private ranges ([PR #1834](https://github.com/RunOnFlux/flux/pull/1834)). No user-namespace remapping, so this is standard Docker isolation.
3. **A network observer between Flux's load balancer and the node.** By default sees plaintext HTTP (§6).
4. **An ArcaneOS operator using what the node offers.** Locked out of the app (§3).
5. **An ArcaneOS operator willing to attack their own machine.** Hypervisor memory dumps, emulated-TPM state, physical RAM attacks: not defended (§3, rows "memory", "offline disk").
6. **A legacy-node operator.** Root. Sees everything for the apps placed there, which can only be public apps (§7).
7. **InFlux Technologies (Flux).** The trusted party (§8). It runs the load balancers that end TLS and decrypt every private spec. Its five team and support IDs can open a shell, read logs and env vars, and download files of any app on any node through the FluxOS API. It signs every ArcaneOS update and runs the attestation root.

---

## 3. "Can a node operator…?" (ArcaneOS vs legacy)

Verdict = can the operator do it? **yes** means the app is exposed. Mirrored in `src/data/flux.ts` as `operatorAccess`.

| Can the operator… | Legacy node | ArcaneOS node | What decides it | Sources |
|---|---|---|---|---|
| Get a root shell on the machine | **yes** ("complete administrative access") | **no**: a `console` user with a fixed command list and an optional restricted `operator` SSH user. FluxOS's own PR: "on ArcaneOS the operator has no shell at all" | no root account | docs legacy, docs OS install / access; [PR #1791](https://github.com/RunOnFlux/flux/pull/1791) |
| Open a shell inside your container | **yes** (`docker exec` as root) | **no**: the node's container terminal answers to "the app owner or Flux team" only, and there's no Docker access without root | FluxOS API gate + no root | [dockerTerminalHandler.js L137-L151](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/lib/socketIoHandlers/dockerTerminalHandler.js#L137-L151) |
| Read your env vars and secrets | **yes** (`docker inspect`), but private apps never run here, and a public app's env is public anyway | **no** through anything the node offers: `appInspect` (which returns "Config.Env and all") refuses the operator, and spec decryption is owner-only | API gate + no root | [appInspector.js L34-L46](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appManagement/appInspector.js#L34-L46), [registryManager.js L1287-L1310](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appDatabase/registryManager.js#L1287-L1310) |
| Browse or copy files in your volumes | **yes** (volumes are plain ext4 image files) | **no**: file browser, downloads and backups are owner-or-Flux-team, and the volumes live inside the encrypted LVM | API gate + encrypted disk | [commit 8b9d5c0](https://github.com/RunOnFlux/flux/commit/8b9d5c000b5ec22940ee6ead6485982910c385c0) |
| Read your logs | **yes** | **no** (owner or Flux team only) | API gate | [commit 8b9d5c0](https://github.com/RunOnFlux/flux/commit/8b9d5c000b5ec22940ee6ead6485982910c385c0) |
| Use their own dashboard login to inspect your app | **partial**: refused since 8.18.0, but root can patch FluxOS | **no since 2026-09-08**. Before FluxOS 8.18.0 the operator's login *could* read env vars ("a customer's API keys and database passwords"), the process list, logs and volume files, and pull the full private spec re-encrypted to a key the caller chose | API gate | [commit 8b9d5c0](https://github.com/RunOnFlux/flux/commit/8b9d5c000b5ec22940ee6ead6485982910c385c0), [v8.18.0](https://github.com/RunOnFlux/flux/releases/tag/v8.18.0) |
| Stop or restart just your app | **yes** | **no**: start/stop/restart/remove are owner-or-Flux-team. They can still power off the whole node, which forfeits their rewards, and your other copies keep serving | API gate | [commit c9d1821](https://github.com/RunOnFlux/flux/commit/c9d1821423f70f4638fce561d888b33c6de68ca9) |
| Swap your image or tamper with the node software | **yes** (FluxOS only flags crude interference: vanished containers, pruned networks) | **no**: Flux-key Secure Boot, signed UKI, dm-verity root, SAS file attestation | boot chain + dm-verity | Halborn; whitepaper ch. 14; [appTamperingDetectionService.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appTamperingDetectionService.js#L36-L80) |
| Read your private (enterprise) spec | **no**: private apps are refused on non-ArcaneOS nodes and can't be decrypted there | **no**: decrypted inside FluxOS and SAS; the decrypt API is owner-only | SAS | [appSpawner.js L546-L551](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appLifecycle/appSpawner.js#L546-L551), [enterpriseHelper.js L7-L23](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/utils/enterpriseHelper.js#L7-L23) |
| Pull the disk and read it offline | **yes** | **partial**: LUKS-encrypted. On bare metal the key is sealed in the hardware TPM. On a VM, the operator's host also stores the emulated TPM's state, and Proxmox says an emulated TPM gives "no real security benefits… it can potentially be edited by anyone with access to it" | LUKS + TPM | docs OS install; whitepaper ch. 14 L47-L99; [Proxmox qm docs](https://pve.proxmox.com/pve-docs/chapter-qm.html) |
| Read your app's memory while it runs | **yes** | **partial**: not from inside the OS (no root; SAS memory protection). But there's **no TEE**: a hypervisor owner can dump a VM's RAM (QEMU `dump-guest-memory`), and Halborn says cold-boot and bus-sniffing attacks aren't mitigated. Halborn also rated SAS's anti-debugging "not a valid security boundary" (risk accepted) | no TEE | Halborn HAL-14 + recommendations; [QEMU QMP reference](https://www.qemu.org/docs/master/interop/qemu-qmp-ref.html); docs VM guide |
| Read your web traffic (default Flux domain) | **yes** | **yes**: FDM ends HTTPS at Flux's load balancer and forwards plain HTTP to the node's public IP, across the operator's own router or hypervisor bridge, outside ArcaneOS. Your app's own TLS closes this | plain HTTP from the edge | [haproxyTemplate.js L274-L287](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/haproxyTemplate.js#L274-L287), [custom.js L1-L13](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/application/custom.js#L1-L13) |
| See which apps run on their node and what they use | **yes** | **yes**: container names, state and status, aggregate CPU/RAM/disk, and the public location list | by design | [PR #1791](https://github.com/RunOnFlux/flux/pull/1791) (listings reduced to `Names`, `State`, `Status`); [/apps/locations](https://api.runonflux.io/apps/locations) |

The FluxOS source states the design rule in so many words ([verificationHelperUtils.js L255-L297](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/verificationHelperUtils.js#L255-L297)): "the app's owner and the flux team, but NOT the node operator… hosting is a reason to know what an app COSTS you… It is not a reason to read the customer's environment variables, files or logs." Its privilege enum ([privileges.js L16-L28](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/utils/privileges.js#L16-L28)) adds: "The operator of THIS node… They administer hardware; nothing about a customer's application follows from that."

---

## 4. Private (enterprise) apps and encrypted specs

**Mechanism** ([v6.1.0 release notes](https://github.com/RunOnFlux/flux/releases/tag/v6.1.0), 2025-06-18; [enterpriseHelper.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/utils/enterpriseHelper.js#L7-L141)):
- The browser asks a node for an **RSA-2048 public key** for `(original owner, app name)` via `POST /apps/getpublickey`. FluxOS hands that to the closed-source benchmark daemon / SAS (`getpublickey`), and non-ArcaneOS nodes throw ([cryptographicKeys.js L13-L43](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appMessaging/cryptographicKeys.js#L13-L43)). v6.0.0: "the owner plus the app name should be used again to get the public key to encrypt the content again" ([v6.0.0](https://github.com/RunOnFlux/flux/releases/tag/v6.0.0)).
- The browser encrypts `{compose, contacts}` (images, ports, env vars, commands, domains, private-registry credentials, contacts) with a **one-time AES-256-GCM key**, wraps that key with RSA, and stores `base64(256-byte RSA blob + 12-byte nonce + ciphertext + 16-byte tag)` as the spec's `enterprise` field. `compose` and `contacts` are published empty.
- A node that installs the app sends the wrapped key to SAS (`decryptrsamessage` with owner, app name, height) and decrypts locally. FluxOS refuses on non-ArcaneOS nodes ("Application Specifications can only be validated on a node running Arcane OS"), and the spawner skips private apps there ([appSpawner.js L546-L551](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appLifecycle/appSpawner.js#L546-L551)).

**Who can decrypt.** It is not end-to-end to the developer:
- **Any ArcaneOS node.** The key is a function of owner and app name, not of a chosen machine, so any of the ~6,400 ArcaneOS nodes can run (and therefore decrypt) any private app. Pinning to named nodes (`nodes[]`) is only for owners on Flux's enterprise allowlist.
- **Flux's load balancers (FDM).** FDM decrypts **every** private spec in full (compose and contacts), so it can learn domains and ports. It calls an InFlux-run SAS key service at a private address (`https://10.100.0.170/api/`, mTLS) with `decryptMessageRSA`, then AES-decrypts and caches the plaintext spec for 24–48 h ([dataFetcher.js L352-L456](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/flux/dataFetcher.js#L352-L456), [domainService.js L1909-L1913](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/domainService.js#L1909-L1913)). FluxOS's own comment: "The flux team decrypts out of band instead" ([registryManager.js L1292-L1299](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appDatabase/registryManager.js#L1287-L1310)). A consequence: a third-party FDM ("anyone can stand up its own FDM") can't route private apps without that key service.
- **The owner**, via the owner-only decrypt endpoint (the spec comes back re-encrypted to the owner's session key).
- **Inference, not verified (SAS is closed):** the whitepaper says SAS's attestation keys are derived from values "compiled identically into every fluxsas binary". If the per-app RSA keys are derived the same way, extracting that secret from any one ArcaneOS node would decrypt every private spec ever published, since the ciphertexts are public and permanent. Halborn's HAL-03 ("Local users were able to retrieve the SAS key (and, consequently, the LUKS encryption key) during the first boot sequence", risk accepted; Flux called the component "a decoy service") shows key handling is an active area.

**Key-fetch authenticity (observation).** FluxCloud fetches the public key through the `api.runonflux.io` balancer, which forwards to community nodes ([ApiClient.js](https://github.com/RunOnFlux/fluxos-frontend/blob/d7fa0de808d7c6d60fb8dcab864e7fbf1b007aad/src/services/ApiClient.js#L52-L62)). The key isn't signed or attested to the browser. A substituted key would make the deploy fail rather than leak quietly, but it could expose the spec to whoever substituted it. Not tested; treat as an open question.

**What else comes with private mode.** Private registries (`repoauth`) are only allowed in private specs ([appValidator.js L792-L799](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appRequirements/appValidator.js#L792-L799)). Every component must ship amd64 ("Arcane nodes are amd64-only", [L1454-L1465](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appRequirements/appValidator.js#L1454-L1465)). Price adds the fixed `scope` item, USD 4 in the price table ([appUtilities.js L113-L116](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/utils/appUtilities.js#L113-L116), [getappspecsusdprice](https://api.runonflux.io/apps/getappspecsusdprice)). Orbit: "Private repositories, database add-ons and secret variables are deployed encrypted, running only on ArcaneOS nodes" ([Orbit](https://runonflux.com/apps/orbit)).

**Adoption (live 2026-10-24):** 1,234 of 2,203 registered apps (56.0%) are private v8 specs.

**What v9 does to this:** the draft v9 spec removes `enterprise` and names an encryption envelope "without specifying it" (whitepaper ch. 10 §"The encryption-envelope regression"). PR #1791 says v9 "seals the component list and publishes only a count" and binds resource totals into the AAD. Not shipped; v9 is on the Q4 2026 roadmap.

---

## 5. Data at rest

- **ArcaneOS:** app volumes are `fallocate`d ext4 image files ([advancedWorkflows.js L669](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appLifecycle/advancedWorkflows.js#L669)) on Docker's data root at `/dat/var/lib/docker`, inside the node's LUKS-encrypted LVM. **FluxOS adds no per-app encryption** (no cryptsetup, fscrypt or similar anywhere in `ZelBack/src`). So the data is encrypted against a stolen or decommissioned disk. While the node runs it is plaintext to the OS, and protection from the operator comes from the lockout in §3.
- Docker stores each container's `Env` in its on-disk config, so on ArcaneOS secrets are encrypted at rest with the disk; on legacy nodes they're readable by root.
- Since 8.18.0, the local database keeps a private app's components emptied ("they are the customer's decrypted configuration") and decrypts on demand ([PR #1791](https://github.com/RunOnFlux/flux/pull/1791)).
- **Legacy:** plain files on whatever disk the operator set up.
- Backups made in FluxCloud live on the node (flux.md §5.5), so they inherit the node's protection.
- Orbit's FAQ says "Enterprise apps run inside ArcaneOS… where all data is encrypted at rest." True of the disk; don't extend it to "encrypted from the host".

---

## 6. Data in transit

| Hop | Encrypted? | Source |
|---|---|---|
| Browser → `<app>.app.runonflux.io` or a custom domain | **Yes**, TLS 1.2+ at Flux's FDM (HAProxy), automatic Let's Encrypt | [FDM README](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/README.md); haproxyTemplate.js L30-L45 |
| FDM → the node running your app | **No, by default.** `ssl: false, mode: 'http'`, so HAProxy forwards plain HTTP to `nodeIP:port` over the internet. A few hard-coded app names get `ssl verify none`, which encrypts without authenticating the node. TCP passthrough only for a hard-coded list (Minecraft, Kaspa, Bittensor…) | [custom.js L1-L13](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/application/custom.js#L1-L13), [haproxyTemplate.js L274-L287](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/src/services/haproxyTemplate.js#L274-L287) |
| Whole reachability path | Whitepaper: "today's reachability path is Foundation-legible end to end"; private overlay networks (VPONs) are planned with no implementation found | [whitepaper ch. 12 L440-L466](https://github.com/RunOnFlux/fluxwhitepaper/blob/686973898157ab8af46ce28345d0064ed4ae94c9/paper/sections/12-networking.tex#L440-L466) |
| Node ↔ node volume sync (`r:`/`g:`/`s:`) | **Yes.** Syncthing: "All device to device traffic is protected by TLS" (1.2/1.3, device certificates pinned). FluxOS runs it TCP-only with global and local discovery off, peers = the app's own nodes | [Syncthing security](https://docs.syncthing.net/users/security.html); [syncthingService.js L1363-L1371](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/syncthingService.js#L1363-L1371) |
| FluxOS gossip between nodes | Plain `ws://`, but messages are signed and carry only public data (private specs travel encrypted) | fluxCommunication.js L1465 |
| `g:` game servers | DNS points straight at the elected node; traffic never passes FDM (only as encrypted as the game protocol) | whitepaper ch. 12 L60-L67 |

**Developer advice the copy can give:** for end-to-end encryption, terminate TLS inside the app on a port clients reach directly, or run your own FDM or proxy.

---

## 7. Legacy nodes, and keeping off them

- A legacy node is "any FluxNode deployed on a supported Linux OS using the traditional FluxOS installation process", with "**Full Control** – Operators have complete administrative access" ([docs](https://docs.runonflux.com/fluxnodes/legacy-fluxnode/)). For any app placed there, the operator can read files, env vars, logs and memory, exec into containers, and sniff or alter traffic. The FluxOS API lockout applies, but root can patch FluxOS.
- Since 8.21.0, legacy nodes also carry a **Flux maintenance SSH account (`fluxadm`, passwordless sudo)** on `apiport − 5`, enabled by default with one Flux-held key ([PR #1831](https://github.com/RunOnFlux/flux/pull/1831), [config L33-L42](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L33-L42)). It's skipped on ArcaneOS.
- **Only public apps can land on legacy nodes.** About 6% of nodes are legacy, so a public app with N copies has some chance of a copy there.
- **Restricting an app to hardened nodes = making it private (enterprise).** There's no separate "ArcaneOS only" flag for public apps. The non-enterprise spawn delay on ArcaneOS nodes was removed in 8.21.0 (#1845).
- FluxOS's tamper detection on legacy nodes catches availability interference (containers vanishing, networks pruned), not reads ([appTamperingDetectionService.js L36-L80](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appTamperingDetectionService.js#L36-L80)).

---

## 8. The party you do trust: InFlux (Flux)

The copy must not imply "trustless". Today:
- **Decrypts private specs**: FDM, routinely, for routing (§4).
- **Can reach inside apps**: five IDs (`fluxTeamFluxID` plus four `fluxSupportTeamFluxID`, [config L139-L148](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/config/default.js#L139-L148)) pass `APP_OWNER_OR_FLUX_TEAM` on every node. That covers the interactive container terminal, `appExec`, inspect (env vars), logs, process list, file listing and downloads, backups and restore. PR #1791: "This changes how a specification is read. It is not a claim about everything a flux team caller can reach on a node they support."
- **Terminates TLS** for every app behind `*.app.runonflux.io` and CNAMEd custom domains.
- **Controls the code**: signs ArcaneOS images (single key, no revocation), picks the FluxOS branch every node runs ("Which code a node runs is the flux team's to choose", PR #1791), and runs the dm-verity known-good hash list, which **fails open** if unreachable (whitepaper ch. 14 L215-L222).
- **Custody**: the whitepaper says these key sets are held personally by four named people (ch. 2 L90-L125).

Fair comparison: this is the same shape of trust as a single cloud provider (you trust Amazon), not the "no one can see" shape of a TEE platform. The difference from a typical DePIN marketplace is that the *machine's owner* is not in that trusted set on ArcaneOS.

---

## 9. Timeline

| Date | Event | Source |
|---|---|---|
| 2025-03-31 | ArcaneOS launched | docs |
| 2025-06-05 | FluxOS 6.0.0: v8 private specs, ArcaneOS-only | [v6.0.0](https://github.com/RunOnFlux/flux/releases/tag/v6.0.0) |
| 2025-06-18 | FluxOS 6.1.0: AES-256-GCM + RSA-2048 envelope; v8 at block 1,932,380 (2025-06-24) | [v6.1.0](https://github.com/RunOnFlux/flux/releases/tag/v6.1.0) |
| 2025-10-08 → 11-18 | Halborn ArcaneOS assessment; fixes through 2026-01-12 | [Halborn](https://www.halborn.com/audits/influx-technologies/arcaneos-0478c8) |
| 2026-03-24 | ArcaneOS "steel raven": TPM sealing over "additional platform measurements", config service split with privileges dropped (D-Bus), AppArmor, an intrusion detection system | [v1774117921](https://github.com/RunOnFlux/arcaneos-releases/releases/tag/v1774117921) |
| 2026-04-07 | ArcaneOS "jolly wombat" (every ArcaneOS node runs it today) | [releases](https://github.com/RunOnFlux/arcaneos-releases/releases) |
| 2026-04-24 | Flux publishes the audit summary | [Flux blog](https://runonflux.com/arcaneos-security-audit/) |
| 2026-09-08 | **FluxOS 8.18.0: "Hosting an app is not owning it"**: the node operator loses every app-scoped verb; spec decryption becomes owner-only | [v8.18.0](https://github.com/RunOnFlux/flux/releases/tag/v8.18.0), [PR #1791](https://github.com/RunOnFlux/flux/pull/1791) |
| 2026-10-14 | FluxOS 8.21.0: FluxOS-owned firewall isolates app networks and keeps containers off the LAN; Syncthing's write API no longer proxied over HTTP; `fluxadm` maintenance SSH on legacy nodes | [v8.21.0](https://github.com/RunOnFlux/flux/releases/tag/v8.21.0) |
| Roadmap | "Privacy groundwork: plan published" and "Private overlay networks" (Q4 2026); "Attestation network: bonded nodes vouch for data" (H1 2027); "New benchmark tool: signed node attestation" (H2 2027) | [timeline](https://runonflux.com/timeline/) |

---

## 10. The Halborn audit

[Report](https://www.halborn.com/audits/influx-technologies/arcaneos-0478c8). 14 findings: **0 critical, 2 high, 3 medium, 9 low; 9 solved, 5 risk accepted.** The flux.ts copy can say "no critical findings". It must not say "all fixed": Flux's own post says "all of which have been addressed and patched", but five are risk accepted.

| ID | Finding | Severity | Status |
|---|---|---|---|
| HAL-01 | Linux kernel module use-after-free | High | Solved |
| HAL-02 | Data race involving memory corruption | High | Risk accepted |
| HAL-03 | Key extraction on first boot (SAS key → LUKS key readable from a process command line) | Medium | Risk accepted ("decoy service") |
| HAL-04 | File corruption from race condition | Medium | Solved |
| HAL-05 | Hard-coded credentials and tokens (XOR-obfuscated, kernel ↔ SAS) | Medium | Risk accepted |
| HAL-06…13 | Weak API/CORS config, cleartext metadata (ip-api over HTTP), weak cookie flags, BSON DoS, exception info leak, web server ran as root, weak token generation (accepted), Zip Slip | Low | 7 solved, HAL-12 accepted |
| HAL-14 | Anti-debug bypass ("did not constitute a valid security boundary") | Low | Risk accepted |

Recommendations: extend TPM sealing beyond PCR 7 (to 9 and 11), pre-calculate seals for updates, run components unprivileged, and "if resistance to sophisticated physical attacks during runtime was required… Trusted Execution Environments (TEEs), such as AWS Nitro Enclaves or Intel SGX/TDX". Follow-up assessment "within six months or after material changes". None published as of 2026-10-24 (not exhaustively searched). The March 2026 ArcaneOS release reads as a response to the PCR and least-privilege items. The whitepaper (Sept 2026) still describes the LUKS seal as PCR 7, with pcrlock 4/7/11 alongside.

---

## 11. How this compares (short and fair)

| | Can the machine's operator see inside by default? | Hardware-enclave option | Note |
|---|---|---|---|
| **Flux** | ArcaneOS (94%): no normal access path (no root, API-gated). Legacy: yes | **No** | InFlux can decrypt private specs and reach inside apps |
| **Akash** | Yes. Before TEEs, protection relied on "the assumption that operators would not inspect containers" | **Yes, opt-in since 2026-07-28** (Intel TDX / AMD SEV-SNP, NVIDIA CC); attestation tooling "currently developing" | [Akash blog](https://akash.network/blog/confidential-compute-comes-to-akash) |
| **Phala Cloud** | No: apps run in Intel TDX confidential VMs; "Anyone can independently verify" the attestation quote | **TEE-native** | Operators are team-verified; strongest of the set against a hostile host ([attestation docs](https://docs.phala.com/phala-cloud/attestation/overview)) |
| **ICP** | Node providers are vetted legal entities and "do not have permission" to read canisters, but "The Internet Computer does not, in itself, make data-privacy guarantees". SEV-SNP "expected to address this" | One SEV "confidential" subnet (competitors.md) | [node-provider FAQ](https://internetcomputer.org/wiki/node-provider-faq), 2026-05-04 |
| **AWS** | "no mechanism for any system or person to log in to EC2 Nitro hosts, access the memory of EC2 instances, or access any customer data", NCC Group-reviewed and in AWS Service Terms | Nitro Enclaves, SEV-SNP instances | You trust Amazon ([Nitro whitepaper](https://docs.aws.amazon.com/whitepapers/latest/security-design-of-aws-nitro-system/no-aws-operator-access.html)) |

Where Flux genuinely wins: against a **default Akash lease, a plain VPS or most DePIN marketplaces**, the person whose machine runs your app has no root and no API path into it, and that's the default on 94% of nodes, not an opt-in SKU. Where it loses: against **Phala, Akash TEE, AWS Nitro or ICP's SEV subnet**, which defend against a hostile host with hardware memory encryption, which ArcaneOS does not have.

---

## 12. Claims ledger (strongest true claims)

1. **"94% of Flux nodes run ArcaneOS, a locked-down OS where the machine's owner has no root."** 6,429 of 6,854 stats rows; `console` / `operator` restricted accounts. [stats](https://stats.runonflux.io/fluxinfo?projection=tier,flux.arcaneVersion,flux.version), [docs](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/step-by-step-guide/accessing-the-system).
2. **"Hosting is not owning: the operator can't open a shell in your app, read its logs, files or environment variables, or stop it."** FluxOS 8.18.0. [PR #1791](https://github.com/RunOnFlux/flux/pull/1791), [verificationHelperUtils.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/verificationHelperUtils.js#L255-L297). Scope to ArcaneOS.
3. **"Private apps keep their secrets, images and settings off the public record."** AES-256-GCM + RSA-2048; only name, owner, instances and placement are public; 56% of apps. [v6.1.0](https://github.com/RunOnFlux/flux/releases/tag/v6.1.0), [specs](https://api.runonflux.io/apps/globalappsspecifications).
4. **"Make an app private and it only ever runs on hardened nodes."** [appSpawner.js L546-L551](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/appLifecycle/appSpawner.js#L546-L551).
5. **"Hardened nodes boot only Flux-signed software onto a read-only, integrity-checked system, with every disk encrypted."** Secure Boot (Flux PK), signed UKI, dm-verity, LUKS LVM. [Halborn](https://www.halborn.com/audits/influx-technologies/arcaneos-0478c8), [docs](https://docs.runonflux.com/fluxnodes/arcaneos-fluxnode/step-by-step-guide/os-installation).
6. **"Independently audited: Halborn found no critical issues in ArcaneOS."** 0 critical, 2 high. [Halborn](https://www.halborn.com/audits/influx-technologies/arcaneos-0478c8).
7. **"HTTPS for every app and encrypted sync between its copies."** FDM + Let's Encrypt; Syncthing TLS. [FDM README](https://github.com/RunOnFlux/flux-domain-manager/blob/a30f379b0724bfa633698104962e8abf6292506b/README.md), [Syncthing](https://docs.syncthing.net/users/security.html).
8. **"Apps sharing a node are walled off from each other."** Per-app network, limits, no privileged mode, firewall since 8.21.0. [PR #1834](https://github.com/RunOnFlux/flux/pull/1834).
9. **"The rules are open source: read exactly who can touch your app."** The privilege checks and encryption code are in public FluxOS (SAS itself is closed). [privileges.js](https://github.com/RunOnFlux/flux/blob/9bb1419690914b1fe98209b56a6c3638b7d11c5c/ZelBack/src/services/utils/privileges.js#L16-L28).

---

## 13. Claims to avoid

| Claim | Why | Say instead |
|---|---|---|
| "Node operators can't spy on your app" / "can't see inside" (absolute) | No TEE; hypervisor and physical memory access not defended; default traffic is plain HTTP on their network; legacy operators are root | "On ArcaneOS nodes the operator is locked out: no root, no shell, no way into your files, logs or secrets" |
| "ArcaneOS encrypts your app" / "apps are encrypted" | Only private specs are encrypted; app data is encrypted by the disk, readable to the running system; container images come from your registry | "Private app specs are encrypted, and app data sits on encrypted disks" |
| "Confidential computing", "enclave", "TEE", "zero-access hosting" | Halborn: "TEEs are not currently used"; analogy in flux.ts used to say "confidential computing" (fixed) | "A hardened OS, not a hardware enclave" |
| "Even Flux can't see it" / "only you hold the keys" / Flux's audit post (2026-04-24): "ensuring that only developers have access to their deployment data" | FDM decrypts every private spec; five Flux team/support IDs can open a shell and read env vars on any node | "Sealed from the public and from node operators. Flux's own infrastructure and support can still access it" |
| "Remote attestation" / "hardware-attested" / "cryptographically proven integrity" | Attestation keys aren't machine-bound and can't be verified by tenants (whitepaper ch. 14) | "Integrity checked by Flux's attestation service" |
| "End-to-end encrypted" | TLS ends at Flux's balancer; the hop to the node is plain HTTP by default | "HTTPS to Flux's edge; terminate TLS in your app for end-to-end" |
| "Every node is hardened" / "every app runs on ArcaneOS" | 346 legacy nodes; public apps can land there | "94% of nodes; make your app private to stay on them" |
| "Encrypted at rest" with no qualifier (Orbit FAQ: "all data is encrypted at rest") | True of the ArcaneOS disk; there's no per-app encryption; the VM case weakens the TPM seal | "On hardened nodes every disk is encrypted" |
| "Operators have never been able to look inside" / "since 2025" | Until FluxOS 8.18.0 (2026-09-08) the operator's login could read env vars, logs and files and pull the private spec | "Since September 2026, hosting a node gives no access to the apps on it" |
| "Secrets are encrypted to the nodes running your app" | Any ArcaneOS node and Flux's key service can derive the key | "Encrypted so that only hardened nodes, and Flux's routing layer, can read it" |
| "Your environment variables are private" (for normal apps) | Public on every node's API unless the app is private | "Put secrets in a private app" |
| "Proof against physical attacks / cold boot" | Halborn: not mitigated | omit |
| "Unhackable", "military-grade", "bank-grade" | Unfalsifiable; 5 risk-accepted audit findings | "Audited by Halborn, no critical findings" |
| "GDPR / HIPAA / SOC 2 compliant" | No certification found (Academy FS-27 found the same) | omit |
| "Attestation network", "bonded attestation", "private overlay networks" as live | Roadmap Q4 2026 to H2 2027, no code | "planned" |
| "Anyone can run their own FDM" (for private apps) | FDM needs InFlux's SAS key service to route private apps | "Anyone can run their own FDM for public apps" |

---

## 14. Threat-model caveats the copy must respect

1. **Scope:** every lockout claim is about ArcaneOS nodes (94%), and about private apps if you want a guarantee that no copy lands on a legacy node.
2. **Not a TEE:** the defence is "no account and no API", not "the hardware hides memory". A node operator who controls the hypervisor (Flux's own guide uses Proxmox) or the physical box could in principle read memory and, on a VM, the emulated TPM state.
3. **Flux is trusted:** InFlux decrypts private specs at its load balancers, its support IDs can reach inside apps, it signs all updates, and it runs the attestation root. Don't write "trustless" or "nobody".
4. **Traffic:** the default route decrypts at Flux's edge and travels to the node unencrypted.
5. **Recency:** the operator API lockout is from 2026-09-08. Write "now" or "since September 2026", not "always".
6. **Closed source:** SAS is closed and obfuscated. Its claims rest on Flux's word, one Halborn audit and Flux's own unusually candid whitepaper.
7. **Metadata is public:** app name, owner address, instance count, placement rules and the IPs hosting each app.
8. **The UI's "operator's view" sim** ("try to get in, get denied at each layer, then the same attempt on an unhardened host") should end on the honest layers too: the traffic row and the memory row are where ArcaneOS doesn't say no.

---

## 15. Open questions

- How the per-app RSA key is derived inside SAS (machine-independent by necessity; whether from static constants like the attestation keys is unverified).
- Whether the public-key fetch can be substituted in transit (the hop from FDM to the backend node is plain HTTP).
- Share of ArcaneOS nodes that are VMs on operator-controlled hypervisors (only indirect evidence: 74% share an IP, and 48% are on hosting-flagged IPs).
- Whether Halborn's PCR recommendation is fully closed (release notes say sealing improved; the whitepaper still describes the LUKS slot as PCR 7).
- Whether a follow-up audit has happened since the six-month window.

---

## 16. What changed in `src/data`

- `src/data/types.ts`: new `OperatorAccessRow`.
- `src/data/flux.ts`: new `privacy: Feature[]` (9 items) and `operatorAccess: OperatorAccessRow[]` (13 rows); new stats `arcane` (94%) and `privateApps` (56%); new milestones 2025-11-18 (Halborn) and 2026-09-08 (FluxOS 8.18.0). Corrected wording in feature `arcane-enterprise` (dropped "confidential computing" and "sealed even from the operator"), the Secrets row of `kubernetesMap`, ecosystem `arcaneos`, and the two ArcaneOS milestones. All ids unchanged.
