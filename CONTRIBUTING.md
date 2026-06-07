# Contributing

Thanks for your interest in improving Scrum Poker. Contributions of all sizes are welcome,
from typo fixes to new features.

## Getting set up

```bash
git clone https://github.com/Daniel-Alamezie/scrum-poker.git
cd scrum-poker
nvm use        # Node 20.15.0, see .nvmrc
npm install
npm run dev
```

Open http://localhost:3000. There are no environment variables or accounts to set up.

## Before you open a pull request

Run the same checks CI runs:

```bash
npm run type-check
npm run lint
npm test
npm run build
```

Formatting and linting also run automatically on commit via a Husky pre-commit hook.

## Guidelines

- Keep changes focused. One concern per pull request is easier to review.
- Add or update tests when you change behaviour, especially in `src/server/room-manager.ts`,
  which holds the core room logic.
- Match the existing style. Prettier and ESLint are configured, so let them do the work.
- Write clear commit messages explaining the why, not just the what.

## Reporting bugs and ideas

Open an issue describing what you expected, what happened, and steps to reproduce. Screenshots
or a short clip help a lot for UI issues.

## Project layout

See the "Architecture" section of the [README](./README.md) for how the pieces fit together.
