import { calculateLife, reliabilityFactors } from './life.js';

const help = `Usage: bearing-life-calc --C <kN> --P <kN> --type <ball|roller> [options]

Required:
  --C <kN>               Dynamic load rating (positive)
  --P <kN>               Equivalent load (positive)
  --type <ball|roller>    Bearing type

Options:
  --rpm <number>         Speed (positive); enables hours output
  --a1 <number>          Reliability factor (positive; default 1)
  --reliability <percent> Select a1: 90=1, 95=0.64, 96=0.55,
                         97=0.47, 98=0.37, 99=0.25
                         Cannot be combined with --a1
  --json                 Output JSON (L10 in million revolutions, hours if rpm given)
  --help, -h             Show help

Example: bearing-life-calc --C 14 --P 2 --type ball --rpm 1500`;

export function runCli(args: string[], io: { log: (text: string) => void; error: (text: string) => void } = console): number {
  try {
    main(args, io);
    return 0;
  } catch (error) {
    io.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

function main(args: string[], io: { log: (text: string) => void }): void {
  const values = new Map<string, string>();
  let json = false;
  const allowed = new Set(['--C', '--P', '--type', '--rpm', '--a1', '--reliability']);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      io.log(help);
      return;
    }
    if (arg === '--json') {
      if (json) throw new Error('duplicate option: --json');
      json = true;
      continue;
    }
    if (!allowed.has(arg)) throw new Error(`unknown argument: ${arg}`);
    if (values.has(arg)) throw new Error(`duplicate option: ${arg}`);
    const value = args[++i];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`missing value for ${arg}`);
    }
    values.set(arg, value);
  }
  for (const key of ['--C', '--P', '--type']) {
    if (!values.has(key)) throw new Error(`missing required option: ${key}`);
  }
  function numeric(key: string): number {
    const raw = values.get(key)!;
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(raw)) {
      throw new Error(`${key} must be a number`);
    }
    return Number(raw);
  }
  if (values.has('--a1') && values.has('--reliability')) {
    throw new Error('use either --a1 or --reliability, not both');
  }
  let a1 = values.has('--a1') ? numeric('--a1') : 1;
  if (values.has('--reliability')) {
    const percent = numeric('--reliability');
    if (!Object.hasOwn(reliabilityFactors, percent)) {
      throw new Error('reliability must be one of 90, 95, 96, 97, 98, 99');
    }
    a1 = reliabilityFactors[percent as keyof typeof reliabilityFactors];
  }
  const result = calculateLife({
    C: numeric('--C'), P: numeric('--P'),
    type: values.get('--type') as 'ball' | 'roller',
    rpm: values.has('--rpm') ? numeric('--rpm') : undefined,
    a1,
  });
  if (json) io.log(JSON.stringify(result));
  else {
    io.log(`L10: ${result.L10} Mrev`);
    if (result.hours !== undefined) io.log(`Life: ${result.hours.toFixed(1)} h`);
  }
}
