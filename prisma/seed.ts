import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const VERTICAL_WEIGHTS: Record<string, number> = {
  PAYMENTS: 50,
  TREASURY: 50,
  FINTECH: 40,
  TRAVEL: 30,
  SAAS: 20,
};

function calculateIcpScore(vertical: string, estimatedSize: number): number {
  const verticalWeight = VERTICAL_WEIGHTS[vertical] ?? 10;
  let sizeBonus: number;
  if (estimatedSize > 10000) sizeBonus = 30;
  else if (estimatedSize > 5000) sizeBonus = 20;
  else if (estimatedSize > 1000) sizeBonus = 10;
  else sizeBonus = 5;
  const raw = verticalWeight + sizeBonus;
  return Math.min(100, Math.round((raw / 80) * 100));
}

const conferences = [
  {
    name: "Money20/20 Europe",
    date: new Date("2026-06-09"),
    endDate: new Date("2026-06-11"),
    location: "RAI Amsterdam, Netherlands",
    city: "Amsterdam",
    country: "Netherlands",
    vertical: "PAYMENTS",
    estimatedSize: 8000,
    website: "https://europe.money2020.com",
    description: "Europe's largest fintech & payments event. Key players in cross-border payments, banking, and FX gather here.",
  },
  {
    name: "Money20/20 USA",
    date: new Date("2026-10-25"),
    endDate: new Date("2026-10-28"),
    location: "The Venetian, Las Vegas, USA",
    city: "Las Vegas",
    country: "USA",
    vertical: "PAYMENTS",
    estimatedSize: 13000,
    website: "https://us.money2020.com",
    description: "The world's biggest payments and fintech conference. Must-attend for Grain's US expansion.",
  },
  {
    name: "Singapore Fintech Festival",
    date: new Date("2026-11-03"),
    endDate: new Date("2026-11-07"),
    location: "Singapore Expo",
    city: "Singapore",
    country: "Singapore",
    vertical: "FINTECH",
    estimatedSize: 62000,
    website: "https://www.fintechfestival.sg",
    description: "The world's largest fintech festival. Strong APAC presence with FX and cross-border focus.",
  },
  {
    name: "Fintech Connect",
    date: new Date("2026-12-01"),
    endDate: new Date("2026-12-02"),
    location: "ExCeL London, UK",
    city: "London",
    country: "UK",
    vertical: "FINTECH",
    estimatedSize: 4000,
    website: "https://www.fintechconnect.com",
    description: "Leading European fintech conference focused on payments innovation and digital banking.",
  },
  {
    name: "Web Summit",
    date: new Date("2026-11-10"),
    endDate: new Date("2026-11-13"),
    location: "Altice Arena, Lisbon, Portugal",
    city: "Lisbon",
    country: "Portugal",
    vertical: "SAAS",
    estimatedSize: 70000,
    website: "https://websummit.com",
    description: "Massive tech conference. Good for networking with SaaS platforms that have FX exposure.",
  },
  {
    name: "ITB Berlin",
    date: new Date("2026-03-10"),
    endDate: new Date("2026-03-12"),
    location: "Messe Berlin, Germany",
    city: "Berlin",
    country: "Germany",
    vertical: "TRAVEL",
    estimatedSize: 26000,
    website: "https://www.itb.com",
    description: "World's leading travel trade show. Travel wholesalers and OTAs with cross-border payment needs.",
  },
  {
    name: "Finovate Europe",
    date: new Date("2026-02-24"),
    endDate: new Date("2026-02-25"),
    location: "InterContinental O2, London, UK",
    city: "London",
    country: "UK",
    vertical: "FINTECH",
    estimatedSize: 2000,
    website: "https://informaconnect.com/finovateeurope",
    description: "Demo-focused fintech event. Ideal for spotting emerging payment platforms and treasury solutions.",
  },
  {
    name: "EuroFinance International Treasury Management",
    date: new Date("2026-09-22"),
    endDate: new Date("2026-09-24"),
    location: "Fira Barcelona, Spain",
    city: "Barcelona",
    country: "Spain",
    vertical: "TREASURY",
    estimatedSize: 3000,
    website: "https://www.eurofinance.com",
    description: "Premier treasury management conference. Direct access to CFOs and treasurers managing FX risk.",
  },
  {
    name: "Phocuswright Conference",
    date: new Date("2026-11-17"),
    endDate: new Date("2026-11-19"),
    location: "JW Marriott, Phoenix, USA",
    city: "Phoenix",
    country: "USA",
    vertical: "TRAVEL",
    estimatedSize: 3500,
    website: "https://www.phocuswrightconference.com",
    description: "Top travel technology conference. Connects travel platforms with payment and FX solutions.",
  },
  {
    name: "SaaStr Annual",
    date: new Date("2026-09-08"),
    endDate: new Date("2026-09-10"),
    location: "Bay Area, San Francisco, USA",
    city: "San Francisco",
    country: "USA",
    vertical: "SAAS",
    estimatedSize: 12000,
    website: "https://www.saastrannual.com",
    description: "Largest SaaS conference globally. Great for meeting SaaS platforms expanding internationally with FX needs.",
  },
];

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.interaction.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.conference.deleteMany();

  // Seed conferences with calculated ICP scores
  for (const conf of conferences) {
    const icpScore = calculateIcpScore(conf.vertical, conf.estimatedSize);
    await prisma.conference.create({
      data: { ...conf, icpScore },
    });
    console.log(`  Created: ${conf.name} (ICP: ${icpScore})`);
  }

  // Seed sample contacts
  const contact1 = await prisma.contact.create({
    data: {
      name: "David Chen",
      currentCompany: "PayFlow Technologies",
      currentRole: "VP of Partnerships",
      email: "david.chen@payflow.io",
      phone: "+44 7700 900123",
      lifecycleStage: "PROSPECT",
      previousCompanies: JSON.stringify(["TransferHub Inc."]),
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      name: "Sarah Martinez",
      currentCompany: "TravelPay Global",
      currentRole: "Head of Treasury",
      email: "s.martinez@travelpay.com",
      phone: "+1 555 0199",
      lifecycleStage: "LEAD",
    },
  });

  const contact3 = await prisma.contact.create({
    data: {
      name: "Michael O'Brien",
      currentCompany: "NordFX Solutions",
      currentRole: "CTO",
      email: "mobrien@nordfx.eu",
      lifecycleStage: "TARGET",
    },
  });

  // Get conferences for interactions
  const allConfs = await prisma.conference.findMany({ orderBy: { date: "asc" } });
  const finovate = allConfs.find(c => c.name.includes("Finovate"))!;
  const money20eu = allConfs.find(c => c.name.includes("Money20/20 Europe"))!;
  const eurofinance = allConfs.find(c => c.name.includes("EuroFinance"))!;
  const itb = allConfs.find(c => c.name.includes("ITB"))!;
  const phocus = allConfs.find(c => c.name.includes("Phocuswright"))!;

  // David Chen — met at 3 conferences (warming relationship)
  await prisma.interaction.create({
    data: {
      contactId: contact1.id,
      conferenceId: finovate.id,
      notes: "Met at Finovate demo booth. He was at TransferHub then, interested in our pricing model. Asked about API integration timelines. Seemed genuinely curious but said budget approval would be Q3.",
      temperature: "COLD",
      capturedRoleAtTime: "Director of BD",
      capturedCompanyAtTime: "TransferHub Inc.",
      source: "manual",
      createdAt: new Date("2026-02-24"),
    },
  });

  await prisma.interaction.create({
    data: {
      contactId: contact1.id,
      conferenceId: money20eu.id,
      notes: "Ran into David again — he moved to PayFlow as VP Partnerships! Much warmer. Remembers our conversation. Says PayFlow processes $200M/month cross-border. Wants to schedule a call with their treasury team. Exchanged LinkedIn.",
      temperature: "WARM",
      capturedRoleAtTime: "VP of Partnerships",
      capturedCompanyAtTime: "PayFlow Technologies",
      source: "manual",
      createdAt: new Date("2026-06-10"),
    },
  });

  await prisma.interaction.create({
    data: {
      contactId: contact1.id,
      conferenceId: eurofinance.id,
      notes: "David sought us out at our booth. Brought his CFO. They're actively evaluating 3 FX providers. Timeline: decision by Q4. Need localized collection accounts in EUR, GBP, USD. This is hot — schedule demo ASAP.",
      temperature: "HOT",
      capturedRoleAtTime: "VP of Partnerships",
      capturedCompanyAtTime: "PayFlow Technologies",
      source: "manual",
      createdAt: new Date("2026-09-23"),
    },
  });

  // Sarah Martinez — met at 2 conferences (travel vertical)
  await prisma.interaction.create({
    data: {
      contactId: contact2.id,
      conferenceId: itb.id,
      notes: "Met Sarah at ITB travel networking dinner. TravelPay does B2B wholesale travel bookings across 40 countries. Currently losing 2-3% on FX spreads. Interested but said they're locked in with current provider until mid-2026.",
      temperature: "WARM",
      capturedRoleAtTime: "Head of Treasury",
      capturedCompanyAtTime: "TravelPay Global",
      source: "manual",
      createdAt: new Date("2026-03-11"),
    },
  });

  await prisma.interaction.create({
    data: {
      contactId: contact2.id,
      conferenceId: phocus.id,
      notes: "Sarah mentioned their current FX provider contract ends in January. She's been comparing alternatives. Asked specifically about our rate-lock feature for pre-booked travel. Send her a case study from a similar travel platform.",
      temperature: "HOT",
      capturedRoleAtTime: "Head of Treasury",
      capturedCompanyAtTime: "TravelPay Global",
      source: "manual",
      createdAt: new Date("2026-11-18"),
    },
  });

  // Michael O'Brien — single cold touch
  await prisma.interaction.create({
    data: {
      contactId: contact3.id,
      conferenceId: finovate.id,
      notes: "Quick intro at networking break. NordFX is a Nordic payment processor, small but growing fast. Michael seemed distracted, exchanged cards. Follow up with email.",
      temperature: "COLD",
      capturedRoleAtTime: "CTO",
      capturedCompanyAtTime: "NordFX Solutions",
      source: "ocr",
      createdAt: new Date("2026-02-25"),
    },
  });

  console.log("Seed complete!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
