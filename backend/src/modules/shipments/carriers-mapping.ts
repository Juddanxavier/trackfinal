export interface CarrierMapping {
  [key: string]: string;
}

export const CARRIER_MAPPINGS: CarrierMapping = {
  // Major Express Carriers
  dhl: '100001',
  dhl_express: '100001',
  dhl_paket: '7041',
  dhl_ecommerce_us: '7047',
  dhl_ecommerce_asia: '7048',
  dhl_parcel_uk: '100152',
  dhl_parcel_nl: '100047',
  dhl_parcel_es: '100392',
  dhl_parcel_pl: '100226',
  dhl_freight: '100245',
  dhl_activetracing: '100216',

  ups: '100002',
  ups_mail_innovations: '100398',

  fedex: '100003',
  fedex_poland: '100261',
  fedex_international_connect: '100222',

  usps: '21051',

  // China & Asia
  china_post: '3011',
  china_ems: '3013',
  sf_express: '100012',
  yun_express: '100295',
  '4px': '3131',
  j_t_express: '100295',
  j_and_t_express: '100295',
  jtexpress: '100295',
  yto_express: '100295',
  zto_express: '100295',
  sto_express: '100295',
  chinapost: '3011',
  hongkong_post: '8011',
  hk_post: '8011',
  macau_post: '13011',
  taiwan_post: '20011',

  // UK & Ireland
  royal_mail: '11031',
  royalmail: '11031',
  parcelforce: '11033',
  hermes: '100018',
  hermes_de: '100031',
  hermes_borderguru: '100091',
  evri: '100331',
  yukyo: '11031',
  an_post: '9051',

  // Europe
  deutsche_post: '7044',
  dpd: '100007',
  dpd_de: '100007',
  dpd_uk: '100010',
  dpd_ru: '100071',
  dpd_fr: '100072',
  dpd_be: '100321',
  dpd_ro: '100177',
  dpd_ie: '100143',
  dpd_pt: '100204',
  dpd_pl: '100111',
  dpd_gr: '100404',
  dpd_cz: '100483',
  dpd_at: '100556',

  gls: '100005',
  gls_italy: '100024',
  gls_spain: '100189',
  gls_hungary: '100280',
  gls_czech: '100281',
  gls_slovakia: '100282',
  gls_slovenia: '100283',
  gls_romania: '100284',
  gls_croatia: '100207',
  gls_canada: '100208',
  gls_portugal: '100316',
  gls_netherlands: '100384',
  gls_us: '100305',

  tnt: '100004',
  tnt_italy: '100065',
  tnt_france: '100241',
  tnt_australia: '100200',

  aramex: '100006',
  aramex_au: '100044',
  aramex_nz: '100067',

  postnl: '14041',
  postnl_international: '14044',

  colissimo: '6051',
  laposte: '6051',

  swiss_post: '19251',

  mondial_relay: '100304',

  inpost: '100043',
  inpost_uk: '100462',
  inpost_italy: '100469',

  omnicuri: '100043',
  danmark: '100346',

  // Americas
  canada_post: '3041',
  canadapost: '3041',

  ontrac: '100049',
  lasership: '100052',

  amazon: '100309',
  amazon_shipping: '100309',
  amazon_mcf: '100309',
  amazon_uk: '100310',

  couriersplease: '100123',
  sendle: '100125',

  ninjavan: '100126',
  ninjavan_sg: '100126',
  ninjavan_id: '100127',
  ninjavan_ph: '100128',
  ninjavan_my: '100129',
  ninjavan_th: '100130',
  ninjavan_vn: '100131',

  delhivery: '100060',
  dtdc: '100069',
  ecom_express: '100099',
  bluedart: '100055',

  // Oceania
  australia_post: '1151',
  auspost: '1151',
  startrack: '100335',
  fastway_au: '100044',

  nz_post: '14061',
  courierpost: '100268',

  // Africa & Middle East
  south_africa_post: '19171',
  fastway_za: '100066',

  // Common variations
  ems: '3013',
  epacket: '3011',
  eub: '3011',
  china_registered_mail: '3011',
  cainiao: '3011',

  // Other common
  skynet: '100025',
  skynet_malaysia: '100192',
  yodel: '100017',
  asendia: '100029',
  asendia_usa: '100016',

  pitney_bowes: '100036',
  newgistics: '100395',
  endicia: '100427',

  purolator: '100042',
  canpar: '100146',
  estafeta: '100139',
  redpack: '100138',

  Correos: '19181',
  correos_spain: '19181',
  correos_argentino: '1121',
  correos_chile: '3101',
  correos_mexico: '100131',

  singpost: '19131',
  malaysia_post: '13051',
  india_post: '9021',
  vietnam_post: '22021',

  // Last mile
  deliver: '100060',
  swiship: '100143',
  swiship_uk: '100214',
  swiship_de: '100312',
  swiship_au: '100415',
  swiship_jp: '100564',

  maersk: '100186',
  db_schenker: '100206',
  dsv: '100186',
  ceva: '100297',

  // SEA
  jne: '100086',
  jnt: '100295',
  ninja_van: '100126',
  gx: '100305',

  // Latin America
  codijis: '100527',
  interrapidisimo: '100493',
  coordinadora: '100495',
  serpost: '16061',
  chilexpress: '100441',
  andreani: '100497',
};

export function getCarrierCode(input: string): string | null {
  if (!input) return null;

  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return (
    CARRIER_MAPPINGS[normalized] ||
    CARRIER_MAPPINGS[input.toLowerCase()] ||
    null
  );
}

export function getAllCarrierCodes(): string[] {
  return Object.values(CARRIER_MAPPINGS);
}

export function searchCarrierCodes(
  query: string,
): Array<{ key: string; code: string }> {
  const results: Array<{ key: string; code: string }> = [];
  const q = query.toLowerCase();

  for (const [key, code] of Object.entries(CARRIER_MAPPINGS)) {
    if (key.includes(q) || code.includes(q)) {
      results.push({ key, code });
    }
  }

  return results;
}
