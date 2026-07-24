# Contributing Guidelines

Thank you for contributing to the TTG Consulting Portal! This guide will help you contribute effectively.

## Getting Started

1. Read the [Setup Guide](./setup.md)
2. Review the [Development Workflow](./development.md)
3. Familiarize yourself with the codebase via CLAUDE.md

## Development Principles

### Test-Driven Development (TDD)

**Always write tests before implementation code.**

1. **Clarify requirements** - Understand what needs to be built
2. **Write failing test(s)** - Define expected behavior through tests
3. **Write minimal code** - Only enough to make tests pass
4. **Run tests** - Verify they pass
5. **Refactor** - Improve code quality while keeping tests green
6. **Repeat** - Add more tests for edge cases as needed

### Testing Pyramid

Follow this distribution:

- **70% Unit Tests** - Fast, isolated tests for business logic
- **20% Integration Tests** - Test component interactions
- **10% E2E Tests** - Only for critical user flows (when explicitly required)

## Code Standards

### Code Quality

- Write clean, readable, idiomatic code
- Follow DRY and SOLID principles
- Handle errors and edge cases explicitly
- Prioritize clarity over premature optimization

### Documentation

- Add comments for complex logic only
- Update README/docs when changing architecture
- **Feature specs belong in PRDs, not code comments**

## Git Workflow

### Branches

**CRITICAL: Branches are for STORIES, not individual tasks.**

```bash
# Format: <type>/<STORY-ID>-<description>
git checkout -b feature/STORY-123-user-auth
```

### Commits

Use conventional commits format (enforced by commit-messages skill):

```
feat(scope): add user authentication

Implements JWT-based auth system with refresh tokens.

Related to STORY-123
```

### Pull Requests

1. **Create PR** - Use GitHub or `/commit` command
2. **Link Linear story** - Include story ID in branch name
3. **Add screenshots** - For any UI changes
4. **Wait for CI** - All checks must pass
5. **Code review** - Address feedback
6. **Merge** - Squash and merge when approved

## Code Review

### As an Author

- Keep PRs focused and small
- Include tests for all changes
- Add clear PR description
- Respond to feedback promptly

### As a Reviewer

- Review within 24 hours
- Be constructive and specific
- Focus on logic, not style (linter handles that)
- Approve when all concerns addressed

## Definition of Done

A task/story is complete when:

- [ ] Tests written FIRST (TDD followed)
- [ ] All tests passing
- [ ] Code follows project conventions
- [ ] Error handling and edge cases covered
- [ ] Linter and type checker passing
- [ ] No debug code remaining
- [ ] Documentation updated if needed
- [ ] PR created with Linear story linked
- [ ] Branch synced to main (no conflicts)
- [ ] CI passing
- [ ] Code review passed
- [ ] Screenshots attached (for UI changes)

## Communication

### Issues and Stories

- Use Linear for all work items
- Start work with `/get-issue STORY-123`
- Link commits to stories
- Update status as work progresses

### Questions

- Check documentation first
- Ask in team chat for quick questions
- Create discussion thread for architectural decisions

## Best Practices

### Do's

- ✅ Write tests first
- ✅ Keep commits small and focused
- ✅ Follow existing patterns
- ✅ Ask questions when uncertain
- ✅ Update documentation

### Don'ts

- ❌ Commit directly to main
- ❌ Skip tests
- ❌ Leave debug code
- ❌ Make large, unfocused PRs
- ❌ Ignore linter warnings

---

**Last Updated**: 2026-03-22
