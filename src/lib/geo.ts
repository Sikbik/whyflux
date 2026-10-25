/**
 * Country to continent, for the honest "where are the nodes" views. The continent codes follow the
 * GeoNames convention that the network's own geolocation data uses (so Europe's share here matches
 * the share in the stats): Russia is Europe, Turkey is Asia, Cyprus is Europe, the Caucasus and
 * Kazakhstan are Asia.
 *
 *   const shares = continentShares(live.byCountry);   // [{ code: 'EU', nodes: 4854, share: 0.708 }, ...]
 */
import type { CountryCount } from './live';

export type ContinentCode = 'EU' | 'NA' | 'SA' | 'AS' | 'AF' | 'OC' | 'AN';

export const CONTINENT_NAME: Readonly<Record<ContinentCode, string>> = {
  EU: 'Europe',
  NA: 'North America',
  SA: 'South America',
  AS: 'Asia',
  AF: 'Africa',
  OC: 'Oceania',
  AN: 'Antarctica',
};

const MEMBERS: Readonly<Record<ContinentCode, string>> = {
  EU: 'AL AD AT BY BE BA BG HR CY CZ DK EE FO FI FR DE GI GR GG HU IS IE IM IT JE XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SJ SE CH UA GB VA AX',
  NA: 'US CA MX GT BZ SV HN NI CR PA CU JM HT DO BS BB TT GD LC VC AG DM KN PR VI KY BM AW CW SX TC VG AI MS GP MQ BL MF PM GL BQ',
  SA: 'BR AR CL CO PE VE EC BO PY UY GY SR GF FK',
  AS: 'AF AM AZ BH BD BT BN KH CN GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE',
  AF: 'DZ AO BJ BW BF BI CM CV CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW SH',
  OC: 'AU NZ FJ PG SB VU NC PF WS TO TV KI FM MH NR PW CK NU TK WF AS GU MP PN NF CC CX HM',
  AN: 'AQ TF BV GS',
};

const BY_COUNTRY = new Map<string, ContinentCode>();
for (const [continent, list] of Object.entries(MEMBERS) as [ContinentCode, string][]) {
  for (const code of list.split(' ')) BY_COUNTRY.set(code, continent);
}

/** The continent of an ISO 3166-1 alpha-2 country code, or undefined for an unknown code. */
export function continentOf(countryCode: string | undefined): ContinentCode | undefined {
  return countryCode ? BY_COUNTRY.get(countryCode.toUpperCase()) : undefined;
}

export interface ContinentShare {
  code: ContinentCode;
  name: string;
  nodes: number;
  /** 0..1 of all nodes that could be placed on a continent. */
  share: number;
}

/** Nodes per continent from `useFluxLive().byCountry`, biggest first. Nodes in unknown countries are left out. */
export function continentShares(byCountry: readonly CountryCount[] | undefined): ContinentShare[] {
  if (!byCountry?.length) return [];
  const totals = new Map<ContinentCode, number>();
  let all = 0;
  for (const c of byCountry) {
    const k = continentOf(c.code);
    if (!k) continue;
    totals.set(k, (totals.get(k) ?? 0) + c.nodes);
    all += c.nodes;
  }
  return [...totals.entries()]
    .map(([code, nodes]) => ({ code, name: CONTINENT_NAME[code], nodes, share: all ? nodes / all : 0 }))
    .sort((a, b) => b.nodes - a.nodes);
}
