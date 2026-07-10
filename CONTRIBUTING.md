# Contributing to ResumeRank

Thank you for your interest in contributing to ResumeRank!

## Getting Started

1. Fork and clone the repository.
2. Copy `.env.example` to `.env` and fill in your local values.
3. Start the services (see README.md for quick start).

## Project Structure

```
resumerank/
├── backend/       # Spring Boot (Java 17, Maven)
├── ai-service/    # FastAPI (Python 3.11)
├── frontend/      # Next.js 15 (TypeScript, Tailwind v4)
└── docs/          # Architecture docs and screenshots
```

## Development Workflow

1. Create a feature branch from `main`: `git checkout -b feat/your-feature`
2. Make atomic commits with clear messages.
3. Ensure all tests pass before pushing.
4. Open a pull request with a description of your changes.

## Commit Convention

Use conventional commits:
- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `style:` — formatting, no code change
- `refactor:` — code change that neither fixes a bug nor adds a feature
- `test:` — adding or updating tests
- `chore:` — build process, dependencies, CI

## Code Style

- **Java:** Follow standard Java conventions, use `final` where possible.
- **Python:** Follow PEP 8, use type hints.
- **TypeScript:** Strict mode enabled, no `any` types.

## Reporting Issues

Open a GitHub issue with:
- A clear title
- Steps to reproduce
- Expected vs. actual behavior
- Environment details (OS, browser, versions)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
