/**
 * Profili mercato settoriali — dati realistici e specifici per settore
 * Usati per generare Market Intelligence contestualizzata
 */

export interface SectorMarketProfile {
  marketSize: number;
  servicableMarket: number;
  targetMarket: number;
  growthRate: number;
  competitorIntensity: "low" | "medium" | "high" | "very_high";
  pricingAverage: number;
  /** Es. "per licenza SaaS/mese" — contesto del prezzo medio */
  pricingLabel: string;
  barriersToEntry: string[];
  keyTrends: string[];
}

/** Match settore → profilo. Le chiavi sono usate per match parziale (includes) */
const SECTOR_PROFILES: Array<{ keywords: string[]; profile: SectorMarketProfile }> = [
  // Technology / Software / Consulenza IT
  {
    keywords: ["technology", "software", "consulenza", "digital", "it", "owltech", "sviluppo"],
    profile: {
      marketSize: 4_200_000_000,
      servicableMarket: 420_000_000,
      targetMarket: 12_000_000,
      growthRate: 18.4,
      competitorIntensity: "high",
      pricingAverage: 2400,
      pricingLabel: "per progetto custom / mese (es. portale B2B, integrazione ERP)",
      barriersToEntry: [
        "Integrazione con sistemi legacy del cliente",
        "Costo di switching elevato — lock-in tecnico",
        "Necessità di personalizzazione verticale per settore",
      ],
      keyTrends: [
        "AI-first ERP: adozione +340% nel 2024 per automazione processi",
        "Migrazione cloud PMI: +28% annuo, PNRR come acceleratore",
        "Regolamento NIS2: obbligo cybersec per PMI critiche",
        "Low-code/no-code: concorrenza su progetti standard",
      ],
    },
  },
  // SaaS / FinTech / Piattaforme
  {
    keywords: ["saas", "fintech", "platform", "ecoceo", "piattaforma", "software as a service"],
    profile: {
      marketSize: 8_900_000_000,
      servicableMarket: 890_000_000,
      targetMarket: 45_000_000,
      growthRate: 22,
      competitorIntensity: "very_high",
      pricingAverage: 89,
      pricingLabel: "per utente/mese (piano standard B2B SaaS)",
      barriersToEntry: [
        "Network effect e integrazioni esistenti (Zapier, API)",
        "Costo acquisizione cliente (CAC) elevato in B2B",
        "Churn: fidelizzazione su feature lock-in",
      ],
      keyTrends: [
        "Usage-based pricing: sostituzione modelli flat-rate",
        "AI embedded: copilot e automazione come differenziatore",
        "Consolidamento: acquisizioni da big player (Microsoft, Salesforce)",
        "PLG (Product-Led Growth): self-serve e free tier come leva",
      ],
    },
  },
  // Design / Branding / UI-UX
  {
    keywords: ["design", "branding", "ui", "ux", "designlab", "agenzia", "identità visiva"],
    profile: {
      marketSize: 2_100_000_000,
      servicableMarket: 210_000_000,
      targetMarket: 4_200_000,
      growthRate: 12,
      competitorIntensity: "high",
      pricingAverage: 7500,
      pricingLabel: "per progetto (es. brand identity completo, UI/UX app)",
      barriersToEntry: [
        "Portfolio e case study come prova di competenza",
        "Relazioni con clienti enterprise e referral",
        "Specializzazione verticale (healthtech, fintech) richiesta",
      ],
      keyTrends: [
        "Design system e component library: riuso e scalabilità",
        "AI per moodboard e concept: accelerazione fase discovery",
        "Design ops: integrazione con dev team e design-to-code",
        "Accessibility (WCAG): requisito per app pubbliche e bandi",
      ],
    },
  },
  // Ceramica / Manifatturiero / Prodotti
  {
    keywords: ["ceramica", "ceramiche", "manifatturiero", "produzione", "piastrelle", "tavoli"],
    profile: {
      marketSize: 3_500_000_000,
      servicableMarket: 350_000_000,
      targetMarket: 8_750_000,
      growthRate: 4.2,
      competitorIntensity: "high",
      pricingAverage: 42,
      pricingLabel: "al m² — piastrella ceramica 60×60 cm (gres porcellanato)",
      barriersToEntry: [
        "Certificazioni e qualità (ISO, Marca CE)",
        "Distribuzione e showroom — retail vs contract",
        "Costo impianti e stampi per serie limitate",
      ],
      keyTrends: [
        "Sostenibilità: riciclo materiali e produzione carbon-neutral",
        "Grandi formati: 120×280 cm, thin slabs per superfici continue",
        "Superfici intelligenti: antibatteriche, fotocatalitiche",
        "E-commerce B2B: ordini digitali e configuratori",
      ],
    },
  },
  // Food / Ristorazione / F&B
  {
    keywords: ["food", "ristorazione", "catering", "gastronomia", "f&b", "ristorante"],
    profile: {
      marketSize: 1_800_000_000,
      servicableMarket: 180_000_000,
      targetMarket: 3_600_000,
      growthRate: 6.8,
      competitorIntensity: "very_high",
      pricingAverage: 28,
      pricingLabel: "per coperto medio (cena, ristorante medio-alto)",
      barriersToEntry: [
        "Location e visibilità — foot traffic",
        "Reclutamento chef e staff qualificato",
        "Permessi e normative HACCP",
      ],
      keyTrends: [
        "Delivery e dark kitchen: modelli ibridi post-COVID",
        "Località e km zero: preferenza clienti",
        "Tecnologia: prenotazioni, POS, gestione tavoli",
        "Experience dining: evento oltre al cibo",
      ],
    },
  },
  // E-commerce / Retail
  {
    keywords: ["ecommerce", "retail", "e-commerce", "vendita online", "marketplace"],
    profile: {
      marketSize: 6_200_000_000,
      servicableMarket: 620_000_000,
      targetMarket: 18_600_000,
      growthRate: 14,
      competitorIntensity: "very_high",
      pricingAverage: 65,
      pricingLabel: "AOV medio — ordine medio e-commerce",
      barriersToEntry: [
        "Acquisizione traffico: costo CAC su Meta/Google",
        "Logistica e resi: margini e CX",
        "Trust e recensioni: social proof",
      ],
      keyTrends: [
        "Social commerce: TikTok Shop, Instagram Checkout",
        "Live shopping: streaming e acquisti in tempo reale",
        "D2C: brand che bypassano retail",
        "Sostenibilità: packaging e supply chain trasparente",
      ],
    },
  },
  // Consulting / Consulenza generica
  {
    keywords: ["consulting", "consulenza", "strategia", "management"],
    profile: {
      marketSize: 2_800_000_000,
      servicableMarket: 280_000_000,
      targetMarket: 7_000_000,
      growthRate: 9,
      competitorIntensity: "high",
      pricingAverage: 180,
      pricingLabel: "a giornata — consulenza senior (strategy, operations)",
      barriersToEntry: [
        "Credibilità e track record: case study e referral",
        "Relazioni con clienti enterprise",
        "Specializzazione verticale o funzionale",
      ],
      keyTrends: [
        "Consulenza ibrida: advisory + implementation",
        "Remote e hybrid delivery: modelli globali",
        "Data-driven: analytics e decision support",
        "Sustainability consulting: ESG e compliance",
      ],
    },
  },
];

/** Trova il profilo più adatto in base a settore e nome attività */
export function getSectorProfile(sector: string, activityName: string): SectorMarketProfile {
  const search = `${sector} ${activityName}`.toLowerCase();

  for (const { keywords, profile } of SECTOR_PROFILES) {
    if (keywords.some((k) => search.includes(k))) {
      return profile;
    }
  }

  // Fallback generico
  return {
    marketSize: 1_500_000_000,
    servicableMarket: 150_000_000,
    targetMarket: 3_750_000,
    growthRate: 8,
    competitorIntensity: "medium",
    pricingAverage: 2500,
    pricingLabel: "per unità/ordine medio (riferimento settore)",
    barriersToEntry: [
      "Integrazione con ecosistema esistente",
      "Brand recognition e fiducia",
      "Costo di switching per il cliente",
    ],
    keyTrends: [
      "Digitalizzazione e automazione processi",
      "Sostenibilità e compliance normativa",
      "AI e data-driven decision making",
    ],
  };
}
