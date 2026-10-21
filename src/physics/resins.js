// Resin catalogue + distribution-coefficient model.
//
// Two kinds of media:
//  • ion-exchange resins (Bio-Rad AG1-X8, AG50W-X8): weight distribution coefficient D
//    (mL g⁻¹, Strelow / Kraus–Nelson convention). Retention in bed volumes uses the dry-resin
//    loading ρ (g dry resin per mL settled bed): Dv = D·ρ.
//  • extraction-chromatographic resins (Eichrom Sr, Ln, TRU, UTEVA, DGA, TEVA): capacity
//    factor k′ (free column volumes to peak maximum), as plotted in Horwitz et al.
//
// IMPORTANT: the numeric D/k′ tables below are ILLUSTRATIVE. They are hand-digitised to
// reproduce the published *shapes and orders of magnitude* (Kraus & Nelson 1956; Strelow
// 1960; Faris & Buchanan 1964; Horwitz et al. 1992, 1993; Pin & Zalduegui 1997; Münker et
// al. 2001) and to make the lab protocols in this project behave as they do at the bench.
// They are not substitutes for the original data.

export const RESINS = {
  AG1X8: {
    id: 'AG1X8', name: 'AG 1-X8', kind: 'ion-exchange', type: 'Strong-base anion exchanger',
    maker: 'Bio-Rad (also sold via Eichrom)',
    matrix: 'Styrene–divinylbenzene copolymer, 8 % cross-linked',
    group: 'Quaternary ammonium, –CH₂N⁺(CH₃)₃ (Cl⁻ form)',
    capacity: '≈1.2 meq mL⁻¹ wet bed (≈3.2 meq g⁻¹ dry)',
    sizes: ['20–50 mesh', '50–100 mesh', '100–200 mesh', '200–400 mesh'],
    sizeNote: '200–400 mesh ≈ 38–75 µm (dry); 100–200 mesh ≈ 75–150 µm (dry). Finer mesh → more theoretical plates, slower flow.',
    eps: 0.4, rho: 0.33,
    mechanism: 'Retains anionic complexes: PbCl₃⁻/PbCl₄²⁻ and PbBr₄²⁻, UO₂Cl₄²⁻, FeCl₄⁻, Th(NO₃)₆²⁻, ReO₄⁻. Cations that do not form anionic complexes (alkalis, alkaline earths, REE, Al) pass straight through.',
    color: 0xf3e3b5,
    verified: true, cite: 'Bio-Rad AG 1 / AG 50 instruction manual; Kraus & Nelson (1956) Proc. Int. Conf. Peaceful Uses At. Energy 7, 113',
  },
  AG50WX8: {
    id: 'AG50WX8', name: 'AG 50W-X8', kind: 'ion-exchange', type: 'Strong-acid cation exchanger',
    maker: 'Bio-Rad (also sold via Eichrom)',
    matrix: 'Styrene–divinylbenzene copolymer, 8 % cross-linked',
    group: 'Sulfonic acid, –SO₃⁻ H⁺',
    capacity: '≈1.7 meq mL⁻¹ wet bed (≈5.1 meq g⁻¹ dry)',
    sizes: ['50–100 mesh', '100–200 mesh', '200–400 mesh'],
    sizeNote: '200–400 mesh is the norm for Rb–Sr, REE and Lu–Hf separations.',
    eps: 0.4, rho: 0.33,
    mechanism: 'Retains cations; affinity rises with charge (M³⁺ ≫ M²⁺ > M⁺) and falls with acid strength (H⁺ competes). Elements forming neutral/anionic fluoride complexes (Hf, Zr, Ti in HCl–HF) are not retained.',
    color: 0xd9a066,
    verified: true, cite: 'Bio-Rad AG 50W manual; Strelow (1960) Anal. Chem. 32, 1185',
  },
  LN: {
    id: 'LN', name: 'Ln Resin (Ln-spec)', kind: 'extraction', type: 'Extraction chromatography',
    maker: 'Eichrom / TrisKem',
    matrix: 'Inert polymeric support (Amberchrom CG-71)',
    group: 'HDEHP — di(2-ethylhexyl) orthophosphoric acid',
    capacity: '≈0.17 mmol Ln per mL bed (vendor)',
    sizes: ['20–50 µm', '50–100 µm', '100–150 µm'],
    sizeNote: 'Boise uses 50–100 µm for Lu (Yb removal) and 100–150 µm for Hf clean-up.',
    eps: 0.65, rho: null,
    mechanism: 'Cation-exchange-like extraction by HDEHP: k′ increases strongly across the lanthanides (La < … < Nd < Sm < … < Yb < Lu) and falls with acidity. Hf⁴⁺ is held even in 6 M HCl and released with HF.',
    color: 0xe8eef2,
    verified: true, cite: 'Horwitz et al. (1993) Anal. Chim. Acta 281, 361; Pin & Zalduegui (1997) Anal. Chim. Acta 339, 79; Münker et al. (2001) G³ 2, 2001GC000183',
  },
  SR: {
    id: 'SR', name: 'Sr Resin (Sr-spec)', kind: 'extraction', type: 'Extraction chromatography',
    maker: 'Eichrom / TrisKem',
    matrix: 'Inert polymeric support',
    group: '4,4′(5′)-di-t-butylcyclohexano-18-crown-6 in 1-octanol',
    capacity: '—',
    sizes: ['20–50 µm', '50–100 µm', '100–150 µm'],
    sizeNote: '50–100 µm common for Sr; Pb is retained extremely strongly (also used for Pb).',
    eps: 0.65, rho: null,
    mechanism: 'Crown-ether cavity size-matches Sr²⁺ (and Pb²⁺) extracted as nitrate ion pairs; k′(Sr) ≈ 80–90 in 3–8 M HNO₃, ≈1 in 0.05 M HNO₃.',
    color: 0xf2f2ea,
    verified: true, cite: 'Horwitz, Chiarizia & Dietz (1992) Solvent Extr. Ion Exch. 10, 313',
  },
  TRU: {
    id: 'TRU', name: 'TRU Resin', kind: 'extraction', type: 'Extraction chromatography',
    maker: 'Eichrom / TrisKem', matrix: 'Inert polymeric support',
    group: 'CMPO (octylphenyl-N,N-di-isobutyl carbamoylphosphine oxide) in TBP',
    capacity: '—', sizes: ['20–50 µm', '50–100 µm', '100–150 µm'],
    sizeNote: 'Used as the REE group separator ahead of Ln resin (Sm–Nd).',
    eps: 0.65, rho: null,
    mechanism: 'Extracts trivalent actinides/lanthanides from ≥1 M HNO₃; REE released in very dilute HNO₃.',
    color: 0xeef2f6, verified: true, cite: 'Horwitz et al. (1993) Anal. Chim. Acta 281, 361; Pin et al. (1994) Anal. Chim. Acta 298, 209',
  },
  UTEVA: {
    id: 'UTEVA', name: 'UTEVA Resin', kind: 'extraction', type: 'Extraction chromatography',
    maker: 'Eichrom / TrisKem', matrix: 'Inert polymeric support',
    group: 'Diamyl amylphosphonate (DAAP)', capacity: '—', sizes: ['50–100 µm', '100–150 µm'],
    sizeNote: 'U/Th: load 3 M HNO₃; Th off in 5 M HCl; U off in 0.05 M HCl.',
    eps: 0.65, rho: null,
    mechanism: 'Neutral solvating extractant for tetra- and hexavalent actinides as nitrato complexes.',
    color: 0xf5efe4, verified: true, cite: 'Horwitz et al. (1992) Anal. Chim. Acta 266, 25',
  },
  DGA: {
    id: 'DGA', name: 'DGA Resin', kind: 'extraction', type: 'Extraction chromatography',
    maker: 'Eichrom / TrisKem', matrix: 'Inert polymeric support',
    group: 'TODGA (N,N,N′,N′-tetra-n-octyldiglycolamide)', capacity: '—', sizes: ['50–100 µm'],
    sizeNote: 'Used for Ca and REE/actinide separations.',
    eps: 0.65, rho: null,
    mechanism: 'Strong extraction of trivalent ions and Ca from HNO₃; release in dilute acid/HCl.',
    color: 0xf1f1f1, verified: true, cite: 'Horwitz et al. (2005) Solvent Extr. Ion Exch. 23, 319',
  },
  TEVA: {
    id: 'TEVA', name: 'TEVA Resin', kind: 'extraction', type: 'Extraction chromatography',
    maker: 'Eichrom / TrisKem', matrix: 'Inert polymeric support',
    group: 'Aliphatic quaternary amine (Aliquat 336)', capacity: '—', sizes: ['50–100 µm', '100–150 µm'],
    sizeNote: 'Anion-exchange-like; tetravalent actinides, Tc, Re.',
    eps: 0.65, rho: null,
    mechanism: 'Liquid anion exchanger; retains Th(IV), Np(IV), Pu(IV), TcO₄⁻/ReO₄⁻ from HNO₃.',
    color: 0xf3f0ea, verified: true, cite: 'Horwitz et al. (1995) Anal. Chim. Acta 310, 63',
  },
};

// ---------------------------------------------------------------------------------------
// Element display colours (consistent across scenes)
export const ELEMENTS = {
  Pb: { name: 'Pb', color: '#3b82f6' },
  U: { name: 'U', color: '#f59e0b' },
  Th: { name: 'Th', color: '#a855f7' },
  Zr: { name: 'Zr', color: '#94a3b8' },
  Hf: { name: 'Hf', color: '#10b981' },
  REE: { name: 'REE', color: '#ec4899' },
  Fe: { name: 'Fe³⁺', color: '#b45309' },
  Ti: { name: 'Ti', color: '#64748b' },
  Matrix: { name: 'Matrix (Na, Ca, Al…)', color: '#cbd5e1' },
  Zn: { name: 'Zn', color: '#22d3ee' },
  Lu: { name: 'Lu', color: '#ef4444' },
  Yb: { name: 'Yb', color: '#f97316' },
  Nd: { name: 'Nd', color: '#8b5cf6' },
  Sm: { name: 'Sm', color: '#06b6d4' },
  LREE: { name: 'La–Ce', color: '#f9a8d4' },
  Rb: { name: 'Rb', color: '#e11d48' },
  Sr: { name: 'Sr', color: '#16a34a' },
  K: { name: 'K', color: '#fb7185' },
  Na: { name: 'Na', color: '#e2e8f0' },
  Ca: { name: 'Ca', color: '#facc15' },
  Mg: { name: 'Mg', color: '#a3e635' },
  Ba: { name: 'Ba', color: '#84cc16' },
  Re: { name: 'Re', color: '#0ea5e9' },
};

// ---------------------------------------------------------------------------------------
// D / k′ tables: [M, value] points, log-linear interpolation in log10(value) vs M.
// Keys: RESIN → MEDIUM → ELEMENT. Media: 'HCl', 'HBr', 'HNO3', 'HCl-HF' (HF-bearing HCl),
// 'HF' , 'HCit' (citric–HNO₃–H₂O₂ mixture, Boise Hf clean-up), 'H2O' (M ignored).
const T = (pts) => pts;

export const DTABLE = {
  AG1X8: {
    HCl: {
      Pb: T([[0, 1], [0.1, 3], [0.5, 20], [1, 30], [2, 25], [3, 15], [4, 10], [6, 3], [8, 1.5], [12, 1]]),
      U: T([[0, 0.05], [0.1, 0.1], [1, 1], [2, 6], [3, 30], [4, 100], [6, 500], [8, 1000], [12, 800]]),
      Fe: T([[0, 0.05], [0.1, 0.1], [1, 1], [2, 5], [3, 30], [4, 300], [6, 3000], [8, 20000], [12, 10000]]),
      Zr: T([[0, 0.02], [3, 0.5], [6, 1], [8, 20], [10, 200], [12, 500]]),
      Hf: T([[0, 0.02], [3, 0.4], [6, 0.8], [8, 12], [10, 120], [12, 300]]),
      Ti: T([[0, 0.02], [3, 0.5], [6, 2], [8, 10], [12, 60]]),
      Zn: T([[0, 1], [0.1, 30], [1, 600], [2, 400], [3, 250], [6, 50], [12, 10]]),
      Th: T([[0, 0.01], [12, 0.02]]),
      REE: T([[0, 0.01], [12, 0.02]]),
      Matrix: T([[0, 0.01], [12, 0.01]]),
      Re: T([[0, 50], [0.5, 400], [1, 300], [4, 60], [8, 20]]),
    },
    HBr: {
      Pb: T([[0, 1], [0.1, 100], [0.5, 1500], [1, 1000], [2, 300], [4, 60]]),
      Zn: T([[0, 1], [0.5, 800], [1, 600], [2, 300]]),
      U: T([[0, 0.05], [0.5, 0.3], [1, 0.4], [2, 1]]),
      Fe: T([[0, 0.05], [0.5, 0.5], [1, 0.8], [2, 2]]),
      Zr: T([[0, 0.02], [2, 0.1]]), Hf: T([[0, 0.02], [2, 0.1]]), Ti: T([[0, 0.02], [2, 0.1]]),
      Th: T([[0, 0.01], [2, 0.01]]), REE: T([[0, 0.01], [2, 0.01]]), Matrix: T([[0, 0.01], [2, 0.01]]),
    },
    HNO3: {
      Th: T([[0, 0.1], [1, 10], [2, 50], [4, 200], [6, 400], [7, 450], [8, 400], [10, 250], [14, 120]]),
      U: T([[0, 0.05], [1, 1], [2, 3], [4, 8], [7, 15], [8, 16], [10, 16], [14, 12]]),
      Fe: T([[0, 0.01], [14, 0.02]]), Zr: T([[0, 0.05], [14, 0.1]]), Hf: T([[0, 0.05], [14, 0.1]]),
      Pb: T([[0, 1], [1, 3], [4, 2], [8, 1]]), Ti: T([[0, 0.05], [14, 0.1]]),
      REE: T([[0, 0.02], [14, 0.05]]), Matrix: T([[0, 0.01], [14, 0.01]]),
      Re: T([[0, 600], [0.1, 300], [0.8, 60], [4, 10], [8, 3]]),
    },
    H2O: { _all: 0.02, Pb: 1, Zn: 1, Re: 50 },
  },
  AG50WX8: {
    HCl: {
      Na: T([[0.1, 120], [0.5, 25], [1, 12.5], [2, 6], [3, 4], [6, 2]]),
      K: T([[0.1, 300], [0.5, 64], [1, 29], [2, 13], [3, 8], [6, 4]]),
      Rb: T([[0.1, 350], [0.5, 72], [1, 33], [2, 15], [3, 9], [6, 5]]),
      Mg: T([[0.1, 2000], [0.5, 166], [1, 42], [2, 9], [3, 4], [6, 2]]),
      Ca: T([[0.1, 3000], [0.5, 380], [1, 92], [2, 18], [3, 8], [6, 3]]),
      Sr: T([[0.1, 3500], [0.5, 450], [1, 99], [2, 20], [3, 9], [6, 3]]),
      Ba: T([[0.1, 8000], [0.5, 1500], [1, 300], [2, 50], [3, 20], [6, 5]]),
      Fe: T([[0.1, 3000], [0.5, 300], [1, 100], [2, 20], [3, 8], [6, 2]]),
      Ti: T([[0.1, 800], [1, 30], [2, 10], [6, 2]]),
      LREE: T([[0.1, 1e5], [1, 2500], [2, 160], [3, 40], [4, 15], [6, 5]]),
      Nd: T([[0.1, 1e5], [1, 1500], [2, 120], [3, 30], [6, 4]]),
      Sm: T([[0.1, 1e5], [1, 1200], [2, 100], [3, 26], [6, 4]]),
      Yb: T([[0.1, 1e5], [1, 600], [2.5, 40], [3, 24], [6, 4]]),
      Lu: T([[0.1, 1e5], [1, 500], [2.5, 32], [3, 20], [6, 4]]),
      REE: T([[0.1, 1e5], [1, 1500], [2, 120], [3, 30], [6, 4]]),
      Hf: T([[0.1, 500], [1, 60], [3, 10], [6, 3]]), Zr: T([[0.1, 500], [1, 60], [3, 10], [6, 3]]),
      Pb: T([[0.1, 800], [1, 50], [2, 15], [6, 3]]), U: T([[0.1, 600], [1, 6], [6, 2]]),
      Matrix: T([[0.1, 500], [1, 40], [3, 6], [6, 2]]),
    },
    'HCl-HF': { // HF complexes the HFSE; others as in HCl
      Hf: T([[0, 0.05], [6, 0.05]]), Zr: T([[0, 0.05], [6, 0.05]]), Ti: T([[0, 0.1], [6, 0.1]]),
    },
    // 0.2 M α-hydroxyisobutyric (methyllactic) acid, pH 4.6: HREE complexed most strongly →
    // elute first. Expressed directly as D such that k′ = D·ρ/ε reproduces a Sm-then-Nd
    // elution within ~10 mL on a 20 cm × 2 mm column (illustrative; real cuts are calibrated).
    MLA: {
      Lu: T([[0, 6], [1, 6]]), Yb: T([[0, 7], [1, 7]]), Sm: T([[0, 23], [1, 23]]), Nd: T([[0, 33], [1, 33]]),
      LREE: T([[0, 50], [1, 50]]), Matrix: T([[0, 0.05], [1, 0.05]]), Ba: T([[0, 400], [1, 400]]),
    },
    H2O: { _all: 1e4 },
  },
  LN: {
    HCl: {
      LREE: T([[0.05, 30], [0.1, 8], [0.25, 1], [0.75, 0.2], [2, 0.1]]),
      Nd: T([[0.05, 200], [0.1, 60], [0.25, 8], [0.75, 0.6], [2, 0.1]]),
      Sm: T([[0.05, 1500], [0.1, 300], [0.25, 30], [0.75, 2], [2, 0.3]]),
      Yb: T([[0.1, 1e4], [1, 300], [2.5, 8], [3, 4], [6, 0.3]]),
      Lu: T([[0.1, 1e4], [1, 900], [2.5, 60], [3, 30], [6, 1]]),
      Hf: T([[0.1, 1e5], [3, 1e4], [6, 400]]),
      Zr: T([[0.1, 1e5], [3, 3000], [6, 80]]),
      Ti: T([[0.1, 1e4], [3, 2000], [6, 100]]),
      Fe: T([[0.1, 50], [1, 2], [6, 0.5]]),
      REE: T([[0.1, 40], [1, 0.5], [6, 0.1]]),
      Matrix: T([[0, 0.01], [6, 0.01]]),
    },
    'HCl-HF': { // 6 M HCl with HF: Zr partly, Hf at 0.4 M HF quantitatively
      Hf: T([[0, 300], [0.06, 250], [0.4, 0.5]]), Zr: T([[0, 60], [0.06, 45], [0.4, 0.3]]),
      Ti: T([[0, 50], [0.4, 0.2]]), Lu: T([[0, 1], [0.4, 1]]), Yb: T([[0, 0.3], [0.4, 0.3]]),
    },
    HCit: { Ti: T([[0, 0.5], [1, 0.5]]), Hf: T([[0, 3000], [1, 3000]]), Zr: T([[0, 1000], [1, 1000]]), Fe: T([[0, 0.5], [1, 0.5]]) },
    H2O: { _all: 1, Hf: 1e4, Zr: 3000, Ti: 1000, Lu: 1e4, Yb: 1e4 },
  },
  SR: {
    HNO3: {
      Sr: T([[0.01, 0.5], [0.05, 1], [0.5, 20], [1, 40], [3, 90], [6, 70], [8, 55]]),
      Pb: T([[0.01, 50], [0.05, 200], [1, 1e4], [3, 1e4], [8, 3000]]),
      Ba: T([[0.05, 0.3], [1, 6], [3, 15], [8, 8]]),
      Ca: T([[0.05, 0.01], [3, 0.5], [8, 0.8]]),
      Rb: T([[0.05, 0.01], [3, 0.3], [8, 0.3]]), K: T([[0.05, 0.01], [3, 0.4], [8, 0.5]]),
      Nd: T([[0, 0.01], [8, 0.1]]), Matrix: T([[0, 0.01], [8, 0.01]]),
    },
    HCl: { Pb: T([[0, 100], [2, 40], [6, 10], [8, 1]]), Sr: T([[0, 0.2], [8, 0.5]]) },
    H2O: { _all: 0.5, Pb: 50 },
  },
  TRU: {
    HNO3: {
      LREE: T([[0.05, 0.3], [0.1, 1], [1, 60], [3, 80]]), Nd: T([[0.05, 0.3], [0.1, 1], [1, 50], [3, 70]]),
      Sm: T([[0.05, 0.3], [0.1, 1], [1, 40], [3, 60]]), REE: T([[0.05, 0.3], [1, 50]]),
      Rb: T([[0, 0.01], [3, 0.01]]), Sr: T([[0, 0.05], [3, 0.1]]), Ba: T([[0, 0.05], [3, 0.1]]),
      Ca: T([[0, 0.05], [3, 0.1]]), Fe: T([[0, 0.1], [3, 2]]), Matrix: T([[0, 0.01], [3, 0.01]]),
    },
    H2O: { _all: 0.1 },
  },
  UTEVA: {
    HNO3: { U: T([[0.1, 2], [1, 40], [3, 200], [6, 250]]), Th: T([[0.1, 0.5], [1, 10], [3, 100], [6, 150]]), Fe: T([[0, 0.01], [6, 0.05]]), Matrix: T([[0, 0.01], [6, 0.01]]) },
    HCl: { U: T([[0.05, 0.5], [1, 3], [5, 80]]), Th: T([[0.05, 0.3], [5, 0.5]]) },
    H2O: { _all: 0.05 },
  },
};

function interpLog(pts, M) {
  if (pts.length === 1) return pts[0][1];
  if (M <= pts[0][0]) return pts[0][1];
  if (M >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 1; i < pts.length; i++) {
    if (M <= pts[i][0]) {
      const [m0, d0] = pts[i - 1], [m1, d1] = pts[i];
      const t = (M - m0) / (m1 - m0);
      return Math.pow(10, Math.log10(d0) + t * (Math.log10(d1) - Math.log10(d0)));
    }
  }
  return pts[pts.length - 1][1];
}

/**
 * Distribution coefficient (D for ion exchange, k′ for extraction chromatography).
 * @param {string} resin key of RESINS
 * @param {string} el element key
 * @param {{acid:string, M:number, HF?:number}} med medium
 */
export function distribution(resin, el, med) {
  const R = DTABLE[resin];
  if (!R) return 0.01;
  const acid = med.acid;
  if (acid === 'H2O') {
    const t = R.H2O || {};
    return t[el] ?? t._all ?? 0.02;
  }
  if (acid === 'HCl-HF') {
    const t = R['HCl-HF'] || {};
    // AG50: HF strength irrelevant once ≥ ~0.05 M; Ln: interpolate in HF molarity
    if (t[el]) return interpLog(t[el], resin === 'LN' ? (med.HF ?? 0) : med.M);
    return distribution(resin, el, { acid: 'HCl', M: med.M });
  }
  const t = R[acid];
  if (!t || !t[el]) return 0.01;
  return interpLog(t[el], med.M);
}

/** Capacity factor k′ (free column volumes to peak) for any resin. */
export function capacityFactor(resin, el, med) {
  const r = RESINS[resin];
  const d = distribution(resin, el, med);
  if (r.kind === 'ion-exchange') return (d * r.rho) / r.eps;
  return d;
}

/** Elution (retention) volume in bed volumes: Vr/Vbed = ε(1 + k′). */
export const retentionBedVolumes = (resin, el, med) => RESINS[resin].eps * (1 + capacityFactor(resin, el, med));

export function mediumLabel(med) {
  if (med.acid === 'H2O') return 'MQ-H₂O';
  if (med.acid === 'HCl-HF') return `${med.M} M HCl–${med.HF} M HF`;
  if (med.acid === 'HCit') return med.label || '0.09 M HCit–0.45 M HNO₃–1 % H₂O₂';
  if (med.acid === 'MLA') return '0.2 M methyllactic acid (α-HIBA), pH 4.6';
  return `${med.M} M ${med.acid.replace('HNO3', 'HNO₃')}`;
}
