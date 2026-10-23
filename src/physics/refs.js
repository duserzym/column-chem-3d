// Literature references (links go to a Google Scholar search to avoid mistyped DOIs).
const gs = (q) => 'https://scholar.google.com/scholar?q=' + encodeURIComponent(q);

export const REFS = {
  guidebook: { label: 'U-Th-Pb Lab Guidebook (user’s lab document)', url: '#scene=atlas' },
  krogh73: { label: 'Krogh (1973) GCA 37, 485', url: gs('Krogh 1973 low-contamination method for hydrothermal decomposition of zircon') },
  mattinson05: { label: 'Mattinson (2005) Chem. Geol. 220, 47', url: gs('Mattinson 2005 zircon U-Pb chemical abrasion CA-TIMS method') },
  gerstenberger97: { label: 'Gerstenberger & Haase (1997) Chem. Geol. 136, 309', url: gs('Gerstenberger Haase 1997 silica gel emitter lead') },
  krausNelson: { label: 'Kraus & Nelson (1956) anion exchange of the elements in HCl', url: gs('Kraus Nelson 1956 anion exchange studies of the fission products') },
  strelow60: { label: 'Strelow (1960) Anal. Chem. 32, 1185', url: gs('Strelow 1960 cation exchange distribution coefficients hydrochloric acid') },
  faris64: { label: 'Faris & Buchanan (1964) Anal. Chem. 36, 1157', url: gs('Faris Buchanan 1964 anion exchange characteristics of the elements in nitric acid') },
  horwitz92: { label: 'Horwitz, Chiarizia & Dietz (1992) Sr resin', url: gs('Horwitz Chiarizia Dietz 1992 novel strontium-selective extraction chromatographic resin') },
  horwitz93: { label: 'Horwitz et al. (1993) TRU / Ln resin', url: gs('Horwitz 1993 separation and preconcentration of actinides extraction chromatography') },
  pin97: { label: 'Pin & Zalduegui (1997) Anal. Chim. Acta 339, 79', url: gs('Pin Zalduegui 1997 sequential separation of light rare-earth elements thorium uranium') },
  munker01: { label: 'Münker et al. (2001) G³', url: gs('Münker Weyer Scherer Mezger 2001 separation of high field strength elements Lu Hf') },
  edwards87: { label: 'Edwards, Chen & Wasserburg (1987) EPSL 81, 175', url: gs('Edwards Chen Wasserburg 1987 238U-234U-230Th-232Th systematics') },
  cheng13: { label: 'Cheng et al. (2013) EPSL 371–372, 82', url: gs('Cheng 2013 improvements in 230Th dating 230Th and 234U half-life values MC-ICP-MS') },
  shen02: { label: 'Shen et al. (2002) Chem. Geol. 185, 165', url: gs('Shen 2002 uranium and thorium isotopic and concentration measurements by magnetic sector ICP-MS') },
  rehkamper96: { label: 'Rehkämper et al. (1996) Chem. Geol. 129, 201', url: gs('Rehkamper 1996 Ce separation selective oxidation solvent extraction') },
  houshBowring91: { label: 'Housh & Bowring (1991) GCA 55, 2309', url: gs('Housh Bowring 1991 lead isotopic heterogeneities within alkali feldspars') },
  bioRad: { label: 'Bio-Rad AG 1 / AG 50W resin manuals', url: 'https://www.bio-rad.com/' },
  eichrom: { label: 'Eichrom resin product literature', url: 'https://www.eichrom.com/' },
};
