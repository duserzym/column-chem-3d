// Systems atlas: every transcribed and literature protocol, run on a 3-D column.
import * as THREE from 'three';
import { Exploder } from '../core/explode.js';
import { section, select, h, para, note, table, sources } from '../core/ui.js';
import { ColumnStage } from './columnStage.js';
import { PROTOCOLS, DESCRIPTIVE, protocolById } from '../physics/protocols.js';
import { RESINS, mediumLabel } from '../physics/resins.js';
import { REFS } from '../physics/refs.js';

const fmtVol = (v) => (v < 1 ? `${(v * 1000).toFixed(0)} µL` : `${v.toFixed(v < 10 ? 2 : 1)} mL`);

export default {
  id: 'atlas',
  title: 'Systems atlas',
  group: 'All systems',
  icon: '▦',
  blurb: 'U–Pb, Pb, U–Th, Lu–Hf, Rb–Sr, Sm–Nd, Re–Os, Fe… protocol cards + 3-D columns',
  async create(ctx) {
    const root = new THREE.Group();
    const ex = new Exploder();
    const hp = new URLSearchParams(location.hash.slice(1));
    let cur = protocolById(hp.get('protocol')) || protocolById('luhf-micro');
    const stage = new ColumnStage(ctx, cur, { exploder: ex });
    root.add(stage.root);

    const pick = section('Choose a protocol', { icon: '▦' });
    const groups = {};
    PROTOCOLS.forEach((p) => { (groups[p.system] = groups[p.system] || []).push(p); });
    const sel = select({
      label: 'System · procedure',
      options: Object.entries(groups).flatMap(([sys, list]) => list.map((p) => ({ value: p.id, label: `${sys} — ${p.title}${p.verified ? '' : ' (literature)'}` }))),
      value: cur.id,
      onChange: (id) => load(id),
    });
    pick.body.append(sel.el, para('Lab procedures (guidebook, Boise binders, UMN Edwards lab) are transcribed step by step; “literature” cards are representative published schemes whose volumes are indicative only.'));
    const card = section('Protocol card', { icon: '☰' });
    const holder = h('div');

    function load(id) {
      cur = protocolById(id);
      stage.pause();
      stage.dispose();
      stage.listeners = [];
      stage.setProtocol(cur);
      ctx.app.applyXray();
      const R = RESINS[cur.resin];
      const g = cur.column;
      card.body.replaceChildren(
        h('h4', {}, cur.title),
        table(['', ''], [
          ['System', cur.system],
          ['Source', `${cur.source}${cur.cite ? ' — ' + cur.cite : ''} ${cur.verified ? '<span class="tag v">transcribed</span>' : '<span class="tag a">literature — verify</span>'}`],
          ['Resin', `${R.name} — ${cur.mesh}${cur.meshUncertain ? ' <span class="tag a">uncertain</span>' : ''}`],
          ['Functional group', R.group],
          ['Bed volume', `${fmtVol(cur.bedVolume)}${cur.cvNote ? ' — ' + cur.cvNote : ''}`],
          ['Column', `${g.kind === 'heatshrink' ? 'heat-shrink micro-column' : g.kind === 'quartz' ? 'long column' : 'PFA column'}, i.d. ${g.id_mm} mm, bed ≈ ${g.bedHeight_mm.toFixed(0)} mm, reservoir ≈ ${g.reservoir_mL} mL${g.note ? ' — ' + g.note : ''}${g.assumed ? ' <span class="tag a">geometry assumed</span>' : ''}`],
        ]),
        cur.theory ? para('<b>Theory.</b> ' + cur.theory) : '',
        cur.prep?.length ? h('div', {}, h('h4', {}, 'Sample preparation'), h('ul', {}, cur.prep.map((x) => h('li', { html: x })))) : '',
        h('h4', {}, 'Steps'),
        table(['#', 'Step', 'Volume', 'Medium', 'Collect'], cur.steps.map((s, i) => [i + 1, s.label + (s.note ? `<br><span class="src">${s.note}</span>` : '') + (s.uncertain ? ' <span class="tag a">uncertain</span>' : ''), s.med ? fmtVol(s.vol) + (s.drops ? ` (${s.drops} dr)` : '') : '—', s.med ? mediumLabel(s.med) : '—', cur.collectLabels?.[s.collect || 'waste'] ?? s.collect ?? 'waste'])),
        cur.after ? para('<b>After.</b> ' + cur.after) : '',
      );
      holder.replaceChildren(...stage.buildPanel({ title: 'Run it on the column' }));
      sel.set(id);
      const H = 0.07 + stage.col.height;
      const k = Math.max(1, H / 0.12);
      const ty = Math.min(0.08 * k, 0.07 + stage.col.height * 0.45);
      ctx.app.flyTo?.([0.09 * k, ty + 0.05 * k, 0.17 * k], [-0.015, ty, 0]);
    }
    load(cur.id);
    if (hp.get('step')) stage.goto(+hp.get('step') - 1, 0.6);

    const desc = section('Other procedures in the binders (not columns)', { icon: '✎', open: false });
    for (const d of DESCRIPTIVE) {
      desc.body.append(h('details', { class: 'card', style: 'box-shadow:none; margin:6px 0' },
        h('summary', {}, `${d.system}: ${d.title}`),
        h('div', { class: 'card-b' }, h('p', { class: 'src', html: d.source }), h('ol', {}, d.steps.map((x) => h('li', { html: x }))), d.uncertain ? note(d.uncertain, 'warn') : '')));
    }

    const prov = section('Sources & provenance', { icon: '✓', open: false });
    prov.body.append(
      para('Transcriptions were made from photographs of the BSU Isotope Geology Laboratory binders (IMG_0607–0622; IMG_0621 duplicates IMG_0607), the Minnesota Isotope Lab U/Th procedure (IMG_0064–0071) and the user’s U-Th-Pb Lab Guidebook. The original documents are not redistributed with this project.'),
      table(['Photo', 'Content'], [
        ['IMG_0607 / 0621', 'Pb separation by anion exchange in dilute HBr'], ['IMG_0608', 'Silica gel emitter preparation'], ['IMG_0609', '“Tantalum gel” for Rb & Sr'],
        ['IMG_0610–0611', 'Sm–Nd by cation exchange in methyllactic acid'], ['IMG_0612', 'Ce separation by oxidation + HDEHP solvent extraction'],
        ['IMG_0613', 'Primary Re clean-up'], ['IMG_0614', 'Secondary Re clean-up'], ['IMG_0615', 'Os solvent extraction & micro-distillation'],
        ['IMG_0616', 'Lu–Hf micro-columns'], ['IMG_0617', 'Lu–Hf milli-columns'], ['IMG_0618', 'Lu clean-up on Ln-spec'], ['IMG_0619', 'Hf clean-up on Ln-spec'],
        ['IMG_0620', 'Rb clean-up by cation exchange'], ['IMG_0622', 'Sequential dissolution of feldspars'],
        ['IMG_0064–0068', 'UMN carbonate U/Th: weighing, digestion, spiking, Fe co-precipitation, columns'], ['IMG_0069–0071', 'UMN seawater & hydrothermal fluid U/Th'],
      ]),
      sources([REFS.krausNelson, REFS.strelow60, REFS.faris64, REFS.horwitz92, REFS.horwitz93, REFS.pin97, REFS.munker01, REFS.rehkamper96, REFS.houshBowring91, REFS.bioRad, REFS.eichrom]),
    );

    return {
      root, exploder: ex, scale: 0.25,
      camera: (() => { const H = 0.07 + stage.col.height; const k = Math.max(1, H / 0.12); const ty = Math.min(0.08 * k, 0.07 + stage.col.height * 0.45); return { position: [0.09 * k, ty + 0.05 * k, 0.17 * k], target: [-0.015, ty, 0] }; })(),
      panel: [pick.el, card.el, holder, desc.el, prov.el],
      update(dt) { stage.update(dt); },
      dispose() { stage.dispose(); },
    };
  },
};
