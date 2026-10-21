import { describe, it, expect } from 'vitest';
import { PlateColumn, runProtocol, peakVolume } from '../src/physics/chromatography.js';
import { distribution, capacityFactor, retentionBedVolumes, RESINS } from '../src/physics/resins.js';
import { PROTOCOLS, protocolById } from '../src/physics/protocols.js';

const synth = (k, bed = 1, plates = 60) => ({
  resin: 'AG1X8', bedVolume: bed, elements: ['Pb'], sample: { Pb: 1 },
  steps: [{ label: 'load', vol: 0.01, med: { acid: 'HCl', M: k }, load: true }, { label: 'elute', vol: 40, med: { acid: 'HCl', M: k } }],
  plates,
});

describe('plate-theory chromatography', () => {
  it('conserves mass exactly for every lab protocol', () => {
    for (const p of PROTOCOLS) {
      const r = runProtocol(p, { snapEvery: 1e9 });
      r.input.forEach((inp, i) => {
        const out = Object.values(r.cuts).reduce((a, c) => a + c[i], 0);
        expect(Math.abs(inp - out - r.retained[i])).toBeLessThan(1e-9 * Math.max(1, inp));
      });
    }
  }, 60000);
  it('peak elution volume ≈ FCV·(1 + k′) = Vbed(ε + Dv)', () => {
    for (const M of [1, 3, 6]) {
      const p = synth(M);
      const r = runProtocol(p, { plates: 80, snapEvery: 1e9 });
      const k = capacityFactor('AG1X8', 'Pb', { acid: 'HCl', M });
      const expected = RESINS.AG1X8.eps * (1 + k) * p.bedVolume;
      expect(Math.abs(peakVolume(r, 0) - expected) / expected).toBeLessThan(0.06);
      expect(retentionBedVolumes('AG1X8', 'Pb', { acid: 'HCl', M })).toBeCloseTo(expected / p.bedVolume, 6);
    }
  });
  it('lower distribution coefficient elutes earlier', () => {
    const rHi = runProtocol(synth(1), { plates: 60, snapEvery: 1e9 }); // D(Pb,1M)≈30
    const rLo = runProtocol(synth(6), { plates: 60, snapEvery: 1e9 }); // D(Pb,6M)≈3
    expect(peakVolume(rLo, 0)).toBeLessThan(peakVolume(rHi, 0));
  });
  it('peaks sharpen with more plates (σ/Vr ≈ 1/√N)', () => {
    const width = (N) => {
      const r = runProtocol(synth(3), { plates: N, snapEvery: 1e9 });
      const c = r.curve.conc[0], v = r.curve.vol;
      const tot = c.reduce((a, b) => a + b, 0);
      const mean = c.reduce((a, b, i) => a + b * v[i], 0) / tot;
      const varr = c.reduce((a, b, i) => a + b * (v[i] - mean) ** 2, 0) / tot;
      return Math.sqrt(varr) / mean;
    };
    expect(width(160)).toBeLessThan(width(40) * 0.7);
  });
  it('column with no flow retains everything; one shift moves the front one plate', () => {
    const c = new PlateColumn({ resin: 'AG1X8', bedVolume: 1, elements: ['U'], plates: 10 });
    c.shift({ acid: 'HCl', M: 6 }, Float64Array.from([1]));
    expect(c.retained()[0]).toBeCloseTo(1, 12);
    expect(c.med[0].M).toBe(6);
  });
});

describe('resin chemistry (shape checks)', () => {
  it('AG1-X8: U(VI) adsorption rises with HCl; water strips it', () => {
    const d = (M) => distribution('AG1X8', 'U', { acid: 'HCl', M });
    expect(d(6)).toBeGreaterThan(d(3));
    expect(d(3)).toBeGreaterThan(d(1));
    expect(distribution('AG1X8', 'U', { acid: 'H2O', M: 0 })).toBeLessThan(0.1);
  });
  it('AG1-X8: Pb strongly held in dilute HBr, weakly in 6 M HCl', () => {
    expect(distribution('AG1X8', 'Pb', { acid: 'HBr', M: 0.5 })).toBeGreaterThan(500);
    expect(distribution('AG1X8', 'Pb', { acid: 'HCl', M: 6 })).toBeLessThan(5);
  });
  it('AG1-X8 in 8 M HNO₃: U K_D ≈ 16 (guidebook), Th ≫ U', () => {
    expect(distribution('AG1X8', 'U', { acid: 'HNO3', M: 8 })).toBeCloseTo(16, 0);
    expect(distribution('AG1X8', 'Th', { acid: 'HNO3', M: 8 })).toBeGreaterThan(100);
  });
  it('AG50W-X8 in 0.6 M HCl: Na < (K,Rb) < Ca as on the Boise Rb page', () => {
    const d = (e) => distribution('AG50WX8', e, { acid: 'HCl', M: 0.6 });
    expect(d('Na')).toBeLessThan(d('Rb'));
    expect(d('Rb')).toBeLessThan(d('Ca'));
  });
  it('Ln-spec: Lu held more strongly than Yb; HF releases Hf', () => {
    expect(distribution('LN', 'Lu', { acid: 'HCl', M: 2.5 })).toBeGreaterThan(distribution('LN', 'Yb', { acid: 'HCl', M: 2.5 }) * 3);
    expect(distribution('LN', 'Hf', { acid: 'HCl-HF', M: 6, HF: 0.4 })).toBeLessThan(2);
  });
});

describe('lab protocols behave as written', () => {
  const rec = (id) => { const p = protocolById(id); const r = runProtocol(p, { snapEvery: 1e9 }); return { p, r, get: (cut, el) => r.recovery[cut]?.[p.elements.indexOf(el)] ?? 0 }; };
  it('U–Pb zircon: Pb and U into the Pb+U cut; Zr/Hf/REE/Th into the saved wash', () => {
    const { get } = rec('upb-zircon');
    expect(get('PbU', 'Pb')).toBeGreaterThan(0.95);
    expect(get('PbU', 'U')).toBeGreaterThan(0.95);
    for (const e of ['Zr', 'Hf', 'REE', 'Th']) expect(get('ThHf', e)).toBeGreaterThan(0.95);
    expect(get('PbU', 'Zr')).toBeLessThan(0.02);
  });
  it('HBr Pb column: U into the wash, Pb into the 6 M HCl cut', () => {
    const { get } = rec('upb-pb-hbr');
    expect(get('U', 'U')).toBeGreaterThan(0.95);
    expect(get('Pb', 'Pb')).toBeGreaterThan(0.95);
  });
  it('Edwards U–Th: Fe to waste, Th in 6 N HCl, U in H₂O', () => {
    const { get } = rec('uth-edwards');
    expect(get('waste', 'Fe')).toBeGreaterThan(0.95);
    expect(get('Th', 'Th')).toBeGreaterThan(0.95);
    expect(get('U', 'U')).toBeGreaterThan(0.9);
  });
  it('Ln-spec Lu clean-up removes Yb and keeps Lu', () => {
    const { get } = rec('lu-ln');
    expect(get('Lu', 'Lu')).toBeGreaterThan(0.95);
    expect(get('Lu', 'Yb')).toBeLessThan(0.05);
  });
  it('Hf clean-up: roughly a third of Zr goes in the HF-bearing rinse (as noted on the page)', () => {
    const { get } = rec('hf-ln');
    expect(get('Hf', 'Hf')).toBeGreaterThan(0.95);
    expect(get('waste', 'Zr')).toBeGreaterThan(0.2);
    expect(get('waste', 'Zr')).toBeLessThan(0.5);
  });
});
