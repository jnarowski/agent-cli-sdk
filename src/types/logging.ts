/**
 * Paths to the three log files created per execution
 */
export interface LogFiles {
  /** Path to input.json (prompt + options) */
  input: string;
  /** Path to output.json (full AdapterResponse) */
  output: string;
  /** Path to stream.jsonl (streaming events) */
  stream: string;
}
