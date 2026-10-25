/**
 * The twelve rows of the Rosetta stone are twelve lenses on one theater. A row is matched by its
 * Kubernetes term, so a reordered or reworded data file keeps working; anything unmatched falls back
 * to the generic lens (the whole stage, no emphasis).
 *
 * Every row gets a caption: one plain line saying what to watch. Captions carry no periods and no numbers
 * (the data's own text holds those), and say what Flux does, not what it lacks.
 */

export type LensId =
  | 'registry'
  | 'schedule'
  | 'replicas'
  | 'reconcile'
  | 'probes'
  | 'failure'
  | 'ingress'
  | 'volumes'
  | 'geo'
  | 'spread'
  | 'secrets'
  | 'nodes'
  | 'generic';

export interface Lens {
  id: LensId;
  /** One line: what to watch. */
  watch: string;
  /** A forward link for the rows that belong to another chapter. */
  link?: { href: string; label: string };
}

const LENSES: Record<LensId, Lens> = {
  registry: { id: 'registry', watch: 'A block lands and every node reads the same registry' },
  schedule: { id: 'schedule', watch: 'No scheduler needed: every node decides for itself, and the first claims win' },
  replicas: { id: 'replicas', watch: 'One setting asks for more copies, each on a different node' },
  reconcile: { id: 'reconcile', watch: 'A crashed container is restarted by its own node, automatically' },
  probes: { id: 'probes', watch: 'Every copy is health checked, and one that stops answering leaves rotation within seconds' },
  failure: { id: 'failure', watch: 'Traffic fails over in seconds, and the network rebuilds the lost copy automatically' },
  ingress: { id: 'ingress', watch: 'Requests spread across the copies, and anyone can run their own balancer for public apps' },
  volumes: { id: 'volumes', watch: 'Volumes follow the app: with synced storage, copies keep their data in sync peer to peer' },
  geo: { id: 'geo', watch: 'Choose where copies may run: pick a zone and publish again' },
  spread: { id: 'spread', watch: 'Copies spread out: a node never takes an app that already runs on its IP' },
  secrets: {
    id: 'secrets',
    watch: 'Private app specs are encrypted, and only hardened nodes can run them',
    link: { href: '#sealed', label: 'See how a private app is sealed' },
  },
  nodes: {
    id: 'nodes',
    watch: 'Anyone with the hardware and the collateral can run a node',
    link: { href: '#operators', label: 'Meet the people who run them' },
  },
  generic: { id: 'generic', watch: 'Pick a row, then drive the stage' },
};

const MATCHERS: [RegExp, LensId][] = [
  [/control plane|etcd/i, 'registry'],
  [/scheduler/i, 'schedule'],
  [/replica/i, 'replicas'],
  [/reconcile|restartpolicy|controller/i, 'reconcile'],
  [/liveness|readiness|probe/i, 'probes'],
  [/node failure|reschedul|eviction/i, 'failure'],
  [/service|ingress/i, 'ingress'],
  [/persistentvolume|statefulset|volume/i, 'volumes'],
  [/affinity|nodeselector/i, 'geo'],
  [/secret|configmap/i, 'secrets'],
  [/kubelet|nodes/i, 'nodes'],
];

/** The lens for a Kubernetes term. Anti-affinity is tested first: it would otherwise match the affinity rule. */
export function lensFor(k8s: string): Lens {
  if (/antiaffinity|topology/i.test(k8s)) return LENSES.spread;
  for (const [re, id] of MATCHERS) if (re.test(k8s)) return LENSES[id];
  return LENSES.generic;
}

export function lensById(id: LensId): Lens {
  return LENSES[id];
}
