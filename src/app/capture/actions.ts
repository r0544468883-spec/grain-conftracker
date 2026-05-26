"use server";

import { prisma } from "@/lib/db";

export async function searchContacts(query: string) {
  if (!query || query.length < 2) return [];

  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { currentCompany: { contains: query } },
        { email: { contains: query } },
      ],
    },
    take: 10,
    include: { _count: { select: { interactions: true } } },
  });

  // Group by company for bi-directional awareness
  const companyMatches = new Set<string>();
  contacts.forEach((c) => {
    if (c.currentCompany?.toLowerCase().includes(query.toLowerCase())) {
      companyMatches.add(c.currentCompany);
    }
  });

  // If we matched a company, also find all contacts at that company
  let allContacts = contacts;
  if (companyMatches.size > 0) {
    const companyContacts = await prisma.contact.findMany({
      where: {
        currentCompany: { in: Array.from(companyMatches) },
      },
      include: { _count: { select: { interactions: true } } },
    });
    // Merge without duplicates
    const ids = new Set(allContacts.map((c) => c.id));
    companyContacts.forEach((c) => {
      if (!ids.has(c.id)) {
        allContacts.push(c);
        ids.add(c.id);
      }
    });
  }

  return allContacts.slice(0, 10).map((c) => ({
    id: c.id,
    name: c.name,
    currentCompany: c.currentCompany,
    currentRole: c.currentRole,
    email: c.email,
    phone: c.phone,
    interactionCount: c._count.interactions,
  }));
}

export async function getConferences() {
  return prisma.conference.findMany({
    orderBy: { date: "desc" },
    select: { id: true, name: true, date: true },
  });
}

export async function submitLead(data: {
  name: string;
  company: string;
  role: string;
  email: string;
  phone: string;
  conferenceId: string;
  notes: string;
  temperature: string;
  source: string;
  existingContactId?: string;
}) {
  const {
    name,
    company,
    role,
    email,
    phone,
    conferenceId,
    notes,
    temperature,
    source,
    existingContactId,
  } = data;

  let contactId: string;

  if (existingContactId) {
    // Update existing contact if role/company changed
    const existing = await prisma.contact.findUnique({ where: { id: existingContactId } });
    const updateData: Record<string, string> = {};
    if (company) updateData.currentCompany = company;
    if (role) updateData.currentRole = role;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    // Track previous company if it changed
    if (company && existing?.currentCompany && company !== existing.currentCompany) {
      const prev: string[] = existing.previousCompanies
        ? JSON.parse(existing.previousCompanies)
        : [];
      if (!prev.includes(existing.currentCompany)) {
        prev.push(existing.currentCompany);
        updateData.previousCompanies = JSON.stringify(prev);
      }
    }

    await prisma.contact.update({
      where: { id: existingContactId },
      data: updateData,
    });
    contactId = existingContactId;
  } else {
    // Check for existing contact by email (bi-directional matching)
    let matchedContact = null;
    if (email) {
      matchedContact = await prisma.contact.findFirst({ where: { email } });
    }

    if (matchedContact) {
      // Update existing instead of creating duplicate
      const updateData: Record<string, string> = {};
      if (company && company !== matchedContact.currentCompany) {
        const prev: string[] = matchedContact.previousCompanies
          ? JSON.parse(matchedContact.previousCompanies)
          : [];
        if (matchedContact.currentCompany && !prev.includes(matchedContact.currentCompany)) {
          prev.push(matchedContact.currentCompany);
          updateData.previousCompanies = JSON.stringify(prev);
        }
        updateData.currentCompany = company;
      }
      if (role) updateData.currentRole = role;
      if (phone) updateData.phone = phone;
      if (Object.keys(updateData).length > 0) {
        await prisma.contact.update({ where: { id: matchedContact.id }, data: updateData });
      }
      contactId = matchedContact.id;
    } else {
      const contact = await prisma.contact.create({
        data: {
          name,
          currentCompany: company || null,
          currentRole: role || null,
          email: email || null,
          phone: phone || null,
          lifecycleStage: "LEAD",
        },
      });
      contactId = contact.id;
    }
  }

  await prisma.interaction.create({
    data: {
      contactId,
      conferenceId,
      notes: notes || null,
      temperature: temperature || "WARM",
      capturedRoleAtTime: role || null,
      capturedCompanyAtTime: company || null,
      source: source || "manual",
    },
  });

  return { success: true, contactId };
}
