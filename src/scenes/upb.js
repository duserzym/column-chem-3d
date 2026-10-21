// U–Pb anion-exchange columns (the focus): the guidebook procedures, step by step.
import * as THREE from 'three';
import { Exploder } from '../core/explode.js';
import { section, segmented, h, para, note, sources } from '../core/ui.js';
import { ColumnStage } from './columnStage.js';
import { protocolById } from '../physics/protocols.js';
import { REFS } from '../physics/refs.js';

const VARIANTS = [
  { id: 'upb-zircon', label: 'Zircon (HCl)' },
  { id: 'upb-pb-hbr', label: 'Phosphate/titanite Pb (HBr)' },
  { id: 'upb-u-hcl', label: 'U column (6 M HCl)' },
  { id: 'th-hno3', label: 'Th (8 M HNO₃)' },
  { id: 'u-waters', label: 'U from waters' },
];

export default {
  id: 'upb',
  title: 'U–Pb anion columns',
  group: 'U–Pb (focus)',
  icon: '⫼',
  blurb: '50 µL AG1-X8 micro-columns: load, wash, Pb and U elution — bands from a plate model',
  async create(ctx) {
    const root = new THREE.Group();
    const ex = new Exploder();
    const stage = new ColumnStage(ctx, protocolById('upb-zircon'), { exploder: ex });
    root.add(stage.root);
    const holder = h('div');
    const info = section('Procedure notes', { icon: '✎' });

    const sel = section('U–Pb column procedures', { icon: '⚗' });
    const seg = segmented({ options: VARIANTS.map((v) => ({ value: v.id, label: v.label })), value: 'upb-zircon', onChange: (id) => load(id) });
    sel.body.append(
      para('Anion exchange on <b>AG1-X8</b> (strong-base, quaternary ammonium). In 3 M HCl, Pb and U form anionic chloro-complexes (PbCl₃⁻, UO₂Cl₃⁻/UCl₆²⁻) and stick, while Zr, Hf, REE and Th do not. 6 M HCl breaks up the Pb complex (Pb comes off); water breaks up the U complex (U comes off). Zircon Pb and U are collected into the <b>same</b> beaker and loaded together.'),
      seg.el,
    );

    function load(id) {
      const p = protocolById(id);
      stage.pause();
      stage.dispose();
      stage.listeners = [];
      stage.setProtocol(p);
      ctx.app.applyXray();
      holder.replaceChildren(...stage.buildPanel({ title: p.title, intro: `<span class="src">${p.source} · ${p.mesh} · ${(p.bedVolume * 1000).toFixed(0)} µL resin</span>` }));
      info.body.replaceChildren(
        h('h4', {}, 'Before the column'), h('ul', {}, (p.prep || []).map((x) => h('li', { html: x }))),
        h('h4', {}, 'After the column'), para(p.after || '—'),
        p.column.assumed ? note(p.column.assumed, 'warn') : '',
        sources([REFS.guidebook, REFS.krogh73, REFS.krausNelson, REFS.faris64, REFS.bioRad]),
      );
    }
    const hp = new URLSearchParams(location.hash.slice(1));
    load(VARIANTS.some((v) => v.id === hp.get('protocol')) ? hp.get('protocol') : 'upb-zircon');
    if (hp.get('protocol')) seg.set(hp.get('protocol'));
    if (hp.get('step')) stage.goto(+hp.get('step') - 1, 0.6);

    return {
      root, exploder: ex, scale: 0.25,
      camera: { position: [0.075, 0.115, 0.14], target: [-0.012, 0.082, 0] },
      panel: [sel.el, holder, info.el],
      update(dt) { stage.update(dt); },
      dispose() { stage.dispose(); },
    };
  },
};
