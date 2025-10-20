/**
 * Interactive relay example: Two-session pattern with user input
 *
 * Demonstrates:
 * - Real-time streaming output from Claude sessions
 * - Interactive terminal input with readline
 * - Multi-session coordination (relay pattern)
 * - Session 1 asks questions, Session 2 processes answers
 */

import { createInterface } from 'node:readline';
import { AgentClient, createClaudeAdapter } from '../../src/index.js';

/**
 * Create a readline interface for user input
 */
function createReadline() {
  return createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user for input
 */
function promptUser(rl: ReturnType<typeof createReadline>, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Main interactive relay loop
 */
async function main() {
  // Check if running in interactive mode (has TTY)
  const isInteractive = process.stdin.isTTY;

  if (!isInteractive) {
    console.log('⚠️  This example requires an interactive terminal (TTY).');
    console.log('Run it directly in your terminal, not via npm/pnpm scripts.\n');
    console.log('Examples:');
    console.log('  tsx examples/advanced/interactive-relay.ts');
    console.log('  bun examples/advanced/interactive-relay.ts\n');
    process.exit(1);
  }

  const client = new AgentClient({
    adapter: createClaudeAdapter(),
  });

  const rl = createReadline();

  console.log('🤖 Interactive Two-Session Relay Example');
  console.log('==========================================\n');
  console.log('Session 1 (Questioner) will ask you 3 questions.');
  console.log('Session 2 (Processor) will summarize all your answers.\n');

  try {
    // Create Session 1 - The Questioner
    console.log('📝 Creating Session 1 (Questioner)...\n');
    const session1 = client.createSession({
      onOutput: (raw) => {
        process.stdout.write(raw);
      },
    });

    // Create Session 2 - The Processor
    console.log('\n🔍 Creating Session 2 (Processor)...\n');
    const session2 = client.createSession({
      onOutput: (raw) => {
        process.stdout.write(raw);
      },
    });

    // Questions to ask
    const questions = [
      'What is your current software project or main technical focus?',
      'What is the biggest challenge you\'re facing with it right now?',
      'What technology stack or tools are you using?',
    ];

    const userAnswers: Array<{ question: string; answer: string }> = [];

    // Ask each question
    for (let i = 0; i < questions.length; i++) {
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`QUESTION ${i + 1} of ${questions.length}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      await session1.send(
        `Ask this exact question concisely: "${questions[i]}"`
      );

      console.log('\n');

      // Get user's answer
      const userAnswer = await promptUser(
        rl,
        `💭 Your answer: `
      );

      if (!userAnswer.trim()) {
        console.log('\n⚠️  Skipping empty answer...');
        userAnswers.push({ question: questions[i], answer: '[No answer provided]' });
      } else {
        userAnswers.push({ question: questions[i], answer: userAnswer });
      }
    }

    // Session 2: Summarize all answers to verify they were received correctly
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SESSION 2 (VERIFICATION SUMMARY)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const formattedAnswers = userAnswers
      .map((qa, idx) => `${idx + 1}. ${qa.question}\n   Answer: "${qa.answer}"`)
      .join('\n\n');

    const response2 = await session2.send(
      `I collected the following answers from a user. Please summarize what they told you in a clear, organized way to verify the information was received correctly:\n\n${formattedAnswers}\n\nProvide a brief summary of what you learned about their project, challenges, and tech stack.`
    );

    // Summary
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SESSION SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Session 1 ID: ${session1.sessionId}`);
    console.log(`Session 2 ID: ${session2.sessionId}`);
    console.log(`Questions asked: ${questions.length}`);
    console.log(`Session 1 messages: ${session1.messageCount}`);
    console.log(`Session 2 messages: ${session2.messageCount}`);

    if (response2.usage) {
      console.log(`\nSession 2 tokens used: ${response2.usage.totalTokens || 'N/A'}`);
    }

    console.log('\n📝 Your raw answers:');
    userAnswers.forEach((qa, idx) => {
      console.log(`  ${idx + 1}. "${qa.answer}"`);
    });

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : error);
  } finally {
    rl.close();
  }
}

// Handle cleanup on exit
process.on('SIGINT', () => {
  console.log('\n\n👋 Interrupted. Cleaning up...');
  process.exit(0);
});

main().catch(console.error);
