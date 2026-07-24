# TTG Consulting Portal Documentation

Welcome to the TTG Consulting Portal documentation. This directory contains comprehensive technical and product documentation for the project.

## Documentation Structure

- **[Getting Started](./getting-started/)** - Setup, development environment, and contribution guides
- **[PRD](./prd/)** - Product requirements and feature specifications
- **[Architecture](./architecture/)** - System design, diagrams, and architectural decisions
- **[API](./api/)** - API documentation and endpoint references
- **[Data](./data/)** - Data models, schemas, and database documentation
- **[Testing](./testing/)** - Testing strategy, guides, and test plans
- **[Deployment](./deployment/)** - Deployment guides and infrastructure documentation
- **[Runbooks](./runbooks/)** - Operational procedures and incident response

## Quick Links

- [Setup Guide](./getting-started/setup.md)
- [Contributing](./getting-started/contributing.md)
- [Product Overview](./prd/overview.md)
- [Architecture Overview](./architecture/overview.md)
- [Open Course Access](./architecture/open-course-access.md)
- [Performance and Cleanup Changes](./architecture/performance-and-cleanup-2026-07-24.md)
- [API Overview](./api/overview.md)
- [Testing Strategy](./testing/strategy.md)

## Documentation Standards

All documentation in this repository follows these principles:

- **Clear and concise** - Focus on essential information
- **Up-to-date** - Update docs when code changes
- **Searchable** - Use consistent terminology
- **Actionable** - Include concrete examples and commands
- **Version controlled** - Track changes via git

## Contributing to Documentation

When adding or updating documentation:

1. **Place files in the appropriate section** - Use the structure above
2. **Update navigation** - Add links to relevant README files
3. **Follow markdown best practices** - Use headers, lists, code blocks
4. **Include examples** - Show, don't just tell
5. **Keep it current** - Review and update regularly

## PRD Workflow

Product requirements follow this workflow:

1. Create PRD using `/prd-create` command in `docs/prd/features/`
2. Review and refine PRD with stakeholders
3. Create Linear issues using `/issues-create`
4. Implement features following TDD approach
5. Update documentation as features are completed

## Architecture Decision Records (ADRs)

Significant architectural decisions are documented in `architecture/decisions/` using this format:

```markdown
# ADR-XXX: [Title]

**Status**: Accepted | Proposed | Deprecated
**Date**: YYYY-MM-DD
**Deciders**: [Names]

## Context
What is the issue we're facing?

## Decision
What did we decide to do?

## Consequences
What are the implications of this decision?
```

---

**Last Updated**: 2026-03-22
**Project Status**: 🚧 Initial setup
