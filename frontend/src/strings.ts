// The string table (M7): every user-visible string and aria-label, grouped by feature. English only for the MVP
// (D-11); a translation is a second object with the same shape. The advice copy follows
// docs/lock-tier-documentation.md section 3 and names the organisation behind each claim that is specific to it.

// one ADFC claim, shared by the second-lock step and the one-lock hint so the two cannot drift apart
const SECOND_LOCK =
  "a second lock of a different type, because thieves often specialise in one kind of lock.";

const reports = (n: number) => `${n} ${n === 1 ? "report" : "reports"}`;

export const STRINGS = {
  // the compact verdict strip; the low phrase must hold for the whole bottom 60% of areas
  verdictPhrase: {
    low: "not among the most reported bike thefts",
    medium: "more reported thefts than most areas",
    high: "among the most reported bike thefts",
    limited: "too few reports to rate this area",
    "no-data": "nothing reported, so no rating",
  },
  status: {
    loadError: "Could not load map data",
    noPostcodeSearch: "station and postcode search unavailable",
    noStreetSearch: "street search unavailable",
  },
  about: {
    title: "About the data",
    intro:
      "Tiers compare areas by reported bike thefts. They are not the risk to a particular bike, and thin or missing data does not mean an area has no thefts.",
    limitsTitle: "Limits",
    limits: [
      "Open data covers about three quarters of the police's own figure.",
      "Many thefts are never reported.",
      "Recent reports arrive late, so the latest weeks are left out.",
      "The data covers one year, so seasons are not modelled.",
    ],
    sourcesTitle: "Sources",
    close: "Close",
  },
  map: {
    // CC-BY: the gazetteer's sources must be credited next to the map
    searchAttribution: "Search: Amt für Statistik Berlin-Brandenburg (CC-BY 3.0), VBB",
  },
  legend: {
    label: "Map legend",
    low: "Low",
    medium: "Medium",
    high: "High",
    limited: "Limited data",
    colourBlind: "Colour-blind",
  },
  card: {
    areaFallback: "Area details",
    close: "Close area details",
    changeHeight: "Change height of area details",
    show: "Show area details",
    collapse: "Collapse area details",
    closePanel: "Close",
    ratingTitle: "What this rating means",
    note: {
      error: ["Could not load this area", "Something went wrong. Pick the area again to retry."],
    },
  },
  verdict: {
    word: {
      low: "Low",
      medium: "Medium",
      high: "High",
      "no-data": "No data",
      limited: "Limited data",
    },
    heading: "Reported bike thefts vs other areas",
    gauge: ["Low", "Medium", "High"],
    explain: "What does this mean?",
    line: {
      high: (share: number) =>
        `Among the ${share}% of Berlin areas with the most reported bike thefts.`,
      medium: "More reported thefts than most Berlin areas, but not among the highest.",
      low: "Among the 60% of Berlin areas with the fewest reported bike thefts.",
      limited: (n: number) =>
        `${n === 0 ? "No reports" : `Only ${reports(n)}`} in 12 months, too few to rate this area. This does not mean low risk.`,
      noData: "No reports found, so we can't rate this area. This does not mean low risk.",
    },
  },
  dataLine: {
    reports,
    plenty: "Plenty of data",
    some: "Some data",
    behind: (n: string) => `behind this: ${n} in 12 months.`,
    shift: "A few more or fewer could shift the rating.",
  },
  details: {
    time: { Morning: "Morning", Afternoon: "Afternoon", Evening: "Evening", Night: "Night" },
    day: { Mon_Thu: "Mon–Thu", Friday: "Friday", Weekend: "Weekend" },
    lastSeen: "When bikes were last seen",
    pattern: { "citywide pattern": "Citywide pattern", "area pattern": "Area pattern" },
    whyPattern:
      "These shares come from all of Berlin's reports and are the same for every area. They show when bikes are usually last seen, not when this area is riskier.",
    timeOfDay: "Time of day",
    dayOfWeek: "Day of the week",
    perDay: "Average share of a week's thefts per day.",
    areaData: "This area's data",
    reportsIn12: (n: number) => `${n === 1 ? "report" : "reports"} in 12 months`,
    dataUpTo: (year: string) => `Police data up to ${year}`,
    thresholds: (plenty: number, limited: number) =>
      `Plenty of data means ${plenty} or more reports in 12 months, some data ${limited} to ${plenty - 1}, limited data fewer than ${limited}.`,
    chart: (label: string, parts: string[]) => `${label}: ${parts.join(", ")}`,
  },
  explain: {
    rankTitle: "How areas are ranked",
    fewest: "Fewest reports",
    most: "Most reports",
    ranked: (name: string) =>
      `All 542 areas, ranked by expected bike thefts per year, with small areas drawn toward their neighbourhood. The pin marks the group ${name} is in.`,
    unplaced: (n: number) =>
      `This area is not placed on the scale. With ${n === 0 ? "no reports" : reports(n)}, any rank would be a guess.`,
    dataTitle: "How much data is behind this?",
    dataIntro:
      "Risk and data are two different things. The rating compares reported thefts with other Berlin areas. The data line says how many reports that comparison rests on.",
    plentyTitle: "Plenty of data",
    plenty: (n: number) =>
      `(${n} or more reports in 12 months): one or two more thefts would not change the rating.`,
    someTitle: "Some data",
    some: (from: number, to: number) =>
      `(${from} to ${to}): our best read, but a few more or fewer reports could move it to a neighbouring level.`,
    limitedTitle: "Limited data",
    limited: (n: number) =>
      `(fewer than ${n}): too few to rate, so no rating is shown. This does not mean low risk.`,
    dataClosing: "A lot of data does not mean high risk, and little data does not mean low risk.",
    notTitle: "What it doesn't tell you",
    not: "It is not the chance that your bike is stolen. Busy places collect more reports.",
    sourceTitle: "Where it comes from",
    source: (start: string, end: string, lagDays: number) =>
      `Police reports of street bike thefts, ${start} to ${end}. The latest ${lagDays} days are left out because reports arrive late.`,
  },
  search: {
    closeLabel: "Close search",
    clearLabel: "Clear search",
    inputLabel: "Search area, street, station or postcode",
    placeholder: "Street, postcode, area or station",
    houseNumber: "House numbers aren't searchable yet, showing the street.",
    tooShort: "Type at least two characters.",
    errorWithRows: "Street search isn't available right now",
    errorNoRows: "Search isn't responding",
    errorBody: "We kept what you typed. Check your connection and try again.",
    retry: "Try again",
    tryTitle: "Try searching for",
    notFound: (query: string) => `‘${query}’ not found`,
    berlinOnly: "lock-out covers Berlin only. Try a Berlin street, postcode, area or station.",
    examplesLabel: "Examples",
    areasLabel: "Areas",
    narrow: "Keep typing to narrow down",
    location: {
      title: "Use my location",
      mapButton: "Show my location",
      ready: "Find the area you are in",
      waitTitle: "Finding your area…",
      wait: "This takes a few seconds",
      denied: "Blocked in your browser settings",
      help: "Allow location for this site in your browser’s site settings (the icon at the left of the address bar), then reload this page. You can also just type above.",
      failed: "We couldn’t find your location. Try again or search instead.",
      noAreaTitle: "We don’t have data for your location",
      noAreaBody:
        "lock-out covers Berlin only. Search for a Berlin street, postcode, area or station, or try again from another spot.",
      live: { waiting: "Finding your area", selected: (area: string) => `Selected ${area}` },
    },
    hints: { navigate: "↑ ↓ navigate", select: "↵ select", close: "esc close" },
    // the gazetteer's own street type: places.test.ts matches it against the shipped data
    kind: {
      postcode: "Postcode",
      station: "Station",
      street: "Street",
      area: "Area",
      water: "Water",
    },
    stationSub: (sub: string) => `${sub} station`,
    inAreas: (kind: string, n: number) => `${kind} · in ${n} areas`,
    more: (n: number, name: string) => `+${n} more areas for ${name}`,
    areaSub: (bezirk: string) => `Area · ${bezirk}`,
    placeSub: (kind: string, area: string, bezirk: string) => `${kind} · ${area} · ${bezirk}`,
    rowLabel: (full: string, sub: string, name: string, pct: number) =>
      `${full}, ${sub}, in ${name}, ${pct}%`,
    live: {
      tooShort: "Keep typing",
      searching: "Searching",
      results: (n: number) => `${n} ${n === 1 ? "result" : "results"}`,
      none: "No results",
    },
  },
  advice: {
    headline: {
      oneLock: "Lock the frame and a wheel to something fixed, with one solid lock",
      twoLocks: "Use two solid locks of different types",
    },
    banner: { oneLock: "Use 1 solid lock", twoLocks: "Use 2 locks" },
    why: {
      oneLock: "Locked to something fixed.",
      twoLocks: "Of different types.",
    },
    key: {
      anchor: "Frame and wheel to something fixed",
      solidLock: "Solid U-, chain or folding lock",
      neverAlone: "A frame or cable lock is never enough on its own",
      position: "Keyhole down, off the ground",
      secondLock: "Add a second lock, different type",
    },
    sectionTitle: "Locking advice",
    bikeCaption: "Bike value",
    allSteps: (n: number) => `All ${n} steps`,
    panel: {
      made: "How this advice was made",
      madeText:
        "This advice follows guidance from Polizei Berlin, the police crime-prevention service (ProPK), the ADFC cycling club and the VdS lock-testing standard. It depends on what a bike is worth, not on the area, so it is the same strong standard everywhere.",
      tips: "Tips for every bike",
      terms: "Lock words explained",
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
      secondLock: `The ADFC advises ${SECOND_LOCK}`,
      threeMinutes:
        "The ADFC's rule of thumb is that a lock should withstand force for three minutes. It adds that new U-locks with a tungsten-carbide coating also resist angle grinders well.",
      higherClass:
        "For very valuable bikes and e-bikes, the police (ProPK) point to the higher VdS class B+.",
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
      failed:
        "We could not check this area, so this is the standard advice. It is the same everywhere.",
      limitedData:
        "Few thefts were reported in this area, so its rating is uncertain. Lock up as carefully as anywhere else.",
      noRecord:
        "The police data we use has no bike theft from the street on record for this area. That does not mean bikes are never stolen here, so lock up as carefully as anywhere else.",
    },
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
    bikeValue: { under_eur_1000: "Under €1,000", eur_1000_or_more: "€1,000 or more" },
    secondLockHint: `For a more valuable bike, the ADFC advises ${SECOND_LOCK}`,
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
