export const HELP_MESSAGE = `Usage: crap4ts [path-filter ...] [options]

Runs the test suite with istanbul coverage, computes CRAP scores and prints a
report sorted worst first.

Options:
  -h, --help             Print this help message and exit.
  --test-command CMD     Run CMD to produce coverage instead of the detected
                         vitest or jest invocation.
  --diff BASE            Only report functions touched relative to BASE.
  --json-only            Write the JSON report without printing the table.

Arguments:
  path-filter    Optional path fragment. Only matching source files are
                 analyzed.`;

export function parseArgs(argv) {
  const options = {
    paths: [],
    testCommand: null,
    diffBase: null,
    jsonOnly: false,
    helpRequested: false,
    error: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "-h" || argument === "--help") {
      options.helpRequested = true;
      return options;
    }
    if (argument === "--json-only") {
      options.jsonOnly = true;
    } else if (argument === "--test-command") {
      index += 1;
      if (index >= argv.length) {
        options.error = "--test-command requires a command";
        return options;
      }
      options.testCommand = argv[index];
    } else if (argument === "--diff") {
      index += 1;
      if (index >= argv.length) {
        options.error = "--diff requires a base revision";
        return options;
      }
      options.diffBase = argv[index];
    } else {
      options.paths.push(argument);
    }
  }
  return options;
}
