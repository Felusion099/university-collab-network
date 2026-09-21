import { searchRepository } from "../repositories/search.repository.js";
import type { SearchType } from "@app/shared-types";

const ALL_TYPES: SearchType[] = [
  "people",
  "projects",
  "research",
  "publications",
  "teams",
  "clubs",
  "startups",
  "events",
  "opportunities",
];

function parseTypes(raw: string | undefined): SearchType[] {
  if (!raw) return ALL_TYPES;
  const requested = raw.split(",").map((t) => t.trim()) as SearchType[];
  const valid = requested.filter((t) => ALL_TYPES.includes(t));
  return valid.length > 0 ? valid : ALL_TYPES;
}

/**
 * Federated search across the Postgres full-text-indexed tables per
 * ARCHITECTURE.md §4. Each type is queried independently and the results
 * are grouped by type rather than merged/ranked together — API_CONTRACT.md
 * §4 asks for "results grouped by type," not a single ranked list.
 */
export async function search(query: string, typesRaw: string | undefined, limit: number) {
  const types = parseTypes(typesRaw);
  const results: Record<string, unknown[]> = {};

  await Promise.all(
    types.map(async (type) => {
      switch (type) {
        case "people":
          results.people = await searchRepository.searchPeople(query, limit);
          break;
        case "projects":
          results.projects = await searchRepository.searchProjects(query, limit);
          break;
        case "research":
          results.research = await searchRepository.searchResearchTopics(query, limit);
          break;
        case "publications":
          results.publications = await searchRepository.searchPublications(query, limit);
          break;
        case "teams":
          results.teams = await searchRepository.searchResearchTeams(query, limit);
          break;
        case "clubs":
          results.clubs = await searchRepository.searchOrganizations(query, "club", limit);
          break;
        case "startups":
          results.startups = await searchRepository.searchOrganizations(query, "startup", limit);
          break;
        case "events":
          results.events = await searchRepository.searchEvents(query, limit);
          break;
        case "opportunities":
          results.opportunities = await searchRepository.searchOpportunities(query, limit);
          break;
      }
    }),
  );

  return results;
}
