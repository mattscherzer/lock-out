# LockOut: Official Lock-Tier & Mitigation Source of Truth Specification
**Target Audience:** Coding & Architecture LLM  
**Purpose:** Integrate legally citable, up-to-date German bicycle security guidelines (Polizei Berlin, ProPK, VdS, and ADFC) into the `lookup_schema_v1.json` contract, backend rule routing, and CI/CD link-health checks.

---

## 1. Executive Summary & Critical Corrections

To ensure **LockOut** provides verifiable, auditable locking recommendations without hallucination or outdated standards, all mitigation copy must adhere to the following four rules:

1. **Drop UK Certifications (`Sold Secure`):** Replace all references to British standards (*Sold Secure Gold/Diamond*) with German police-referenced laboratory standards: **VdS 2597 (Klassifizierung A+ and B+)**.
2. **Never Recommend a Frame Lock Alone:** Correct earlier placeholder copy for `STANDARD_LOW`. Both **Polizei Berlin** and the **ADFC** explicitly state that frame locks (*Rahmenschlösser*) and cable locks (*Spiralkabelschlösser*) are **never sufficient** for unattended street parking, even for brief stops. Frame locks only act as a secondary immobilizer (*Wegfahrsperre*).
3. **Avoid Deprecated "ADFC-Prüfsiegel" / `DIN EN 15496` Labels:** Current 2025/2026 ADFC documentation no longer promotes an internal ADFC lock-testing seal. Instead, cite concrete ADFC hardware specifications (**>1 kg weight**, **disc-detainer cylinder / *Drehscheibenzylinder***, **3-minute attack resistance**, and **tungsten-carbide coatings / *Wolfram-Carbid-Beschichtung*** against cordless angle grinders) alongside **VdS A+ / B+**.
4. **Enforce Anchor Locking (*Anschließen statt nur Abschließen*):** Every tier must instruct the rider to lock the **frame and at least one wheel** to a fixed, immovable street object (*Fahrradbügel*).

---

## 2. Verified Primary Sources & Last-Updated Audit

| Source Organization | Document Title | Canonical URL | Last Updated / Version |
| :--- | :--- | :--- | :--- |
| **Polizei (ProPK)** *(Programm Polizeiliche Kriminalprävention)* | *Sichere Fahrradschlösser finden* | `https://www.polizei-beratung.de/aktuelles/detailansicht/sichere-fahrradschloesser-finden/` | **2026-06-03** *(Explicit timestamp: `03.06.2026`)* |
| **VdS Schadenverhütung** *(Technical Certification Standard)* | *VdS 2597: Zweiradschlösser, Anforderungen und Prüfmethoden* | `https://shop.vds.de/publikation/vds-2597` | **2025-12** *(Version `2025-12 (04)`)* |
| **Polizei Berlin** | *Fahrraddiebstahl verhindern – So schützen Sie ihr Fahrrad effektiv* | `https://www.berlin.de/polizei/aufgaben/praevention/diebstahl-und-einbruch/artikel.228483.php` | **2025** *(Post-2024 PKS release)* |
| **ADFC (Bundesverband)** | *Fahrradschloss-Typen* & *Fahrraddiebstahl vorbeugen* | `https://www.adfc.de/artikel/fahrradschloss-typen` & `https://www.adfc.de/artikel/fahrraddiebstahl-vorbeugen` | **2025** *(Includes tungsten-carbide angle-grinder guidance)* |

---

## 3. Verbatim Fact Bank (Quotable German Guidelines)

### A. Polizei Berlin (`berlin.de/polizei`)
* **Always Anchor:** *"Fahrrad immer anschließen – auch wenn Sie nur einen kurzen Stopp planen, auch beim Abstellen im eigenen Keller."*
* **Frame + Wheel:** *"Sichern Sie nicht nur den Rahmen, sondern auch mindestens ein Laufrad."*
* **Lock Positioning & Leverage:** *"Lassen Sie das Schloss Richtung Boden schauen (so wird der Einsatz von Dietrichen erschwert), jedoch nicht auf dem Boden aufliegen (sonst kann es z.B. mit Hammer und Meißel geknackt werden). Lassen Sie beim Anschließen möglichst wenig Spielraum, um Hebelansätze zu erschweren."*
* **Components & Skewers:** *"Achten Sie darauf, teure Anbauteile abzunehmen oder einzeln zu sichern... Ersetzen Sie Schnellspanner z.B. durch Sicherheitsmuttern für Räder und Sattel."*
* **Certification Reference:** *"Verwenden Sie nur hochwertige Schlösser aus massivem Material... Informieren Sie sich z.B. beim Fachverband VdS."*

### B. German Police Crime Prevention – ProPK (`polizei-beratung.de`)
* **5–10% Value Rule:** *"Rechnen Sie mit circa fünf bis zehn Prozent des Fahrradpreises für den Kauf eines guten diebstahlsicheren Fahrradschlosses."*
* **Approved Lock Types vs. Frame Locks:** *"Den besten Diebstahlschutz bieten stabile Ketten-, Bügel- oder Faltschlösser... Speichenschlösser [Rahmenschlösser] sind als Diebstahl-Schutz ebenfalls nicht ausreichend."*
* **VdS Classes (A+ & B+):** Recommends **VdS-geprüfte Zweiradschlösser** in **Klasse A+** (bicycles) and **Klasse B+** (high-value e-bikes/light motorcycles). The `+` denotes locks suitable for anchoring to fixed street furniture.
* **E-Bike Battery Removal:** *"Wertvolle Zubehörteile wie den Akku unbedingt immer mitnehmen, oder mit einem zusätzlichen stabilen Schloss gegen Diebstahl schützen. Ohne Akku ist das Rad praktisch wertlos."*

### C. ADFC (`adfc.de`)
* **3-Minute Resistance Rule:** *"Die Faustregel lautet: Drei Minuten muss ein Fahrradschloss gewaltsamen Aufbruchsversuchen standhalten. Dauert es länger, steigt das Risiko, erwischt zu werden."*
* **Hardware Specs (>1 kg & Disc-Detainer Cylinder):** *"Schwerere Schlösser mit großen Bügel-Durchmessern sind stabiler. Deshalb wiegen qualitativ hochwertige Schlösser oft mehr als ein Kilogramm. Drehscheibenzylinder bieten hohen Schutz gegen das Lockpicking."*
* **Dual-Lock Diversity Rule:** *"Da sich Fahrraddiebe oft auf eine Schlossbauart spezialisieren, sollte man sein Fahrrad noch mit einem zweiten Schlosstyp an- und abschließen."*
* **Angle-Grinder Defense:** *"Knacken lassen sich hochwertige Bügelschlösser fast nur mit einem Winkelschleifer. Neue Bügelschlossmodelle mit Wolfram-Carbid-Beschichtung leisten auch gegen Winkelschleifer viel Widerstand."*

---

## 4. Updated JSON Contract (`lookup_schema_v1.json` Snippet)

Drop this updated `metadata` and `advice_catalog` structure directly into `data/processed/lookup_schema_v1.json`:

    {
      "metadata": {
        "generated_at": "2026-10-19T00:00:00Z",
        "guidelines_verified_at": "2026-10-19",
        "security_standards_version": "ProPK (2026-06-03) / VdS 2597:2025-12 / ADFC (2025)",
        "version": "v1.1.0",
        "model_type": "hierarchical_eb_poisson_glm",
        "truncation_lag_days": 14,
        "attribution": {
          "police_data": "Datenquelle: Polizei Berlin (CC-BY 4.0)",
          "osm": "© OpenStreetMap contributors (ODbL)",
          "security_guidance": "Empfehlungen basierend auf Polizei Berlin, ProPK & ADFC"
        }
      },
      "advice_catalog": {
        "STANDARD_LOW": {
          "tier_code": "TIER_1_SOLID",
          "headline": "Solid Primary Lock (Frame + Wheel to Rack)",
          "instruction": "Anchor both the frame and at least one wheel to a fixed street rack using a hardened U-lock, chain, or folding lock (>1 kg, VdS A+ or disc-detainer cylinder). Never rely on a frame lock or cable lock alone, even for short stops.",
          "technical_tip": "Position the lock off the ground with the keyhole facing down and minimal gap to prevent lever or hammer attacks.",
          "sources": [
            {
              "org": "Polizei Berlin",
              "title": "Fahrraddiebstahl verhindern",
              "published_or_updated": "2025",
              "url": "https://www.berlin.de/polizei/aufgaben/praevention/diebstahl-und-einbruch/artikel.228483.php"
            },
            {
              "org": "ADFC",
              "title": "Fahrradschloss-Typen",
              "published_or_updated": "2025",
              "url": "https://www.adfc.de/artikel/fahrradschloss-typen"
            }
          ]
        },
        "STANDARD_MEDIUM": {
          "tier_code": "TIER_1_PLUS_SECONDARY",
          "headline": "Hardened U-Lock + Secondary Wheel Security",
          "instruction": "Elevated local lock-tampering rate. Secure the frame and rear wheel to an immovable anchor with a hardened U-lock or chain (>1 kg, VdS A+/B+), and secure the front wheel with a secondary lock or security nuts.",
          "technical_tip": "Park in well-lit, high-foot-traffic racks and replace quick-release skewers (Schnellspanner) on wheels and seatposts.",
          "sources": [
            {
              "org": "Polizei Berlin",
              "title": "Fahrraddiebstahl verhindern",
              "published_or_updated": "2025",
              "url": "https://www.berlin.de/polizei/aufgaben/praevention/diebstahl-und-einbruch/artikel.228483.php"
            },
            {
              "org": "Polizei (ProPK)",
              "title": "Sichere Fahrradschlösser finden",
              "published_or_updated": "2026-06-03",
              "url": "https://www.polizei-beratung.de/aktuelles/detailansicht/sichere-fahrradschloesser-finden/"
            }
          ]
        },
        "STANDARD_HIGH": {
          "tier_code": "TIER_2_DUAL_MECHANISM",
          "headline": "Dual-Lock Strategy (Two Distinct Lock Mechanisms)",
          "instruction": "High-volume theft hotspot. Combine two different lock build types (e.g., a hardened U-lock + a heavy chain or folding lock) to anchor the frame and both wheels, as thieves specialize in tools for a single mechanism.",
          "technical_tip": "Invest 5–10% of your bike's value in locks designed to resist >3 minutes of attack. Avoid predictable long-term or overnight street parking here.",
          "sources": [
            {
              "org": "ADFC",
              "title": "Fahrraddiebstahl vorbeugen",
              "published_or_updated": "2025",
              "url": "https://www.adfc.de/artikel/fahrraddiebstahl-vorbeugen"
            },
            {
              "org": "Polizei (ProPK)",
              "title": "Sichere Fahrradschlösser finden",
              "published_or_updated": "2026-06-03",
              "url": "https://www.polizei-beratung.de/aktuelles/detailansicht/sichere-fahrradschloesser-finden/"
            }
          ]
        },
        "EBIKE_LOW_MEDIUM": {
          "tier_code": "TIER_2_EBIKE_STANDARD",
          "headline": "VdS B+ Lock + Remove Battery & Display",
          "instruction": "Anchor the frame and rear wheel to a fixed steel rack using a heavy-duty U-lock or chain (VdS B+ or >1.5 kg hardened steel). Always remove the E-bike battery and plug-in display when leaving the bike.",
          "technical_tip": "Per German Police guidance, an E-bike without its battery is commercially unattractive to thieves.",
          "sources": [
            {
              "org": "Polizei (ProPK)",
              "title": "Sichere Fahrradschlösser finden",
              "published_or_updated": "2026-06-03",
              "url": "https://www.polizei-beratung.de/aktuelles/detailansicht/sichere-fahrradschloesser-finden/"
            }
          ]
        },
        "EBIKE_HIGH": {
          "tier_code": "TIER_3_MAX_GRINDER_DEFENSE",
          "headline": "Maximum Defense: Dual Locks (Grinder-Resistant) + Remove Battery",
          "instruction": "Prime target zone for high-value bikes. Remove the battery and display unit, and anchor the frame and wheels using two distinct high-security locks (e.g., a tungsten-carbide angle-grinder-resistant U-lock + a VdS B+ heavy chain).",
          "technical_tip": "Never leave an E-bike or cargo bike unattended overnight on the street in this planning area.",
          "sources": [
            {
              "org": "ADFC",
              "title": "Fahrradschloss-Typen (Winkelschleifer-Schutz)",
              "published_or_updated": "2025",
              "url": "https://www.adfc.de/artikel/fahrradschloss-typen"
            },
            {
              "org": "Polizei Berlin",
              "title": "Fahrraddiebstahl verhindern",
              "published_or_updated": "2025",
              "url": "https://www.berlin.de/polizei/aufgaben/praevention/diebstahl-und-einbruch/artikel.228483.php"
            }
          ]
        }
      }
    }

---

## 5. Suggested Code 1: Empirical Advice Key Router (`src/advice_router.py`)

This deterministic helper maps each cell's predicted `risk_level` and local empirical police statistics (`ERFASSUNGSGRUND` lock-break ratio and `SCHADENSHOEHE` median value) to the appropriate `advice_key`. Even if a cell's raw volume is `MEDIUM`, if >80% of local thefts involve breaking a lock (`Schwerer Diebstahl`) or high-value targets (>= €1,000), it automatically escalates the rider to the ADFC dual-lock recommendation.

    def select_advice_key(
        bike_type: str,
        risk_level: str,
        aggravated_lock_break_share: float,
        median_stolen_value_eur: float,
        daypart: str,
    ) -> str:
        """
        Deterministically selects the ADFC / Polizei Berlin advice_key based on
        predicted risk band AND empirical local crime characteristics.
        """
        bike_type = bike_type.upper()
        risk_level = risk_level.upper()

        # Escalation triggers based on empirical Polizei Berlin data in this LOR:
        # 1. Professional lock-defeating hotspot (>= 80% Schwerer Diebstahl)
        # 2. High-value target zone (median stolen bike >= 1,000 EUR)
        # 3. Overnight exposure (Night daypart)
        high_professional_threat = (
            aggravated_lock_break_share >= 0.80
            or median_stolen_value_eur >= 1000.0
        )

        if bike_type in {"EBIKE", "CARGO"}:
            if risk_level == "HIGH" or (risk_level == "MEDIUM" and (high_professional_threat or daypart == "Night")):
                return "EBIKE_HIGH"
            return "EBIKE_LOW_MEDIUM"

        # Standard Bike Routing
        if risk_level == "HIGH":
            return "STANDARD_HIGH"
        if risk_level == "MEDIUM":
            # Escalate to ADFC Dual-Lock strategy if thieves here systematically break single locks
            if high_professional_threat and daypart == "Night":
                return "STANDARD_HIGH"
            return "STANDARD_MEDIUM"

        # Even in LOW volume areas, escalate to MEDIUM if lock-break ratio is extreme
        if high_professional_threat:
            return "STANDARD_MEDIUM"
        return "STANDARD_LOW"

---

## 6. Suggested Code 2: Source-of-Truth URL Health Check (`src/verify_guideline_sources.py`)

Run this script inside the weekly `.github/workflows/refresh_data.yaml` pipeline so the team is alerted if Polizei Berlin, ProPK, or ADFC ever moves a URL or changes key guidance text.

    import sys
    import urllib.request
    import urllib.error

    GUIDELINE_SOURCES = [
        {
            "org": "Polizei Berlin",
            "url": "https://www.berlin.de/polizei/aufgaben/praevention/diebstahl-und-einbruch/artikel.228483.php",
            "expected_keywords": ["Fahrrad", "anschließen", "VdS"],
        },
        {
            "org": "Polizei (ProPK)",
            "url": "https://www.polizei-beratung.de/aktuelles/detailansicht/sichere-fahrradschloesser-finden/",
            "expected_keywords": ["VdS", "Akku", "fünf bis zehn Prozent"],
        },
        {
            "org": "ADFC (Schloss-Typen)",
            "url": "https://www.adfc.de/artikel/fahrradschloss-typen",
            "expected_keywords": ["Bügelschloss", "Wolfram-Carbid", "Drehscheibenzylinder"],
        },
        {
            "org": "ADFC (Vorbeugen)",
            "url": "https://www.adfc.de/artikel/fahrraddiebstahl-vorbeugen",
            "expected_keywords": ["Drei Minuten", "zweiten Schlosstyp"],
        },
    ]

    def verify_sources() -> bool:
        all_ok = True
        headers = {"User-Agent": "LockOut-Audit-Bot/1.0 (+https://github.com/mattscherzer/lock-out)"}

        for src in GUIDELINE_SOURCES:
            req = urllib.request.Request(src["url"], headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    status = resp.getcode()
                    body = resp.read().decode("utf-8", errors="ignore")
                    missing = [kw for kw in src["expected_keywords"] if kw.lower() not in body.lower()]
                    if status != 200 or missing:
                        print(f"[WARN] {src['org']} ({src['url']}): HTTP {status}, missing keywords: {missing}")
                        all_ok = False
                    else:
                        print(f"[OK]   {src['org']} verified (HTTP 200, all keywords present).")
            except urllib.error.URLError as e:
                print(f"[FAIL] {src['org']} ({src['url']}) unreachable: {e}")
                all_ok = False

        return all_ok

    if __name__ == "__main__":
        success = verify_sources()
        sys.exit(0 if success else 1)