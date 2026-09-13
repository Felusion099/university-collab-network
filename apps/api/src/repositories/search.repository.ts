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
    // Real username (SAFE_USER_SELECT semantics — never the UUID as a
    // display field), full_name per role profile, and MATCH reason.
    // Matches on name (ILIKE), profile full-text vector (bio/expertise),
    // and university domain — intentional searchable fields only, never
    // IDs/timestamps/enum values.
    return prisma.$queryRaw<
      { id: string; username: string; fullName: string | null; role: string; department: string | null; matched: string }[]
    >`
      SELECT u.id::text as id, u.username, u.requested_role as role,
             COALESCE(sp.full_name, pp.full_name, rp.full_name) as "fullName",
             COALESCE(sp.department, pp.department, rp.department) as department,
             CASE
               WHEN u.username ILIKE ${'%' + query + '%'}
                 OR sp.full_name ILIKE ${'%' + query + '%'}
                 OR pp.full_name ILIKE ${'%' + query + '%'}
                 OR rp.full_name ILIKE ${'%' + query + '%'} THEN 'name'
               WHEN pp.expertise::text ILIKE ${'%' + query + '%'} THEN 'expertise'
               ELSE 'profile'
             END as matched
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.id
      LEFT JOIN professor_profiles pp ON pp.user_id = u.id
      LEFT JOIN researcher_profiles rp ON rp.user_id = u.id
      WHERE u.status = 'active'
        AND (
          u.username ILIKE ${'%' + query + '%'}
          OR sp.full_name ILIKE ${'%' + query + '%'}
          OR pp.full_name ILIKE ${'%' + query + '%'}
          OR rp.full_name ILIKE ${'%' + query + '%'}
          OR sp.search_vector @@ plainto_tsquery('english', ${query})
          OR pp.search_vector @@ plainto_tsquery('english', ${query})
          OR rp.search_vector @@ plainto_tsquery('english', ${query})
        )
      ORDER BY CASE
        WHEN u.username ILIKE ${query + '%'}
          OR sp.full_name ILIKE ${query + '%'}
          OR pp.full_name ILIKE ${query + '%'}
          OR rp.full_name ILIKE ${query + '%'} THEN 0
        ELSE 1
      END, u.username
      LIMIT ${limit}
    `;
  }

  async searchProjects(query: string, limit: number) {
    return prisma.$queryRaw<
      { id: string; name: string; status: string; description: string | null; creator: string | null }[]
    >`
      SELECT p.id::text as id, p.name, p.status::text as status,
             p.description,
             u.username as creator
      FROM projects p
      LEFT JOIN users u ON u.id = p.created_by
      WHERE p.search_vector @@ plainto_tsquery('english', ${query})
         OR p.name ILIKE ${'%' + query + '%'}
      LIMIT ${limit}
    `;
  }

  async searchResearchTopics(query: string, limit: number) {
    return prisma.$queryRaw<{ id: string; name: string; slug: string }[]>`
      SELECT id::text as id, name, slug
      FROM research_topics
      WHERE search_vector @@ plainto_tsquery('english', ${query})
         OR name ILIKE ${'%' + query + '%'}
      LIMIT ${limit}
    `;
  }

  async searchPublications(query: string, limit: number) {
    return prisma.$queryRaw<{ id: string; title: string }[]>`
      SELECT id::text as id, title
      FROM publications
      WHERE search_vector @@ plainto_tsquery('english', ${query})
         OR title ILIKE ${'%' + query + '%'}
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
    return prisma.$queryRaw<{ id: string; name: string; description: string | null }[]>`
      SELECT id::text as id, name, description
      FROM research_teams
      WHERE name ILIKE ${"%" + query + "%"} OR description ILIKE ${"%" + query + "%"}
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
