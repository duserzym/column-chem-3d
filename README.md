# Column Chem 3D

Interactive three.js illustrations of **ion-exchange column chemistry for isotope geochemistry**, with a particular focus on **U–Pb (CA-ID-TIMS) zircon chemistry**. Every step of leaching (chemical abrasion) and partitioning (column elution) is shown in 3-D, and the elution is driven by a plate-theory chromatography model, so the bands move because of distribution coefficients rather than keyframes.

The app shell, styling and controls are the same as in [tims-3d](https://github.com/duserzym/tims-3d).

| Scene | What it shows |
|---|---|
| **Chemical abrasion & dissolution** | Fourteen guidebook steps: anneal, loading into 300 µL microcapsules, 4 drops 29 M HF, Parr-type vessel assembly (7 mL moat acid, loose bottom plate, star-pattern torque), 190 °C / ~12 h leach, leachate removal, 3.5 M HNO₃ + sonication, rinses, spiking (~0.01 g mixed U–Pb spike), 220 °C / 48 h dissolution, dry-down, 6 M HCl at 180 °C, and the loading acid. The vessel explodes and reassembles with the procedure. A schematic zoned zircon loses its radiation-damaged high-U zones, then dissolves. A thermal-history chart runs alongside. |
| **U–Pb anion columns** | The guidebook column procedures on 50 µL AG1-X8 (200–400 mesh) micro-columns: zircon (HCl; Pb + U collected together), Pb column for phosphate and titanite (HBr), U column (6 M HCl), Th (8 M HNO₃), and U from waters. Includes a step player, coloured element bands, the elution curve with collected cuts, D-versus-acid curves, and a table of where each element ends up. |
| **Resins & partitioning** | A bead-scale view of exchange sites and complexes: AG1-X8, AG50W-X8, and the Ln, Sr, TRU, UTEVA, DGA and TEVA resins. Includes D/k′ curves by acid and a resin catalogue with particle sizes. |
| **Systems atlas** | Every transcribed protocol, plus a few representative literature schemes, as a protocol card and a running 3-D column. Covers Pb (HBr), Lu–Hf micro and milli columns, Lu and Hf clean-up on Ln-spec, Rb clean-up, Sm–Nd in methyllactic acid, Re primary and secondary clean-up, U–Th, Fe and Sr. Non-column procedures are described in text: Ce solvent extraction, Os extraction and micro-distillation, feldspar sequential leaching, silica-gel and Ta-gel emitters. |
| **U–Th (carbonates)** | The carbonate procedure: weighing, HNO₃ digestion, spiking, a 170 °C dry-down, Fe co-precipitation and centrifugation, then the column (Fe off in 7 N HNO₃, Th in 6 N HCl, U in H₂O). Also summarises the seawater and hydrothermal-fluid variant. |

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # chemistry + chromatography tests (vitest)
npm run build        # static site in dist/
npm run screenshots  # headless smoke test (Playwright)
```

Deep links work, for example `#scene=upb&protocol=upb-pb-hbr&step=11` and `#scene=atlas&protocol=hf-ln&step=10`.

## Where the procedures come from

- **U-Th-Pb Lab Guidebook** (the user's lab document): reagent calibration, microcapsule cleaning, chemical abrasion, spiking, dissolution, all U–Pb/Th/U columns, and the Lu–Hf columns.
- **Isotope chemistry procedure binders**, from photographs IMG_0607–0622: Pb in HBr, silica-gel and Ta-gel emitters, Sm–Nd in MLA, Ce solvent extraction, Re clean-ups, Os extraction and micro-distillation, Lu–Hf micro and milli columns, Lu and Hf clean-up on Ln-spec, Rb clean-up, and feldspar sequential dissolution.
- **Carbonate and fluid U/Th procedures**, from photographs IMG_0064–0071 (rev. 02/22/2023).

Values that are not stated or are ambiguous in a source are flagged `uncertain` in `src/physics/protocols.js` and in the UI. Examples: the resin type is not on the photographed U–Th pages; one Re page has a duplicated step number; the Os micro-distillation final volume reads "ml" where µL is meant. The original documents and photos are **not** included in this repository.

## Scientific notes and honesty

- **Plate model**: the bed is split into N theoretical plates, with ΔV = FCV/N and FCV = ε·V_bed. Each parcel shift re-equilibrates every plate with k′ = D·ρ/ε (ion exchange) or k′ (extraction chromatography). Mass is conserved exactly. Peak volume ≈ FCV·(1 + k′), and peaks sharpen as 1/√N; both are tested.
- **Distribution coefficients**: the values in `src/physics/resins.js` are **illustrative**. They are hand-shaped after Kraus & Nelson (1956), Strelow (1960), Faris & Buchanan (1964), Horwitz et al. (1992, 1993), Pin & Zalduegui (1997) and Münker et al. (2001). They reproduce the logic of each procedure, but they are not exact yields.
- **Column geometry**: where a procedure gives only a resin volume, the inner diameter and reservoir size are representative and flagged "geometry assumed".
- **Literature schemes** (Sr-spec, TRU→Ln Sm–Nd, Fe on AG1, UTEVA) are labelled "literature — verify" and their volumes are indicative.

## Safety

This is an educational visualisation, **not** an SOP. Follow your own laboratory's procedures and safety training. Concentrated HF causes deep, delayed burns and systemic toxicity. HClO₄ requires a perchloric-rated hood. Pressurised PTFE vessels at 180–220 °C can fail. Spikes are radioactive.

## Licence, trademarks and attribution

- **Code**: MIT (see `LICENSE`).
- **Bundled dependency**: three.js (MIT). Its licence ships as `THIRD_PARTY_LICENSES.txt`.
- **Trademarks**: AG and Bio-Rad (Bio-Rad Laboratories); Eichrom, Sr Resin, Ln Resin, TRU, UTEVA, DGA and TEVA (Eichrom Technologies / TrisKem); Savillex; Parr. Names are used only to identify the materials and labware being described, and the project is not affiliated with or endorsed by any of these companies or laboratories.
- **Sources**: procedures are paraphrased and transcribed with attribution for teaching. Literature links point to Google Scholar searches.

**Live site:** <https://duserzym.github.io/column-chem-3d/>
