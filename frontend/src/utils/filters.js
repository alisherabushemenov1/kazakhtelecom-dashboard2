export const DEFAULT_FILTERS = {
  search: "",
  type: "",
  region: "",
  sponsor: "",
  manager: "",
  month: "may",
  amountFrom: "",
  amountTo: ""
};

const MONTH_FALLBACKS = ["jan_may", "may", "january"];

export function getMonthBlock(project, monthKey) {
  if (!project?.months) return null;

  const keys = [monthKey, ...MONTH_FALLBACKS].filter(Boolean);
  for (const key of keys) {
    if (project.months[key]) return project.months[key];
  }

  const firstKey = Object.keys(project.months)[0];
  return firstKey ? project.months[firstKey] : null;
}

export function getMonthValues(project, monthKey) {
  const block = getMonthBlock(project, monthKey);
  if (!block) {
    return { plan: 0, fact: 0, equipmentPlan: 0, smrPlan: 0, equipmentFact: 0, smrFact: 0 };
  }

  return {
    plan: block.plan.total,
    fact: block.fact.total,
    equipmentPlan: block.plan.equipment,
    smrPlan: block.plan.smr,
    equipmentFact: block.fact.equipment,
    smrFact: block.fact.smr
  };
}

export function getMonthLabel(meta, monthKey) {
  const list = meta?.allMonths || meta?.months || [];
  return list.find((m) => m.key === monthKey)?.label || monthKey;
}

export function filterProjects(projects, filters) {
  const q = filters.search.trim().toLowerCase();
  const from = filters.amountFrom !== "" ? Number(filters.amountFrom) : null;
  const to = filters.amountTo !== "" ? Number(filters.amountTo) : null;

  return projects.filter((project) => {
    if (filters.type && project.type !== filters.type) return false;
    if (filters.region && project.region !== filters.region) return false;
    if (filters.sponsor && project.sponsor !== filters.sponsor) return false;
    if (filters.manager && project.manager !== filters.manager) return false;

    const amount = project.plan2026.total;
    if (from !== null && !Number.isNaN(from) && amount < from) return false;
    if (to !== null && !Number.isNaN(to) && amount > to) return false;

    if (!q) return true;
    return [project.name, project.spp, project.sponsor, project.manager, project.region, project.typeLabel]
      .some((value) => String(value || "").toLowerCase().includes(q));
  });
}

export function filterRegions(regionStats, filters) {
  const q = filters.search.trim().toLowerCase();

  return regionStats
    .map((region) => {
      const projects = filterProjects(region.projects, filters);
      if (!projects.length) return null;

      const periodPlan = projects.reduce((sum, p) => sum + getMonthValues(p, filters.month).plan, 0);
      const periodFact = projects.reduce((sum, p) => sum + getMonthValues(p, filters.month).fact, 0);

      return {
        ...region,
        projects,
        count: projects.length,
        plan2026: projects.reduce((sum, p) => sum + p.plan2026.total, 0),
        periodPlan,
        periodFact,
        execution: periodPlan > 0 ? Math.round((periodFact / periodPlan) * 1000) / 10 : 0
      };
    })
    .filter(Boolean)
    .filter((region) => {
      if (!q) return true;
      return region.region.toLowerCase().includes(q) || region.projects.some((p) => p.name.toLowerCase().includes(q));
    });
}
