import { operatorAccess } from '@/data/flux';
import { SealedView } from './SealedView';

/**
 * Chapter 07: Your app, sealed. ArcaneOS and privacy: what a node operator can and cannot reach. The seat
 * (try to get at an app on a legacy node and on an ArcaneOS node), two figures, and the receipts. The spec is
 * in docs/DESIGN.md (Restyle v2 and storyboard section 07), the facts in research/privacy.md.
 */
export function Sealed() {
  return <SealedView rows={operatorAccess} />;
}
