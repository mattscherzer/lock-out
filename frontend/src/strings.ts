// The string table: every piece of copy the app shows (M7). English only for the MVP (D-11); a translation is a
// second object with the same shape. The advice copy follows docs/lock-tier-documentation.md section 3.
export const STRINGS = {
  advice: {
    headline: {
      oneLock: "Lock the frame and a wheel to something fixed, with one solid lock",
      twoLocks: "Use two solid locks of different types",
    },
    step: {
      anchor:
        "Lock the frame and at least one wheel to a bike stand or another fixed object, even for a short stop.",
      solidLock: "Use a U-lock, a chain lock or a folding lock made of solid steel.",
      tested:
        "Look for a lock tested to VdS class A+. Good locks often weigh more than 1 kg and have a disc-detainer cylinder.",
      position:
        "Keep the lock off the ground with the keyhole facing down, and leave as little gap as possible around it.",
      neverAlone:
        "A frame lock or a cable lock is never enough on its own. Use one only as an extra.",
      secondLock:
        "Add a second lock of a different type, for example a chain lock next to a U-lock. Thieves often specialise in one kind of lock.",
      threeMinutes:
        "A good lock holds out against force for at least three minutes. Some newer U-locks also resist angle grinders.",
      higherClass: "For very valuable bikes and e-bikes, VdS has a higher class, B+.",
    },
    tip: {
      budget: "Plan to spend about 5 to 10% of the bike's price on locks.",
      battery:
        "If your bike has a battery, take it with you. Without it, an e-bike is worth little to a thief.",
      parts:
        "Take expensive parts with you or lock them too, and replace quick-release levers with security nuts.",
    },
    limitedData:
      "Few thefts were reported in this area, so its rating is uncertain. Lock up as carefully as anywhere else.",
    // [term as it appears in the copy, its meaning in plain words]
    term: {
      uLock: ["U-lock", "a rigid steel shackle shaped like a U."],
      chainLock: ["Chain lock", "a hardened steel chain with its own lock."],
      foldingLock: ["Folding lock", "steel bars joined like a folding ruler."],
      frameLock: [
        "Frame lock",
        "a lock fixed to the frame that only blocks the rear wheel. Never enough on its own.",
      ],
      cableLock: [
        "Cable lock",
        "a thin steel cable that is quick to cut. Never enough on its own.",
      ],
      vds: [
        "VdS",
        "the testing institute of the German insurance industry. Classes A+ and B+ mark locks made for locking to a fixed object.",
      ],
      discDetainer: [
        "Disc-detainer cylinder",
        "a lock cylinder with rotating discs that is hard to pick.",
      ],
      securityNuts: [
        "Security nuts",
        "wheel and seat fixings that need a special key, instead of quick-release levers.",
      ],
    },
    source: {
      polizeiBerlin: "Polizei Berlin: Fahrraddiebstahl verhindern",
      propk: "Polizei (ProPK): Sichere Fahrradschlösser finden",
      adfcTypes: "ADFC: Fahrradschloss-Typen",
      adfcPrevent: "ADFC: Fahrraddiebstahl vorbeugen",
      vds: "VdS 2597: Zweiradschlösser",
    },
  },
} as const;
