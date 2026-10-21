// Plate-theory (Craig counter-current) model of an ion-exchange / extraction column.
//
// The settled bed is divided into N theoretical plates. Each plate holds a mobile volume
// ΔV = FCV/N (FCV = free column volume = ε·V_bed) and resin whose capacity factor for
// element i in the plate's current medium is k′ᵢ. One "shift" moves every mobile parcel
// down one plate (the bottom parcel drips out as eluate, a fresh parcel of the current
// reagent enters at the top) and then each plate re-equilibrates:
//     mobile = total/(1 + k′),  stationary = total·k′/(1 + k′).
// Consequences that the tests check:
//   • mass is conserved exactly (in = eluted + retained);
//   • an element with constant k′ elutes with peak volume ≈ FCV·(1 + k′);
//   • lower k′ ⇒ earlier elution; the acid front itself travels at one FCV per FCV,
//     so a change of medium "releases" an element only after the front reaches it.
// Real columns also show kinetics, overloading and channelling; this model has none.

import { capacityFactor, RESINS } from './resins.js';

/**
 * @param {object} o
 * @param {string} o.resin RESINS key
 * @param {number} o.bedVolume settled bed volume (mL)
 * @param {string[]} o.elements
 * @param {number} [o.plates=40]
 * @param {{acid,M}} [o.initialMedium]
 */
export class PlateColumn {
  constructor({ resin, bedVolume, elements, plates = 40, initialMedium = { acid: 'H2O', M: 0 } }) {
    this.resin = resin;
    this.bed = bedVolume;
    this.N = plates;
    this.els = elements;
    this.eps = RESINS[resin].eps;
    this.fcv = this.eps * bedVolume;
    this.dV = this.fcv / plates;
    this.mobile = elements.map(() => new Float64Array(plates));
    this.stat = elements.map(() => new Float64Array(plates));
    this.med = new Array(plates).fill(initialMedium);
    this.kCache = new Map();
    this.input = new Float64Array(elements.length);
    this.eluted = new Float64Array(elements.length);
    this.volume = 0;
  }
  k(i, med) {
    const key = i + '|' + med.acid + '|' + med.M + '|' + (med.HF ?? '');
    let v = this.kCache.get(key);
    if (v === undefined) { v = capacityFactor(this.resin, this.els[i], med); this.kCache.set(key, v); }
    return v;
  }
  /** One parcel shift. inject: Float64Array amounts carried by the entering parcel. Returns eluted amounts. */
  shift(med, inject = null) {
    const { N, els } = this;
    const out = new Float64Array(els.length);
    for (let i = 0; i < els.length; i++) {
      const m = this.mobile[i];
      out[i] = m[N - 1];
      for (let p = N - 1; p > 0; p--) m[p] = m[p - 1];
      m[0] = inject ? inject[i] : 0;
      if (inject) this.input[i] += inject[i];
      this.eluted[i] += out[i];
    }
    for (let p = N - 1; p > 0; p--) this.med[p] = this.med[p - 1];
    this.med[0] = med;
    for (let p = 0; p < N; p++) {
      const md = this.med[p];
      for (let i = 0; i < els.length; i++) {
        const tot = this.mobile[i][p] + this.stat[i][p];
        if (tot === 0) continue;
        const k = this.k(i, md);
        const mob = tot / (1 + k);
        this.mobile[i][p] = mob;
        this.stat[i][p] = tot - mob;
      }
    }
    this.volume += this.dV;
    return out;
  }
  /** Total amount per plate per element (for rendering bands). */
  profile() {
    return this.els.map((_, i) => {
      const a = new Float32Array(this.N);
      for (let p = 0; p < this.N; p++) a[p] = this.mobile[i][p] + this.stat[i][p];
      return a;
    });
  }
  retained() {
    return this.els.map((_, i) => {
      let s = 0;
      for (let p = 0; p < this.N; p++) s += this.mobile[i][p] + this.stat[i][p];
      return s;
    });
  }
}

/**
 * Run a whole protocol.
 * @param {object} protocol { resin, bedVolume, elements, sample:{el:amount}, steps:[{label, vol, med, load?:true, collect}] }
 * @param {object} [opt] { plates, snapEvery (shifts), maxShifts }
 * @returns {{steps, curve, snaps, cuts, totals, column}}
 */
/** Plate count from bed height (≈2.5 plates per mm, clamped) unless the protocol sets one. */
export function defaultPlates(protocol) {
  if (protocol.plates) return protocol.plates;
  const h = protocol.column?.bedHeight_mm ?? 20;
  return Math.max(30, Math.min(160, Math.round(h * 2.5)));
}

export function runProtocol(protocol, { plates = defaultPlates(protocol), snapEvery = null, maxSnaps = 700, maxShiftsPerStep = 30000 } = {}) {
  const els = protocol.elements;
  const firstMed = protocol.initialMedium || protocol.steps.find((s) => s.med)?.med || { acid: 'H2O', M: 0 };
  const col = new PlateColumn({ resin: protocol.resin, bedVolume: protocol.bedVolume, elements: els, plates, initialMedium: firstMed });
  const sample = els.map((e) => protocol.sample?.[e] ?? 0);
  if (!snapEvery) {
    const total = protocol.steps.reduce((a, st) => a + (st.med && st.vol > 0 ? Math.max(1, Math.round(st.vol / col.dV)) : 0), 0);
    snapEvery = Math.max(1, Math.ceil(total / maxSnaps));
  }
  const totalIn = sample.reduce((a, b) => a + b, 0) || 1;
  const curve = { vol: [], conc: els.map(() => []), step: [] };
  const snaps = [];
  const stepResults = [];
  const cuts = {};
  let shiftCount = 0;
  protocol.steps.forEach((st, si) => {
    if (!st.med || !(st.vol > 0)) { stepResults.push({ ...st, eluted: els.map(() => 0), shifts: 0, v0: col.volume, v1: col.volume }); return; }
    let n = Math.round(st.vol / col.dV);
    n = Math.max(1, Math.min(maxShiftsPerStep, n));
    const scale = st.vol / (n * col.dV); // exact volume bookkeeping when n is capped/rounded
    const v0 = col.volume;
    const stepOut = new Float64Array(els.length);
    for (let j = 0; j < n; j++) {
      const inject = st.load ? Float64Array.from(sample, (a) => a / n) : null;
      const out = col.shift(st.med, inject);
      for (let i = 0; i < els.length; i++) stepOut[i] += out[i];
      curve.vol.push(v0 + (j + 1) * col.dV * scale);
      curve.step.push(si);
      for (let i = 0; i < els.length; i++) curve.conc[i].push(out[i] / (col.dV * scale));
      if (shiftCount++ % snapEvery === 0 || j === n - 1) {
        snaps.push({ step: si, frac: (j + 1) / n, vol: v0 + (j + 1) * col.dV * scale, profile: col.profile(), med: st.med, outflow: Array.from(out) });
      }
    }
    col.volume = v0 + st.vol;
    const eluted = Array.from(stepOut);
    stepResults.push({ ...st, eluted, shifts: n, v0, v1: col.volume });
    const key = st.collect || 'waste';
    if (!cuts[key]) cuts[key] = els.map(() => 0);
    eluted.forEach((a, i) => (cuts[key][i] += a));
  });
  // fractions relative to input of each element
  const input = Array.from(col.input);
  const recovery = {};
  for (const [k, arr] of Object.entries(cuts)) recovery[k] = arr.map((a, i) => (input[i] > 0 ? a / input[i] : 0));
  const retained = col.retained();
  return { steps: stepResults, curve, snaps, cuts, recovery, input, retained, column: col, totalIn };
}

/** Peak (maximum concentration) volume of element index i in a run curve. */
export function peakVolume(run, i) {
  let best = -1, v = NaN;
  run.curve.conc[i].forEach((c, j) => { if (c > best) { best = c; v = run.curve.vol[j]; } });
  return v;
}
