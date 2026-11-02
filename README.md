# Bearing life calculator

A small TypeScript Node CLI for ISO 281 basic rolling bearing rating life, with
optional reliability scaling. No runtime dependencies. Requires Node.js 20 or later.

## Install and build

```sh
npm install
npm run build
```

Run locally with `node dist/cli.js`. To install the `bearing-life-calc` command
locally for development, run `npm link` after building.

## Usage

```sh
node dist/cli.js --C 14 --P 2 --type ball --rpm 1500
```

```text
L10: 343 Mrev
Life: 3811.1 h
```

| Option | Meaning |
| --- | --- |
| `--C <number>` | Required dynamic load rating in kN, greater than zero |
| `--P <number>` | Required equivalent load in kN, greater than zero |
| `--type <ball\|roller>` | Required bearing type |
| `--rpm <number>` | Optional speed, greater than zero; enables hours output |
| `--a1 <number>` | Optional positive reliability factor; defaults to 1 |
| `--reliability <percent>` | Select a factor from the table below; cannot be combined with `--a1` |
| `--json` | Emit a JSON object instead of human-readable text |
| `--help`, `-h` | Show help |

Options use separate values, such as `--C 14`. Decimal and scientific notation
are accepted. Inputs must be finite and positive. Missing, duplicate, unknown,
or invalid arguments produce an error on stderr and exit status 1. Results
outside the supported floating-point range also produce an error.

```sh
node dist/cli.js --C 14 --P 2 --type ball --json
# {"L10":343}

node dist/cli.js --C 14 --P 2 --type ball --rpm 1500 --reliability 95 --json
# {"L10":219.52,"hours":2439.1111111111113}

node dist/cli.js --C 14 --P 2 --type roller --a1 0.64
```

JSON `L10` is measured in million revolutions; `hours` is present only when
`--rpm` is supplied. JSON numbers retain JavaScript floating-point precision;
human-readable hours are rounded to one decimal place.

## Calculation

```text
L10 = a1 × (C / P)^p                 [million revolutions]
hours = L10 × 1,000,000 / (60 × rpm)
```

The exponent `p` is 3 for ball bearings and 10/3 for roller bearings.
The default `a1 = 1` represents 90% reliability.

| Reliability (%) | a1 |
| --- | --- |
| 90 | 1 |
| 95 | 0.64 |
| 96 | 0.55 |
| 97 | 0.47 |
| 98 | 0.37 |
| 99 | 0.25 |

For consistency, the CLI calls the result `L10` even when a reliability factor
is applied; strictly, basic L10 refers to 90% reliability and a reliability-scaled
result is designated Ln. This calculator implements the formula above; it does
not model lubrication, contamination, fatigue load limits, or variable loads.

## Tests

```sh
npm test
```

Builds with `tsc`, then runs calculation and command-handler tests using Node's
built-in `node:test` runner. TypeScript and Node type definitions are development
dependencies only.

## License

MIT — see [LICENSE](LICENSE).
