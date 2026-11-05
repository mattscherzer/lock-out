// The string table (M7), starting with the lock advice; other components still hold some copy of their own until it
// moves here. English only for the MVP (D-11); a translation is a second object with the same shape. The advice copy
// follows docs/lock-tier-documentation.md section 3 and names the organisation behind each claim that is specific to it.
export const STRINGS = {
  advice: {
    headline: {
      oneLock: "Lock the frame and a wheel to something fixed, with one solid lock",
      twoLocks: "Use two solid locks of different types",
    },
    step: {
      anchor:
        "Lock the frame and at least one wheel to a bike stand or another fixed object, even for a short stop.",
      solidLock: "Use a sturdy U-lock, chain lock or folding lock made of solid material.",
      tested:
        "The police (ProPK) recommend locks tested to VdS class A+. According to the ADFC, good locks often weigh more than 1 kg, and disc-detainer cylinders protect well against lock picking.",
      position:
        "Keep the lock off the ground with the keyhole facing down, and leave as little gap as possible around it.",
      neverAlone:
        "A frame lock or a cable lock is never enough on its own. Use one only as an extra.",
      secondLock:
        "The ADFC advises locking with a second lock of a different type, because thieves often specialise in one kind of lock.",
      threeMinutes:
        "The ADFC's rule of thumb is that a lock should withstand force for three minutes. It adds that new U-locks with a tungsten-carbide coating also resist angle grinders well.",
      higherClass: "For very valuable bikes, the police (ProPK) point to the higher VdS class B+.",
    },
    tip: {
      budget:
        "The police (ProPK) suggest budgeting about 5 to 10% of the bike's price for a good lock.",
      battery:
        "If your bike has a battery, the police (ProPK) advise always taking it with you or securing it with an extra sturdy lock, as without it the bike is practically worthless.",
      parts:
        "Remove expensive parts or lock them separately, and replace quick-release levers on the wheels and saddle with security nuts.",
    },
    // shown on top of the full advice when the area's data is thin; no_record wins over limited_data
    note: {
      limitedData:
        "Few thefts were reported in this area, so its rating is uncertain. Lock up as carefully as anywhere else.",
      noRecord:
        "The police data we use has no bike theft from the street on record for this area. That does not mean bikes are never stolen here, so lock up as carefully as anywhere else.",
    },
    // shown with the one-lock advice when no bike value is chosen
    noBikeValue:
      "For a more valuable bike, the ADFC advises a second lock of a different type, because thieves often specialise in one kind of lock.",
    // [term as it appears in the copy, its meaning in plain words]
    term: {
      uLock: ["U-lock", "a rigid steel shackle shaped like a U."],
      chainLock: ["Chain lock", "a steel chain with its own lock."],
      foldingLock: ["Folding lock", "steel bars joined like a folding ruler."],
      frameLock: [
        "Frame lock",
        "a lock fixed to the frame that only blocks the rear wheel. Never enough on its own.",
      ],
      cableLock: ["Cable lock", "a steel cable with a lock. Never enough on its own."],
      vds: [
        "VdS",
        "the testing institute of the German insurance industry. Classes A+ and B+ mark locks made for locking to a fixed object.",
      ],
      discDetainer: ["Disc-detainer cylinder", "a lock cylinder that works with rotating discs."],
      securityNuts: [
        "Security nuts",
        "wheel and saddle fixings that need a special key, instead of quick-release levers.",
      ],
    },
    sourcesLabel: "Where this guidance comes from",
    source: {
      polizeiBerlin: "Polizei Berlin: Fahrraddiebstahl verhindern",
      propk: "Polizei (ProPK): Sichere Fahrradschlösser finden",
      adfcTypes: "ADFC: Fahrradschloss-Typen",
      adfcPrevent: "ADFC: Fahrraddiebstahl vorbeugen",
      vds: "VdS 2597: Zweiradschlösser",
    },
  },
} as const;
