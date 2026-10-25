/**
 * Flux vs other DePIN networks vs web2 clouds. Owned by the comparison research
 * pass; see research/competitors.md for the long-form notes, scoring rubric and
 * every source. All facts checked on 2026-10-24.
 *
 * Score rubric (0-5), used for every cell:
 *   5  yes, by default, no assembly required
 *   4  yes, with a real caveat
 *   3  partial: exists but opt-in, limited or DIY
 *   2  weak: possible only with significant work, or only for a narrow workload
 *   1  essentially no (a token capability at most)
 *   0  no / not offered
 * Verdicts follow the score: yes >= 4, partial 2-3, no <= 1, na when the
 * question does not apply (scored 0).
 *
 * Colors: validated with the dataviz palette checker against #080a0f, in
 * array order within each kind (Flux first), and every color against both
 * Flux blues (#2B61D1, #4F7AD4). Colors are unique within a kind; a few hue
 * families repeat across kinds (Akash/Hetzner red, Render/AWS orange,
 * Theta/Azure teal), so mixed-kind charts should label series directly.
 */
import type {
  Cell,
  Dimension,
  Incident,
  MarketShare,
  Platform,
  PricePoint,
  Source,
  Verdict,
} from './types.ts';

const ACCESSED = '2026-10-24';
const src = (label: string, url: string): Source => ({ label, url, accessed: ACCESSED });

/* --------------------------------------------------------------------------
   Sources
   -------------------------------------------------------------------------- */

const S = {
  // Flux
  fluxNodesDoc: src('Flux docs: What are FluxNodes', 'https://docs.runonflux.com/fluxnodes/what-are-fluxnodes'),
  fluxNodeCount: src('Flux API: node count (live)', 'https://api.runonflux.io/daemon/getfluxnodecount'),
  fluxGeo: src('Flux stats: node geolocation (live)', 'https://stats.runonflux.io/fluxinfo?projection=geolocation'),
  fluxOperators: src('Flux stats: operator identities (live)', 'https://stats.runonflux.io/fluxinfo?projection=flux.zelid'),
  fluxBench: src(
    'Flux stats: benchmarked cores, RAM, SSD (live)',
    'https://stats.runonflux.io/fluxinfo?projection=tier,benchmark.bench.cores,benchmark.bench.ram,benchmark.bench.ssd',
  ),
  fluxAppsLocations: src('Flux API: running app locations (live)', 'https://api.runonflux.io/apps/locations'),
  fluxDeploymentInfo: src('Flux API: deployment rules (live)', 'https://api.runonflux.io/apps/deploymentinformation'),
  fluxConfig: src(
    'FluxOS config: instance limits and timers',
    'https://github.com/RunOnFlux/flux/blob/master/ZelBack/config/default.js',
  ),
  fluxSpawner: src(
    'FluxOS source: app spawner',
    'https://github.com/RunOnFlux/flux/blob/master/ZelBack/src/services/appLifecycle/appSpawner.js',
  ),
  fluxPlacement: src(
    'FluxOS source: fault-domain placement',
    'https://github.com/RunOnFlux/flux/blob/master/ZelBack/src/services/appPlacement/placementFeasibility.js',
  ),
  fluxFrontendInstall: src(
    'FluxCloud UI source: marketplace install defaults',
    'https://github.com/RunOnFlux/fluxos-frontend/blob/master/src/components/Marketplace/InstallDialog.vue',
  ),
  fluxFrontendRegister: src(
    'FluxCloud UI source: custom deploy defaults',
    'https://github.com/RunOnFlux/fluxos-frontend/blob/master/src/pages/apps/register/configure.vue',
  ),
  fluxIntro: src('Flux docs: FluxCloud introduction', 'https://docs.runonflux.com/fluxcloud/introduction'),
  fluxGeneral: src(
    'Flux docs: deploy with Docker, general settings',
    'https://docs.runonflux.com/fluxcloud/register-new-app/deploy-with-docker/general',
  ),
  fluxComponents: src(
    'Flux docs: components and volume prefixes',
    'https://docs.runonflux.com/fluxcloud/register-new-app/deploy-with-docker/components',
  ),
  fluxDomain: src(
    'Flux docs: custom domain setup',
    'https://docs.runonflux.com/fluxcloud/register-new-app/custom-domain-setup',
  ),
  fdmRepo: src('Flux Domain Manager (HAProxy load balancer) README', 'https://github.com/RunOnFlux/flux-domain-manager'),
  fluxCost: src('Flux docs: cost calculator and rate card', 'https://docs.runonflux.com/fluxcloud/cost-calculator'),
  fluxPriceApi: src('Flux stats: USD price spec (live)', 'https://stats.runonflux.io/apps/getappspecsusdprice'),
  fluxPriceQuote: src(
    'Flux API: calculatefiatandfluxprice (POST, live quote)',
    'https://api.runonflux.io/apps/calculatefiatandfluxprice',
  ),
  fluxRepo: src('RunOnFlux/flux on GitHub (AGPL-3.0)', 'https://github.com/RunOnFlux/flux'),
  fluxOrg: src('RunOnFlux GitHub organization', 'https://github.com/RunOnFlux'),
  fluxPolicy: src('RunOnFlux/fluxos-network-policy (signed blocklist)', 'https://github.com/RunOnFlux/fluxos-network-policy'),
  fluxMarketplace: src('Flux stats: marketplace templates (live)', 'https://stats.runonflux.io/marketplace/listapps'),
  fluxSharedDb: src('Flux docs: shared database', 'https://docs.runonflux.com/fluxcloud/shared-database/component'),
  fluxEdgeRent: src('Flux docs: FluxEdge, rent a machine', 'https://docs.runonflux.com/fluxedge/projects/rent-machine'),
  coingecko: src(
    'CoinGecko API: token prices and market caps',
    'https://api.coingecko.com/api/v3/simple/price?ids=zelcash,akash-network,internet-computer,render-token&vs_currencies=usd&include_market_cap=true',
  ),

  // Akash
  akashProviders: src(
    'Akash docs: should I run a provider?',
    'https://akash.network/docs/providers/getting-started/should-i-run-a-provider/',
  ),
  akashLeases: src('Akash docs: providers and leases', 'https://akash.network/docs/learn/core-concepts/providers-leases/'),
  akashDeployments: src('Akash docs: deployments', 'https://akash.network/docs/learn/core-concepts/deployments'),
  akashStorage: src('Akash docs: persistent storage', 'https://akash.network/docs/learn/core-concepts/persistent-storage'),
  akashIpLeases: src('Akash docs: IP leases', 'https://akash.network/docs/learn/core-concepts/ip-leases'),
  akashCustomDomain: src(
    'Akash docs: SDL syntax reference (accepted hostnames)',
    'https://akash.network/docs/developers/deployment/akash-sdl/syntax-reference/',
  ),
  akashAep66: src('Akash AEP-66 (automatic certificates, draft)', 'https://akash.network/roadmap/aep-66/'),
  akashStats: src('Akash Console API: dashboard data (live)', 'https://console-api.akash.network/v1/dashboard-data'),
  akashCapacity: src('Akash Console API: network capacity (live)', 'https://console-api.akash.network/v1/network-capacity'),
  akashGpu: src('Akash Console API: GPU inventory (live)', 'https://console-api.akash.network/v1/gpu'),
  akashGithub: src('akash-network on GitHub (Apache-2.0)', 'https://github.com/akash-network'),
  akashBme: src(
    'Akash blog: what Burn-Mint Equilibrium means',
    'https://akash.network/blog/what-burn-mint-equilibrium-means-for-akash/',
  ),
  akashQ1: src('Akash Network Q1 2026 report', 'https://akash.network/blog/akash-network-q1-2026-report'),
  akashMl: src(
    'Akash blog: AkashML managed inference',
    'https://akash.network/blog/akashml-managed-ai-inference-on-the-decentralized-supercloud',
  ),
  akashPriceScript: src(
    'Akash provider default price script',
    'https://github.com/akash-network/helm-charts/blob/main/charts/akash-provider/scripts/price_script_generic.sh',
  ),
  akashFunding: src('Akash docs: how funding works', 'https://akash.network/docs/getting-started/how-funding-works/'),

  // Internet Computer
  icpOnboarding: src('Internet Computer wiki: node provider onboarding', 'https://internetcomputer.org/wiki/node-provider-onboarding/'),
  icpSubnets: src(
    'ICP docs: subnet selection',
    'https://docs.internetcomputer.org/guides/canister-management/subnet-selection.md',
  ),
  icpSubnetsApi: src('ICP dashboard API: subnets (live)', 'https://ic-api.internetcomputer.org/api/v3/subnets'),
  icpNodesApi: src('ICP dashboard API: nodes (live)', 'https://ic-api.internetcomputer.org/api/v3/nodes'),
  icpEvolution: src('ICP docs: evolution and scaling', 'https://docs.internetcomputer.org/concepts/evolution-scaling/'),
  icpLimits: src('ICP docs: resource limits', 'https://docs.internetcomputer.org/references/resource-limits.md'),
  icpDomains: src('ICP docs: custom domains', 'https://docs.internetcomputer.org/guides/frontends/custom-domains.md'),
  icpCycles: src('ICP docs: cycle costs', 'https://docs.internetcomputer.org/references/cycle-costs/'),
  icpRepo: src('dfinity/ic on GitHub', 'https://github.com/dfinity/ic'),
  icpCoC: src('DFINITY boundary node code of conduct', 'https://dfinity.org/boundary-nodes/ic0-app/code-of-conduct'),
  icpDashboard: src('ICP dashboard', 'https://dashboard.internetcomputer.org'),
  icpCaffeine: src('BusinessWire: DFINITY launches Caffeine', 'https://www.businesswire.com/news/home/20250715119613/en'),

  // Render
  renderOnboard: src(
    'Render Network KB: how to get started as a node operator',
    'https://know.rendernetwork.com/general-render-network/what-role-am-i/how-to-get-started-1',
  ),
  renderRnp019: src('Render RNP-019: compute network', 'https://github.com/rendernetwork/RNPs/blob/main/RNP-019.md'),
  renderRnp021: src('Render RNP-021: enterprise GPUs', 'https://github.com/rendernetwork/RNPs/blob/main/RNP-021.md'),
  renderRnp023: src('Render RNP-023: Salad subnet', 'https://github.com/rendernetwork/RNPs/blob/main/RNP-023.md'),
  renderPricing: src('Render Network pricing', 'https://rendernetwork.com/pricing'),
  renderRerender: src(
    'Render Network KB: re-rendering rejected frames',
    'https://know.rendernetwork.com/getting-started/how-to-get-started/requesting-a-new-node',
  ),
  renderJobTypes: src('Render Dispersed docs: job types', 'https://otoyinc.mintlify.app/service-consumers/job-types.md'),
  renderHow: src('Render Dispersed docs: how it works', 'https://otoyinc.mintlify.app/how-it-works.md'),
  renderTroubleshooting: src('Render Dispersed docs: troubleshooting', 'https://otoyinc.mintlify.app/troubleshooting.md'),
  renderStats: src('Render Network stats', 'https://stats.renderfoundation.com/'),
  renderFaq: src('Render Foundation FAQ', 'https://renderfoundation.com/faq'),
  renderGithub: src('rendernetwork on GitHub', 'https://github.com/rendernetwork'),

  // Golem
  golemOverview: src('Golem docs: overview', 'https://docs.golem.network/docs/golem/overview'),
  golemProvider: src('Golem docs: provider installation', 'https://docs.golem.network/docs/providers/provider-installation'),
  golemErrors: src(
    'Golem docs: error handling and retries',
    'https://docs.golem.network/docs/creators/javascript/guides/error-handling',
  ),
  golemInternet: src(
    'Golem docs: accessing the internet',
    'https://docs.golem.network/docs/creators/javascript/guides/accessing-internet',
  ),
  golemYagna012: src(
    'Golem blog: Yagna 0.12 networking',
    'https://blog.golem.network/golem-yagna-0-12-a-vast-new-world-of-exciting-possibilities-2/',
  ),
  golemStats: src('Golem stats API: network online (live)', 'https://api2.stats.golem.network/v2/network/online/stats'),
  golemRepo: src('golemfactory/yagna on GitHub (GPL-3.0)', 'https://github.com/golemfactory/yagna'),
  golemSecurity: src('Golem blog: security review update', 'https://blog.golem.network/golem-network-security-review-update/'),
  golemFaq: src('Golem docs: requestor FAQ', 'https://docs.golem.network/docs/golem/overview/requestor-faq'),

  // Aethir
  aethirHostStart: src(
    'Aethir docs: Cloud Host get started',
    'https://docs.aethir.com/aethir-cloud/aethir-cloud-host/cloud-host-portal-guide/get-started.md',
  ),
  aethirOpsReq: src(
    'Aethir docs: operational requirements for Cloud Hosts',
    'https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts.md',
  ),
  aethirStaking: src(
    'Aethir docs: staking parameters',
    'https://docs.aethir.com/aethir-cloud/aethir-cloud-host/operational-requirements-for-cloud-hosts/staking-as-cloud-host/staking-parameters.md',
  ),
  aethirEarth: src(
    'Aethir docs: Aethir Earth portal',
    'https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/cloud-customer-portal-guide/aethir-earth.md',
  ),
  aethirEarthGuide: src(
    'Aethir docs: Earth service guide',
    'https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/aethir-cloud-products/aethir-earth-service-guide.md',
  ),
  aethirFees: src(
    'Aethir docs: service fees',
    'https://docs.aethir.com/aethir-cloud/aethir-cloud-host/rewards-and-service-fees-for-cloud-hosts/service-fees-for-cloud-host.md',
  ),
  aethirCustomer: src(
    'Aethir docs: Cloud Customer get started',
    'https://docs.aethir.com/aethir-cloud/aethir-cloud-customer/cloud-customer-portal-guide/get-started.md',
  ),
  aethirEnterprise: src('Aethir enterprise cost calculator', 'https://enterprise.aethir.com'),
  aethirBuyer: src(
    'Aethir blog: GPU-as-a-service buyer guide (Jun 2026)',
    'https://aethir.com/blog-posts/aethirs-gpu-as-a-service-in-2026-a-compute-buyer-guide',
  ),
  aethirQ3: src('Aethir blog: record Q3 2025', 'https://ecosystem.aethir.com/blog-posts/aethirs-record-breaking-q3'),
  aethirDefillama: src('DefiLlama: Aethir fees', 'https://defillama.com/protocol/aethir'),
  aethirMesh: src('Aethir docs: Aethir Mesh', 'https://docs.aethir.com/aethir-mesh.md'),
  aethirGithub: src('AethirCloud on GitHub', 'https://github.com/AethirCloud'),

  // io.net
  ionetWorkers: src('io.net docs: workers intro', 'https://io.net/docs/guides/workers/intro.md'),
  ionetStaking: src('io.net docs: staking', 'https://io.net/docs/guides/staking/io-staking.md'),
  ionetVm: src('io.net docs: VM on demand', 'https://io.net/docs/guides/clouds/deploy-vm-on-demand.md'),
  ionetCaas: src('io.net API reference: deploy a container', 'https://io.net/docs/reference/caas/deploy-a-container.md'),
  ionetContainers: src('io.net docs: deploy containers', 'https://io.net/docs/guides/clouds/deploy-containers.md'),
  ionetManaged: src('io.net docs: managed services', 'https://io.net/docs/guides/clouds/managed-services.md'),
  ionetPayg: src('io.net docs: pay as you go', 'https://io.net/docs/guides/payment/pay-as-you-go.md'),
  ionetPayments: src('io.net docs: IO Cloud payments', 'https://io.net/docs/guides/payment/io-cloud-payments.md'),
  ionetExplorerApi: src('io.net explorer API: network info (live)', 'https://api.io.solutions/v1/io-explorer/network/info'),
  ionetHardware: src('io.net explorer API: hardware (live)', 'https://api.io.solutions/v1/io-explorer/devices/hardware'),
  ionetEarnings: src(
    'io.net explorer API: cluster earnings (live)',
    'https://api.io.solutions/v1/io-explorer/network/info/cluster/total-earnings-summary',
  ),
  ionetMarketing: src(
    'io.net: H100 GPU cloud pricing guide (marketing)',
    'https://io.net/p/h100-gpu-cloud-where-to-rent-complete-pricing-guide-for-2026',
  ),
  ionetBinaries: src('ionet-official/io_launch_binaries on GitHub', 'https://github.com/ionet-official/io_launch_binaries'),

  // Fluence
  fluenceConnect: src('Fluence docs: connect servers (provider requirements)', 'https://fluence.dev/docs/connect_servers/llms.txt'),
  fluenceProviderOverview: src('Fluence docs: provider overview', 'https://fluence.dev/docs/connect_servers/overview.md'),
  fluenceCpu: src('Fluence docs: CPU cloud concepts', 'https://fluence.dev/docs/build/cpu_cloud/overview.md'),
  fluenceManageVm: src('Fluence docs: manage VMs', 'https://fluence.dev/docs/build/cpu_cloud/manage_vm.md'),
  fluenceGpu: src('Fluence docs: GPU cloud concepts', 'https://fluence.dev/docs/build/gpu_cloud/overview.md'),
  fluenceGpuInstances: src('Fluence docs: manage GPU instances', 'https://fluence.dev/docs/build/gpu_cloud/manage_instances.md'),
  fluenceStorage: src(
    'Fluence blog: persistent volumes and public IPs',
    'https://fluence.ai/blog/persistent-storage-volumes-public-ip-management/',
  ),
  fluenceAiFocus: src('Fluence blog: AI focus and FLT updates', 'https://fluence.ai/blog/ai-focus-flt-updates/'),
  fluenceL2beat: src('L2BEAT: Fluence', 'https://l2beat.com/layer2s/projects/fluence'),
  fluenceGithub: src('fluencelabs on GitHub', 'https://github.com/fluencelabs'),
  fluenceHome: src('fluence.ai homepage', 'https://fluence.ai/'),
  fluenceBalance: src('Fluence docs: balance and billing', 'https://fluence.dev/docs/build/balance.md'),
  fluenceTelegram: src('Fluence official announcements (Telegram)', 'https://t.me/s/fluence_official'),
  fluenceAuctions: src('Fluence blog: GPU cluster auctions', 'https://fluence.ai/blog/gpu-cluster-auctions/'),
  fluencePr: src(
    'Fluence press release: GPU cloud public access (Mar 2026)',
    'https://fortune.com/press-releases/fluence-gpu-cloud-public-access-ai-infrastructure-2026-03-12/',
  ),

  // Theta EdgeCloud
  thetaClient: src('Theta docs: EdgeCloud client guide', 'https://docs.thetatoken.org/docs/theta-edgecloud-client-guide.md'),
  thetaWhat: src('Theta blog: what is Theta (Jul 2026)', 'https://blog.thetatoken.org/what-is-theta/'),
  thetaGeneric: src(
    'Theta docs: generic containerized workloads',
    'https://docs.thetatoken.org/docs/running-generic-containerized-workload.md',
  ),
  thetaApiDeploy: src(
    'Theta docs: manage deployments via API',
    'https://docs.thetatoken.org/docs/use-edgecloud-api-keys-to-manage-deployments.md',
  ),
  thetaFaq: src('Theta docs: community FAQ', 'https://docs.thetatoken.org/docs/community-faq.md'),
  thetaEdgeNode: src('Theta docs: set up an edge node', 'https://docs.thetatoken.org/docs/setup-theta-edge-node.md'),
  thetaVmList: src('Theta EdgeCloud API: VM price list (live)', 'https://api.thetaedgecloud.com/resource/vm/list'),
  thetaLedger: src('thetatoken/theta-protocol-ledger (GPL-3.0)', 'https://github.com/thetatoken/theta-protocol-ledger'),
  thetaOverview: src('Theta docs: EdgeCloud overview', 'https://docs.thetatoken.org/docs/theta-edgecloud-overview.md'),
  thetaAcademic: src(
    'Theta blog: academic AI research on EdgeCloud',
    'https://medium.com/theta-network/the-future-of-academic-ai-research-is-on-theta-edgecloud-19466467dedf',
  ),

  // Phala Cloud
  phalaHome: src('phala.com', 'https://phala.com/'),
  phalaNetworking: src('Phala Cloud docs: networking overview', 'https://docs.phala.com/phala-cloud/networking/overview.md'),
  phalaDomain: src('Phala Cloud docs: custom domains', 'https://docs.phala.com/phala-cloud/networking/setup-custom-domain.md'),
  phalaReplicas: src('Phala Cloud docs: multi-replica scaling', 'https://docs.phala.com/phala-cloud/cvm/multi-replica-scaling.md'),
  phalaRegister: src(
    'Phala docs: register a GPU worker',
    'https://docs.phala.com/network/compute-providers/run-GPU-on-phala/register-work-onchain.md',
  ),
  phalaProviders: src('Phala docs: compute providers', 'https://docs.phala.com/network/compute-providers/introduction.md'),
  phalaDstack: src('Dstack-TEE/dstack on GitHub (Apache-2.0)', 'https://github.com/Dstack-TEE/dstack'),
  phalaGpuTee: src('Phala GPU TEE', 'https://phala.com/gpu-tee'),
  phalaOpenRouter: src('OpenRouter: Phala provider', 'https://openrouter.ai/provider/phala'),

  // AWS
  awsInfra: src('AWS global infrastructure', 'https://aws.amazon.com/about-aws/global-infrastructure/'),
  awsAZ: src(
    'AWS docs: Regions and Availability Zones',
    'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html',
  ),
  awsSla: src('Amazon Compute SLA', 'https://aws.amazon.com/compute/sla/'),
  awsAgreement: src('AWS Customer Agreement', 'https://aws.amazon.com/agreement/'),
  awsAup: src('AWS Acceptable Use Policy', 'https://aws.amazon.com/aup/'),
  awsAsg: src(
    'AWS docs: Auto Scaling health checks',
    'https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-health-checks.html',
  ),
  awsEbsFeatures: src('AWS docs: EBS features (data availability)', 'https://docs.aws.amazon.com/ebs/latest/userguide/EBSFeatures.html'),
  awsEc2Pricing: src('AWS EC2 on-demand pricing', 'https://aws.amazon.com/ec2/pricing/on-demand/'),
  awsEbsPricing: src('AWS EBS pricing', 'https://aws.amazon.com/ebs/pricing/'),
  awsVpcPricing: src('AWS VPC pricing (public IPv4)', 'https://aws.amazon.com/vpc/pricing/'),
  awsElbPricing: src('AWS Elastic Load Balancing pricing', 'https://aws.amazon.com/elasticloadbalancing/pricing/'),
  awsBurstable: src(
    'AWS docs: burstable instance baselines',
    'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/burstable-credits-baseline-concepts.html',
  ),
  awsEgressExit: src(
    'AWS blog: free data transfer out when moving out of AWS',
    'https://aws.amazon.com/blogs/aws/free-data-transfer-out-to-internet-when-moving-out-of-aws/',
  ),
  awsProducts: src('AWS products catalog', 'https://aws.amazon.com/products/'),
  awsP5: src('AWS EC2 P5 instances (H100/H200)', 'https://aws.amazon.com/ec2/instance-types/p5/'),
  awsContainers: src('AWS containers', 'https://aws.amazon.com/containers/'),
  awsPes2025: src('AWS post-event summary, 20 Oct 2025', 'https://aws.amazon.com/message/101925/'),
  awsPes2021: src('AWS post-event summary, 7 Dec 2021', 'https://aws.amazon.com/message/12721/'),

  // Google Cloud
  gcpLocations: src('Google Cloud locations', 'https://cloud.google.com/about/locations'),
  gcpSla: src('Compute Engine SLA', 'https://cloud.google.com/compute/sla'),
  gcpTerms: src('Google Cloud terms of service', 'https://cloud.google.com/terms'),
  gcpAup: src('Google Cloud acceptable use policy', 'https://cloud.google.com/terms/aup'),
  gcpMig: src(
    'Google Cloud docs: autohealing in managed instance groups',
    'https://docs.cloud.google.com/compute/docs/instance-groups/autohealing-instances-in-migs',
  ),
  gcpPd: src('Google Cloud docs: Persistent Disk', 'https://docs.cloud.google.com/compute/docs/disks/persistent-disks'),
  gcpPricing: src(
    'Google Cloud general-purpose VM pricing',
    'https://cloud.google.com/products/compute/pricing/general-purpose',
  ),
  gcpDiskPricing: src('Google Cloud disk pricing', 'https://cloud.google.com/compute/disks-image-pricing'),
  gcpNetwork: src('Google Cloud network pricing (egress, IPs, load balancing)', 'https://cloud.google.com/vpc/network-pricing'),
  gcpE2: src('Google Cloud docs: general-purpose machines (E2)', 'https://docs.cloud.google.com/compute/docs/general-purpose-machines'),
  gcpExit: src('Google Cloud: exit cloud (free egress when leaving)', 'https://cloud.google.com/exit-cloud'),
  gcpGpus: src('Google Cloud docs: GPU machine types', 'https://docs.cloud.google.com/compute/docs/gpus'),
  gcpRun: src('Google Cloud Run overview', 'https://cloud.google.com/run/docs/overview/what-is-cloud-run'),
  gcpProducts: src('Google Cloud products', 'https://cloud.google.com/products'),
  gcpIncident2025: src(
    'Google Cloud incident report, 12 Jun 2025',
    'https://status.cloud.google.com/incidents/ow5i3PPK96RduMcb1SsW',
  ),
  gcpIncidentLondon: src(
    'Google Cloud incident: europe-west2-b power event, 20 Oct 2026',
    'https://status.cloud.google.com/incidents/Xs2XTHzAVC9YnafnPyzj',
  ),

  // Azure
  azureInfra: src('Azure global infrastructure', 'https://azure.microsoft.com/en-us/explore/global-infrastructure/'),
  azureReliability: src(
    'Microsoft Learn: reliability in Azure Virtual Machines',
    'https://learn.microsoft.com/en-us/azure/reliability/reliability-virtual-machines',
  ),
  azureRepairs: src(
    'Microsoft Learn: automatic instance repairs for scale sets',
    'https://learn.microsoft.com/en-us/azure/virtual-machine-scale-sets/virtual-machine-scale-sets-automatic-instance-repairs',
  ),
  azureDiskRedundancy: src(
    'Microsoft Learn: redundancy options for managed disks',
    'https://learn.microsoft.com/en-us/azure/virtual-machines/disks-redundancy',
  ),
  azureOsa: src('Microsoft Online Subscription Agreement', 'https://azure.microsoft.com/en-us/support/legal/subscription-agreement/'),
  azurePricesApi: src('Azure Retail Prices API', 'https://prices.azure.com/api/retail/prices'),
  azureVmPricing: src('Azure Linux VM pricing', 'https://azure.microsoft.com/en-us/pricing/details/virtual-machines/linux/'),
  azureDiskPricing: src('Azure managed disks pricing', 'https://azure.microsoft.com/en-us/pricing/details/managed-disks/'),
  azureBandwidth: src('Azure bandwidth pricing', 'https://azure.microsoft.com/en-us/pricing/details/bandwidth/'),
  azureLbPricing: src('Azure Load Balancer pricing', 'https://azure.microsoft.com/en-us/pricing/details/load-balancer/'),
  azureIpPricing: src('Azure IP address pricing', 'https://azure.microsoft.com/en-us/pricing/details/ip-addresses/'),
  azureContainerApps: src('Microsoft Learn: Azure Container Apps', 'https://learn.microsoft.com/en-us/azure/container-apps/overview'),
  azureNdH100: src(
    'Microsoft Learn: ND H100 v5 series',
    'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/gpu-accelerated/ndh100v5-series',
  ),
  azureProducts: src('Azure products', 'https://azure.microsoft.com/en-us/products/'),
  azureBv1: src(
    'Microsoft Learn: Bv1 series (burstable)',
    'https://learn.microsoft.com/en-us/azure/virtual-machines/sizes/general-purpose/bv1-series',
  ),
  azurePirAfd: src(
    'Azure post-incident review YKYN-BWZ (Front Door)',
    'https://azure.status.microsoft/en-us/status/history/?trackingId=YKYN-BWZ',
  ),
  azurePirFeb2026: src(
    'Azure post-incident review FNJ8-VQZ',
    'https://azure.status.microsoft/en-us/status/history/?trackingId=FNJ8-VQZ',
  ),
  azurePirCentralUs: src(
    'Azure post-incident review 1K80-N_8 (Central US)',
    'https://azure.status.microsoft/en-us/status/history/?trackingId=1K80-N_8',
  ),

  // DigitalOcean
  doRegions: src('DigitalOcean docs: regional availability', 'https://docs.digitalocean.com/platform/regional-availability/'),
  doSla: src('DigitalOcean Droplet SLA', 'https://www.digitalocean.com/sla/cpu-droplets'),
  doTos: src('DigitalOcean terms of service', 'https://www.digitalocean.com/legal/terms-of-service-agreement'),
  doAup: src('DigitalOcean acceptable use policy', 'https://www.digitalocean.com/legal/acceptable-use-policy'),
  doPricing: src('DigitalOcean Droplet pricing', 'https://www.digitalocean.com/pricing/droplets'),
  doBandwidth: src('DigitalOcean docs: bandwidth billing', 'https://docs.digitalocean.com/platform/billing/bandwidth/'),
  doLb: src(
    'DigitalOcean docs: load balancer pricing',
    'https://docs.digitalocean.com/products/networking/load-balancers/details/pricing/',
  ),
  doAppPlatform: src('DigitalOcean docs: App Platform', 'https://docs.digitalocean.com/products/app-platform/'),
  doVolumes: src('DigitalOcean docs: Volumes', 'https://docs.digitalocean.com/products/volumes/'),
  doGpu: src('DigitalOcean GPU Droplets', 'https://www.digitalocean.com/products/gpu-droplets'),
  doProducts: src('DigitalOcean products', 'https://www.digitalocean.com/products'),

  // Vercel
  vercelRegions: src('Vercel docs: global network and regions', 'https://vercel.com/docs/regions'),
  vercelFunctionRegions: src(
    'Vercel docs: configuring function regions and failover',
    'https://vercel.com/docs/functions/configuring-functions/region',
  ),
  vercelTerms: src('Vercel terms of service', 'https://vercel.com/legal/terms'),
  vercelPricing: src('Vercel pricing', 'https://vercel.com/pricing'),
  vercelDuration: src(
    'Vercel docs: function duration limits',
    'https://vercel.com/docs/functions/configuring-functions/duration',
  ),
  vercelStorage: src('Vercel docs: storage overview', 'https://vercel.com/docs/storage'),
  vercelDocker: src(
    'Vercel KB: run a Docker monolith with workers (container images, beta)',
    'https://vercel.com/kb/guide/docker-monolith-workers-vercel',
  ),
  vercelDaemons: src('Vercel KB: Vercel Daemons (beta)', 'https://vercel.com/kb/guide/vercel-daemons'),
  vercelOct20: src(
    'Vercel: service disruption on October 20, 2025',
    'https://vercel.com/blog/update-regarding-vercel-service-disruption-on-october-20-2025',
  ),
  nextjs: src('vercel/next.js on GitHub', 'https://github.com/vercel/next.js'),

  // Hetzner
  hetznerLocations: src('Hetzner docs: cloud locations', 'https://docs.hetzner.com/cloud/general/locations/'),
  hetznerPlacement: src('Hetzner docs: placement groups', 'https://docs.hetzner.com/cloud/placement-groups/overview/'),
  hetznerVolumes: src('Hetzner docs: Volumes', 'https://docs.hetzner.com/cloud/volumes/overview/'),
  hetznerLb: src('Hetzner docs: Load Balancers', 'https://docs.hetzner.com/cloud/load-balancers/overview/'),
  hetznerTerms: src('Hetzner terms and conditions', 'https://www.hetzner.com/legal/terms-and-conditions/'),
  hetznerSystemPolicies: src('Hetzner system policies', 'https://www.hetzner.com/legal/system-policies/'),
  hetznerCostOptimized: src('Hetzner Cloud cost-optimized plans', 'https://www.hetzner.com/cloud/cost-optimized'),
  hetznerRegular: src('Hetzner Cloud regular-performance plans', 'https://www.hetzner.com/cloud/regular-performance'),
  hetznerPriceAdj: src(
    'Hetzner docs: price adjustment',
    'https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/',
  ),
  hetznerPress2026: src(
    'Hetzner press release: price adjustment (May 2026)',
    'https://www.hetzner.com/pressroom/standardization-and-price-adjustment-of-our-server-products/',
  ),
  hetznerGpu: src('Hetzner GPU dedicated servers', 'https://www.hetzner.com/dedicated-rootserver/matrix-gpu/'),
  hetznerCloud: src('Hetzner Cloud', 'https://www.hetzner.com/cloud/'),

  // Market, incidents, press
  synergyQ2: src(
    'Synergy Research: Q2 2026 cloud market passes $143 billion',
    'https://www.srgresearch.com/articles/q2-cloud-market-passes-143-billion-highest-growth-rate-in-eight-years',
  ),
  regAwsPostmortem: src('The Register: AWS outage post-mortem', 'https://www.theregister.com/2025/10/23/amazon_outage_postmortem/'),
  ooklaOutages: src(
    'FoneArena summarizing Ookla: largest outages of 2025',
    'https://www.fonearena.com/blog/471254/largest-outages-2025-ookla.html',
  ),
  cybercube: src(
    'Risk & Insurance: AWS outage loss estimates',
    'https://riskandinsurance.com/aws-outage-loss-estimates-range-from-38m-to-581m-as-cyber-insurers-face-moderate-impact/',
  ),
  insurerAws: src(
    'The Insurer (Reuters): AWS outage disrupts apps worldwide',
    'https://www.theinsurer.com/cyber-risk/news/amazons-aws-recovering-after-major-outage-disrupts-apps-services-worldwide-2025-10-20',
  ),
  jakartaAws: src(
    'Jakarta Post (Reuters): AWS outage, websites down',
    'https://www.thejakartapost.com/culture/2025/10/20/amazons-cloud-unit-reports-outage-several-websites-down.html',
  ),
  regMiddleEast: src('The Register: AWS Middle East outages (2 Mar 2026)', 'https://www.theregister.com/2026/03/02/amazon_outages_middle_east/'),
  heiseMiddleEast: src('heise: AWS UAE region unable to support applications', 'https://heise.de/-11279391'),
  railway: src(
    'Railway incident report: GCP account outage (19 May 2026)',
    'https://blog.railway.com/p/incident-report-may-19-2026-gcp-account-outage',
  ),
  regRailway: src(
    'The Register: Google Cloud suspended Railway',
    'https://www.theregister.com/off-prem/2026/05/20/google-cloud-suspended-major-customer-railwaycom-without-cause-causing-outage/5243111',
  ),
  cfNov2025: src('Cloudflare blog: 18 November 2025 outage', 'https://blog.cloudflare.com/18-november-2025-outage/'),
  cnbcCfNov: src('CNBC: Cloudflare outage hits X, ChatGPT', 'https://www.cnbc.com/2025/11/18/cloudflare-down-outage-traffic-spike-x-chatgpt.html'),
  cfDec2025: src('Cloudflare blog: 5 December 2025 outage', 'https://blog.cloudflare.com/5-december-2025-outage/'),
  bgovCfDec: src(
    'Bloomberg Government: Cloudflare fixes outage that slowed banking sites, Zoom',
    'https://news.bgov.com/tech-and-telecom-law/cloudflare-says-it-fixed-outage-that-slowed-banking-sites-zoom',
  ),
  cfJun2025: src('Cloudflare blog: service outage 12 June 2025', 'https://blog.cloudflare.com/cloudflare-service-outage-june-12-2025/'),
  bnnGcp: src(
    'BNN Bloomberg (Reuters): Google Cloud, Spotify down',
    'https://www.bnnbloomberg.ca/business/technology/2025/06/12/google-cloud-spotify-down-for-tens-of-thousands-of-users-downdetector-shows/',
  ),
  cfFeb2026: src('Cloudflare blog: 20 February 2026 outage', 'https://blog.cloudflare.com/cloudflare-outage-february-20-2026/'),
  laravelCf: src(
    'Laravel Cloud incident report, 20 Feb 2026',
    'https://laravel.com/blog/laravel-cloud-incident-report-february-20-2026',
  ),
  msCrowdstrike: src(
    'Microsoft: helping customers through the CrowdStrike outage',
    'https://blogs.microsoft.com/blog/2024/07/20/helping-our-customers-through-the-crowdstrike-outage/',
  ),
  crowdstrikeRca: src(
    'CrowdStrike root cause analysis, Channel File 291',
    'https://crowdstrike.com/wp-content/uploads/2024/08/Channel-File-291-Incident-Root-Cause-Analysis-08.06.2024.pdf',
  ),
  flightsCrowdstrike: src(
    'Business Traveller: airlines cancelled ~10,000 flights in three days',
    'https://www.businesstraveller.com/business-travel/2024/07/22/worlds-largest-airlines-cancelled-10000-flights-in-three-days-due-to-it-outage/',
  ),
  axiosCrowdstrike: src('Axios: Fortune 500 CrowdStrike losses', 'https://www.axios.com/2024/07/24/fortune-500-crowdstrike-outage-impact'),
  apAfd: src(
    'AP via ABC7: Microsoft Azure outage',
    'https://abc7.com/post/microsoft-azure-outage-today-technology-company-says-cloud-service-experiencing-issues/18086551/',
  ),
  nwAzureFeb: src(
    'Network World: Azure outage disrupts VMs and identity services',
    'https://networkworld.com/article/4127142/azure-outage-disrupts-vms-and-identity-services-for-over-10-hours.html',
  ),
  regLondon: src('The Register: Google Cloud London outage', 'https://www.theregister.com/a/5304160'),
  irishLondon: src(
    'Irish News (PA): banks and courts affected by Google Cloud outage',
    'https://www.irishnews.com/news/uk/banks-and-courts-affected-by-disruption-as-google-apologises-for-cloud-outage-NGVJFIJO7NK47DX5KKSFPTUGNQ/',
  ),
  cnbcAws2021: src(
    'CNBC: AWS outage hits Disney, Netflix, Coinbase',
    'https://www.cnbc.com/2021/12/07/amazon-web-services-outage-causes-issues-at-disney-netflix-coinbase.html',
  ),
  fastlyBlog: src('Fastly: summary of June 8 outage', 'https://www.fastly.com/blog/summary-of-june-8-outage'),
  tcFastly: src('TechCrunch: numerous popular websites face an outage', 'https://techcrunch.com/2021/06/08/numerous-popular-websites-are-facing-an-outage/'),
  ovhNews: src('OVHcloud newsroom: Strasbourg site information', 'https://corporate.ovhcloud.com/en/newsroom/news/informations-site-strasbourg/'),
  netcraftOvh: src('Netcraft: OVH fire', 'https://www.netcraft.com/blog/ovh-fire'),
  dcdOvhCourt: src(
    'DCD: OVHcloud ordered to pay customers who lost data',
    'https://www.datacenterdynamics.com/en/news/ovhcloud-ordered-to-pay-250k-to-two-customers-who-lost-data-in-strasbourg-data-center-fire/',
  ),
  tcParler: src(
    'TechCrunch: AWS gives Parler 24-hour notice',
    'https://techcrunch.com/2021/01/09/amazon-web-services-gives-parler-24-hour-notice-that-it-will-suspend-services-to-the-company/',
  ),
  cnnParler: src('CNN: Parler returns', 'https://www.cnn.com/2021/02/15/tech/parler-returns'),
  theBlockHetzner: src(
    'The Block: 1,000 Solana validators go offline as Hetzner blocks access',
    'https://www.theblock.co/post/182283/1000-solana-validators-go-offline-as-hetzner-blocks-server-access',
  ),
  decryptHetzner: src('Decrypt: Solana validators offline after Hetzner ban', 'https://decrypt.co/113429'),
  cryptoslateHetzner: src(
    'CryptoSlate: host of 17% of Ethereum nodes says staking not permitted',
    'https://cryptoslate.com/data-center-operator-hosting-17-of-ethereums-nodes-says-staking-is-not-permitted/',
  ),
} satisfies Record<string, Source>;

/* --------------------------------------------------------------------------
   Platforms
   -------------------------------------------------------------------------- */

export const platforms: Platform[] = [
  {
    id: 'flux',
    name: 'Flux',
    kind: 'flux',
    category: 'Decentralized, self-healing container cloud',
    summary:
      'A permissionless network of about 6,850 independently run nodes in 57 countries that schedules Docker apps, keeps several copies alive, rebuilds lost ones and load-balances traffic to them.',
    fluxEdge:
      'The baseline: Docker apps replicated across independent operators, healed automatically, load-balanced under a free domain with TLS, at a published USD price with no egress fees.',
    theirStrength:
      'Where Flux is weaker, honestly: GPU depth (high-end GPUs come through FluxEdge partners), managed services and ecosystem size, and a network-wide blocklist that the core team can apply.',
    website: 'https://runonflux.com',
    color: '#2B61D1',
    launched: '2018-01',
    sources: [S.fluxNodesDoc, S.fluxNodeCount, S.fluxGeo, S.fluxIntro, S.fluxPolicy],
  },
  {
    id: 'akash',
    name: 'Akash Network',
    kind: 'depin',
    category: 'Decentralized compute leasing marketplace',
    summary:
      'A Cosmos-SDK chain running a reverse-auction market: you describe a deployment, providers bid, and you lease Kubernetes capacity (including data-center GPUs) from one provider.',
    fluxEdge:
      'On Akash a deployment lives on one provider: if that provider fails you close the lease and redeploy by hand, and provider-local storage goes with it. Flux runs copies on as many independent nodes as you choose, replaces lost ones automatically and load-balances them under a free domain with TLS.',
    theirStrength:
      'Real data-center GPU inventory (A100, H100, B300), a fully Apache-2.0 stack, USD-pegged billing with card payments, managed inference (AkashML), and no network-wide blocklist: a refused tenant can simply go to another provider.',
    website: 'https://akash.network',
    color: '#d72828',
    launched: '2021-03',
    sources: [S.akashLeases, S.akashDeployments, S.akashStats, S.akashBme, S.akashGithub],
  },
  {
    id: 'ionet',
    name: 'io.net',
    kind: 'depin',
    category: 'Aggregated GPU marketplace',
    summary:
      'A Solana-based marketplace that aggregates GPUs from individuals and partners into containers, VMs and sales-led clusters, with an LLM API on top.',
    fluxEdge:
      'io.net containers run on a single node with no automatic rescheduling, and its own explorer shows about 1,300 active GPUs against "320,000+" in its marketing. Flux’s node count is live and verifiable, and its apps heal themselves.',
    theirStrength:
      'Hundreds of genuinely hired data-center GPUs (640 H100s in the live API), managed Kubernetes, Ray and confidential-compute clusters, and an OpenAI-compatible inference API.',
    website: 'https://io.net',
    color: '#af9100',
    launched: '2024-06',
    sources: [S.ionetExplorerApi, S.ionetHardware, S.ionetCaas, S.ionetContainers, S.ionetMarketing],
  },
  {
    id: 'aethir',
    name: 'Aethir',
    kind: 'depin',
    category: 'Enterprise GPU cloud network',
    summary:
      'A network of vetted, staked enterprise GPU hosts that rents bare-metal servers for AI and cloud gaming, priced in USD and settled in the ATH token.',
    fluxEdge:
      'Aethir rents you one vetted server; if it fails, the host has up to four hours to repair it and nothing moves your workload. Flux’s hardware is open to anyone, and your app can run on several nodes that replace each other automatically.',
    theirStrength:
      'By far the largest DePIN compute business by customer fees (about $66 million in the year to October 2026), with H100, H200, B200 and GB200 clusters of up to 4,000 GPUs on SLA-bound hosts.',
    website: 'https://aethir.com',
    color: '#008c57',
    launched: '2024-06',
    sources: [S.aethirOpsReq, S.aethirEarth, S.aethirFees, S.aethirDefillama, S.aethirEnterprise],
  },
  {
    id: 'icp',
    name: 'Internet Computer',
    kind: 'depin',
    category: 'Replicated WebAssembly smart-contract cloud',
    summary:
      'DFINITY’s own blockchain runs WebAssembly "canisters" replicated across subnets of 13 or more nodes, operated by node providers approved through NNS governance.',
    fluxEdge:
      'ICP replicates by default too, but only governance-approved providers may host (and no new machines are being onboarded), and it runs WebAssembly canisters, not Docker. Flux lets anyone add hardware and runs ordinary containers unchanged.',
    theirStrength:
      'Byzantine-fault-tolerant replication of compute and state, automatic TLS and custom domains, tamper-proof execution, a large ecosystem (about 1.27 million canisters) and a market cap around $1.5 billion.',
    website: 'https://internetcomputer.org',
    color: '#d740a2',
    launched: '2021-05',
    sources: [S.icpOnboarding, S.icpSubnets, S.icpEvolution, S.icpNodesApi, S.coingecko],
  },
  {
    id: 'render',
    name: 'Render Network',
    kind: 'depin',
    category: 'GPU rendering and AI network',
    summary:
      'A Solana-based network, run with OTOY, that splits 3D renders across many GPU nodes and now adds GPU compute subnets for AI.',
    fluxEdge:
      'Render is a GPU job network with curated operators and closed core software; it does not host always-on web apps with domains, TLS or failover. Flux is an open, general-purpose cloud for the services those renders end up in.',
    theirStrength:
      'Best-in-class distributed rendering (OctaneRender, Redshift, Blender) with frames fanned out to up to 100 nodes and automatic re-renders, fixed euro pricing, enterprise H100/H200 capacity and Salad’s GPU fleet joining as a subnet.',
    website: 'https://rendernetwork.com',
    color: '#db7300',
    launched: '2020',
    sources: [S.renderOnboard, S.renderPricing, S.renderRnp019, S.renderRnp021, S.renderStats],
  },
  {
    id: 'fluence',
    name: 'Fluence',
    kind: 'depin',
    category: 'Vetted data-center CPU/GPU marketplace',
    summary:
      'Once a "cloudless" protocol, now an AI-focused marketplace of KYB-vetted Tier 3/4 data centers with USD billing; its rollup chain shut down in April 2026.',
    fluxEdge:
      'Fluence admits only vetted data centers, runs its console centrally and offers no failover: a terminated instance and its data are gone. Flux is open to any operator and keeps apps alive across nodes.',
    theirStrength:
      'Enterprise-grade hardware, H100 from $1.24 an hour, H200 and B200 clusters through reverse auctions, USD card billing, private networking (VPC) and a zero-egress-fee policy.',
    website: 'https://fluence.ai',
    color: '#b82771',
    launched: '2024-02',
    sources: [S.fluenceConnect, S.fluenceCpu, S.fluenceManageVm, S.fluenceAiFocus, S.fluenceHome],
  },
  {
    id: 'golem',
    name: 'Golem Network',
    kind: 'depin',
    category: 'Permissionless batch-compute market',
    summary:
      'One of the oldest DePIN projects: a permissionless market where requestors rent CPU from providers for batch and parallel tasks, paid in GLM on Ethereum and Polygon.',
    fluxEdge:
      'Golem retries batch tasks but cannot host a public website: providers accept no direct inbound connections and there are no domains or TLS. Flux serves always-on apps with replicas and load balancing.',
    theirStrength:
      'Genuinely permissionless and GPL-licensed, live since the 2018 Brass release, with built-in task retries across providers that suit embarrassingly parallel jobs.',
    website: 'https://golem.network',
    color: '#9c622f',
    launched: '2018',
    sources: [S.golemOverview, S.golemErrors, S.golemYagna012, S.golemStats, S.golemRepo],
  },
  {
    id: 'theta',
    name: 'Theta EdgeCloud',
    kind: 'depin',
    category: 'Hybrid edge and hosted GPU cloud',
    summary:
      'Theta Labs’ EdgeCloud mixes community GPUs with H100/H200 capacity hosted in partner data centers and on Google Cloud and AWS, on its own Theta blockchain.',
    fluxEdge:
      'Much of Theta’s high-end GPU capacity runs on Google Cloud and AWS, so hyperscaler outages can reach it, and the platform is run centrally by Theta Labs. Flux nodes are independently operated, with effectively none on the big three clouds.',
    theirStrength:
      'Cheap community RTX GPUs alongside on-demand H100/H200, 36 universities and research institutions as customers, and long experience in video infrastructure.',
    website: 'https://www.thetaedgecloud.com',
    color: '#18a7a1',
    launched: '2024-05',
    sources: [S.thetaWhat, S.thetaClient, S.thetaGeneric, S.thetaFaq, S.thetaVmList],
  },
  {
    id: 'phala',
    name: 'Phala Cloud',
    kind: 'depin',
    category: 'Confidential (TEE) container cloud',
    summary:
      'Phala Cloud deploys Docker Compose apps into confidential virtual machines, including H100, H200 and B300 GPU TEEs, on team-verified hardware.',
    fluxEdge:
      'Phala runs containers inside TEEs, but replicas get separate endpoints with no load balancing or shared storage, and GPU workers are verified by the Phala team. Flux balances traffic across self-healing replicas on permissionless nodes.',
    theirStrength:
      'Hardware-enforced confidentiality (CPU and GPU TEEs), automatic HTTPS and custom domains, the Apache-2.0 dstack framework co-developed with Flashbots, and strong AI-inference traction.',
    website: 'https://phala.com',
    color: '#639900',
    sources: [S.phalaHome, S.phalaReplicas, S.phalaNetworking, S.phalaRegister, S.phalaDstack],
  },
  {
    id: 'aws',
    name: 'Amazon Web Services',
    kind: 'web2',
    category: 'Largest hyperscale public cloud',
    summary:
      'Amazon’s cloud: 124 availability zones in 39 regions, the broadest catalog of managed services, and 28% of the cloud infrastructure market.',
    fluxEdge:
      'AWS is one company with one set of terms, and a region (us-east-1) whose bad days take much of the internet with it. Our reference app costs $38 a month for one copy on AWS before egress; Flux runs three self-healing copies for $4.99.',
    theirStrength:
      'Unmatched breadth of managed services, abundant H100/H200 capacity, mature multi-AZ tooling and SLAs, compliance certifications and enterprise support.',
    website: 'https://aws.amazon.com',
    color: '#d77900',
    sources: [S.awsInfra, S.awsAZ, S.awsAgreement, S.awsEc2Pricing, S.synergyQ2],
  },
  {
    id: 'azure',
    name: 'Microsoft Azure',
    kind: 'web2',
    category: 'Microsoft’s hyperscale cloud',
    summary: 'Microsoft’s cloud: 80+ regions, deep enterprise integration, and 20% of the cloud infrastructure market.',
    fluxEdge:
      'On Azure, resilience is "a shared responsibility" you engineer and pay for, and control-plane faults such as Front Door in October 2025 cross regions. Flux makes replicas, failover and load balancing part of the base price.',
    theirStrength:
      'Enterprise integration (Entra ID, Microsoft 365), zone-redundant disks, ND H100 v5 clusters that scale to thousands of GPUs, and broad compliance coverage.',
    website: 'https://azure.microsoft.com',
    color: '#00a7af',
    sources: [S.azureInfra, S.azureReliability, S.azureOsa, S.azurePricesApi, S.synergyQ2],
  },
  {
    id: 'digitalocean',
    name: 'DigitalOcean',
    kind: 'web2',
    category: 'Developer-friendly simple cloud',
    summary:
      'A simpler cloud for developers and small businesses: flat-priced Droplets, managed databases, Kubernetes and App Platform in 13 regions.',
    fluxEdge:
      'DigitalOcean’s SLA covers each Droplet on its own; redundancy means buying more Droplets and a load balancer ($84 a month for three of our reference servers). Flux runs three load-balanced, self-healing copies for $4.99.',
    theirStrength:
      'Simple, flat pricing with 4 TB of transfer included, polished managed services, and H100, H200 and B300 GPU Droplets.',
    website: 'https://www.digitalocean.com',
    color: '#979c00',
    sources: [S.doRegions, S.doSla, S.doPricing, S.doTos],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    kind: 'web2',
    category: 'Frontend and serverless platform',
    summary:
      'The company behind Next.js: git-push deploys, a 126-PoP CDN and serverless functions that run in 19 regions mapped onto AWS.',
    fluxEdge:
      'Vercel’s compute sits in AWS regions (its default, iad1, is us-east-1) and offers no always-on processes; the October 2025 AWS outage disrupted it. Flux runs long-lived containers on independent hardware.',
    theirStrength:
      'The best developer experience for frontends: instant preview deployments, automatic domains and TLS, a global CDN, and Next.js.',
    website: 'https://vercel.com',
    color: '#db428c',
    sources: [S.vercelRegions, S.vercelFunctionRegions, S.vercelTerms, S.vercelOct20],
  },
  {
    id: 'gcp',
    name: 'Google Cloud',
    kind: 'web2',
    category: 'Google’s hyperscale cloud',
    summary: 'Google’s cloud: 130 zones in 43 regions, strong data and AI services, and 15% of the cloud infrastructure market.',
    fluxEdge:
      'In May 2026 an automated action at Google suspended Railway’s production account without notice and took every Railway region offline. On Flux there is no hosting account for one provider to suspend, egress is free, and running several copies is one number in the spec.',
    theirStrength:
      'World-class data and AI services, A3/A4 GPU machines up to GB300, regional disks replicated across zones, and Google’s private global network.',
    website: 'https://cloud.google.com',
    color: '#30ad51',
    sources: [S.gcpLocations, S.gcpSla, S.gcpTerms, S.gcpPricing, S.synergyQ2],
  },
  {
    id: 'hetzner',
    name: 'Hetzner',
    kind: 'web2',
    category: 'Low-cost European hosting provider',
    summary:
      'A German host with cheap cloud servers and dedicated machines in six cloud locations (Germany, Finland, the US and Singapore).',
    fluxEdge:
      'Hetzner bans crypto mining in its terms and cut off more than 1,000 Solana validators in 2022: one host’s policy ended those deployments. Flux spreads an app’s copies across different nodes (and stateful apps across hosting organizations), so copies on other networks keep serving if one host pulls the plug.',
    theirStrength:
      'Very low prices for raw compute in Europe even after two 2026 increases, 20 TB of traffic included, and triple-replicated volumes. It also hosts about a quarter of Flux’s own nodes.',
    website: 'https://www.hetzner.com',
    color: '#d01c29',
    sources: [S.hetznerLocations, S.hetznerTerms, S.hetznerCostOptimized, S.theBlockHetzner, S.fluxGeo],
  },
];

type PlatformId =
  | 'flux'
  | 'akash'
  | 'ionet'
  | 'aethir'
  | 'icp'
  | 'render'
  | 'fluence'
  | 'golem'
  | 'theta'
  | 'phala'
  | 'aws'
  | 'azure'
  | 'digitalocean'
  | 'vercel'
  | 'gcp'
  | 'hetzner';

/* --------------------------------------------------------------------------
   Dimensions
   -------------------------------------------------------------------------- */

const DIMENSION_IDS = [
  'permissionless-operators',
  'multi-operator-redundancy',
  'self-healing',
  'replicated-data',
  'geographic-spread',
  'deplatforming-resistance',
  'open-source',
  'any-container',
  'always-on',
  'built-in-networking',
  'ecosystem',
  'predictable-pricing',
  'network-scale',
  'gpu-depth',
] as const;
type DimensionId = (typeof DIMENSION_IDS)[number];

export const dimensions: Dimension[] = [
  {
    id: 'permissionless-operators',
    label: 'Permissionless operators',
    question: 'Can anyone plug in hardware and get paid for hosting?',
    why: 'If only approved companies or data centers may host, the network is a federation of vendors, and a few gatekeepers decide who takes part.',
    group: 'decentralization',
  },
  {
    id: 'multi-operator-redundancy',
    label: 'Replicated across operators',
    question: 'Does one deployment run on several independent machines at once?',
    why: 'A single-provider lease fails the moment that provider does. Live copies on separate, independently hosted machines turn a dead server into a non-event.',
    group: 'resilience',
  },
  {
    id: 'self-healing',
    label: 'Automatic failover',
    question: 'If the machine hosting my app dies, does the app come back by itself?',
    why: 'Self-healing means nobody is paged at 3 a.m. to redeploy: the platform notices the missing copy and replaces it.',
    group: 'resilience',
  },
  {
    id: 'replicated-data',
    label: 'Replicated app data',
    question: 'Does my data survive losing the machine it lived on?',
    why: 'Restarting a container is easy; state is what gets lost. Volumes replicated to other hosts keep data alive when a host disappears.',
    group: 'resilience',
  },
  {
    id: 'geographic-spread',
    label: 'Geographic & network spread',
    question: 'How many countries and independent networks is the hardware spread across?',
    why: 'Fires, power cuts, regulators, wars and routing failures are local. Hardware spread over many countries and many network operators is hard to knock out in one place.',
    group: 'decentralization',
  },
  {
    id: 'deplatforming-resistance',
    label: 'Deplatforming resistance',
    question: 'Can a single company switch my app off?',
    why: 'On a centralized cloud, one account review or one automated flag can end a business overnight. The more independent parties would have to agree, the harder that becomes.',
    group: 'decentralization',
  },
  {
    id: 'open-source',
    label: 'Open-source stack',
    question: 'Can I read and audit the code that schedules and runs my app?',
    why: 'Open code lets anyone verify how workloads are placed, paid for and protected, and lets the network outlive any one company.',
    group: 'decentralization',
  },
  {
    id: 'any-container',
    label: 'Runs any Docker container',
    question: 'Can I bring a standard container image, or must I rewrite for the platform?',
    why: 'Docker is the common language of deployment. A platform that runs ordinary images has no rewrite tax and no lock-in.',
    group: 'developer',
  },
  {
    id: 'always-on',
    label: 'Always-on services',
    question: 'Can it host a website, API, database or game server that never stops?',
    why: 'Much "decentralized compute" runs batch jobs or renders. A real cloud has to keep long-running services up around the clock.',
    group: 'developer',
  },
  {
    id: 'built-in-networking',
    label: 'Domains, TLS & load balancing',
    question: 'Do I get a public URL, HTTPS and traffic spread across replicas without extra setup?',
    why: 'Replicas only help users if traffic is routed to the healthy ones. Built-in ingress turns redundancy into uptime.',
    group: 'developer',
  },
  {
    id: 'ecosystem',
    label: 'Managed services & ecosystem',
    question: 'Are there managed databases, queues, SDKs, support plans and a large community?',
    why: 'Mature clouds bundle hundreds of managed services and huge communities.',
    group: 'developer',
  },
  {
    id: 'predictable-pricing',
    label: 'Flat pricing, no egress fees',
    question: 'Is the bill published and predictable, with no per-gigabyte charge for traffic out?',
    why: 'Egress fees and line-item sprawl make cloud bills hard to forecast and make leaving expensive.',
    group: 'economics',
  },
  {
    id: 'network-scale',
    label: 'Network scale',
    question: 'How much hardware is actually there, by verifiable count?',
    why: 'Capacity decides how much a network can absorb and how many failures it can survive. Live, checkable numbers beat marketing totals.',
    group: 'scale',
  },
  {
    id: 'gpu-depth',
    label: 'High-end GPUs',
    question: 'Can I rent data-center GPUs (H100-class) for AI training and inference?',
    why: 'AI workloads need serious GPUs, and depth of supply decides what you can rent.',
    group: 'scale',
  },
];

/* --------------------------------------------------------------------------
   Cells: every platform x every dimension
   -------------------------------------------------------------------------- */

type CellSpec = readonly [verdict: Verdict, score: number, short: string, detail: string, sources: Source[]];

function row(platformId: PlatformId, specs: Record<DimensionId, CellSpec>): Cell[] {
  return DIMENSION_IDS.map((dimensionId) => {
    const [verdict, score, short, detail, sources] = specs[dimensionId];
    return { platformId, dimensionId, verdict, score, short, detail, sources };
  });
}

const fluxRow = row('flux', {
  'permissionless-operators': [
    'yes',
    5,
    'Anyone with hardware and FLUX collateral',
    'FluxNodes are "permissionless and open to everyone": an operator locks collateral (1,000, 12,500 or 40,000 FLUX for Cumulus, Nimbus or Stratus), passes the network benchmark and starts earning. More than 6,800 nodes were confirmed on 2026-10-24, run by 1,155 distinct operator identities.',
    [S.fluxNodesDoc, S.fluxNodeCount, S.fluxOperators],
  ],
  'multi-operator-redundancy': [
    'yes',
    5,
    '1 to 100 live copies, each on a different node',
    'An app spec sets instances from 1 to 100, and FluxOS places each copy on a different node; stateful apps are also spread across hosting organizations ("fault domains"). Marketplace installs default to 3 copies and the custom-deploy wizard to 1 (single copies were allowed from December 2025). On 2026-10-24, 1,815 of the 2,115 running apps (86%) had two or more live copies.',
    [S.fluxConfig, S.fluxPlacement, S.fluxFrontendInstall, S.fluxFrontendRegister, S.fluxAppsLocations],
  ],
  'self-healing': [
    'yes',
    5,
    'Lost copies are rebuilt; healthy ones keep serving',
    'Every node runs a spawner that looks for apps with fewer running copies than requested and installs the missing copy locally, so a dead node’s share is rebuilt elsewhere with no action from the owner. With two or more copies, Flux Domain Manager health-checks backends and routes around the failure. A sudden node loss is noticed when its location record expires (up to 125 minutes; 7 minutes on a clean shutdown), so single-copy apps are down until the rebuild.',
    [S.fluxSpawner, S.fluxConfig, S.fdmRepo, S.fluxIntro],
  ],
  'replicated-data': [
    'yes',
    4,
    'Volumes sync between copies (r: and g: prefixes)',
    'Prefix a volume with r: and FluxOS keeps it in sync across all copies; g: runs one read-write primary with standbys replicating it, which suits databases and game servers. Unprefixed volumes are local and are not carried to a new node, so replication is opt-in per volume, and it is file synchronization rather than consensus-replicated state.',
    [S.fluxComponents, S.fluxCost],
  ],
  'geographic-spread': [
    'yes',
    5,
    'Over 50 countries, 6 continents, 234 networks',
    'Node geolocation on 2026-10-24 covered 57 countries on 6 continents and 234 autonomous systems, with no nodes on AWS, Azure or Google Cloud (the 6 on a Google network are Google Fiber home lines). About half sit on residential or business lines rather than data-center IPs.',
    [S.fluxGeo],
  ],
  'deplatforming-resistance': [
    'partial',
    3,
    'No account to suspend, but a public team blocklist',
    'An app is a paid spec on the Flux chain and its copies run on independent operators, so no single host or account review can remove it. But every node enforces a signed network policy published by the Flux team (312 blocklist entries on 2026-10-24, mostly owners of mass-registered abuse deployments), so the core team can take an app off the whole network, publicly and with a stated reason. The default *.app.runonflux.io domain layer is also team-run, though anyone can run their own Flux Domain Manager.',
    [S.fluxPolicy, S.fdmRepo],
  ],
  'open-source': [
    'yes',
    4,
    'FluxOS (AGPL-3.0), daemon, load balancer and UI public',
    'FluxOS is AGPL-3.0, and the daemon, Flux Domain Manager and FluxCloud front end are public on GitHub, so placement, pricing and failover logic can be read line by line. Two pieces are closed: the benchmark daemon and ArcaneOS’s attestation service.',
    [S.fluxRepo, S.fluxOrg, S.fdmRepo],
  ],
  'any-container': [
    'yes',
    5,
    'Any registry image, up to 10 components per app',
    'Apps are Compose-style specs of up to 10 components built from ordinary Docker images (up to 5 GB each), with environment variables, commands and volumes. Private registry images are available to enterprise (encrypted) apps. A short list of ports such as SSH and SMTP is blocked to prevent abuse.',
    [S.fluxDeploymentInfo, S.fluxComponents],
  ],
  'always-on': [
    'yes',
    5,
    'Websites, APIs, databases, game servers',
    'Apps run continuously for their prepaid period (one week to one year, renewable). On 2026-10-24 the network was running 2,115 apps on 8,827 instances, and the marketplace listed 106 templates, from WordPress and databases to dedicated game servers.',
    [S.fluxGeneral, S.fluxAppsLocations, S.fluxMarketplace],
  ],
  'built-in-networking': [
    'yes',
    5,
    'Automatic domain, Let’s Encrypt TLS, round-robin LB',
    'Every app gets <app>.app.runonflux.io, and a custom domain is one CNAME away, with certificates issued automatically by Let’s Encrypt. Flux Domain Manager (HAProxy) balances traffic round-robin across healthy copies, with sticky sessions.',
    [S.fluxDomain, S.fdmRepo],
  ],
  ecosystem: [
    'partial',
    2,
    'One-click marketplace, few managed services',
    'FluxCloud offers 106 marketplace templates, a shared MySQL operator, FluxDrive storage and FluxEdge GPU rentals. That is nothing like a hyperscaler’s catalog of managed databases, queues and analytics, and the developer community is far smaller.',
    [S.fluxMarketplace, S.fluxSharedDb, S.fluxEdgeRent],
  ],
  'predictable-pricing': [
    'yes',
    5,
    'Published USD rate card, zero egress fees',
    'Pricing is a public per-resource USD rate card with automatic small-app and term discounts, prepaid by card or in FLUX (5% off). There are "no ingress or egress fees". Our 2 vCPU / 4 GB / 50 GB reference app costs $1.99 a month for one copy and $4.99 for three.',
    [S.fluxCost, S.fluxPriceApi, S.fluxIntro],
  ],
  'network-scale': [
    'yes',
    4,
    '6,800+ nodes, ~56,900 cores, 3.37 PB SSD',
    'On 2026-10-24: 6,854 confirmed nodes benchmarking about 56,900 logical cores, 192 TB of RAM and 3.37 PB of SSD, with running apps reserving about 30% of the cores. Among the DePIN networks here, Flux publishes the most live CPU capacity: Akash shows about 14,200 cores and Golem about 5,000.',
    [S.fluxNodeCount, S.fluxBench, S.akashCapacity],
  ],
  'gpu-depth': [
    'partial',
    2,
    'FluxEdge rentals; H100s come via partners',
    'FluxNodes are CPU machines. GPUs are rented separately on FluxEdge, a single-machine marketplace of community cards such as the RTX 4090, plus a Premium tab of H100, A100 and Blackwell GPUs sourced from partners such as Hyperstack (KYC required). There is no replicated, self-healing GPU deployment.',
    [S.fluxEdgeRent],
  ],
});

const akashRow = row('akash', {
  'permissionless-operators': [
    'yes',
    5,
    'Anyone can become a provider',
    'Providers join a "permissionless and open environment" with their own Kubernetes cluster, a public IP and a small AKT deposit per bid (0.5 AKT); there is no stake or KYC. Tenants can optionally accept bids only from third-party-audited providers.',
    [S.akashProviders, S.akashLeases],
  ],
  'multi-operator-redundancy': [
    'no',
    1,
    'One lease, one provider',
    'A deployment’s lease is "tied to specific provider". For high availability the docs say to deploy to multiple providers yourself, with no built-in coordination or traffic routing between those deployments.',
    [S.akashDeployments, S.akashLeases],
  ],
  'self-healing': [
    'no',
    1,
    'Provider down? Close the lease and redeploy',
    'Kubernetes on the provider restarts crashed containers, but if the provider itself fails the docs say to "close lease and redeploy" to a different provider; unused escrow is returned. Nothing moves the workload automatically.',
    [S.akashLeases, S.akashDeployments],
  ],
  'replicated-data': [
    'no',
    1,
    'Storage lives and dies with the provider',
    'Persistent storage exists, but "Storage is tied to the provider": "Data is lost when you close the deployment" and "Data may be lost if provider’s storage fails".',
    [S.akashStorage],
  ],
  'geographic-spread': [
    'partial',
    2,
    '58 active providers',
    '58 providers were active on 2026-10-24, and Akash publishes no country breakdown.',
    [S.akashStats, S.fluxOperators],
  ],
  'deplatforming-resistance': [
    'yes',
    4,
    'No network kill switch; providers choose',
    'Akash documents no network-wide blocklist. Each provider decides which workloads it accepts and can close a lease, but a refused tenant can redeploy to another provider.',
    [S.akashProviders, S.akashDeployments],
  ],
  'open-source': ['yes', 5, 'Apache-2.0 node, provider and console', 'The chain node, provider software and Console are Apache-2.0 and actively developed on GitHub.', [S.akashGithub]],
  'any-container': [
    'yes',
    5,
    'Any Docker image via SDL',
    'Deployments are described in Akash’s SDL and run as ordinary Docker containers on the provider’s Kubernetes, including GPU workloads.',
    [S.akashDeployments],
  ],
  'always-on': [
    'yes',
    5,
    'Long-running services while escrow lasts',
    'Leases run continuously while escrow is funded; when it hits zero the deployment closes and cannot be restarted without a new deployment.',
    [S.akashDeployments],
  ],
  'built-in-networking': [
    'partial',
    2,
    'Provider hostname; TLS and LB are DIY',
    'Deployments are reached through their provider’s ingress subdomain, and custom hostnames can be accepted in the SDL, but TLS for custom domains still leans on third parties such as Cloudflare: automatic certificates (AEP-66) are a draft. There is no load balancing across providers, and dedicated IPs "can’t move between providers".',
    [S.akashCustomDomain, S.akashAep66, S.akashIpLeases],
  ],
  ecosystem: [
    'partial',
    3,
    'AkashML, card-paying Console, big community',
    'AkashML managed inference (launched November 2025), a Console that takes card payments, confidential-compute GPUs and a large, well-known community. Still far from a hyperscaler’s managed-service catalog.',
    [S.akashMl, S.akashQ1, S.akashFunding],
  ],
  'predictable-pricing': [
    'partial',
    3,
    'Bid market in a USD-pegged credit',
    'Providers bid and you choose, so prices vary by provider. Since March 2026 leases are paid in ACT, a non-transferable USD-pegged credit minted by burning AKT or bought by card in Console. We found no protocol-level egress fee, but no official statement either.',
    [S.akashLeases, S.akashBme, S.akashFunding],
  ],
  'network-scale': [
    'partial',
    2,
    '58 providers, ~14,200 cores, 376 GPUs',
    'Live on 2026-10-24: 58 active providers offering about 14,200 CPU cores, 76 TB of RAM and 376 GPUs, with 656 active leases and about $6,200 a day of spend.',
    [S.akashStats, S.akashCapacity],
  ],
  'gpu-depth': [
    'partial',
    3,
    'Real A100/H100/B300 inventory, in the hundreds',
    '376 GPUs on 2026-10-24, including 200 A100 80GB, 69 H100 80GB and 16 B300, with 265 leased: genuine data-center GPUs in modest quantity.',
    [S.akashGpu, S.akashCapacity],
  ],
});

const ionetRow = row('ionet', {
  'permissionless-operators': [
    'yes',
    4,
    'Open sign-up, proof of work, staking',
    'Anyone can connect a device; it must pass proof-of-work checks and be staked (200 IO per GPU times a multiplier) to be hired for jobs. Some VM inventory is listed as partner-provided clusters.',
    [S.ionetWorkers, S.ionetStaking, S.ionetVm],
  ],
  'multi-operator-redundancy': [
    'partial',
    2,
    'Replicas allowed, each on one node, no load balancer',
    'Containers "must run within a single node". You can request several replicas, each with its own public URL, but nothing balances traffic between them.',
    [S.ionetCaas, S.ionetContainers],
  ],
  'self-healing': [
    'no',
    1,
    'Health checks are monitoring only',
    'Health checks are "monitoring only: a failing check never stops your container", and no automatic rescheduling of a running workload is documented.',
    [S.ionetContainers],
  ],
  'replicated-data': ['no', 1, 'No replicated storage documented', 'The container and VM docs describe no persistent volumes replicated across machines.', [S.ionetContainers, S.ionetVm]],
  'geographic-spread': [
    'partial',
    2,
    'Claims 130+ countries; 1,307 GPUs active',
    'Marketing claims "320,000+ GPUs … 130+ countries", but io.net’s own explorer listed 1,307 active GPUs on 2026-10-24, and their locations are not broken down.',
    [S.ionetMarketing, S.ionetExplorerApi],
  ],
  'deplatforming-resistance': [
    'no',
    1,
    'Central scheduling, payments and bans',
    'Device onboarding, bans, payments and the managed clusters are all run by io.net; managed clusters are sold through its sales team.',
    [S.ionetWorkers, S.ionetManaged],
  ],
  'open-source': [
    'no',
    1,
    'Worker ships as unlicensed binaries',
    'The worker is distributed as binaries with no license; only demos and an attestation agent are open source.',
    [S.ionetBinaries],
  ],
  'any-container': [
    'partial',
    2,
    'HTTP GPU containers or GPU VMs',
    'The container service accepts "only HTTP server containers", with a single traffic port and at least one GPU each. GPU VMs with SSH and sales-led Kubernetes or Ray clusters cover the rest.',
    [S.ionetCaas, S.ionetVm, S.ionetManaged],
  ],
  'always-on': [
    'partial',
    3,
    'Containers and VMs run while paid',
    'Containers and VMs run for as long as they are paid for, but the supplier can change the price of a running booking, and every container needs a GPU.',
    [S.ionetPayg, S.ionetCaas],
  ],
  'built-in-networking': [
    'partial',
    2,
    'Public URL per container; no LB or custom domains',
    'Each container gets an unauthenticated public URL; no load balancer across replicas or custom domains are documented. On managed Kubernetes, ingress, DNS and certificates are do-it-yourself.',
    [S.ionetContainers],
  ],
  ecosystem: ['partial', 2, 'LLM APIs and managed clusters', 'IO Intelligence offers LLM APIs and agents; Kubernetes, Ray and confidential-compute clusters are available as managed services.', [S.ionetManaged]],
  'predictable-pricing': [
    'partial',
    2,
    'Prepaid USD credits; price can change mid-booking',
    'Compute is paid with prepaid IO Credits (by card with a 5% fee, or in IO or USDC). The supplier can change the price of a booking while it runs, and egress charges are not documented.',
    [S.ionetPayments, S.ionetPayg],
  ],
  'network-scale': [
    'partial',
    2,
    '1,307 GPUs active vs "320,000+" claimed',
    'The explorer reports total_gpu 1,061,267 and verified_gpu 327,085, but active_gpu 1,307 on 2026-10-24. Cluster earnings were about $1.03 million over the last 30 days.',
    [S.ionetExplorerApi, S.ionetEarnings],
  ],
  'gpu-depth': [
    'yes',
    4,
    '640 H100s live, all hired',
    'The live hardware API lists 640 H100 80GB GPUs (all hired), 616 RTX 4090s and 8 B300s, plus managed clusters with confidential computing on H100, H200 and B200.',
    [S.ionetHardware, S.ionetManaged],
  ],
});

const aethirRow = row('aethir', {
  'permissionless-operators': [
    'no',
    1,
    'Application form, enterprise hardware, stake, KYC',
    'Cloud Hosts apply through a form, must run "only enterprise-grade GPUs" on bare metal with a 99% uptime target, stake ATH (45,095 ATH for one H100 as of December 2025) and pass KYC to withdraw earnings.',
    [S.aethirHostStart, S.aethirOpsReq, S.aethirStaking],
  ],
  'multi-operator-redundancy': [
    'no',
    1,
    'You rent one server',
    'On Aethir Earth you select a server and rent it, for at least a week; orchestration such as Kubernetes or Slurm is the customer’s job.',
    [S.aethirEarth, S.aethirEarthGuide],
  ],
  'self-healing': [
    'no',
    1,
    'The host has up to 4 hours to repair it',
    'An out-of-service node is a P0 ticket for its host, resolved in "up to 4 hours". You are not charged for the downtime and slashed stake funds a compensation pool, but nothing migrates your workload.',
    [S.aethirOpsReq, S.aethirFees],
  ],
  'replicated-data': ['no', 1, 'Local disks on one server', 'Storage is the rented server’s own disks; replication is up to the customer’s own stack.', [S.aethirEarthGuide]],
  'geographic-spread': [
    'partial',
    3,
    '94 countries (self-reported)',
    'Aethir reports capacity in 94 countries and more than 200 locations (June 2026), counted as "GPU containers", a unit that includes consumer PCs and phones.',
    [S.aethirBuyer, S.aethirStaking],
  ],
  'deplatforming-resistance': [
    'no',
    1,
    'Renters apply; the company operates',
    'Customers apply through an application form, and Aethir’s operations team can reset or reprovision servers.',
    [S.aethirCustomer, S.aethirEarthGuide],
  ],
  'open-source': ['no', 0, 'Closed binaries', 'The GitHub organization holds only release binaries for its checker and host agent, with no license.', [S.aethirGithub]],
  'any-container': [
    'partial',
    2,
    'Bare metal with SSH; bring your own stack',
    'You get a bare-metal GPU server with SSH and install whatever you need; there is no managed container platform.',
    [S.aethirEarthGuide],
  ],
  'always-on': [
    'partial',
    3,
    'Whole servers rented by the week or longer',
    'A rented server runs continuously on Reserve or OnDemand terms, but it is a GPU box rather than a managed hosting platform.',
    [S.aethirEarth, S.aethirFees],
  ],
  'built-in-networking': ['no', 1, 'Public IP and SSH only', 'Each server gets a public IP and SSH; no load balancing, domains or TLS are provided.', [S.aethirOpsReq]],
  ecosystem: ['partial', 2, 'LLM API, hosted agents, 150+ partners', 'Aethir Mesh (an LLM API), hosted agents and more than 150 partners and clients.', [S.aethirMesh]],
  'predictable-pricing': [
    'partial',
    3,
    'USD prices, settled in ATH',
    'Services are "priced in fiat currency but settled in ATH tokens", and self-serve customers need ATH to buy compute. The enterprise calculator showed H100 at $1.25 per GPU-hour, and Aethir says it charges no egress fees.',
    [S.aethirFees, S.aethirCustomer, S.aethirEnterprise, S.aethirBuyer],
  ],
  'network-scale': [
    'yes',
    4,
    'Largest DePIN by fees: ~$66M in a year',
    'DefiLlama records about $66 million of customer fees over the year to October 2026 (Q3 2026 about $12.7 million, down roughly 68% on Q3 2025). The "435,000+ GPU containers" figure is self-reported and includes non-data-center devices.',
    [S.aethirDefillama, S.aethirQ3],
  ],
  'gpu-depth': [
    'yes',
    5,
    'H100, H200, B200, GB200; clusters to 4K GPUs',
    'The host catalog covers H100, H200, B200 and GB200 bare metal, and the enterprise offer goes up to 4,000-GPU clusters.',
    [S.aethirStaking, S.aethirEnterprise],
  ],
});

const icpRow = row('icp', {
  'permissionless-operators': [
    'no',
    1,
    'NNS-approved node providers only',
    'Node providers are admitted by governance proposal, which records the legal entity behind the provider and its proof-of-identity documents; data centers need a proposal too. "No new node machines are being onboarded at present": the network reached its target topology in December 2023.',
    [S.icpOnboarding],
  ],
  'multi-operator-redundancy': [
    'yes',
    5,
    'Every canister runs on all nodes of its subnet',
    'Canisters are replicated on every node of their subnet: 35 of the 42 subnets have 13 nodes, the fiduciary subnet has 34 and the NNS subnet 40 (2026-10-24).',
    [S.icpSubnets, S.icpSubnetsApi],
  ],
  'self-healing': [
    'yes',
    5,
    'Keeps running with up to a third of nodes faulty',
    'A subnet "continues making progress as long as fewer than one third of the nodes in a subnet are faulty", so a dead node is invisible to users. Replacing the node itself takes a governance proposal.',
    [S.icpEvolution],
  ],
  'replicated-data': [
    'yes',
    5,
    'State replicated by consensus',
    'Canister heap and stable memory (up to 500 GiB per canister) are part of the subnet’s replicated state, so data survives the loss of any minority of nodes, with stronger consistency than file synchronization.',
    [S.icpLimits, S.icpEvolution],
  ],
  'geographic-spread': [
    'yes',
    4,
    '101 data centers in ~33 countries',
    '1,280 nodes from 76 node providers in 101 data centers across about 33 countries (2026-10-24), all professionally hosted.',
    [S.icpNodesApi, S.icpDashboard],
  ],
  'deplatforming-resistance': [
    'partial',
    2,
    'Governed by the NNS; gateways can filter',
    'The NNS DAO controls upgrades, node membership and subnets. DFINITY’s icp0.io boundary nodes filter content "at the sole discretion" of their operator and may "cease serving" a canister without notifying its controllers; the canister stays on chain and other gateways can still reach it.',
    [S.icpCoC, S.icpEvolution],
  ],
  'open-source': ['yes', 4, 'Mostly Apache-2.0', 'The dfinity/ic repository is mostly Apache-2.0, with some files under a community source license.', [S.icpRepo]],
  'any-container': [
    'no',
    0,
    'WebAssembly canisters only',
    'Code must be compiled to WebAssembly canisters (Rust, Motoko and others); Docker images do not run. Limits include 4 to 6 GiB of heap and a 100 MiB module.',
    [S.icpLimits],
  ],
  'always-on': ['yes', 5, 'Canisters serve HTTP around the clock', 'Canisters are always on and serve web content directly to browsers.', [S.icpDomains]],
  'built-in-networking': [
    'yes',
    5,
    'Canister URLs, custom domains, automatic TLS',
    'Every canister is reachable at https://<id>.icp.net; for custom domains the service "handles TLS certificate provisioning, renewal, and routing automatically", and any replica in the subnet can answer.',
    [S.icpDomains],
  ],
  ecosystem: [
    'partial',
    3,
    'AI app builder, ~1.27M canisters',
    'A large on-chain developer ecosystem (about 1.27 million canisters), the Caffeine AI app builder and Internet Identity, built on its own languages and toolchain rather than the standard cloud stack.',
    [S.icpDashboard, S.icpCaffeine],
  ],
  'predictable-pricing': [
    'partial',
    3,
    'Cycles pegged to XDR; per-byte charges',
    'Developers pay in cycles pegged to the IMF’s XDR basket (1 trillion cycles = 1 XDR). There is no general egress fee, but ingress, cross-subnet traffic and HTTPS outcalls are charged per byte, and larger subnets cost proportionally more.',
    [S.icpCycles],
  ],
  'network-scale': [
    'partial',
    3,
    '1,280 nodes, 42 subnets',
    '1,280 nodes (618 in subnets, the rest spare) across 42 subnets. A large replicated computer, but modest in raw capacity because every node in a subnet does the same work.',
    [S.icpNodesApi, S.icpSubnetsApi],
  ],
  'gpu-depth': ['no', 0, 'No GPU subnets', 'Neither the docs nor the live dashboard show any GPU-capable subnets.', [S.icpSubnetsApi, S.icpLimits]],
});

const renderRow = row('render', {
  'permissionless-operators': [
    'no',
    1,
    'Application and waitlist',
    'Node operators fill in an interest form and join an onboarding queue. The compute subnet is onboarded by the Render Foundation "until a permissionless system is implemented", and enterprise nodes are "limited to verified operators".',
    [S.renderOnboard, S.renderRnp019, S.renderRnp021],
  ],
  'multi-operator-redundancy': [
    'partial',
    2,
    'Renders fan out; compute jobs don’t',
    'A render job is split by frame across up to 100 nodes. Compute jobs on the Dispersed subnet are matched to a single node, and services are not replicated.',
    [S.renderPricing, S.renderHow],
  ],
  'self-healing': [
    'partial',
    3,
    'Rejected frames re-render elsewhere',
    '"Once a Frame is Rejected, it will automatically be sent to another node on the network to be re-rendered"; after three failed re-renders the job is terminated. Dispersed compute jobs document no automatic failover.',
    [S.renderRerender, S.renderTroubleshooting],
  ],
  'replicated-data': ['na', 0, 'Jobs are stateless', 'Rendering and compute jobs take inputs and return outputs; there are no persistent volumes to replicate.', [S.renderJobTypes]],
  'geographic-spread': [
    'partial',
    2,
    'No live node map published',
    'Render reports 5,600 nodes "since inception" (cumulative, not currently active) and publishes no live geography.',
    [S.renderStats],
  ],
  'deplatforming-resistance': [
    'no',
    1,
    'Foundation and OTOY run the marketplace',
    'Onboarding, job allocation ("rotational assignment") and payments are run centrally by the Render Foundation and OTOY, which can also quarantine nodes.',
    [S.renderRnp019, S.renderOnboard],
  ],
  'open-source': ['no', 1, 'Core software is closed (OTOY)', 'The public GitHub organizations hold proposals, plugins and examples; the network software itself is closed.', [S.renderGithub]],
  'any-container': [
    'partial',
    3,
    'Docker on CUDA via the Dispersed subnet',
    'The Dispersed subnet runs Docker containers on NVIDIA GPUs as batch or persistent jobs; the core network runs OctaneRender, Redshift and Blender Cycles scenes.',
    [S.renderJobTypes, S.renderFaq],
  ],
  'always-on': [
    'partial',
    2,
    'Persistent GPU jobs, no web-hosting stack',
    'Persistent jobs run "indefinitely until explicitly stopped" and are billed hourly, but there are no domains, TLS or load balancing for serving a public site.',
    [S.renderJobTypes],
  ],
  'built-in-networking': ['no', 1, 'Host:port endpoints only', 'Dispersed jobs return node URLs with a hostname and port; custom domains, TLS and load balancing are not documented.', [S.renderTroubleshooting]],
  ecosystem: ['partial', 2, 'Deep 3D-tool integration', 'Tight integration with OctaneRender, Redshift and Blender through OTOY, with artist and studio case studies.', [S.renderFaq]],
  'predictable-pricing': [
    'partial',
    3,
    'Fixed euro tiers plus a per-GB asset fee',
    'Rendering is priced per OctaneBench-hour in fixed euro tiers (€0.60 to €2.40 per 400 OBh) and billed by the minute, plus 0.09 credits per GB of scene assets sent to each node.',
    [S.renderPricing],
  ],
  'network-scale': [
    'partial',
    3,
    '82.5M frames rendered; 5,600 nodes ever',
    'More than 82.5 million frames rendered and 5,600 nodes since inception (2026-10-24); Salad, which claims about 60,000 daily active GPUs, is joining as a subnet.',
    [S.renderStats, S.renderRnp023],
  ],
  'gpu-depth': [
    'yes',
    4,
    'GPU-native: rendering plus an H100/H200 subnet',
    'Built for GPUs: the rendering network plus an enterprise compute subnet (H100, H200, A100, MI300) sized at "up to 1,200 NVIDIA H200" equivalent, with Salad’s consumer-GPU fleet joining in 2026.',
    [S.renderRnp021, S.renderRnp023],
  ],
});

const fluenceRow = row('fluence', {
  'permissionless-operators': [
    'no',
    1,
    'Tier 3/4 data centers with KYB review',
    '"Providers must operate Tier 3 or Tier 4 data centers and complete a KYB review before joining"; their machines are managed through an application hosted by the Fluence team.',
    [S.fluenceConnect, S.fluenceProviderOverview],
  ],
  'multi-operator-redundancy': [
    'no',
    1,
    'One provider per instance',
    'An offer is one or more compute peers "in the same data center", and a peer "is the actual machine that runs your workload". Multi-VM setups (with VPC since September 2026) are assembled by hand.',
    [S.fluenceCpu],
  ],
  'self-healing': [
    'no',
    0,
    'Terminated instances are simply gone',
    '"Terminated instances are no longer accessible, and data stored on them is lost"; unused funds are refunded, but no automatic failover is documented.',
    [S.fluenceManageVm],
  ],
  'replicated-data': [
    'no',
    1,
    'Volumes since April 2026, on one provider',
    'Persistent volumes for VMs arrived on 2026-04-20, but they live with one provider and are not replicated across machines.',
    [S.fluenceStorage, S.fluenceManageVm],
  ],
  'geographic-spread': [
    'partial',
    3,
    '32 regions, 71 data centers (company claim)',
    'Fluence says it offers "1400+ GPUs across 32 regions and 71 data centers" (February 2026), all in vetted facilities.',
    [S.fluenceTelegram, S.fluencePr],
  ],
  'deplatforming-resistance': [
    'no',
    1,
    'Central console; providers can terminate',
    'Providers terminate instances for "violating the terms of service" or "running malicious workloads", and the console and provider software are hosted centrally by the Fluence team.',
    [S.fluenceManageVm, S.fluenceProviderOverview],
  ],
  'open-source': [
    'no',
    1,
    'Legacy stack archived, current stack closed',
    'The original open-source stack is archived; the current console and provider software have no public, licensed repositories.',
    [S.fluenceGithub],
  ],
  'any-container': [
    'partial',
    3,
    'GPU containers and custom VM images',
    'GPU containers run Docker images; CPU VMs boot custom disk images, on which you can run Docker yourself.',
    [S.fluenceGpu, S.fluenceCpu],
  ],
  'always-on': ['yes', 4, 'Always-on CPU and GPU VMs', 'CPU VMs are billed daily and GPU instances hourly, and both run continuously while funded.', [S.fluenceBalance, S.fluenceCpu]],
  'built-in-networking': [
    'partial',
    2,
    'Domain and forwarded ports on GPU containers',
    'GPU containers get "a domain" and forwarded external ports, plus an HTTP URI if port 80 is enabled; VMs get public IPs. Automatic TLS, custom domains and load balancing are not documented.',
    [S.fluenceGpuInstances, S.fluenceStorage],
  ],
  ecosystem: ['partial', 2, 'Young marketplace: VPC, MCP, x402', 'A young GPU and CPU marketplace that has added VPC networking, an MCP server and agent payments in 2026.', [S.fluenceAiFocus, S.fluenceAuctions]],
  'predictable-pricing': [
    'yes',
    4,
    'USD billing; "zero egress fees"',
    '"CPU Cloud uses daily billing in USD" and GPU Cloud hourly prepaid USD, topped up by card or crypto. The homepage promises "Zero egress fees and unlimited bandwidth" (a vendor claim).',
    [S.fluenceBalance, S.fluenceHome],
  ],
  'network-scale': [
    'partial',
    2,
    '1,400+ GPUs (company claim)',
    '"1400+ GPUs" (February 2026), plus "6,000+ GPUs in clusters" listed for auctions in August 2026; there is no live public explorer.',
    [S.fluenceTelegram, S.fluenceAuctions],
  ],
  'gpu-depth': [
    'yes',
    4,
    'H100 from $1.24/h, H200 and B200 clusters',
    'H100 80GB from $1.24 an hour and H200 from $2.96 (March 2026), with reserved H200 and B200 clusters sold by reverse auction.',
    [S.fluencePr, S.fluenceAuctions],
  ],
});

const golemRow = row('golem', {
  'permissionless-operators': [
    'yes',
    5,
    'Almost any Linux machine can provide',
    '"In general, almost any computer might act as a provider": the requirements are x86-64 Linux with virtualization, with no stake or KYC.',
    [S.golemOverview, S.golemProvider],
  ],
  'multi-operator-redundancy': [
    'partial',
    2,
    'Many providers per job, no service replicas',
    'A requestor "can use the hardware from many providers at the same time" for parallel tasks, but a single service is not replicated.',
    [S.golemOverview],
  ],
  'self-healing': [
    'partial',
    2,
    'Failed tasks retry; services don’t migrate',
    'The Task API relaunches a failed task "on a different provider" (3 retries by default). Long-running services have no documented migration.',
    [S.golemErrors],
  ],
  'replicated-data': ['no', 0, 'No persistent volumes documented', 'The docs describe no persistent or replicated storage for workloads.', [S.golemOverview]],
  'geographic-spread': ['partial', 2, '792 providers online', '792 providers were online on 2026-10-24; Golem publishes no country breakdown.', [S.golemStats]],
  'deplatforming-resistance': [
    'partial',
    3,
    'Providers choose; Golem Factory gates versions',
    'Providers set their own outbound and requestor rules, and no network-wide content blocklist is documented, but Golem Factory blocked vulnerable provider versions from the marketplace in 2026, so a central control point exists.',
    [S.golemInternet, S.golemSecurity],
  ],
  'open-source': ['yes', 5, 'GPL-3.0', 'The Yagna node software is GPL-3.0 on GitHub.', [S.golemRepo]],
  'any-container': [
    'partial',
    3,
    'Docker-derived VM images, or WASM',
    'Workloads run in a "Golem VM Image, which is derived from the Docker image", or as WebAssembly; there is no plain docker run.',
    [S.golemOverview],
  ],
  'always-on': [
    'no',
    1,
    'No direct inbound access for public sites',
    'Services can run, but inbound access goes through a requestor-side proxy over the Golem VPN, which "does not enable direct, inbound access" to providers, so hosting a public website is impractical.',
    [S.golemYagna012],
  ],
  'built-in-networking': ['no', 0, 'No domains, TLS or load balancing', 'Outbound internet is off unless a provider allows it, and there are no public endpoints, domains or certificates.', [S.golemInternet, S.golemYagna012]],
  ecosystem: ['no', 1, 'Small; batch and Ray tooling', 'SDKs and a Ray integration for batch work, with a small developer community.', [S.golemOverview]],
  'predictable-pricing': [
    'partial',
    2,
    'Provider-set GLM prices',
    'Each provider sets CPU-hour, environment-hour and start prices in GLM, and requestors choose offers; there is no USD or stablecoin option.',
    [S.golemFaq],
  ],
  'network-scale': [
    'partial',
    2,
    '792 providers, 5,015 cores, 0 GPUs',
    '792 providers with 5,015 cores, about 7.7 TB of RAM and no GPUs were online on 2026-10-24.',
    [S.golemStats],
  ],
  'gpu-depth': ['no', 0, '0 GPUs online', 'A GPU provider exists in beta, but the live stats showed 0 GPUs online on 2026-10-24.', [S.golemStats]],
});

const thetaRow = row('theta', {
  'permissionless-operators': [
    'partial',
    3,
    'Community GPUs open; high end hosted on GCP and AWS',
    '"Anyone with idle GPUs" can run the EdgeCloud client and set an hourly rate, but the H100/H200 capacity runs in "partner data centers and enterprise cloud infrastructure from Google Cloud and AWS", and the chain’s validators are enterprises.',
    [S.thetaClient, S.thetaWhat],
  ],
  'multi-operator-redundancy': [
    'partial',
    3,
    'Replica counts on dedicated deployments',
    'Dedicated and custom container deployments take minimum and maximum replica counts behind one endpoint; which operators those replicas land on is not documented.',
    [S.thetaApiDeploy, S.thetaGeneric],
  ],
  'self-healing': [
    'partial',
    3,
    'Hybrid jobs reroute on node loss',
    'The hybrid beta promises that "If a node goes offline mid-task, the system will reroute the job to another available GPU"; this is not documented for SSH GPU nodes.',
    [S.thetaFaq],
  ],
  'replicated-data': ['no', 1, 'No replicated volumes documented', 'The deployment docs describe no persistent storage replicated across machines.', [S.thetaGeneric]],
  'geographic-spread': [
    'partial',
    3,
    '30,000+ edge nodes; big GPUs on hyperscalers',
    'Theta cites "more than 30,000 edge nodes", but edge nodes need no GPU, and its high-end GPUs sit in Google Cloud and AWS regions.',
    [S.thetaWhat, S.thetaEdgeNode],
  ],
  'deplatforming-resistance': [
    'no',
    1,
    'Theta Labs runs the platform',
    'EdgeCloud is operated centrally by Theta Labs, and node operators cannot yet opt out of jobs (listed as "coming soon").',
    [S.thetaFaq, S.thetaWhat],
  ],
  'open-source': ['partial', 2, 'Ledger GPL-3.0; EdgeCloud closed', 'The blockchain ledger is GPL-3.0; the EdgeCloud platform and client are not open source.', [S.thetaLedger, S.thetaClient]],
  'any-container': [
    'partial',
    3,
    'Any container, one port mapped to HTTPS',
    'EdgeCloud runs "any containerized workload", with one container port mapped to HTTPS on 443.',
    [S.thetaGeneric],
  ],
  'always-on': ['partial', 3, 'Dedicated inference endpoints', 'Dedicated deployments stay up behind an HTTPS endpoint, aimed mainly at AI inference and model APIs.', [S.thetaApiDeploy, S.thetaOverview]],
  'built-in-networking': [
    'partial',
    3,
    'HTTPS endpoint per deployment; no custom domains',
    'Each deployment gets an HTTPS endpoint under onthetaedgecloud.com with optional basic auth; custom domains are not documented.',
    [S.thetaApiDeploy],
  ],
  ecosystem: ['partial', 2, 'Model APIs, 36 universities', 'On-demand model APIs, agents and video services, with 36 universities and research institutions as customers (June 2026).', [S.thetaOverview, S.thetaAcademic]],
  'predictable-pricing': [
    'partial',
    3,
    'USD hourly list prices',
    'Public USD hourly prices (H100 $2.29 and H200 $3.69 in the API on 2026-10-24; the homepage shows a different H200 price). Egress charges are not documented.',
    [S.thetaVmList],
  ],
  'network-scale': ['partial', 3, '30,000+ edge nodes (GPU optional)', 'Theta reports more than 30,000 edge nodes but publishes no GPU count.', [S.thetaWhat, S.thetaEdgeNode]],
  'gpu-depth': [
    'yes',
    4,
    'H100/H200 on demand plus community RTX',
    'On-demand H100 and H200 (hosted on Google Cloud and AWS) alongside A100, V100 and cheap community RTX cards.',
    [S.thetaVmList, S.thetaWhat],
  ],
});

const phalaRow = row('phala', {
  'permissionless-operators': [
    'partial',
    2,
    'GPU workers verified by the Phala team',
    'GPU providers post vPHA collateral (1,250 for an H100) and the Phala team verifies each worker’s hardware before it serves.',
    [S.phalaRegister, S.phalaProviders],
  ],
  'multi-operator-redundancy': [
    'partial',
    2,
    'Replicas yes, traffic splitting no',
    'You can run replicas and pin them to nodes in different regions, but "Phala Cloud does not distribute traffic across replicas. Each replica gets its own public endpoint."',
    [S.phalaReplicas],
  ],
  'self-healing': [
    'partial',
    2,
    'Others keep serving; no auto-replace documented',
    'If one replica’s node goes down "the others keep serving", but routing around it is up to you, and automatic replacement is not documented.',
    [S.phalaReplicas],
  ],
  'replicated-data': [
    'no',
    1,
    '"Replicas do not share filesystems"',
    '"Replicas do not share filesystems, memory, or any in-process state"; stateful apps need an external database or object store.',
    [S.phalaReplicas],
  ],
  'geographic-spread': [
    'partial',
    2,
    'No public node or country count',
    'Phala publishes no node or country count; replicas can be pinned to nodes in different regions.',
    [S.phalaReplicas, S.phalaProviders],
  ],
  'deplatforming-resistance': [
    'partial',
    2,
    'TEE privacy, but a company-run console',
    'Workloads run inside TEEs, so hardware operators cannot read them, but deployment goes through Phala Cloud, a company-run service, onto team-verified workers.',
    [S.phalaHome, S.phalaRegister],
  ],
  'open-source': ['partial', 3, 'dstack TEE framework is Apache-2.0', 'The dstack TEE framework is Apache-2.0 and co-developed with Flashbots.', [S.phalaDstack]],
  'any-container': ['yes', 4, 'Docker Compose into confidential VMs', 'You "move existing Docker Compose workloads into CPU or GPU confidential machines".', [S.phalaHome]],
  'always-on': ['yes', 4, 'Confidential VMs with HTTPS endpoints', 'Confidential VMs run continuously behind automatic HTTPS endpoints.', [S.phalaNetworking]],
  'built-in-networking': [
    'partial',
    3,
    'Automatic HTTPS and custom domains; no LB',
    'Automatic HTTPS endpoints with TLS, and custom domains with automatic certificates, but no load balancing across replicas.',
    [S.phalaNetworking, S.phalaDomain, S.phalaReplicas],
  ],
  ecosystem: [
    'partial',
    2,
    'OpenRouter-served models, TEE tooling',
    'Serves 22 models on OpenRouter and reports 183 billion confidential tokens a day (self-reported, October 2026).',
    [S.phalaOpenRouter, S.phalaHome],
  ],
  'predictable-pricing': ['partial', 3, 'Published hourly GPU prices', 'H200 from $4.40 and B300 from $8.20 per GPU-hour on its site; egress pricing was not found.', [S.phalaHome]],
  'network-scale': ['partial', 2, 'Strong traction, hardware count unpublished', 'Inference volume is high by its own account, but the amount of hardware behind it is not published.', [S.phalaHome, S.phalaProviders]],
  'gpu-depth': ['yes', 4, 'H100, H200, B300 inside TEEs', 'Confidential GPU machines on H100, H200 and B300.', [S.phalaGpuTee, S.phalaHome]],
});

const awsRow = row('aws', {
  'permissionless-operators': ['no', 0, 'Amazon’s own data centers only', 'All hardware is owned and operated by Amazon.', [S.awsInfra]],
  'multi-operator-redundancy': [
    'partial',
    2,
    'Multi-AZ if you build it; one operator',
    'AWS does not automatically replicate resources across Regions; you protect against an AZ failure "by launching EC2 instances in multiple Availability Zones". A single instance gets a 99.5% SLA and 99.99% needs two or more AZs. Every copy is still an AWS machine.',
    [S.awsAZ, S.awsSla],
  ],
  'self-healing': [
    'partial',
    3,
    'Auto Scaling replaces instances, once configured',
    'An Auto Scaling group "replaces it with a new instance" when an instance is unhealthy. You create the group, template and health checks, and it heals inside AWS, not around an AWS regional failure like us-east-1 in October 2025.',
    [S.awsAsg, S.awsPes2025],
  ],
  'replicated-data': [
    'yes',
    4,
    'EBS replicated within its AZ',
    'An EBS volume "is automatically replicated within its Availability Zone to prevent data loss due to failure of any single hardware component"; snapshots are stored across several AZs. Live cross-AZ or cross-region copies are yours to set up.',
    [S.awsEbsFeatures],
  ],
  'geographic-spread': [
    'partial',
    3,
    '39 regions, one company’s network',
    '124 Availability Zones in 39 regions (two more announced), all operated by Amazon. In March 2026 drone strikes took out two of the three zones in its UAE region at once.',
    [S.awsInfra, S.regMiddleEast],
  ],
  'deplatforming-resistance': [
    'no',
    1,
    'AWS may suspend or terminate',
    'The Customer Agreement lets AWS suspend access for security risks, harm to AWS or other customers, breach or non-payment (§4.1), and terminate "for any reason" on 30 days’ notice (§5.2). Parler got 24 hours’ notice in January 2021.',
    [S.awsAgreement, S.awsAup, S.tcParler],
  ],
  'open-source': ['no', 0, 'Proprietary control plane', 'AWS contributes to open source, but the control plane that schedules and runs your workload is proprietary.', [S.awsProducts]],
  'any-container': ['yes', 5, 'ECS, EKS, Fargate or any VM', 'Containers run on ECS, EKS, Fargate or plain EC2 instances.', [S.awsContainers]],
  'always-on': ['yes', 5, 'Anything, around the clock', 'Long-running VMs, containers and managed databases are the core product.', [S.awsProducts]],
  'built-in-networking': [
    'partial',
    3,
    'Load balancers, certificates, DNS: separate products',
    'Load balancing, certificates and DNS are excellent but separate products you configure and pay for: an Application Load Balancer starts at $0.0225 an hour plus capacity units.',
    [S.awsElbPricing],
  ],
  ecosystem: [
    'yes',
    5,
    'The largest managed-service catalog',
    'A vast catalog of managed databases, queues, analytics and AI services, the largest partner ecosystem, and 28% of the cloud infrastructure market.',
    [S.awsProducts, S.synergyQ2],
  ],
  'predictable-pricing': [
    'no',
    1,
    '$0.09/GB egress, IPv4 and CPU-credit charges',
    'Data out to the internet costs $0.09/GB after 100 GB a month, a public IPv4 address $0.005 an hour, and burstable t3 instances bill surplus CPU credits at $0.05 per vCPU-hour. Egress can be waived on request when you leave AWS.',
    [S.awsEc2Pricing, S.awsVpcPricing, S.awsBurstable, S.awsEgressExit],
  ],
  'network-scale': ['yes', 5, 'World’s largest cloud', 'Amazon holds 28% of a cloud infrastructure market worth $143 billion a quarter (Synergy, Q2 2026).', [S.synergyQ2]],
  'gpu-depth': ['yes', 5, 'P5 (H100) and P5e/P5en (H200)', '"P5 instances, powered by NVIDIA H100 Tensor Core GPUs, and P5e and P5en instances powered by NVIDIA H200 Tensor Core GPUs."', [S.awsP5]],
});

const azureRow = row('azure', {
  'permissionless-operators': ['no', 0, 'Microsoft’s own data centers only', 'All hardware is owned and operated by Microsoft.', [S.azureInfra]],
  'multi-operator-redundancy': [
    'partial',
    2,
    'Zones and scale sets, if you configure them',
    '"A zonal VM isn’t resilient to zone outages" and "VMs are single-region resources"; for multi-region "you need to implement replication, load balancing, and failover". Reliability "is a shared responsibility".',
    [S.azureReliability],
  ],
  'self-healing': [
    'partial',
    3,
    'Scale-set automatic repairs (opt-in)',
    'Virtual Machine Scale Sets can delete and replace unhealthy instances once you enable application health monitoring and the automatic-repairs policy.',
    [S.azureRepairs],
  ],
  'replicated-data': [
    'yes',
    4,
    'Disks keep 3 copies (LRS) or span 3 zones (ZRS)',
    'Locally redundant disks keep "three copies in a single data center"; zone-redundant disks replicate "across three Azure availability zones".',
    [S.azureDiskRedundancy],
  ],
  'geographic-spread': ['partial', 3, '80+ regions, one operator', '"80+ Azure regions" and "500+ datacenters", all operated by Microsoft.', [S.azureInfra]],
  'deplatforming-resistance': [
    'no',
    1,
    'Microsoft may suspend for policy breaches',
    'Microsoft "may suspend your use of the Online Services" for non-payment or breaches of its Acceptable Use Policy, and can terminate subscriptions after repeated suspensions.',
    [S.azureOsa],
  ],
  'open-source': ['no', 0, 'Proprietary control plane', 'The platform that schedules and runs your workload is proprietary.', [S.azureProducts]],
  'any-container': ['yes', 5, 'AKS, Container Apps, ACI', 'Containers run on Azure Kubernetes Service, Container Apps, Container Instances or plain VMs.', [S.azureContainerApps]],
  'always-on': ['yes', 5, 'Anything, around the clock', 'Long-running VMs, containers and managed databases are the core product.', [S.azureProducts]],
  'built-in-networking': [
    'partial',
    3,
    'Load Balancer and Front Door: separate and billed',
    'Load balancing and global ingress are separate products you configure and pay for (a Standard Load Balancer costs $0.025 an hour for its first five rules, plus data processed).',
    [S.azureLbPricing, S.azurePricesApi],
  ],
  ecosystem: ['yes', 5, 'Huge catalog, deep enterprise ties', 'A huge catalog of managed services tied into Microsoft 365 and Entra ID, and 20% of the cloud infrastructure market.', [S.azureProducts, S.synergyQ2]],
  'predictable-pricing': ['no', 1, '$0.087/GB egress after 100 GB', 'Internet egress costs $0.087/GB after the first 100 GB a month, and public IPs and disk operations are billed separately.', [S.azureBandwidth, S.azureIpPricing]],
  'network-scale': ['yes', 5, '20% of the cloud market', 'Microsoft holds 20% of a cloud infrastructure market worth $143 billion a quarter (Synergy, Q2 2026).', [S.synergyQ2]],
  'gpu-depth': [
    'yes',
    5,
    'ND H100 v5: 8×H100, scales to thousands',
    'ND H100 v5 VMs have eight NVIDIA H100 GPUs each, and deployments "can scale up to thousands of GPUs".',
    [S.azureNdH100],
  ],
});

const doRow = row('digitalocean', {
  'permissionless-operators': ['no', 0, 'DigitalOcean’s own data centers only', 'All hardware is operated by DigitalOcean.', [S.doRegions]],
  'multi-operator-redundancy': [
    'no',
    1,
    'Per-Droplet SLA, no automatic replicas',
    'The 99.99% SLA applies "for each individual Droplet instance", and nothing is replicated automatically. Running several Droplets behind a $12-a-month load balancer is up to you.',
    [S.doSla, S.doLb],
  ],
  'self-healing': [
    'partial',
    2,
    'Droplets don’t move; use Kubernetes or App Platform',
    'A Droplet is a single VM. Automatic failover means running managed Kubernetes or App Platform, or building it yourself.',
    [S.doSla, S.doAppPlatform],
  ],
  'replicated-data': [
    'partial',
    3,
    'Ceph-backed volumes in one region',
    'Block-storage volumes are described as having "Ceph-backed durability", though DigitalOcean doesn’t state a replica count, and data stays in one region unless you copy it.',
    [S.doVolumes],
  ],
  'geographic-spread': ['partial', 2, '16 data centers in 13 regions', '"16 datacenters across 13 regions", all operated by DigitalOcean.', [S.doRegions]],
  'deplatforming-resistance': [
    'no',
    1,
    'Terminate "at any time, with or without notice"',
    'The terms reserve the right to terminate access "at any time, with or without notice, effective immediately", and the AUP allows suspension "even if a violation is committed unintentionally".',
    [S.doTos, S.doAup],
  ],
  'open-source': ['no', 0, 'Proprietary control plane', 'The platform that schedules and runs your workload is proprietary.', [S.doProducts]],
  'any-container': [
    'yes',
    5,
    'App Platform images, Kubernetes, Droplets',
    'App Platform "deploys applications from Git repositories or container images", alongside managed Kubernetes and plain Droplets.',
    [S.doAppPlatform],
  ],
  'always-on': ['yes', 5, 'Anything, around the clock', 'Long-running Droplets, containers and managed databases are the core product.', [S.doProducts]],
  'built-in-networking': [
    'partial',
    3,
    'App Platform domains; Droplet LBs extra',
    'App Platform includes a DigitalOcean subdomain plus custom domains; for Droplets, load balancers cost $12 a month per node.',
    [S.doAppPlatform, S.doLb],
  ],
  ecosystem: ['yes', 4, 'Managed databases, Kubernetes, storage', 'Managed databases, Kubernetes, object storage and App Platform, with a strong documentation and tutorial community.', [S.doProducts]],
  'predictable-pricing': [
    'yes',
    4,
    'Flat price, 4 TB transfer, $0.01/GiB after',
    'Droplets have flat monthly prices (the 2 vCPU / 4 GB Droplet is $24 with 4,000 GiB of transfer), and overage is $0.01/GiB.',
    [S.doPricing, S.doBandwidth],
  ],
  'network-scale': ['partial', 3, 'A mid-sized public cloud', 'A mid-sized public cloud of 16 data centers in 13 regions, not among Synergy’s leading providers.', [S.doRegions, S.synergyQ2]],
  'gpu-depth': ['yes', 4, 'H100, H200, B300, MI300X GPU Droplets', 'GPU Droplets with NVIDIA H100, H200 and B300 and AMD MI300X, MI325X and MI350X.', [S.doGpu]],
});

const vercelRow = row('vercel', {
  'permissionless-operators': [
    'no',
    0,
    'Vercel’s platform, on AWS regions',
    'Compute runs in 19 Vercel regions mapped one-to-one onto AWS regions (iad1 is us-east-1); nobody else can contribute hardware.',
    [S.vercelRegions],
  ],
  'multi-operator-redundancy': [
    'partial',
    3,
    'Multi-AZ functions by default, one cloud below',
    '"Vercel Functions have multiple availability zone redundancy by default"; multi-region functions need Pro (up to 5 regions), and automatic regional failover is Enterprise-only. All of it sits on one provider’s infrastructure.',
    [S.vercelFunctionRegions],
  ],
  'self-healing': [
    'partial',
    3,
    'CDN reroutes; function failover is Enterprise',
    'During a regional outage, CDN traffic "is automatically rerouted to the next closest region"; functions fail over between regions only on Enterprise. The AWS us-east-1 outage of 2025-10-20 disrupted Vercel itself.',
    [S.vercelRegions, S.vercelFunctionRegions, S.vercelOct20],
  ],
  'replicated-data': [
    'partial',
    2,
    'Stateless compute; storage via Blob or partners',
    '"Nothing written to the local filesystem or process memory survives between instances"; data goes to Vercel Blob or marketplace databases such as Neon and Upstash.',
    [S.vercelStorage, S.vercelDocker],
  ],
  'geographic-spread': [
    'partial',
    3,
    '126 PoPs; 19 compute regions on AWS',
    'A CDN of 126 points of presence in 51 countries, but compute runs in 19 regions, all of them AWS regions.',
    [S.vercelRegions],
  ],
  'deplatforming-resistance': [
    'no',
    1,
    '30 days’ notice, or none on Hobby',
    'Vercel may terminate an account "at any time by providing thirty (30) days prior notice", immediately if you exceed its limits, and Hobby projects "without notice for any reason or no reason".',
    [S.vercelTerms],
  ],
  'open-source': ['no', 0, 'Next.js is open; the platform is not', 'Next.js is open source, but the platform that builds and runs your deployment is proprietary.', [S.nextjs]],
  'any-container': [
    'partial',
    3,
    'Container images in beta, request-driven',
    '"Container images and Vercel Services are in beta and available on all plans", but they run as request-driven functions that scale to zero after 5 idle minutes, with no persistent disk. Daemons (also beta) run background containers with no inbound traffic.',
    [S.vercelDocker, S.vercelDaemons],
  ],
  'always-on': [
    'partial',
    3,
    'Great for sites and APIs, not for servers',
    'Websites and APIs are Vercel’s core strength, but no process takes inbound traffic continuously: function requests top out at 800 seconds on Pro, so databases and game servers live elsewhere.',
    [S.vercelDuration, S.vercelDocker],
  ],
  'built-in-networking': [
    'yes',
    5,
    'Domains, TLS and a global CDN out of the box',
    'Automatic domains and TLS, with traffic terminated at 126 PoPs and routed over a private network to the nearest region.',
    [S.vercelRegions],
  ],
  ecosystem: ['yes', 4, 'Next.js, marketplace, storage partners', 'Next.js, a marketplace of storage and database integrations, and a strong frontend community.', [S.nextjs, S.vercelStorage]],
  'predictable-pricing': [
    'partial',
    2,
    'Seats plus usage; $0.15/GB over 1 TB',
    'Pro is $20 per seat a month with a usage credit; data transfer beyond 1 TB starts at $0.15/GB, and functions are billed by usage.',
    [S.vercelPricing],
  ],
  'network-scale': ['partial', 3, 'Runs on AWS capacity', 'Vercel operates 126 PoPs and 19 compute regions on AWS infrastructure; the underlying capacity is AWS’s.', [S.vercelRegions]],
  'gpu-depth': ['no', 0, 'No GPU compute', 'Vercel offers no GPU instances; AI workloads call models hosted elsewhere.', [S.vercelPricing]],
});

const gcpRow = row('gcp', {
  'permissionless-operators': ['no', 0, 'Google’s own data centers only', 'All hardware is owned and operated by Google.', [S.gcpLocations]],
  'multi-operator-redundancy': [
    'partial',
    2,
    'Multi-zone if you build it; one operator',
    'A single instance gets a 99.9% SLA; 99.99% requires "Instances in Multiple Zones". Replicas are yours to configure, and all of them run on Google.',
    [S.gcpSla],
  ],
  'self-healing': [
    'partial',
    3,
    'Managed-instance-group autohealing, once configured',
    'Health checks "detect unhealthy VMs and proactively recreate those VMs", once you create a health check and an autohealing policy for a managed instance group.',
    [S.gcpMig],
  ],
  'replicated-data': [
    'yes',
    4,
    'Persistent Disk over many disks; regional PD spans 2 zones',
    '"The data on each Persistent Disk volume is distributed across several physical disks"; Regional Persistent Disk keeps a replica in a second zone.',
    [S.gcpPd],
  ],
  'geographic-spread': [
    'partial',
    3,
    '43 regions, 130 zones, one operator',
    '"43 global regions and 130 zones", all operated by Google. On 2026-10-20 a power failure in one London zone spilled over to the other two.',
    [S.gcpLocations, S.gcpIncidentLondon],
  ],
  'deplatforming-resistance': [
    'no',
    1,
    'Automated suspensions happen',
    'Google may suspend for AUP violations not fixed within 24 hours, or immediately to protect its services. In May 2026 an automated action wrongly suspended Railway’s production account without notice, taking every Railway region offline for about 8 hours.',
    [S.gcpTerms, S.gcpAup, S.railway],
  ],
  'open-source': ['no', 0, 'Proprietary control plane', 'Google started Kubernetes, but the platform that runs your workload is proprietary.', [S.gcpProducts]],
  'any-container': ['yes', 5, 'Cloud Run, GKE, any VM', 'Containers run on Cloud Run, Google Kubernetes Engine or plain VMs.', [S.gcpRun]],
  'always-on': ['yes', 5, 'Anything, around the clock', 'Long-running VMs, containers and managed databases are the core product.', [S.gcpProducts]],
  'built-in-networking': [
    'partial',
    3,
    'Cloud Load Balancing: separate and billed',
    'Load balancing is a separate product: forwarding rules cost $0.025 an hour for the first five, plus $0.008 per GiB processed. Cloud Run adds URLs and TLS for its own services.',
    [S.gcpNetwork, S.gcpRun],
  ],
  ecosystem: ['yes', 5, 'Deep data and AI catalog', 'A broad catalog of managed data, analytics and AI services, and 15% of the cloud infrastructure market.', [S.gcpProducts, S.synergyQ2]],
  'predictable-pricing': [
    'no',
    1,
    '$0.12/GiB egress on the default tier',
    'Premium Tier internet egress starts at $0.12/GiB; external IPv4 costs $0.005 an hour. Egress can be waived if you leave Google Cloud entirely.',
    [S.gcpNetwork, S.gcpExit],
  ],
  'network-scale': ['yes', 5, '15% of the cloud market', 'Google holds 15% of a cloud infrastructure market worth $143 billion a quarter (Synergy, Q2 2026).', [S.synergyQ2]],
  'gpu-depth': ['yes', 5, 'A3 (H100/H200), A4 (B200), A4X (GB200/GB300)', 'A3 machines carry H100 or H200 GPUs, A4 carries B200, and A4X carries GB200 and GB300.', [S.gcpGpus]],
});

const hetznerRow = row('hetzner', {
  'permissionless-operators': ['no', 0, 'Hetzner’s own data centers only', 'All hardware is owned and operated by Hetzner.', [S.hetznerLocations]],
  'multi-operator-redundancy': [
    'no',
    1,
    'One location; spread groups only split hosts',
    'A server lives in one location; spread placement groups only put servers "on different physical servers". Multi-location redundancy is up to you.',
    [S.hetznerPlacement],
  ],
  'self-healing': [
    'no',
    1,
    'No managed failover',
    'Hetzner Cloud offers no managed instance groups or automatic replacement; failover is something you build yourself.',
    [S.hetznerPlacement, S.hetznerCloud],
  ],
  'replicated-data': [
    'partial',
    3,
    'Volumes stored on 3 servers; no backups',
    'For Volumes, "every block of data is stored on three different physical servers", but "we do not provide Backups or Snapshots for Volumes", and data stays in one location.',
    [S.hetznerVolumes],
  ],
  'geographic-spread': [
    'no',
    1,
    '6 locations in 4 countries',
    'Cloud locations are Falkenstein and Nuremberg (Germany), Helsinki (Finland), Ashburn and Hillsboro (US) and Singapore.',
    [S.hetznerLocations],
  ],
  'deplatforming-resistance': [
    'no',
    0,
    'Bans crypto mining; cut off Solana validators',
    'The terms allow "locking or terminating the Customer’s services or account without notice for good cause" and ban crypto "mining, farming and plotting". In November 2022 more than 1,000 Solana validators went offline when Hetzner blocked crypto workloads.',
    [S.hetznerTerms, S.theBlockHetzner],
  ],
  'open-source': ['no', 0, 'Proprietary platform', 'The platform that provisions and runs your servers is proprietary.', [S.hetznerCloud]],
  'any-container': ['yes', 4, 'Plain VMs: run Docker yourself', 'Cloud servers are plain VMs on which you install Docker yourself; there is no managed container service.', [S.hetznerCloud]],
  'always-on': ['yes', 5, 'Always-on servers', 'Cloud and dedicated servers run continuously.', [S.hetznerCloud]],
  'built-in-networking': [
    'partial',
    2,
    'Load balancers sold separately; no automatic domains',
    'Load Balancers "distribute traffic across multiple target servers" as a separately priced product; there are no automatic app domains.',
    [S.hetznerLb],
  ],
  ecosystem: ['partial', 2, 'Servers, volumes, LBs; few managed services', 'Servers, volumes, load balancers and networking, but few managed higher-level services.', [S.hetznerCloud]],
  'predictable-pricing': [
    'yes',
    4,
    'Flat prices, 20 TB included in the EU',
    'Flat monthly prices with 20 TB of traffic included on EU plans and €1 per extra TB, though prices rose twice in 2026 (April and June), sharply on some plans.',
    [S.hetznerCostOptimized, S.hetznerRegular, S.hetznerPress2026],
  ],
  'network-scale': [
    'partial',
    3,
    'Six cloud locations, large dedicated estates',
    'Six cloud locations plus large dedicated-server estates. Its weight shows in crypto: in August 2022 roughly 16% of Ethereum nodes ran on Hetzner.',
    [S.fluxGeo, S.cryptoslateHetzner],
  ],
  'gpu-depth': [
    'partial',
    2,
    'RTX PRO Blackwell servers, no H100',
    'Dedicated GPU servers with NVIDIA RTX PRO 4000 and 6000 Blackwell cards (from €214 a month); no H100-class GPUs are listed.',
    [S.hetznerGpu],
  ],
});

export const cells: Cell[] = [
  ...fluxRow,
  ...akashRow,
  ...ionetRow,
  ...aethirRow,
  ...icpRow,
  ...renderRow,
  ...fluenceRow,
  ...golemRow,
  ...thetaRow,
  ...phalaRow,
  ...awsRow,
  ...azureRow,
  ...doRow,
  ...vercelRow,
  ...gcpRow,
  ...hetznerRow,
];

/* --------------------------------------------------------------------------
   Incidents
   -------------------------------------------------------------------------- */

export const incidents: Incident[] = [
  {
    id: 'aws-middle-east-2026',
    date: '2026-03-01',
    provider: 'AWS',
    kind: 'physical',
    title: 'Drone strikes knock out AWS’s UAE region',
    impact:
      'Objects "struck the data center, creating sparks and fire" in me-central-1; AWS later confirmed two UAE facilities were "directly struck" by drones and a Bahrain site was hit nearby. Two of the three UAE availability zones failed together, S3 saw high failure rates, and AWS told customers to back up and migrate. Two months later it said the region "is currently unable to reliably support customer applications".',
    affected: ['Snowflake (regional)', 'Gulf financial institutions'],
    sources: [S.regMiddleEast, S.heiseMiddleEast],
  },
  {
    id: 'aws-us-east-1-2025',
    date: '2025-10-20',
    provider: 'AWS',
    kind: 'outage',
    title: 'DynamoDB DNS bug takes down us-east-1',
    impact:
      'A race condition in DynamoDB’s DNS automation left its regional endpoint with an empty record, cascading into EC2, load balancers, Lambda and more. Ookla counted more than 17 million Downdetector reports, the biggest outage of 2025; CyberCube estimated insured losses of $38M to $581M.',
    durationHours: 14.5,
    affected: ['Snapchat', 'Reddit', 'Robinhood', 'Coinbase', 'Perplexity', 'Vercel'],
    sources: [S.awsPes2025, S.regAwsPostmortem, S.ooklaOutages, S.cybercube, S.insurerAws, S.jakartaAws, S.vercelOct20],
  },
  {
    id: 'gcp-railway-2026',
    date: '2026-05-19',
    provider: 'Google Cloud',
    kind: 'deplatforming',
    title: 'An automated suspension takes Railway offline',
    impact:
      'Google Cloud "placed Railway’s production account into a suspended status incorrectly, as part of an automated action", with no notice. Railway’s network control plane lived on GCP, so "all Railway workloads across all regions", including those on AWS and its own hardware, became unreachable.',
    durationHours: 8,
    affected: ['Railway and the apps it hosts'],
    sources: [S.railway, S.regRailway],
  },
  {
    id: 'cloudflare-2025-11',
    date: '2025-11-18',
    provider: 'Cloudflare',
    kind: 'outage',
    title: 'One oversized file breaks Cloudflare worldwide',
    impact:
      'A database permissions change doubled a Bot Management feature file past a hard limit and crashed core proxying across the network; Cloudflare called it its "worst outage since 2019". Core traffic was largely back after about 3 hours; everything was normal after about 5.8. Ookla counted more than 3.3 million Downdetector reports.',
    durationHours: 5.8,
    affected: ['ChatGPT', 'X', 'Shopify'],
    sources: [S.cfNov2025, S.cnbcCfNov, S.ooklaOutages],
  },
  {
    id: 'cloudflare-2025-12',
    date: '2025-12-05',
    provider: 'Cloudflare',
    kind: 'outage',
    title: 'Cloudflare fails again, 17 days later',
    impact:
      'A WAF change meant to shield customers from a React vulnerability triggered a bug in Cloudflare’s older proxy, and about 28% of all the HTTP traffic it serves returned errors. "We let the Internet down again," Cloudflare wrote.',
    durationHours: 0.4,
    affected: ['LinkedIn', 'Zoom', 'Banking sites'],
    sources: [S.cfDec2025, S.bgovCfDec],
  },
  {
    id: 'gcp-2025-06',
    date: '2025-06-12',
    provider: 'Google Cloud',
    kind: 'outage',
    title: 'One null pointer crashes Google Cloud worldwide, and Cloudflare with it',
    impact:
      'A policy change with blank fields hit new code with no error handling, and Service Control crash-looped globally, returning errors across IAM, Cloud Storage, BigQuery, Compute Engine and Workspace. Most regions recovered within about 3 hours, the last products after about 7.5. Cloudflare’s Workers KV, backed by a third-party cloud, failed for about 2.5 hours and took many Cloudflare products down with it.',
    durationHours: 7.5,
    affected: ['Spotify', 'Discord', 'Gmail', 'Google Drive', 'Cloudflare Workers KV'],
    sources: [S.gcpIncident2025, S.bnnGcp, S.cfJun2025],
  },
  {
    id: 'crowdstrike-2024',
    date: '2024-07-19',
    provider: 'CrowdStrike (Windows)',
    kind: 'outage',
    title: 'One faulty update crashes 8.5 million Windows machines',
    impact:
      'A CrowdStrike Falcon content update with a field-count mismatch sent Windows hosts into boot loops; Microsoft estimated 8.5 million devices, each needing hands-on repair. Airlines canceled about 9,650 flights over three days, and Parametrix put Fortune 500 losses at $5.4 billion. Hours earlier, a separate Azure storage fault had hit Central US. This was a single vendor rather than a host, but it shows the same concentration risk.',
    affected: ['Delta Air Lines', 'United Airlines', 'American Airlines', 'Spirit Airlines'],
    sources: [S.msCrowdstrike, S.crowdstrikeRca, S.flightsCrowdstrike, S.axiosCrowdstrike, S.azurePirCentralUs],
  },
  {
    id: 'azure-front-door-2025',
    date: '2025-10-29',
    provider: 'Microsoft Azure',
    kind: 'outage',
    title: 'An Azure Front Door config defect goes global',
    impact:
      'Incompatible configuration metadata crashed Front Door edge servers worldwide, taking down the Azure Portal, App Service, Entra ID and Microsoft 365 services; customer configuration changes stayed blocked for a week. It came nine days after the AWS outage.',
    durationHours: 8.4,
    affected: ['Microsoft 365', 'Xbox Live', 'Minecraft', 'Alaska Airlines check-in'],
    sources: [S.azurePirAfd, S.apAfd],
  },
  {
    id: 'azure-2026-02',
    date: '2026-02-02',
    provider: 'Microsoft Azure',
    kind: 'outage',
    title: 'A wrongly targeted policy breaks Azure VMs and GitHub Actions',
    impact:
      'A remediation workflow disabled anonymous access on the wrong storage accounts, including those holding VM extension packages, so VM operations failed in multiple regions; the retry surge then overloaded Managed Identities in East and West US.',
    durationHours: 12,
    affected: ['GitHub Actions', 'Azure DevOps', 'Azure Kubernetes Service'],
    sources: [S.azurePirFeb2026, S.nwAzureFeb],
  },
  {
    id: 'gcp-london-2026',
    date: '2026-10-20',
    provider: 'Google Cloud',
    kind: 'physical',
    title: 'Backup power fails in Google’s London zone',
    impact:
      'A grid disruption hit the facility hosting europe-west2-b; the controllers failed to start the backup generators, the UPS drained and the zone went dark, and failover load then strained the other two London zones. Around 38 products were affected.',
    durationHours: 6.2,
    affected: ['Revolut', 'Lloyds', 'HSBC', 'Royal Mail', 'HM Courts & Tribunals Service'],
    sources: [S.gcpIncidentLondon, S.regLondon, S.irishLondon],
  },
  {
    id: 'cloudflare-2026-02',
    date: '2026-02-20',
    provider: 'Cloudflare',
    kind: 'outage',
    title: 'A cleanup bug withdraws 1,100 customer IP ranges',
    impact:
      'A buggy cleanup task treated customers’ bring-your-own-IP prefixes as queued for deletion and withdrew about 1,100 of them from the internet via BGP; CDN, Spectrum and Magic Transit customers on those ranges became unreachable.',
    durationHours: 6.1,
    affected: ['Laravel Cloud'],
    sources: [S.cfFeb2026, S.laravelCf],
  },
  {
    id: 'aws-us-east-1-2021',
    date: '2021-12-07',
    provider: 'AWS',
    kind: 'outage',
    title: 'Internal network congestion cripples us-east-1',
    impact:
      'An automated scaling activity overwhelmed AWS’s internal network devices; EC2 APIs, console sign-in, Route 53 APIs, Amazon Connect and even AWS’s own status-page updates broke. The network recovered after about 7 hours, the last services after about 11.',
    durationHours: 7,
    affected: ['Disney+', 'Netflix', 'Slack', 'Ticketmaster', 'Robinhood', 'Coinbase', 'Ring'],
    sources: [S.awsPes2021, S.cnbcAws2021],
  },
  {
    id: 'fastly-2021',
    date: '2021-06-08',
    provider: 'Fastly',
    kind: 'outage',
    title: 'One customer’s setting takes down 85% of Fastly',
    impact:
      'A latent bug, triggered by one customer’s valid configuration change, made 85% of Fastly’s network return errors; 95% was back within 49 minutes.',
    durationHours: 0.8,
    affected: ['Amazon', 'Reddit', 'Twitch', 'gov.uk', 'The New York Times', 'The Guardian', 'GitHub', 'PayPal'],
    sources: [S.fastlyBlog, S.tcFastly],
  },
  {
    id: 'ovh-fire-2021',
    date: '2021-03-10',
    provider: 'OVHcloud',
    kind: 'physical',
    title: 'Fire destroys OVHcloud’s Strasbourg SBG2 data center',
    impact:
      'A fire that broke out at 00:47 local time destroyed SBG2 (14,046 servers) and part of SBG1, and the whole site was powered down. Netcraft counted about 3.6 million websites offline; some customers lost data for good because their backups sat in the same place, and SBG2 never came back.',
    sources: [S.ovhNews, S.netcraftOvh, S.dcdOvhCourt],
  },
  {
    id: 'aws-parler-2021',
    date: '2021-01-11',
    provider: 'AWS',
    kind: 'deplatforming',
    title: 'AWS gives a platform 24 hours, then pulls the plug',
    impact:
      'AWS suspended Parler’s account at 11:59 pm PST on 10 January under its terms of service, after Apple and Google had already pulled the app. The whole platform was offline for about five weeks until it found a new host.',
    affected: ['Parler'],
    sources: [S.tcParler, S.cnnParler],
  },
];

/* --------------------------------------------------------------------------
   Prices
   -------------------------------------------------------------------------- */

const SINGLE = '2 vCPU / 4 GB RAM / 50 GB SSD · 1 server · always on · 1 month';
const REDUNDANT = 'Same server × 3 replicas behind a load balancer · 1 month';
const PRICED = '2026-10-24';

export const prices: PricePoint[] = [
  {
    platformId: 'flux',
    workload: SINGLE,
    usdPerMonth: 1.99,
    note: 'One instance on one FluxNode: live network quote for a 2-core / 4,000 MB / 50 GB v8 app, identical from 5 unrelated nodes. Includes an automatic *.app.runonflux.io domain, automatic TLS for custom domains, and no ingress or egress fees. If the node goes down, the network rebuilds the app on another node automatically. 30.05 FLUX if paid in FLUX (5% discount).',
    asOf: PRICED,
    sources: [S.fluxCost, S.fluxPriceApi],
  },
  {
    platformId: 'akash',
    workload: SINGLE,
    usdPerMonth: 7.9,
    note: 'Akash’s default provider price script: 2 CPU × $1.60 + 4 GiB × $0.80 + 50 GiB persistent SSD × $0.03 = $7.90 a month (about $8.20 at current block times). It is a bid market, so each provider sets its own price: real 2 vCPU / 4 GiB leases from the last 90 days ranged from $0.98 to $14.28 (median $3.99, without 50 GB of persistent storage). One lease runs on one provider; a dedicated IPv4 lease is another $5. Paid in ACT, a USD-pegged credit made by burning AKT or bought by card.',
    asOf: PRICED,
    sources: [S.akashPriceScript, S.akashStats, S.akashLeases, S.akashBme],
  },
  {
    platformId: 'aws',
    workload: SINGLE,
    usdPerMonth: 38.02,
    note: 'us-east-1 on-demand: t3.medium $0.0416/h × 730 = $30.37, plus 50 GB gp3 at $0.08/GB = $4.00, plus a public IPv4 at $0.005/h = $3.65. Burstable: the baseline is 20% per vCPU, and sustained full load can add up to $58.40 in CPU credits. A non-burstable c7i.large comes to $72.80. Egress is $0.09/GB after 100 GB. Single instance in one Availability Zone.',
    asOf: PRICED,
    sources: [S.awsEc2Pricing, S.awsEbsPricing, S.awsVpcPricing, S.awsBurstable],
  },
  {
    platformId: 'gcp',
    workload: SINGLE,
    usdPerMonth: 33.11,
    note: 'us-central1: e2-medium (2 shared vCPUs at 50% each, 4 GB) $0.0335/h × 730 = $24.46, plus 50 GiB pd-balanced = $5.00, plus an external IPv4 at $0.005/h = $3.65. E2 gets no sustained-use discount. Premium Tier egress is $0.12/GiB. Single instance in one zone.',
    asOf: PRICED,
    sources: [S.gcpPricing, S.gcpDiskPricing, S.gcpNetwork, S.gcpE2],
  },
  {
    platformId: 'azure',
    workload: SINGLE,
    usdPerMonth: 38.82,
    note: 'East US: B2s (2 vCPU, 4 GiB, 20% baseline, End of Life series) $0.0416/h × 730 = $30.37, plus a 64 GiB E6 Standard SSD (the nearest tier above 50 GB) = $4.80, plus a static public IPv4 = $3.65; disk operations are extra. Egress is $0.087/GB after 100 GB. Single VM.',
    asOf: PRICED,
    sources: [S.azurePricesApi, S.azureVmPricing, S.azureDiskPricing, S.azureBv1],
  },
  {
    platformId: 'digitalocean',
    workload: SINGLE,
    usdPerMonth: 24,
    note: 'Basic Regular Droplet, 2 shared vCPUs / 4 GiB: a flat $24 including an 80 GiB SSD, an IPv4 address and 4,000 GiB of transfer ($0.01/GiB beyond that). Single Droplet with a per-Droplet SLA.',
    asOf: PRICED,
    sources: [S.doPricing, S.doBandwidth],
  },
  {
    platformId: 'hetzner',
    workload: SINGLE,
    usdPerMonth: 7.09,
    note: 'CX23 (2 shared vCPUs, 4 GB) at €5.99 including IPv4, about $7.09, excluding VAT. Caveats: it has a 40 GB disk (short of 50 GB), is EU-only (Germany and Finland), and was listed as "currently unavailable" on the day we checked. It includes 20 TB of traffic. Prices rose in April and June 2026; the nearest US plan, CPX21, costs about $38. Single server.',
    asOf: PRICED,
    sources: [S.hetznerCostOptimized, S.hetznerPriceAdj, S.hetznerPress2026],
  },
  {
    platformId: 'flux',
    workload: REDUNDANT,
    usdPerMonth: 4.99,
    note: 'Three instances on three different FluxNodes, live network quote (75.36 FLUX if paid in FLUX). Includes round-robin load balancing with health checks (Flux Domain Manager), an automatic domain and TLS, automatic respawn of lost copies, optional replicated volumes, and no egress fees. Ten copies cost $20.49.',
    asOf: PRICED,
    sources: [S.fluxCost, S.fdmRepo],
  },
  {
    platformId: 'akash',
    workload: REDUNDANT,
    usdPerMonth: 23.7,
    note: 'Three separate deployments on three providers at the default price script ($7.90 each). Akash has no load balancing across providers, so traffic routing, TLS and failover are yours to add and are not included; each deployment’s storage stays on its own provider.',
    asOf: PRICED,
    sources: [S.akashPriceScript, S.akashLeases, S.akashCustomDomain],
  },
  {
    platformId: 'aws',
    workload: REDUNDANT,
    usdPerMonth: 132.68,
    note: '3 × (t3.medium $30.37 + 50 GB gp3 $4.00) = $103.11 on private IPs, plus an Application Load Balancer at $0.0225/h = $16.43, plus one capacity unit at $0.008/h = $5.84, plus the load balancer’s two public IPv4 addresses = $7.30. Egress ($0.09/GB) and extra load-balancer capacity units are not included. All replicas run on AWS.',
    asOf: PRICED,
    sources: [S.awsEc2Pricing, S.awsEbsPricing, S.awsElbPricing, S.awsVpcPricing],
  },
  {
    platformId: 'gcp',
    workload: REDUNDANT,
    usdPerMonth: 106.63,
    note: '3 × (e2-medium $24.46 + 50 GiB pd-balanced $5.00) = $88.38, plus a load-balancer forwarding rule at $0.025/h = $18.25 (its IP is free while attached). Not included: $0.008/GiB of data processed by the load balancer and $0.12/GiB of egress. All replicas run on Google.',
    asOf: PRICED,
    sources: [S.gcpPricing, S.gcpDiskPricing, S.gcpNetwork],
  },
  {
    platformId: 'azure',
    workload: REDUNDANT,
    usdPerMonth: 127.41,
    note: '3 × (B2s $30.37 + E6 Standard SSD $4.80) = $105.51, plus a Standard Load Balancer at $0.025/h = $18.25, plus its public IPv4 = $3.65. Not included: load-balancer data processing, disk operations and egress ($0.087/GB). All replicas run on Microsoft.',
    asOf: PRICED,
    sources: [S.azurePricesApi, S.azureLbPricing, S.azureDiskPricing, S.azureIpPricing],
  },
  {
    platformId: 'digitalocean',
    workload: REDUNDANT,
    usdPerMonth: 84,
    note: '3 × $24 Droplets, plus a regional load balancer at $12 a month for one node. Each Droplet keeps its own 4,000 GiB of pooled transfer. All replicas run on DigitalOcean, in one region.',
    asOf: PRICED,
    sources: [S.doPricing, S.doLb],
  },
];

/* --------------------------------------------------------------------------
   Cloud market concentration
   -------------------------------------------------------------------------- */

// Synergy Research, Q2 2026 (IaaS + PaaS + hosted private cloud, $143.4B in
// the quarter), published 2026-07-30. "Everyone else" is the remainder.
export const cloudMarketShare: MarketShare[] = [
  { provider: 'Amazon Web Services', sharePct: 28, asOf: '2026-06-30', source: S.synergyQ2 },
  { provider: 'Microsoft Azure', sharePct: 20, asOf: '2026-06-30', source: S.synergyQ2 },
  { provider: 'Google Cloud', sharePct: 15, asOf: '2026-06-30', source: S.synergyQ2 },
  { provider: 'Everyone else', sharePct: 37, asOf: '2026-06-30', source: S.synergyQ2 },
];
