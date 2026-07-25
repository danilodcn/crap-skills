from dataclasses import dataclass, field

HELP_MESSAGE = """Usage: crap_py.py [path-filter ...] [options]

Runs the test suite with coverage, computes CRAP scores and prints a report
sorted worst first.

Options:
  -h, --help             Print this help message and exit.
  --test-command CMD     Run CMD to produce coverage instead of
                         "coverage run -m pytest".
  --diff BASE            Only report functions touched relative to BASE.
  --json-only            Write the JSON report without printing the table.

Arguments:
  path-filter    Optional path fragment. Only matching source files are
                 analyzed."""


@dataclass
class Options:
    paths: list[str] = field(default_factory=list)
    test_command: str | None = None
    diff_base: str | None = None
    json_only: bool = False
    help_requested: bool = False
    error: str | None = None


def parse_args(argv: list[str]) -> Options:
    options = Options()
    index = 0
    while index < len(argv):
        argument = argv[index]
        if argument in ("-h", "--help"):
            options.help_requested = True
            return options
        if argument == "--json-only":
            options.json_only = True
        elif argument == "--test-command":
            index += 1
            if index >= len(argv):
                options.error = "--test-command requires a command"
                return options
            options.test_command = argv[index]
        elif argument == "--diff":
            index += 1
            if index >= len(argv):
                options.error = "--diff requires a base revision"
                return options
            options.diff_base = argv[index]
        else:
            options.paths.append(argument)
        index += 1
    return options
