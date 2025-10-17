/**
 * CI/CD integration example
 * Demonstrates automated code review in a CI pipeline
 */

import { createCodexAdapter } from '../src/index';
import { parallel } from '../src/utils/async';

async function ciIntegration() {
  try {
    console.log('CI/CD Pipeline: Automated Code Review\n');

    const codex = createCodexAdapter();

    // Simulate a CI environment
    const changedFiles = process.argv.slice(2); // Get file paths from command line

    if (changedFiles.length === 0) {
      console.log('Usage: tsx examples/ci-integration.ts <file1> <file2> ...');
      console.log('No files specified. Using example...\n');
      changedFiles.push('src/index.ts');
    }

    console.log(`Files to review: ${changedFiles.join(', ')}\n`);

    // Run reviews in parallel for speed
    console.log('=== Running Parallel Reviews ===');
    const reviews = await parallel(
      changedFiles.map((file) => {
        return async () => {
          console.log(`  Reviewing ${file}...`);
          return codex.execute(
            `Review ${file} for:
- Code quality issues
- Potential bugs
- Security vulnerabilities
- Performance concerns

Provide a concise summary with severity ratings (high/medium/low).`,
            {
              fullAuto: true,
              workingDirectory: process.cwd(),
            }
          );
        };
      })
    );

    // Analyze results
    console.log('\n=== Review Results ===');
    let hasHighSeverity = false;

    reviews.forEach((review, i) => {
      console.log(`\n${changedFiles[i]}:`);
      console.log(review.output);

      // Check for high severity issues
      if (review.output.toLowerCase().includes('high severity') ||
          review.output.toLowerCase().includes('critical')) {
        hasHighSeverity = true;
      }
    });

    // Exit with appropriate code for CI
    if (hasHighSeverity) {
      console.log('\n❌ High severity issues found. Failing CI build.');
      process.exit(1);
    } else {
      console.log('\n✅ All reviews passed. No critical issues found.');
      process.exit(0);
    }
  } catch (error) {
    console.error('CI Error:', error);
    process.exit(1);
  }
}

// Run the CI integration
ciIntegration();
