# Contributing to Agent CLI SDK

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Development Setup

### Prerequisites

- Node.js 22 or higher
- Claude Code CLI (optional, for testing Claude adapter)
- Codex CLI (optional, for testing Codex adapter)
- Git

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/sourceborn/agent-cli-sdk.git
   cd agent-cli-sdk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
agent-cli-sdk/
├── src/
│   ├── core/              # Core interfaces, base classes, errors
│   ├── adapters/          # Adapter implementations
│   │   ├── claude/        # Claude Code adapter
│   │   └── codex/         # Codex adapter
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── examples/              # Example usage
├── tests/                 # Test files
└── dist/                  # Build output (generated)
```

## Development Workflow

### Making Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run linting and formatting:
   ```bash
   npm run lint
   npm run format
   ```

4. Build the project:
   ```bash
   npm run build
   ```

5. Test your changes:
   ```bash
   npm test
   ```

6. Commit your changes:
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

7. Push your branch:
   ```bash
   git push origin feature/your-feature-name
   ```

8. Open a Pull Request

## Code Style

- Use TypeScript for all source code
- Follow existing code style and conventions
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions focused and single-purpose
- Prefer composition over inheritance

## Testing

### Unit Tests

- Write unit tests for new functionality
- Use mocks for CLI interactions
- Aim for >80% code coverage
- Place unit tests in `tests/unit/`

### E2E Tests

- E2E tests require actual CLIs installed
- These are optional and run with `RUN_E2E_TESTS=true npm test`
- Place E2E tests in `tests/e2e/`

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run E2E tests (requires CLIs installed)
RUN_E2E_TESTS=true npm test
```

## Adding a New Adapter

To add support for a new AI CLI tool:

1. Create adapter directory:
   ```
   src/adapters/your-tool/
   ├── index.ts           # Main adapter class
   ├── cli-wrapper.ts     # CLI process spawning
   └── parser.ts          # Output parsing
   ```

2. Implement the `AIAdapter` interface:
   ```typescript
   export class YourToolAdapter extends BaseAdapter implements AIAdapter {
     async execute(prompt: string, options?: ExecutionOptions): Promise<AdapterResponse> {
       // Implementation
     }

     getCapabilities(): AdapterCapabilities {
       // Return capabilities
     }
   }
   ```

3. Add types in `src/types/your-tool.ts`

4. Create factory function in `src/utils/factory.ts`

5. Export from `src/index.ts`

6. Add tests in `tests/unit/adapters/your-tool.test.ts`

7. Add example in `examples/your-tool-example.ts`

8. Update README.md with usage instructions

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for new public APIs
- Include examples for new features
- Update CHANGELOG.md (if exists)

## Pull Request Guidelines

### Before Submitting

- Ensure all tests pass
- Update documentation
- Add tests for new functionality
- Follow code style guidelines
- Rebase on latest main branch

### PR Description

Include:
- Summary of changes
- Motivation and context
- Breaking changes (if any)
- Related issues

### Review Process

1. Automated checks must pass (lint, tests, build)
2. At least one approving review required
3. Address reviewer feedback
4. Squash commits if requested

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (Node version, OS, etc.)
- Error messages and stack traces

### Feature Requests

Include:
- Clear description of the feature
- Use case and motivation
- Example usage (pseudocode)
- Alternatives considered

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others when possible
- Follow the Code of Conduct

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

- Open an issue for questions
- Check existing issues and PRs first
- Tag maintainers if needed

Thank you for contributing!
