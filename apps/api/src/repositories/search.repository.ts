import { prisma } from "./prisma.js";

/**
 * Postgres full-text search via the generated `search_vector` tsvector
 * columns (see prisma/migrations/.../migration.sql) per ARCHITECTURE.md §4.
 * Prisma's schema language has no first-class tsvector query support, so
 * these use $queryRaw against the raw column — the one place in Phase 5
 * that intentionally drops to raw SQL, exactly as ARCHITECTURE.md §4
 * anticipates ("future: Meilisearch/Elasticsearch swap behind the same
 * service interface" — this repository is that interface boundary).
 */
export class SearchRepository {
  async searchPeople(query: string, limit: number) {
    return prisma.$queryRaw<
      { id: string; username: string; role: string; department: string | null; matched: string }[]
    >`
      SELECT u.id::text as id, u.id::text as username, u.requested_role as role,
             COALESCE(sp.department, pp.department, rp.department) as department,
             'bio' as matched
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id AND sp.search_vector @@ plainto_tsquery('english', ${query})
      LEFT JOIN professor_profiles pp ON pp.user_id = u.id AND pp.search_vector @@ plainto_tsquery('english', ${query})
      LEFT JOIN researcher_profiles rp ON rp.user_id = u.id AND rp.search_vector @@ plainto_tsquery('english', ${query})
      WHERE u.status = 'active'
        AND (sp.user_id IS NOT NULL OR pp.user_id IS NOT NULL OR rp.user_id IS NOT NULL)
      LIMIT ${limit}
    `;
  }

  async searchProjects(query: string, limit: number) {
    return prisma.$queryRaw<{ id: string; name: string; status: string }[]>`
      SELECT id::text as id, name, status::text as status
      FROM projects
      WHERE search_vector @@ plainto_tsquery('english', ${query})
      LIMIT ${limit}
    `;
  }

  async searchResearchTopics(query: string, limit: number) {
    return prisma.$queryRaw<{ id: string; name: string; slug: string }[]>`
      SELECT id::text as id, name, slug
      FROM research_topics
      WHERE search_vector @@ plainto_tsquery('english', ${query})
      LIMIT ${limit}
    `;
  }

  async searchPublications(query: string, limit: number) {
    return prisma.$queryRaw<{ id: string; title: string }[]>`
      SELECT id::text as id, title
      FROM publications
      WHERE search_vector @@ plainto_tsquery('english', ${query})
      LIMIT ${limit}
    `;
  }

  async searchOrganizations(
    query: string,
    type: "club" | "society" | "startup" | undefined,
    limit: number,
  ) {
    if (type) {
      return prisma.$queryRaw<{ id: string; name: string; type: string }[]>`
        SELECT id::text as id, name, type::text as type
        FROM organizations
        WHERE search_vector @@ plainto_tsquery('english', ${query}) AND type = ${type}::"OrganizationType"
        LIMIT ${limit}
      `;
    }
    return prisma.$queryRaw<{ id: string; name: string; type: string }[]>`
      SELECT id::text as id, name, type::text as type
      FROM organizations
      WHERE search_vector @@ plainto_tsquery('english', ${query})
      LIMIT ${limit}
    `;
  }

  async searchResearchTeams(query: string, limit: number) {
    // research_teams has no search_vector column (not listed in DATABASE_SCHEMA.md's
    // Indexing Summary) — falls back to a simple ILIKE on name, which is the
    // documented, non-generated-column path for tables without one.
    return prisma.$queryRaw<{ id: string; name: string }[]>`
      SELECT id::text as id, name
      FROM research_teams
      WHERE name ILIKE ${"%" + query + "%"}
      LIMIT ${limit}
    `;
  }

  async searchEvents(query: string, limit: number) {
    return prisma.$queryRaw<{ id: string; title: string }[]>`
      SELECT id::text as id, title
      FROM events
      WHERE title ILIKE ${"%" + query + "%"} OR description ILIKE ${"%" + query + "%"}
      LIMIT ${limit}
    `;
  }

  async searchOpportunities(query: string, limit: number) {
    return prisma.$queryRaw<{ id: string; title: string }[]>`
      SELECT id::text as id, title
      FROM opportunities
      WHERE title ILIKE ${"%" + query + "%"} OR description ILIKE ${"%" + query + "%"}
      LIMIT ${limit}
    `;
  }
}

export const searchRepository = new SearchRepository();
