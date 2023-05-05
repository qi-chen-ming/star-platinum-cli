import require$$0 from 'readline';
import require$$2 from 'events';
import path$3 from 'node:path';
import fs$1 from 'node:fs';
import require$$0$3 from 'child_process';
import require$$0$2 from 'path';
import require$$0$1 from 'fs';
import { fileURLToPath } from 'node:url';
import ora from 'ora';
import download from 'download-git-repo';
import { promisify } from 'node:util';
import { ESLint } from 'eslint';

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getAugmentedNamespace(n) {
  var f = n.default;
	if (typeof f == "function") {
		var a = function () {
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

function hasKey(obj, keys) {
	var o = obj;
	keys.slice(0, -1).forEach(function (key) {
		o = o[key] || {};
	});

	var key = keys[keys.length - 1];
	return key in o;
}

function isNumber$1(x) {
	if (typeof x === 'number') { return true; }
	if ((/^0x[0-9a-f]+$/i).test(x)) { return true; }
	return (/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(e[-+]?\d+)?$/).test(x);
}

function isConstructorOrProto(obj, key) {
	return (key === 'constructor' && typeof obj[key] === 'function') || key === '__proto__';
}

var minimist = function (args, opts) {
	if (!opts) { opts = {}; }

	var flags = {
		bools: {},
		strings: {},
		unknownFn: null,
	};

	if (typeof opts.unknown === 'function') {
		flags.unknownFn = opts.unknown;
	}

	if (typeof opts.boolean === 'boolean' && opts.boolean) {
		flags.allBools = true;
	} else {
		[].concat(opts.boolean).filter(Boolean).forEach(function (key) {
			flags.bools[key] = true;
		});
	}

	var aliases = {};

	function aliasIsBoolean(key) {
		return aliases[key].some(function (x) {
			return flags.bools[x];
		});
	}

	Object.keys(opts.alias || {}).forEach(function (key) {
		aliases[key] = [].concat(opts.alias[key]);
		aliases[key].forEach(function (x) {
			aliases[x] = [key].concat(aliases[key].filter(function (y) {
				return x !== y;
			}));
		});
	});

	[].concat(opts.string).filter(Boolean).forEach(function (key) {
		flags.strings[key] = true;
		if (aliases[key]) {
			[].concat(aliases[key]).forEach(function (k) {
				flags.strings[k] = true;
			});
		}
	});

	var defaults = opts.default || {};

	var argv = { _: [] };

	function argDefined(key, arg) {
		return (flags.allBools && (/^--[^=]+$/).test(arg))
			|| flags.strings[key]
			|| flags.bools[key]
			|| aliases[key];
	}

	function setKey(obj, keys, value) {
		var o = obj;
		for (var i = 0; i < keys.length - 1; i++) {
			var key = keys[i];
			if (isConstructorOrProto(o, key)) { return; }
			if (o[key] === undefined) { o[key] = {}; }
			if (
				o[key] === Object.prototype
				|| o[key] === Number.prototype
				|| o[key] === String.prototype
			) {
				o[key] = {};
			}
			if (o[key] === Array.prototype) { o[key] = []; }
			o = o[key];
		}

		var lastKey = keys[keys.length - 1];
		if (isConstructorOrProto(o, lastKey)) { return; }
		if (
			o === Object.prototype
			|| o === Number.prototype
			|| o === String.prototype
		) {
			o = {};
		}
		if (o === Array.prototype) { o = []; }
		if (o[lastKey] === undefined || flags.bools[lastKey] || typeof o[lastKey] === 'boolean') {
			o[lastKey] = value;
		} else if (Array.isArray(o[lastKey])) {
			o[lastKey].push(value);
		} else {
			o[lastKey] = [o[lastKey], value];
		}
	}

	function setArg(key, val, arg) {
		if (arg && flags.unknownFn && !argDefined(key, arg)) {
			if (flags.unknownFn(arg) === false) { return; }
		}

		var value = !flags.strings[key] && isNumber$1(val)
			? Number(val)
			: val;
		setKey(argv, key.split('.'), value);

		(aliases[key] || []).forEach(function (x) {
			setKey(argv, x.split('.'), value);
		});
	}

	Object.keys(flags.bools).forEach(function (key) {
		setArg(key, defaults[key] === undefined ? false : defaults[key]);
	});

	var notFlags = [];

	if (args.indexOf('--') !== -1) {
		notFlags = args.slice(args.indexOf('--') + 1);
		args = args.slice(0, args.indexOf('--'));
	}

	for (var i = 0; i < args.length; i++) {
		var arg = args[i];
		var key;
		var next;

		if ((/^--.+=/).test(arg)) {
			// Using [\s\S] instead of . because js doesn't support the
			// 'dotall' regex modifier. See:
			// http://stackoverflow.com/a/1068308/13216
			var m = arg.match(/^--([^=]+)=([\s\S]*)$/);
			key = m[1];
			var value = m[2];
			if (flags.bools[key]) {
				value = value !== 'false';
			}
			setArg(key, value, arg);
		} else if ((/^--no-.+/).test(arg)) {
			key = arg.match(/^--no-(.+)/)[1];
			setArg(key, false, arg);
		} else if ((/^--.+/).test(arg)) {
			key = arg.match(/^--(.+)/)[1];
			next = args[i + 1];
			if (
				next !== undefined
				&& !(/^(-|--)[^-]/).test(next)
				&& !flags.bools[key]
				&& !flags.allBools
				&& (aliases[key] ? !aliasIsBoolean(key) : true)
			) {
				setArg(key, next, arg);
				i += 1;
			} else if ((/^(true|false)$/).test(next)) {
				setArg(key, next === 'true', arg);
				i += 1;
			} else {
				setArg(key, flags.strings[key] ? '' : true, arg);
			}
		} else if ((/^-[^-]+/).test(arg)) {
			var letters = arg.slice(1, -1).split('');

			var broken = false;
			for (var j = 0; j < letters.length; j++) {
				next = arg.slice(j + 2);

				if (next === '-') {
					setArg(letters[j], next, arg);
					continue;
				}

				if ((/[A-Za-z]/).test(letters[j]) && next[0] === '=') {
					setArg(letters[j], next.slice(1), arg);
					broken = true;
					break;
				}

				if (
					(/[A-Za-z]/).test(letters[j])
					&& (/-?\d+(\.\d*)?(e-?\d+)?$/).test(next)
				) {
					setArg(letters[j], next, arg);
					broken = true;
					break;
				}

				if (letters[j + 1] && letters[j + 1].match(/\W/)) {
					setArg(letters[j], arg.slice(j + 2), arg);
					broken = true;
					break;
				} else {
					setArg(letters[j], flags.strings[letters[j]] ? '' : true, arg);
				}
			}

			key = arg.slice(-1)[0];
			if (!broken && key !== '-') {
				if (
					args[i + 1]
					&& !(/^(-|--)[^-]/).test(args[i + 1])
					&& !flags.bools[key]
					&& (aliases[key] ? !aliasIsBoolean(key) : true)
				) {
					setArg(key, args[i + 1], arg);
					i += 1;
				} else if (args[i + 1] && (/^(true|false)$/).test(args[i + 1])) {
					setArg(key, args[i + 1] === 'true', arg);
					i += 1;
				} else {
					setArg(key, flags.strings[key] ? '' : true, arg);
				}
			}
		} else {
			if (!flags.unknownFn || flags.unknownFn(arg) !== false) {
				argv._.push(flags.strings._ || !isNumber$1(arg) ? arg : Number(arg));
			}
			if (opts.stopEarly) {
				argv._.push.apply(argv._, args.slice(i + 1));
				break;
			}
		}
	}

	Object.keys(defaults).forEach(function (k) {
		if (!hasKey(argv, k.split('.'))) {
			setKey(argv, k.split('.'), defaults[k]);

			(aliases[k] || []).forEach(function (x) {
				setKey(argv, x.split('.'), defaults[k]);
			});
		}
	});

	if (opts['--']) {
		argv['--'] = notFlags.slice();
	} else {
		notFlags.forEach(function (k) {
			argv._.push(k);
		});
	}

	return argv;
};

let enabled = true;
// Support both browser and node environments
const globalVar = typeof self !== 'undefined'
    ? self
    : typeof window !== 'undefined'
        ? window
        : typeof global !== 'undefined'
            ? global
            : {};
/**
 * Detect how much colors the current terminal supports
 */
let supportLevel = 0 /* none */;
if (globalVar.process && globalVar.process.env && globalVar.process.stdout) {
    const { FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = globalVar.process.env;
    if (NODE_DISABLE_COLORS || NO_COLOR || FORCE_COLOR === '0') {
        enabled = false;
    }
    else if (FORCE_COLOR === '1' || FORCE_COLOR === '2' || FORCE_COLOR === '3') {
        enabled = true;
    }
    else if (TERM === 'dumb') {
        enabled = false;
    }
    else if ('CI' in globalVar.process.env &&
        [
            'TRAVIS',
            'CIRCLECI',
            'APPVEYOR',
            'GITLAB_CI',
            'GITHUB_ACTIONS',
            'BUILDKITE',
            'DRONE',
        ].some(vendor => vendor in globalVar.process.env)) {
        enabled = true;
    }
    else {
        enabled = process.stdout.isTTY;
    }
    if (enabled) {
        supportLevel =
            TERM && TERM.endsWith('-256color')
                ? 2 /* ansi256 */
                : 1 /* ansi */;
    }
}
let options = {
    enabled,
    supportLevel,
};
function kolorist(start, end, level = 1 /* ansi */) {
    const open = `\x1b[${start}m`;
    const close = `\x1b[${end}m`;
    const regex = new RegExp(`\\x1b\\[${end}m`, 'g');
    return (str) => {
        return options.enabled && options.supportLevel >= level
            ? open + ('' + str).replace(regex, open) + close
            : '' + str;
    };
}
// modifiers
const reset = kolorist(0, 0);
const red = kolorist(31, 39);
const green = kolorist(32, 39);
const yellow = kolorist(33, 39);
const blue = kolorist(34, 39);
const cyan = kolorist(36, 39);
const bgRed = kolorist(41, 49);
const bgGreen = kolorist(42, 49);
const bgCyan = kolorist(46, 49);

const name$1 = "create-star-platinum";
const version$1 = "2.0.0";
const type = "module";
const author$1 = "qi-chen-ming";
const description$1 = "Using vite's scaffolding tool, you can create vue, react, and other projects.";
const bin$1 = {
	"create-sp": "index.js"
};
const files = [
	"index.js",
	"dist"
];
const main$2 = "index.js";
const scripts$1 = {
	dev: "unbuild --stub",
	build: "unbuild"
};
const engines$1 = {
	node: "^14.18.0 || >=16.0.0"
};
const repository$1 = {
	type: "git",
	url: "git+https://github.com/qi-chen-ming/star-platinum-cli",
	directory: "packages/create-star-platinum"
};
const bugs$1 = {
	url: "https://github.com/qi-chen-ming/star-platinum-cli/issues"
};
const homepage$1 = "https://github.com/qi-chen-ming/star-platinum-cli/tree/main/packages/create-star-platinum#readme";
const keywords$1 = [
	"vite",
	"vue",
	"react",
	"cli"
];
const license$1 = "ISC";
const devDependencies$1 = {
	"@types/ejs": "^3.1.2",
	"@types/eslint": "^8.37.0",
	"@types/prompts": "^2.4.4",
	"cross-spawn": "^7.0.3",
	ejs: "^3.1.9",
	kolorist: "^1.7.0",
	minimist: "^1.2.8",
	prompts: "^2.4.2",
	unbuild: "0.8.11"
};
const gitHead = "d29e22b2429af8b51e6b6d72602495101c508c0c";
const dependencies$1 = {
	"download-git-repo": "^3.0.2",
	eslint: "^8.39.0",
	ora: "^6.3.0"
};
const rootPKG = {
	name: name$1,
	version: version$1,
	type: type,
	author: author$1,
	description: description$1,
	bin: bin$1,
	files: files,
	main: main$2,
	scripts: scripts$1,
	engines: engines$1,
	repository: repository$1,
	bugs: bugs$1,
	homepage: homepage$1,
	keywords: keywords$1,
	license: license$1,
	devDependencies: devDependencies$1,
	gitHead: gitHead,
	dependencies: dependencies$1
};

function getVersion() {
  console.log(
    bgGreen(` create-star-platinum `),
    `version is ${rootPKG.version}`
  );
  process.exit(0);
}

var prompts$1 = {};

const { FORCE_COLOR, NODE_DISABLE_COLORS, TERM } = process.env;

const $ = {
	enabled: !NODE_DISABLE_COLORS && TERM !== 'dumb' && FORCE_COLOR !== '0',

	// modifiers
	reset: init(0, 0),
	bold: init(1, 22),
	dim: init(2, 22),
	italic: init(3, 23),
	underline: init(4, 24),
	inverse: init(7, 27),
	hidden: init(8, 28),
	strikethrough: init(9, 29),

	// colors
	black: init(30, 39),
	red: init(31, 39),
	green: init(32, 39),
	yellow: init(33, 39),
	blue: init(34, 39),
	magenta: init(35, 39),
	cyan: init(36, 39),
	white: init(37, 39),
	gray: init(90, 39),
	grey: init(90, 39),

	// background colors
	bgBlack: init(40, 49),
	bgRed: init(41, 49),
	bgGreen: init(42, 49),
	bgYellow: init(43, 49),
	bgBlue: init(44, 49),
	bgMagenta: init(45, 49),
	bgCyan: init(46, 49),
	bgWhite: init(47, 49)
};

function run(arr, str) {
	let i=0, tmp, beg='', end='';
	for (; i < arr.length; i++) {
		tmp = arr[i];
		beg += tmp.open;
		end += tmp.close;
		if (str.includes(tmp.close)) {
			str = str.replace(tmp.rgx, tmp.close + tmp.open);
		}
	}
	return beg + str + end;
}

function chain(has, keys) {
	let ctx = { has, keys };

	ctx.reset = $.reset.bind(ctx);
	ctx.bold = $.bold.bind(ctx);
	ctx.dim = $.dim.bind(ctx);
	ctx.italic = $.italic.bind(ctx);
	ctx.underline = $.underline.bind(ctx);
	ctx.inverse = $.inverse.bind(ctx);
	ctx.hidden = $.hidden.bind(ctx);
	ctx.strikethrough = $.strikethrough.bind(ctx);

	ctx.black = $.black.bind(ctx);
	ctx.red = $.red.bind(ctx);
	ctx.green = $.green.bind(ctx);
	ctx.yellow = $.yellow.bind(ctx);
	ctx.blue = $.blue.bind(ctx);
	ctx.magenta = $.magenta.bind(ctx);
	ctx.cyan = $.cyan.bind(ctx);
	ctx.white = $.white.bind(ctx);
	ctx.gray = $.gray.bind(ctx);
	ctx.grey = $.grey.bind(ctx);

	ctx.bgBlack = $.bgBlack.bind(ctx);
	ctx.bgRed = $.bgRed.bind(ctx);
	ctx.bgGreen = $.bgGreen.bind(ctx);
	ctx.bgYellow = $.bgYellow.bind(ctx);
	ctx.bgBlue = $.bgBlue.bind(ctx);
	ctx.bgMagenta = $.bgMagenta.bind(ctx);
	ctx.bgCyan = $.bgCyan.bind(ctx);
	ctx.bgWhite = $.bgWhite.bind(ctx);

	return ctx;
}

function init(open, close) {
	let blk = {
		open: `\x1b[${open}m`,
		close: `\x1b[${close}m`,
		rgx: new RegExp(`\\x1b\\[${close}m`, 'g')
	};
	return function (txt) {
		if (this !== void 0 && this.has !== void 0) {
			this.has.includes(open) || (this.has.push(open),this.keys.push(blk));
			return txt === void 0 ? this : $.enabled ? run(this.keys, txt+'') : txt+'';
		}
		return txt === void 0 ? chain([open], [blk]) : $.enabled ? run([blk], txt+'') : txt+'';
	};
}

var kleur = $;

var action$1 = (key, isSelect) => {
  if (key.meta && key.name !== 'escape') return;
  
  if (key.ctrl) {
    if (key.name === 'a') return 'first';
    if (key.name === 'c') return 'abort';
    if (key.name === 'd') return 'abort';
    if (key.name === 'e') return 'last';
    if (key.name === 'g') return 'reset';
  }
  
  if (isSelect) {
    if (key.name === 'j') return 'down';
    if (key.name === 'k') return 'up';
  }

  if (key.name === 'return') return 'submit';
  if (key.name === 'enter') return 'submit'; // ctrl + J
  if (key.name === 'backspace') return 'delete';
  if (key.name === 'delete') return 'deleteForward';
  if (key.name === 'abort') return 'abort';
  if (key.name === 'escape') return 'exit';
  if (key.name === 'tab') return 'next';
  if (key.name === 'pagedown') return 'nextPage';
  if (key.name === 'pageup') return 'prevPage';
  // TODO create home() in prompt types (e.g. TextPrompt)
  if (key.name === 'home') return 'home';
  // TODO create end() in prompt types (e.g. TextPrompt)
  if (key.name === 'end') return 'end';

  if (key.name === 'up') return 'up';
  if (key.name === 'down') return 'down';
  if (key.name === 'right') return 'right';
  if (key.name === 'left') return 'left';

  return false;
};

var strip$2 = str => {
  const pattern = [
    '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
    '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PRZcf-ntqry=><~]))'
  ].join('|');

  const RGX = new RegExp(pattern, 'g');
  return typeof str === 'string' ? str.replace(RGX, '') : str;
};

const ESC = '\x1B';
const CSI = `${ESC}[`;
const beep$1 = '\u0007';

const cursor$b = {
  to(x, y) {
    if (!y) return `${CSI}${x + 1}G`;
    return `${CSI}${y + 1};${x + 1}H`;
  },
  move(x, y) {
    let ret = '';

    if (x < 0) ret += `${CSI}${-x}D`;
    else if (x > 0) ret += `${CSI}${x}C`;

    if (y < 0) ret += `${CSI}${-y}A`;
    else if (y > 0) ret += `${CSI}${y}B`;

    return ret;
  },
  up: (count = 1) => `${CSI}${count}A`,
  down: (count = 1) => `${CSI}${count}B`,
  forward: (count = 1) => `${CSI}${count}C`,
  backward: (count = 1) => `${CSI}${count}D`,
  nextLine: (count = 1) => `${CSI}E`.repeat(count),
  prevLine: (count = 1) => `${CSI}F`.repeat(count),
  left: `${CSI}G`,
  hide: `${CSI}?25l`,
  show: `${CSI}?25h`,
  save: `${ESC}7`,
  restore: `${ESC}8`
};

const scroll = {
  up: (count = 1) => `${CSI}S`.repeat(count),
  down: (count = 1) => `${CSI}T`.repeat(count)
};

const erase$7 = {
  screen: `${CSI}2J`,
  up: (count = 1) => `${CSI}1J`.repeat(count),
  down: (count = 1) => `${CSI}J`.repeat(count),
  line: `${CSI}2K`,
  lineEnd: `${CSI}K`,
  lineStart: `${CSI}1K`,
  lines(count) {
    let clear = '';
    for (let i = 0; i < count; i++)
      clear += this.line + (i < count - 1 ? cursor$b.up() : '');
    if (count)
      clear += cursor$b.left;
    return clear;
  }
};

var src = { cursor: cursor$b, scroll, erase: erase$7, beep: beep$1 };

const strip$1 = strip$2;
const { erase: erase$6, cursor: cursor$a } = src;

const width = str => [...strip$1(str)].length;

/**
 * @param {string} prompt
 * @param {number} perLine
 */
var clear$9 = function(prompt, perLine) {
  if (!perLine) return erase$6.line + cursor$a.to(0);

  let rows = 0;
  const lines = prompt.split(/\r?\n/);
  for (let line of lines) {
    rows += 1 + Math.floor(Math.max(width(line) - 1, 0) / perLine);
  }

  return erase$6.lines(rows);
};

const main$1 = {
  arrowUp: '↑',
  arrowDown: '↓',
  arrowLeft: '←',
  arrowRight: '→',
  radioOn: '◉',
  radioOff: '◯',
  tick: '✔',	
  cross: '✖',	
  ellipsis: '…',	
  pointerSmall: '›',	
  line: '─',	
  pointer: '❯'	
};	
const win = {
  arrowUp: main$1.arrowUp,
  arrowDown: main$1.arrowDown,
  arrowLeft: main$1.arrowLeft,
  arrowRight: main$1.arrowRight,
  radioOn: '(*)',
  radioOff: '( )',	
  tick: '√',	
  cross: '×',	
  ellipsis: '...',	
  pointerSmall: '»',	
  line: '─',	
  pointer: '>'	
};	
const figures$8 = process.platform === 'win32' ? win : main$1;	

 var figures_1 = figures$8;

const c = kleur;
const figures$7 = figures_1;

// rendering user input.
const styles = Object.freeze({
  password: { scale: 1, render: input => '*'.repeat(input.length) },
  emoji: { scale: 2, render: input => '😃'.repeat(input.length) },
  invisible: { scale: 0, render: input => '' },
  default: { scale: 1, render: input => `${input}` }
});
const render = type => styles[type] || styles.default;

// icon to signalize a prompt.
const symbols = Object.freeze({
  aborted: c.red(figures$7.cross),
  done: c.green(figures$7.tick),
  exited: c.yellow(figures$7.cross),
  default: c.cyan('?')
});

const symbol = (done, aborted, exited) =>
  aborted ? symbols.aborted : exited ? symbols.exited : done ? symbols.done : symbols.default;

// between the question and the user's input.
const delimiter = completing =>
  c.gray(completing ? figures$7.ellipsis : figures$7.pointerSmall);

const item = (expandable, expanded) =>
  c.gray(expandable ? (expanded ? figures$7.pointerSmall : '+') : figures$7.line);

var style$9 = {
  styles,
  render,
  symbols,
  symbol,
  delimiter,
  item
};

const strip = strip$2;

/**
 * @param {string} msg
 * @param {number} perLine
 */
var lines$2 = function (msg, perLine) {
  let lines = String(strip(msg) || '').split(/\r?\n/);

  if (!perLine) return lines.length;
  return lines.map(l => Math.ceil(l.length / perLine))
      .reduce((a, b) => a + b);
};

/**
 * @param {string} msg The message to wrap
 * @param {object} opts
 * @param {number|string} [opts.margin] Left margin
 * @param {number} opts.width Maximum characters per line including the margin
 */
var wrap$3 = (msg, opts = {}) => {
  const tab = Number.isSafeInteger(parseInt(opts.margin))
    ? new Array(parseInt(opts.margin)).fill(' ').join('')
    : (opts.margin || '');

  const width = opts.width;

  return (msg || '').split(/\r?\n/g)
    .map(line => line
      .split(/\s+/g)
      .reduce((arr, w) => {
        if (w.length + tab.length >= width || arr[arr.length - 1].length + w.length + 1 < width)
          arr[arr.length - 1] += ` ${w}`;
        else arr.push(`${tab}${w}`);
        return arr;
      }, [ tab ])
      .join('\n'))
    .join('\n');
};

/**
 * Determine what entries should be displayed on the screen, based on the
 * currently selected index and the maximum visible. Used in list-based
 * prompts like `select` and `multiselect`.
 *
 * @param {number} cursor the currently selected entry
 * @param {number} total the total entries available to display
 * @param {number} [maxVisible] the number of entries that can be displayed
 */
var entriesToDisplay$3 = (cursor, total, maxVisible)  => {
  maxVisible = maxVisible || total;

  let startIndex = Math.min(total- maxVisible, cursor - Math.floor(maxVisible / 2));
  if (startIndex < 0) startIndex = 0;

  let endIndex = Math.min(startIndex + maxVisible, total);

  return { startIndex, endIndex };
};

var util = {
  action: action$1,
  clear: clear$9,
  style: style$9,
  strip: strip$2,
  figures: figures_1,
  lines: lines$2,
  wrap: wrap$3,
  entriesToDisplay: entriesToDisplay$3
};

const readline = require$$0;
const { action } = util;
const EventEmitter = require$$2;
const { beep, cursor: cursor$9 } = src;
const color$9 = kleur;

/**
 * Base prompt skeleton
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 */
class Prompt$8 extends EventEmitter {
  constructor(opts={}) {
    super();

    this.firstRender = true;
    this.in = opts.stdin || process.stdin;
    this.out = opts.stdout || process.stdout;
    this.onRender = (opts.onRender || (() => void 0)).bind(this);
    const rl = readline.createInterface({ input:this.in, escapeCodeTimeout:50 });
    readline.emitKeypressEvents(this.in, rl);

    if (this.in.isTTY) this.in.setRawMode(true);
    const isSelect = [ 'SelectPrompt', 'MultiselectPrompt' ].indexOf(this.constructor.name) > -1;
    const keypress = (str, key) => {
      let a = action(key, isSelect);
      if (a === false) {
        this._ && this._(str, key);
      } else if (typeof this[a] === 'function') {
        this[a](key);
      } else {
        this.bell();
      }
    };

    this.close = () => {
      this.out.write(cursor$9.show);
      this.in.removeListener('keypress', keypress);
      if (this.in.isTTY) this.in.setRawMode(false);
      rl.close();
      this.emit(this.aborted ? 'abort' : this.exited ? 'exit' : 'submit', this.value);
      this.closed = true;
    };

    this.in.on('keypress', keypress);
  }

  fire() {
    this.emit('state', {
      value: this.value,
      aborted: !!this.aborted,
      exited: !!this.exited
    });
  }

  bell() {
    this.out.write(beep);
  }

  render() {
    this.onRender(color$9);
    if (this.firstRender) this.firstRender = false;
  }
}

var prompt$1 = Prompt$8;

const color$8 = kleur;
const Prompt$7 = prompt$1;
const { erase: erase$5, cursor: cursor$8 } = src;
const { style: style$8, clear: clear$8, lines: lines$1, figures: figures$6 } = util;

/**
 * TextPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {String} [opts.style='default'] Render style
 * @param {String} [opts.initial] Default value
 * @param {Function} [opts.validate] Validate function
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 * @param {String} [opts.error] The invalid error label
 */
class TextPrompt extends Prompt$7 {
  constructor(opts={}) {
    super(opts);
    this.transform = style$8.render(opts.style);
    this.scale = this.transform.scale;
    this.msg = opts.message;
    this.initial = opts.initial || ``;
    this.validator = opts.validate || (() => true);
    this.value = ``;
    this.errorMsg = opts.error || `Please Enter A Valid Value`;
    this.cursor = Number(!!this.initial);
    this.cursorOffset = 0;
    this.clear = clear$8(``, this.out.columns);
    this.render();
  }

  set value(v) {
    if (!v && this.initial) {
      this.placeholder = true;
      this.rendered = color$8.gray(this.transform.render(this.initial));
    } else {
      this.placeholder = false;
      this.rendered = this.transform.render(v);
    }
    this._value = v;
    this.fire();
  }

  get value() {
    return this._value;
  }

  reset() {
    this.value = ``;
    this.cursor = Number(!!this.initial);
    this.cursorOffset = 0;
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    this.value = this.value || this.initial;
    this.done = this.aborted = true;
    this.error = false;
    this.red = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  async validate() {
    let valid = await this.validator(this.value);
    if (typeof valid === `string`) {
      this.errorMsg = valid;
      valid = false;
    }
    this.error = !valid;
  }

  async submit() {
    this.value = this.value || this.initial;
    this.cursorOffset = 0;
    this.cursor = this.rendered.length;
    await this.validate();
    if (this.error) {
      this.red = true;
      this.fire();
      this.render();
      return;
    }
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  next() {
    if (!this.placeholder) return this.bell();
    this.value = this.initial;
    this.cursor = this.rendered.length;
    this.fire();
    this.render();
  }

  moveCursor(n) {
    if (this.placeholder) return;
    this.cursor = this.cursor+n;
    this.cursorOffset += n;
  }

  _(c, key) {
    let s1 = this.value.slice(0, this.cursor);
    let s2 = this.value.slice(this.cursor);
    this.value = `${s1}${c}${s2}`;
    this.red = false;
    this.cursor = this.placeholder ? 0 : s1.length+1;
    this.render();
  }

  delete() {
    if (this.isCursorAtStart()) return this.bell();
    let s1 = this.value.slice(0, this.cursor-1);
    let s2 = this.value.slice(this.cursor);
    this.value = `${s1}${s2}`;
    this.red = false;
    if (this.isCursorAtStart()) {
      this.cursorOffset = 0;
    } else {
      this.cursorOffset++;
      this.moveCursor(-1);
    }
    this.render();
  }

  deleteForward() {
    if(this.cursor*this.scale >= this.rendered.length || this.placeholder) return this.bell();
    let s1 = this.value.slice(0, this.cursor);
    let s2 = this.value.slice(this.cursor+1);
    this.value = `${s1}${s2}`;
    this.red = false;
    if (this.isCursorAtEnd()) {
      this.cursorOffset = 0;
    } else {
      this.cursorOffset++;
    }
    this.render();
  }

  first() {
    this.cursor = 0;
    this.render();
  }

  last() {
    this.cursor = this.value.length;
    this.render();
  }

  left() {
    if (this.cursor <= 0 || this.placeholder) return this.bell();
    this.moveCursor(-1);
    this.render();
  }

  right() {
    if (this.cursor*this.scale >= this.rendered.length || this.placeholder) return this.bell();
    this.moveCursor(1);
    this.render();
  }

  isCursorAtStart() {
    return this.cursor === 0 || (this.placeholder && this.cursor === 1);
  }

  isCursorAtEnd() {
    return this.cursor === this.rendered.length || (this.placeholder && this.cursor === this.rendered.length + 1)
  }

  render() {
    if (this.closed) return;
    if (!this.firstRender) {
      if (this.outputError)
        this.out.write(cursor$8.down(lines$1(this.outputError, this.out.columns) - 1) + clear$8(this.outputError, this.out.columns));
      this.out.write(clear$8(this.outputText, this.out.columns));
    }
    super.render();
    this.outputError = '';

    this.outputText = [
      style$8.symbol(this.done, this.aborted),
      color$8.bold(this.msg),
      style$8.delimiter(this.done),
      this.red ? color$8.red(this.rendered) : this.rendered
    ].join(` `);

    if (this.error) {
      this.outputError += this.errorMsg.split(`\n`)
          .reduce((a, l, i) => a + `\n${i ? ' ' : figures$6.pointerSmall} ${color$8.red().italic(l)}`, ``);
    }

    this.out.write(erase$5.line + cursor$8.to(0) + this.outputText + cursor$8.save + this.outputError + cursor$8.restore + cursor$8.move(this.cursorOffset, 0));
  }
}

var text = TextPrompt;

const color$7 = kleur;
const Prompt$6 = prompt$1;
const { style: style$7, clear: clear$7, figures: figures$5, wrap: wrap$2, entriesToDisplay: entriesToDisplay$2 } = util;
const { cursor: cursor$7 } = src;

/**
 * SelectPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {Array} opts.choices Array of choice objects
 * @param {String} [opts.hint] Hint to display
 * @param {Number} [opts.initial] Index of default value
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 * @param {Number} [opts.optionsPerPage=10] Max options to display at once
 */
class SelectPrompt extends Prompt$6 {
  constructor(opts={}) {
    super(opts);
    this.msg = opts.message;
    this.hint = opts.hint || '- Use arrow-keys. Return to submit.';
    this.warn = opts.warn || '- This option is disabled';
    this.cursor = opts.initial || 0;
    this.choices = opts.choices.map((ch, idx) => {
      if (typeof ch === 'string')
        ch = {title: ch, value: idx};
      return {
        title: ch && (ch.title || ch.value || ch),
        value: ch && (ch.value === undefined ? idx : ch.value),
        description: ch && ch.description,
        selected: ch && ch.selected,
        disabled: ch && ch.disabled
      };
    });
    this.optionsPerPage = opts.optionsPerPage || 10;
    this.value = (this.choices[this.cursor] || {}).value;
    this.clear = clear$7('', this.out.columns);
    this.render();
  }

  moveCursor(n) {
    this.cursor = n;
    this.value = this.choices[n].value;
    this.fire();
  }

  reset() {
    this.moveCursor(0);
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    this.done = this.aborted = true;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  submit() {
    if (!this.selection.disabled) {
      this.done = true;
      this.aborted = false;
      this.fire();
      this.render();
      this.out.write('\n');
      this.close();
    } else
      this.bell();
  }

  first() {
    this.moveCursor(0);
    this.render();
  }

  last() {
    this.moveCursor(this.choices.length - 1);
    this.render();
  }

  up() {
    if (this.cursor === 0) {
      this.moveCursor(this.choices.length - 1);
    } else {
      this.moveCursor(this.cursor - 1);
    }
    this.render();
  }

  down() {
    if (this.cursor === this.choices.length - 1) {
      this.moveCursor(0);
    } else {
      this.moveCursor(this.cursor + 1);
    }
    this.render();
  }

  next() {
    this.moveCursor((this.cursor + 1) % this.choices.length);
    this.render();
  }

  _(c, key) {
    if (c === ' ') return this.submit();
  }

  get selection() {
    return this.choices[this.cursor];
  }

  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(cursor$7.hide);
    else this.out.write(clear$7(this.outputText, this.out.columns));
    super.render();

    let { startIndex, endIndex } = entriesToDisplay$2(this.cursor, this.choices.length, this.optionsPerPage);

    // Print prompt
    this.outputText = [
      style$7.symbol(this.done, this.aborted),
      color$7.bold(this.msg),
      style$7.delimiter(false),
      this.done ? this.selection.title : this.selection.disabled
          ? color$7.yellow(this.warn) : color$7.gray(this.hint)
    ].join(' ');

    // Print choices
    if (!this.done) {
      this.outputText += '\n';
      for (let i = startIndex; i < endIndex; i++) {
        let title, prefix, desc = '', v = this.choices[i];

        // Determine whether to display "more choices" indicators
        if (i === startIndex && startIndex > 0) {
          prefix = figures$5.arrowUp;
        } else if (i === endIndex - 1 && endIndex < this.choices.length) {
          prefix = figures$5.arrowDown;
        } else {
          prefix = ' ';
        }

        if (v.disabled) {
          title = this.cursor === i ? color$7.gray().underline(v.title) : color$7.strikethrough().gray(v.title);
          prefix = (this.cursor === i ? color$7.bold().gray(figures$5.pointer) + ' ' : '  ') + prefix;
        } else {
          title = this.cursor === i ? color$7.cyan().underline(v.title) : v.title;
          prefix = (this.cursor === i ? color$7.cyan(figures$5.pointer) + ' ' : '  ') + prefix;
          if (v.description && this.cursor === i) {
            desc = ` - ${v.description}`;
            if (prefix.length + title.length + desc.length >= this.out.columns
                || v.description.split(/\r?\n/).length > 1) {
              desc = '\n' + wrap$2(v.description, { margin: 3, width: this.out.columns });
            }
          }
        }

        this.outputText += `${prefix} ${title}${color$7.gray(desc)}\n`;
      }
    }

    this.out.write(this.outputText);
  }
}

var select = SelectPrompt;

const color$6 = kleur;
const Prompt$5 = prompt$1;
const { style: style$6, clear: clear$6 } = util;
const { cursor: cursor$6, erase: erase$4 } = src;

/**
 * TogglePrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {Boolean} [opts.initial=false] Default value
 * @param {String} [opts.active='no'] Active label
 * @param {String} [opts.inactive='off'] Inactive label
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 */
class TogglePrompt extends Prompt$5 {
  constructor(opts={}) {
    super(opts);
    this.msg = opts.message;
    this.value = !!opts.initial;
    this.active = opts.active || 'on';
    this.inactive = opts.inactive || 'off';
    this.initialValue = this.value;
    this.render();
  }

  reset() {
    this.value = this.initialValue;
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    this.done = this.aborted = true;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  submit() {
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  deactivate() {
    if (this.value === false) return this.bell();
    this.value = false;
    this.render();
  }

  activate() {
    if (this.value === true) return this.bell();
    this.value = true;
    this.render();
  }

  delete() {
    this.deactivate();
  }
  left() {
    this.deactivate();
  }
  right() {
    this.activate();
  }
  down() {
    this.deactivate();
  }
  up() {
    this.activate();
  }

  next() {
    this.value = !this.value;
    this.fire();
    this.render();
  }

  _(c, key) {
    if (c === ' ') {
      this.value = !this.value;
    } else if (c === '1') {
      this.value = true;
    } else if (c === '0') {
      this.value = false;
    } else return this.bell();
    this.render();
  }

  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(cursor$6.hide);
    else this.out.write(clear$6(this.outputText, this.out.columns));
    super.render();

    this.outputText = [
      style$6.symbol(this.done, this.aborted),
      color$6.bold(this.msg),
      style$6.delimiter(this.done),
      this.value ? this.inactive : color$6.cyan().underline(this.inactive),
      color$6.gray('/'),
      this.value ? color$6.cyan().underline(this.active) : this.active
    ].join(' ');

    this.out.write(erase$4.line + cursor$6.to(0) + this.outputText);
  }
}

var toggle = TogglePrompt;

class DatePart$9 {
  constructor({token, date, parts, locales}) {
    this.token = token;
    this.date = date || new Date();
    this.parts = parts || [this];
    this.locales = locales || {};
  }

  up() {}

  down() {}

  next() {
    const currentIdx = this.parts.indexOf(this);
    return this.parts.find((part, idx) => idx > currentIdx && part instanceof DatePart$9);
  }

  setTo(val) {}

  prev() {
    let parts = [].concat(this.parts).reverse();
    const currentIdx = parts.indexOf(this);
    return parts.find((part, idx) => idx > currentIdx && part instanceof DatePart$9);
  }

  toString() {
    return String(this.date);
  }
}

var datepart = DatePart$9;

const DatePart$8 = datepart;

class Meridiem$1 extends DatePart$8 {
  constructor(opts={}) {
    super(opts);
  }

  up() {
    this.date.setHours((this.date.getHours() + 12) % 24);
  }

  down() {
    this.up();
  }

  toString() {
    let meridiem = this.date.getHours() > 12 ? 'pm' : 'am';
    return /\A/.test(this.token) ? meridiem.toUpperCase() : meridiem;
  }
}

var meridiem = Meridiem$1;

const DatePart$7 = datepart;

const pos = n => {
  n = n % 10;
  return n === 1 ? 'st'
       : n === 2 ? 'nd'
       : n === 3 ? 'rd'
       : 'th';
};

class Day$1 extends DatePart$7 {
  constructor(opts={}) {
    super(opts);
  }

  up() {
    this.date.setDate(this.date.getDate() + 1);
  }

  down() {
    this.date.setDate(this.date.getDate() - 1);
  }

  setTo(val) {
    this.date.setDate(parseInt(val.substr(-2)));
  }

  toString() {
    let date = this.date.getDate();
    let day = this.date.getDay();
    return this.token === 'DD' ? String(date).padStart(2, '0')
         : this.token === 'Do' ? date + pos(date)
         : this.token === 'd' ? day + 1
         : this.token === 'ddd' ? this.locales.weekdaysShort[day]
         : this.token === 'dddd' ? this.locales.weekdays[day]
         : date;
  }
}

var day = Day$1;

const DatePart$6 = datepart;

class Hours$1 extends DatePart$6 {
  constructor(opts={}) {
    super(opts);
  }

  up() {
    this.date.setHours(this.date.getHours() + 1);
  }

  down() {
    this.date.setHours(this.date.getHours() - 1);
  }

  setTo(val) {
    this.date.setHours(parseInt(val.substr(-2)));
  }

  toString() {
    let hours = this.date.getHours();
    if (/h/.test(this.token))
      hours = (hours % 12) || 12;
    return this.token.length > 1 ? String(hours).padStart(2, '0') : hours;
  }
}

var hours = Hours$1;

const DatePart$5 = datepart;

class Milliseconds$1 extends DatePart$5 {
  constructor(opts={}) {
    super(opts);
  }

  up() {
    this.date.setMilliseconds(this.date.getMilliseconds() + 1);
  }

  down() {
    this.date.setMilliseconds(this.date.getMilliseconds() - 1);
  }

  setTo(val) {
    this.date.setMilliseconds(parseInt(val.substr(-(this.token.length))));
  }

  toString() {
    return String(this.date.getMilliseconds()).padStart(4, '0')
                                              .substr(0, this.token.length);
  }
}

var milliseconds = Milliseconds$1;

const DatePart$4 = datepart;

class Minutes$1 extends DatePart$4 {
  constructor(opts={}) {
    super(opts);
  }

  up() {
    this.date.setMinutes(this.date.getMinutes() + 1);
  }

  down() {
    this.date.setMinutes(this.date.getMinutes() - 1);
  }

  setTo(val) {
    this.date.setMinutes(parseInt(val.substr(-2)));
  }

  toString() {
    let m = this.date.getMinutes();
    return this.token.length > 1 ? String(m).padStart(2, '0') : m;
  }
}

var minutes = Minutes$1;

const DatePart$3 = datepart;

class Month$1 extends DatePart$3 {
  constructor(opts={}) {
    super(opts);
  }

  up() {
    this.date.setMonth(this.date.getMonth() + 1);
  }

  down() {
    this.date.setMonth(this.date.getMonth() - 1);
  }

  setTo(val) {
    val = parseInt(val.substr(-2)) - 1;
    this.date.setMonth(val < 0 ? 0 : val);
  }

  toString() {
    let month = this.date.getMonth();
    let tl = this.token.length;
    return tl === 2 ? String(month + 1).padStart(2, '0')
           : tl === 3 ? this.locales.monthsShort[month]
             : tl === 4 ? this.locales.months[month]
               : String(month + 1);
  }
}

var month = Month$1;

const DatePart$2 = datepart;

class Seconds$1 extends DatePart$2 {
  constructor(opts={}) {
    super(opts);
  }

  up() {
    this.date.setSeconds(this.date.getSeconds() + 1);
  }

  down() {
    this.date.setSeconds(this.date.getSeconds() - 1);
  }

  setTo(val) {
    this.date.setSeconds(parseInt(val.substr(-2)));
  }

  toString() {
    let s = this.date.getSeconds();
    return this.token.length > 1 ? String(s).padStart(2, '0') : s;
  }
}

var seconds = Seconds$1;

const DatePart$1 = datepart;

class Year$1 extends DatePart$1 {
  constructor(opts={}) {
    super(opts);
  }

  up() {
    this.date.setFullYear(this.date.getFullYear() + 1);
  }

  down() {
    this.date.setFullYear(this.date.getFullYear() - 1);
  }

  setTo(val) {
    this.date.setFullYear(val.substr(-4));
  }

  toString() {
    let year = String(this.date.getFullYear()).padStart(4, '0');
    return this.token.length === 2 ? year.substr(-2) : year;
  }
}

var year = Year$1;

var dateparts = {
  DatePart: datepart,
  Meridiem: meridiem,
  Day: day,
  Hours: hours,
  Milliseconds: milliseconds,
  Minutes: minutes,
  Month: month,
  Seconds: seconds,
  Year: year,
};

const color$5 = kleur;
const Prompt$4 = prompt$1;
const { style: style$5, clear: clear$5, figures: figures$4 } = util;
const { erase: erase$3, cursor: cursor$5 } = src;
const { DatePart, Meridiem, Day, Hours, Milliseconds, Minutes, Month, Seconds, Year } = dateparts;

const regex = /\\(.)|"((?:\\["\\]|[^"])+)"|(D[Do]?|d{3,4}|d)|(M{1,4})|(YY(?:YY)?)|([aA])|([Hh]{1,2})|(m{1,2})|(s{1,2})|(S{1,4})|./g;
const regexGroups = {
  1: ({token}) => token.replace(/\\(.)/g, '$1'),
  2: (opts) => new Day(opts), // Day // TODO
  3: (opts) => new Month(opts), // Month
  4: (opts) => new Year(opts), // Year
  5: (opts) => new Meridiem(opts), // AM/PM // TODO (special)
  6: (opts) => new Hours(opts), // Hours
  7: (opts) => new Minutes(opts), // Minutes
  8: (opts) => new Seconds(opts), // Seconds
  9: (opts) => new Milliseconds(opts), // Fractional seconds
};

const dfltLocales = {
  months: 'January,February,March,April,May,June,July,August,September,October,November,December'.split(','),
  monthsShort: 'Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec'.split(','),
  weekdays: 'Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday'.split(','),
  weekdaysShort: 'Sun,Mon,Tue,Wed,Thu,Fri,Sat'.split(',')
};


/**
 * DatePrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {Number} [opts.initial] Index of default value
 * @param {String} [opts.mask] The format mask
 * @param {object} [opts.locales] The date locales
 * @param {String} [opts.error] The error message shown on invalid value
 * @param {Function} [opts.validate] Function to validate the submitted value
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 */
class DatePrompt extends Prompt$4 {
  constructor(opts={}) {
    super(opts);
    this.msg = opts.message;
    this.cursor = 0;
    this.typed = '';
    this.locales = Object.assign(dfltLocales, opts.locales);
    this._date = opts.initial || new Date();
    this.errorMsg = opts.error || 'Please Enter A Valid Value';
    this.validator = opts.validate || (() => true);
    this.mask = opts.mask || 'YYYY-MM-DD HH:mm:ss';
    this.clear = clear$5('', this.out.columns);
    this.render();
  }

  get value() {
    return this.date
  }

  get date() {
    return this._date;
  }

  set date(date) {
    if (date) this._date.setTime(date.getTime());
  }

  set mask(mask) {
    let result;
    this.parts = [];
    while(result = regex.exec(mask)) {
      let match = result.shift();
      let idx = result.findIndex(gr => gr != null);
      this.parts.push(idx in regexGroups
        ? regexGroups[idx]({ token: result[idx] || match, date: this.date, parts: this.parts, locales: this.locales })
        : result[idx] || match);
    }

    let parts = this.parts.reduce((arr, i) => {
      if (typeof i === 'string' && typeof arr[arr.length - 1] === 'string')
        arr[arr.length - 1] += i;
      else arr.push(i);
      return arr;
    }, []);

    this.parts.splice(0);
    this.parts.push(...parts);
    this.reset();
  }

  moveCursor(n) {
    this.typed = '';
    this.cursor = n;
    this.fire();
  }

  reset() {
    this.moveCursor(this.parts.findIndex(p => p instanceof DatePart));
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    this.done = this.aborted = true;
    this.error = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  async validate() {
    let valid = await this.validator(this.value);
    if (typeof valid === 'string') {
      this.errorMsg = valid;
      valid = false;
    }
    this.error = !valid;
  }

  async submit() {
    await this.validate();
    if (this.error) {
      this.color = 'red';
      this.fire();
      this.render();
      return;
    }
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  up() {
    this.typed = '';
    this.parts[this.cursor].up();
    this.render();
  }

  down() {
    this.typed = '';
    this.parts[this.cursor].down();
    this.render();
  }

  left() {
    let prev = this.parts[this.cursor].prev();
    if (prev == null) return this.bell();
    this.moveCursor(this.parts.indexOf(prev));
    this.render();
  }

  right() {
    let next = this.parts[this.cursor].next();
    if (next == null) return this.bell();
    this.moveCursor(this.parts.indexOf(next));
    this.render();
  }

  next() {
    let next = this.parts[this.cursor].next();
    this.moveCursor(next
      ? this.parts.indexOf(next)
      : this.parts.findIndex((part) => part instanceof DatePart));
    this.render();
  }

  _(c) {
    if (/\d/.test(c)) {
      this.typed += c;
      this.parts[this.cursor].setTo(this.typed);
      this.render();
    }
  }

  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(cursor$5.hide);
    else this.out.write(clear$5(this.outputText, this.out.columns));
    super.render();

    // Print prompt
    this.outputText = [
      style$5.symbol(this.done, this.aborted),
      color$5.bold(this.msg),
      style$5.delimiter(false),
      this.parts.reduce((arr, p, idx) => arr.concat(idx === this.cursor && !this.done ? color$5.cyan().underline(p.toString()) : p), [])
          .join('')
    ].join(' ');

    // Print error
    if (this.error) {
      this.outputText += this.errorMsg.split('\n').reduce(
          (a, l, i) => a + `\n${i ? ` ` : figures$4.pointerSmall} ${color$5.red().italic(l)}`, ``);
    }

    this.out.write(erase$3.line + cursor$5.to(0) + this.outputText);
  }
}

var date = DatePrompt;

const color$4 = kleur;
const Prompt$3 = prompt$1;
const { cursor: cursor$4, erase: erase$2 } = src;
const { style: style$4, figures: figures$3, clear: clear$4, lines } = util;

const isNumber = /[0-9]/;
const isDef = any => any !== undefined;
const round = (number, precision) => {
  let factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
};

/**
 * NumberPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {String} [opts.style='default'] Render style
 * @param {Number} [opts.initial] Default value
 * @param {Number} [opts.max=+Infinity] Max value
 * @param {Number} [opts.min=-Infinity] Min value
 * @param {Boolean} [opts.float=false] Parse input as floats
 * @param {Number} [opts.round=2] Round floats to x decimals
 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
 * @param {Function} [opts.validate] Validate function
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 * @param {String} [opts.error] The invalid error label
 */
class NumberPrompt extends Prompt$3 {
  constructor(opts={}) {
    super(opts);
    this.transform = style$4.render(opts.style);
    this.msg = opts.message;
    this.initial = isDef(opts.initial) ? opts.initial : '';
    this.float = !!opts.float;
    this.round = opts.round || 2;
    this.inc = opts.increment || 1;
    this.min = isDef(opts.min) ? opts.min : -Infinity;
    this.max = isDef(opts.max) ? opts.max : Infinity;
    this.errorMsg = opts.error || `Please Enter A Valid Value`;
    this.validator = opts.validate || (() => true);
    this.color = `cyan`;
    this.value = ``;
    this.typed = ``;
    this.lastHit = 0;
    this.render();
  }

  set value(v) {
    if (!v && v !== 0) {
      this.placeholder = true;
      this.rendered = color$4.gray(this.transform.render(`${this.initial}`));
      this._value = ``;
    } else {
      this.placeholder = false;
      this.rendered = this.transform.render(`${round(v, this.round)}`);
      this._value = round(v, this.round);
    }
    this.fire();
  }

  get value() {
    return this._value;
  }

  parse(x) {
    return this.float ? parseFloat(x) : parseInt(x);
  }

  valid(c) {
    return c === `-` || c === `.` && this.float || isNumber.test(c)
  }

  reset() {
    this.typed = ``;
    this.value = ``;
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    let x = this.value;
    this.value = x !== `` ? x : this.initial;
    this.done = this.aborted = true;
    this.error = false;
    this.fire();
    this.render();
    this.out.write(`\n`);
    this.close();
  }

  async validate() {
    let valid = await this.validator(this.value);
    if (typeof valid === `string`) {
      this.errorMsg = valid;
      valid = false;
    }
    this.error = !valid;
  }

  async submit() {
    await this.validate();
    if (this.error) {
      this.color = `red`;
      this.fire();
      this.render();
      return;
    }
    let x = this.value;
    this.value = x !== `` ? x : this.initial;
    this.done = true;
    this.aborted = false;
    this.error = false;
    this.fire();
    this.render();
    this.out.write(`\n`);
    this.close();
  }

  up() {
    this.typed = ``;
    if(this.value === '') {
      this.value = this.min - this.inc;
    }
    if (this.value >= this.max) return this.bell();
    this.value += this.inc;
    this.color = `cyan`;
    this.fire();
    this.render();
  }

  down() {
    this.typed = ``;
    if(this.value === '') {
      this.value = this.min + this.inc;
    }
    if (this.value <= this.min) return this.bell();
    this.value -= this.inc;
    this.color = `cyan`;
    this.fire();
    this.render();
  }

  delete() {
    let val = this.value.toString();
    if (val.length === 0) return this.bell();
    this.value = this.parse((val = val.slice(0, -1))) || ``;
    if (this.value !== '' && this.value < this.min) {
      this.value = this.min;
    }
    this.color = `cyan`;
    this.fire();
    this.render();
  }

  next() {
    this.value = this.initial;
    this.fire();
    this.render();
  }

  _(c, key) {
    if (!this.valid(c)) return this.bell();

    const now = Date.now();
    if (now - this.lastHit > 1000) this.typed = ``; // 1s elapsed
    this.typed += c;
    this.lastHit = now;
    this.color = `cyan`;

    if (c === `.`) return this.fire();

    this.value = Math.min(this.parse(this.typed), this.max);
    if (this.value > this.max) this.value = this.max;
    if (this.value < this.min) this.value = this.min;
    this.fire();
    this.render();
  }

  render() {
    if (this.closed) return;
    if (!this.firstRender) {
      if (this.outputError)
        this.out.write(cursor$4.down(lines(this.outputError, this.out.columns) - 1) + clear$4(this.outputError, this.out.columns));
      this.out.write(clear$4(this.outputText, this.out.columns));
    }
    super.render();
    this.outputError = '';

    // Print prompt
    this.outputText = [
      style$4.symbol(this.done, this.aborted),
      color$4.bold(this.msg),
      style$4.delimiter(this.done),
      !this.done || (!this.done && !this.placeholder)
          ? color$4[this.color]().underline(this.rendered) : this.rendered
    ].join(` `);

    // Print error
    if (this.error) {
      this.outputError += this.errorMsg.split(`\n`)
          .reduce((a, l, i) => a + `\n${i ? ` ` : figures$3.pointerSmall} ${color$4.red().italic(l)}`, ``);
    }

    this.out.write(erase$2.line + cursor$4.to(0) + this.outputText + cursor$4.save + this.outputError + cursor$4.restore);
  }
}

var number = NumberPrompt;

const color$3 = kleur;
const { cursor: cursor$3 } = src;
const Prompt$2 = prompt$1;
const { clear: clear$3, figures: figures$2, style: style$3, wrap: wrap$1, entriesToDisplay: entriesToDisplay$1 } = util;

/**
 * MultiselectPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {Array} opts.choices Array of choice objects
 * @param {String} [opts.hint] Hint to display
 * @param {String} [opts.warn] Hint shown for disabled choices
 * @param {Number} [opts.max] Max choices
 * @param {Number} [opts.cursor=0] Cursor start position
 * @param {Number} [opts.optionsPerPage=10] Max options to display at once
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 */
class MultiselectPrompt$1 extends Prompt$2 {
  constructor(opts={}) {
    super(opts);
    this.msg = opts.message;
    this.cursor = opts.cursor || 0;
    this.scrollIndex = opts.cursor || 0;
    this.hint = opts.hint || '';
    this.warn = opts.warn || '- This option is disabled -';
    this.minSelected = opts.min;
    this.showMinError = false;
    this.maxChoices = opts.max;
    this.instructions = opts.instructions;
    this.optionsPerPage = opts.optionsPerPage || 10;
    this.value = opts.choices.map((ch, idx) => {
      if (typeof ch === 'string')
        ch = {title: ch, value: idx};
      return {
        title: ch && (ch.title || ch.value || ch),
        description: ch && ch.description,
        value: ch && (ch.value === undefined ? idx : ch.value),
        selected: ch && ch.selected,
        disabled: ch && ch.disabled
      };
    });
    this.clear = clear$3('', this.out.columns);
    if (!opts.overrideRender) {
      this.render();
    }
  }

  reset() {
    this.value.map(v => !v.selected);
    this.cursor = 0;
    this.fire();
    this.render();
  }

  selected() {
    return this.value.filter(v => v.selected);
  }

  exit() {
    this.abort();
  }

  abort() {
    this.done = this.aborted = true;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  submit() {
    const selected = this.value
      .filter(e => e.selected);
    if (this.minSelected && selected.length < this.minSelected) {
      this.showMinError = true;
      this.render();
    } else {
      this.done = true;
      this.aborted = false;
      this.fire();
      this.render();
      this.out.write('\n');
      this.close();
    }
  }

  first() {
    this.cursor = 0;
    this.render();
  }

  last() {
    this.cursor = this.value.length - 1;
    this.render();
  }
  next() {
    this.cursor = (this.cursor + 1) % this.value.length;
    this.render();
  }

  up() {
    if (this.cursor === 0) {
      this.cursor = this.value.length - 1;
    } else {
      this.cursor--;
    }
    this.render();
  }

  down() {
    if (this.cursor === this.value.length - 1) {
      this.cursor = 0;
    } else {
      this.cursor++;
    }
    this.render();
  }

  left() {
    this.value[this.cursor].selected = false;
    this.render();
  }

  right() {
    if (this.value.filter(e => e.selected).length >= this.maxChoices) return this.bell();
    this.value[this.cursor].selected = true;
    this.render();
  }

  handleSpaceToggle() {
    const v = this.value[this.cursor];

    if (v.selected) {
      v.selected = false;
      this.render();
    } else if (v.disabled || this.value.filter(e => e.selected).length >= this.maxChoices) {
      return this.bell();
    } else {
      v.selected = true;
      this.render();
    }
  }

  toggleAll() {
    if (this.maxChoices !== undefined || this.value[this.cursor].disabled) {
      return this.bell();
    }

    const newSelected = !this.value[this.cursor].selected;
    this.value.filter(v => !v.disabled).forEach(v => v.selected = newSelected);
    this.render();
  }

  _(c, key) {
    if (c === ' ') {
      this.handleSpaceToggle();
    } else if (c === 'a') {
      this.toggleAll();
    } else {
      return this.bell();
    }
  }

  renderInstructions() {
    if (this.instructions === undefined || this.instructions) {
      if (typeof this.instructions === 'string') {
        return this.instructions;
      }
      return '\nInstructions:\n'
        + `    ${figures$2.arrowUp}/${figures$2.arrowDown}: Highlight option\n`
        + `    ${figures$2.arrowLeft}/${figures$2.arrowRight}/[space]: Toggle selection\n`
        + (this.maxChoices === undefined ? `    a: Toggle all\n` : '')
        + `    enter/return: Complete answer`;
    }
    return '';
  }

  renderOption(cursor, v, i, arrowIndicator) {
    const prefix = (v.selected ? color$3.green(figures$2.radioOn) : figures$2.radioOff) + ' ' + arrowIndicator + ' ';
    let title, desc;

    if (v.disabled) {
      title = cursor === i ? color$3.gray().underline(v.title) : color$3.strikethrough().gray(v.title);
    } else {
      title = cursor === i ? color$3.cyan().underline(v.title) : v.title;
      if (cursor === i && v.description) {
        desc = ` - ${v.description}`;
        if (prefix.length + title.length + desc.length >= this.out.columns
          || v.description.split(/\r?\n/).length > 1) {
          desc = '\n' + wrap$1(v.description, { margin: prefix.length, width: this.out.columns });
        }
      }
    }

    return prefix + title + color$3.gray(desc || '');
  }

  // shared with autocompleteMultiselect
  paginateOptions(options) {
    if (options.length === 0) {
      return color$3.red('No matches for this query.');
    }

    let { startIndex, endIndex } = entriesToDisplay$1(this.cursor, options.length, this.optionsPerPage);
    let prefix, styledOptions = [];

    for (let i = startIndex; i < endIndex; i++) {
      if (i === startIndex && startIndex > 0) {
        prefix = figures$2.arrowUp;
      } else if (i === endIndex - 1 && endIndex < options.length) {
        prefix = figures$2.arrowDown;
      } else {
        prefix = ' ';
      }
      styledOptions.push(this.renderOption(this.cursor, options[i], i, prefix));
    }

    return '\n' + styledOptions.join('\n');
  }

  // shared with autocomleteMultiselect
  renderOptions(options) {
    if (!this.done) {
      return this.paginateOptions(options);
    }
    return '';
  }

  renderDoneOrInstructions() {
    if (this.done) {
      return this.value
        .filter(e => e.selected)
        .map(v => v.title)
        .join(', ');
    }

    const output = [color$3.gray(this.hint), this.renderInstructions()];

    if (this.value[this.cursor].disabled) {
      output.push(color$3.yellow(this.warn));
    }
    return output.join(' ');
  }

  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(cursor$3.hide);
    super.render();

    // print prompt
    let prompt = [
      style$3.symbol(this.done, this.aborted),
      color$3.bold(this.msg),
      style$3.delimiter(false),
      this.renderDoneOrInstructions()
    ].join(' ');
    if (this.showMinError) {
      prompt += color$3.red(`You must select a minimum of ${this.minSelected} choices.`);
      this.showMinError = false;
    }
    prompt += this.renderOptions(this.value);

    this.out.write(this.clear + prompt);
    this.clear = clear$3(prompt, this.out.columns);
  }
}

var multiselect = MultiselectPrompt$1;

const color$2 = kleur;
const Prompt$1 = prompt$1;
const { erase: erase$1, cursor: cursor$2 } = src;
const { style: style$2, clear: clear$2, figures: figures$1, wrap, entriesToDisplay } = util;

const getVal = (arr, i) => arr[i] && (arr[i].value || arr[i].title || arr[i]);
const getTitle = (arr, i) => arr[i] && (arr[i].title || arr[i].value || arr[i]);
const getIndex = (arr, valOrTitle) => {
  const index = arr.findIndex(el => el.value === valOrTitle || el.title === valOrTitle);
  return index > -1 ? index : undefined;
};

/**
 * TextPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {Array} opts.choices Array of auto-complete choices objects
 * @param {Function} [opts.suggest] Filter function. Defaults to sort by title
 * @param {Number} [opts.limit=10] Max number of results to show
 * @param {Number} [opts.cursor=0] Cursor start position
 * @param {String} [opts.style='default'] Render style
 * @param {String} [opts.fallback] Fallback message - initial to default value
 * @param {String} [opts.initial] Index of the default value
 * @param {Boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 * @param {String} [opts.noMatches] The no matches found label
 */
class AutocompletePrompt extends Prompt$1 {
  constructor(opts={}) {
    super(opts);
    this.msg = opts.message;
    this.suggest = opts.suggest;
    this.choices = opts.choices;
    this.initial = typeof opts.initial === 'number'
      ? opts.initial
      : getIndex(opts.choices, opts.initial);
    this.select = this.initial || opts.cursor || 0;
    this.i18n = { noMatches: opts.noMatches || 'no matches found' };
    this.fallback = opts.fallback || this.initial;
    this.clearFirst = opts.clearFirst || false;
    this.suggestions = [];
    this.input = '';
    this.limit = opts.limit || 10;
    this.cursor = 0;
    this.transform = style$2.render(opts.style);
    this.scale = this.transform.scale;
    this.render = this.render.bind(this);
    this.complete = this.complete.bind(this);
    this.clear = clear$2('', this.out.columns);
    this.complete(this.render);
    this.render();
  }

  set fallback(fb) {
    this._fb = Number.isSafeInteger(parseInt(fb)) ? parseInt(fb) : fb;
  }

  get fallback() {
    let choice;
    if (typeof this._fb === 'number')
      choice = this.choices[this._fb];
    else if (typeof this._fb === 'string')
      choice = { title: this._fb };
    return choice || this._fb || { title: this.i18n.noMatches };
  }

  moveSelect(i) {
    this.select = i;
    if (this.suggestions.length > 0)
      this.value = getVal(this.suggestions, i);
    else this.value = this.fallback.value;
    this.fire();
  }

  async complete(cb) {
    const p = (this.completing = this.suggest(this.input, this.choices));
    const suggestions = await p;

    if (this.completing !== p) return;
    this.suggestions = suggestions
      .map((s, i, arr) => ({ title: getTitle(arr, i), value: getVal(arr, i), description: s.description }));
    this.completing = false;
    const l = Math.max(suggestions.length - 1, 0);
    this.moveSelect(Math.min(l, this.select));

    cb && cb();
  }

  reset() {
    this.input = '';
    this.complete(() => {
      this.moveSelect(this.initial !== void 0 ? this.initial : 0);
      this.render();
    });
    this.render();
  }

  exit() {
    if (this.clearFirst && this.input.length > 0) {
      this.reset();
    } else {
      this.done = this.exited = true; 
      this.aborted = false;
      this.fire();
      this.render();
      this.out.write('\n');
      this.close();
    }
  }

  abort() {
    this.done = this.aborted = true;
    this.exited = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  submit() {
    this.done = true;
    this.aborted = this.exited = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  _(c, key) {
    let s1 = this.input.slice(0, this.cursor);
    let s2 = this.input.slice(this.cursor);
    this.input = `${s1}${c}${s2}`;
    this.cursor = s1.length+1;
    this.complete(this.render);
    this.render();
  }

  delete() {
    if (this.cursor === 0) return this.bell();
    let s1 = this.input.slice(0, this.cursor-1);
    let s2 = this.input.slice(this.cursor);
    this.input = `${s1}${s2}`;
    this.complete(this.render);
    this.cursor = this.cursor-1;
    this.render();
  }

  deleteForward() {
    if(this.cursor*this.scale >= this.rendered.length) return this.bell();
    let s1 = this.input.slice(0, this.cursor);
    let s2 = this.input.slice(this.cursor+1);
    this.input = `${s1}${s2}`;
    this.complete(this.render);
    this.render();
  }

  first() {
    this.moveSelect(0);
    this.render();
  }

  last() {
    this.moveSelect(this.suggestions.length - 1);
    this.render();
  }

  up() {
    if (this.select === 0) {
      this.moveSelect(this.suggestions.length - 1);
    } else {
      this.moveSelect(this.select - 1);
    }
    this.render();
  }

  down() {
    if (this.select === this.suggestions.length - 1) {
      this.moveSelect(0);
    } else {
      this.moveSelect(this.select + 1);
    }
    this.render();
  }

  next() {
    if (this.select === this.suggestions.length - 1) {
      this.moveSelect(0);
    } else this.moveSelect(this.select + 1);
    this.render();
  }

  nextPage() {
    this.moveSelect(Math.min(this.select + this.limit, this.suggestions.length - 1));
    this.render();
  }

  prevPage() {
    this.moveSelect(Math.max(this.select - this.limit, 0));
    this.render();
  }

  left() {
    if (this.cursor <= 0) return this.bell();
    this.cursor = this.cursor-1;
    this.render();
  }

  right() {
    if (this.cursor*this.scale >= this.rendered.length) return this.bell();
    this.cursor = this.cursor+1;
    this.render();
  }

  renderOption(v, hovered, isStart, isEnd) {
    let desc;
    let prefix = isStart ? figures$1.arrowUp : isEnd ? figures$1.arrowDown : ' ';
    let title = hovered ? color$2.cyan().underline(v.title) : v.title;
    prefix = (hovered ? color$2.cyan(figures$1.pointer) + ' ' : '  ') + prefix;
    if (v.description) {
      desc = ` - ${v.description}`;
      if (prefix.length + title.length + desc.length >= this.out.columns
        || v.description.split(/\r?\n/).length > 1) {
        desc = '\n' + wrap(v.description, { margin: 3, width: this.out.columns });
      }
    }
    return prefix + ' ' + title + color$2.gray(desc || '');
  }

  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(cursor$2.hide);
    else this.out.write(clear$2(this.outputText, this.out.columns));
    super.render();

    let { startIndex, endIndex } = entriesToDisplay(this.select, this.choices.length, this.limit);

    this.outputText = [
      style$2.symbol(this.done, this.aborted, this.exited),
      color$2.bold(this.msg),
      style$2.delimiter(this.completing),
      this.done && this.suggestions[this.select]
        ? this.suggestions[this.select].title
        : this.rendered = this.transform.render(this.input)
    ].join(' ');

    if (!this.done) {
      const suggestions = this.suggestions
        .slice(startIndex, endIndex)
        .map((item, i) =>  this.renderOption(item,
          this.select === i + startIndex,
          i === 0 && startIndex > 0,
          i + startIndex === endIndex - 1 && endIndex < this.choices.length))
        .join('\n');
      this.outputText += `\n` + (suggestions || color$2.gray(this.fallback.title));
    }

    this.out.write(erase$1.line + cursor$2.to(0) + this.outputText);
  }
}

var autocomplete = AutocompletePrompt;

const color$1 = kleur;
const { cursor: cursor$1 } = src;
const MultiselectPrompt = multiselect;
const { clear: clear$1, style: style$1, figures } = util;
/**
 * MultiselectPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {Array} opts.choices Array of choice objects
 * @param {String} [opts.hint] Hint to display
 * @param {String} [opts.warn] Hint shown for disabled choices
 * @param {Number} [opts.max] Max choices
 * @param {Number} [opts.cursor=0] Cursor start position
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 */
class AutocompleteMultiselectPrompt extends MultiselectPrompt {
  constructor(opts={}) {
    opts.overrideRender = true;
    super(opts);
    this.inputValue = '';
    this.clear = clear$1('', this.out.columns);
    this.filteredOptions = this.value;
    this.render();
  }

  last() {
    this.cursor = this.filteredOptions.length - 1;
    this.render();
  }
  next() {
    this.cursor = (this.cursor + 1) % this.filteredOptions.length;
    this.render();
  }

  up() {
    if (this.cursor === 0) {
      this.cursor = this.filteredOptions.length - 1;
    } else {
      this.cursor--;
    }
    this.render();
  }

  down() {
    if (this.cursor === this.filteredOptions.length - 1) {
      this.cursor = 0;
    } else {
      this.cursor++;
    }
    this.render();
  }

  left() {
    this.filteredOptions[this.cursor].selected = false;
    this.render();
  }

  right() {
    if (this.value.filter(e => e.selected).length >= this.maxChoices) return this.bell();
    this.filteredOptions[this.cursor].selected = true;
    this.render();
  }

  delete() {
    if (this.inputValue.length) {
      this.inputValue = this.inputValue.substr(0, this.inputValue.length - 1);
      this.updateFilteredOptions();
    }
  }

  updateFilteredOptions() {
    const currentHighlight = this.filteredOptions[this.cursor];
    this.filteredOptions = this.value
      .filter(v => {
        if (this.inputValue) {
          if (typeof v.title === 'string') {
            if (v.title.toLowerCase().includes(this.inputValue.toLowerCase())) {
              return true;
            }
          }
          if (typeof v.value === 'string') {
            if (v.value.toLowerCase().includes(this.inputValue.toLowerCase())) {
              return true;
            }
          }
          return false;
        }
        return true;
      });
    const newHighlightIndex = this.filteredOptions.findIndex(v => v === currentHighlight);
    this.cursor = newHighlightIndex < 0 ? 0 : newHighlightIndex;
    this.render();
  }

  handleSpaceToggle() {
    const v = this.filteredOptions[this.cursor];

    if (v.selected) {
      v.selected = false;
      this.render();
    } else if (v.disabled || this.value.filter(e => e.selected).length >= this.maxChoices) {
      return this.bell();
    } else {
      v.selected = true;
      this.render();
    }
  }

  handleInputChange(c) {
    this.inputValue = this.inputValue + c;
    this.updateFilteredOptions();
  }

  _(c, key) {
    if (c === ' ') {
      this.handleSpaceToggle();
    } else {
      this.handleInputChange(c);
    }
  }

  renderInstructions() {
    if (this.instructions === undefined || this.instructions) {
      if (typeof this.instructions === 'string') {
        return this.instructions;
      }
      return `
Instructions:
    ${figures.arrowUp}/${figures.arrowDown}: Highlight option
    ${figures.arrowLeft}/${figures.arrowRight}/[space]: Toggle selection
    [a,b,c]/delete: Filter choices
    enter/return: Complete answer
`;
    }
    return '';
  }

  renderCurrentInput() {
    return `
Filtered results for: ${this.inputValue ? this.inputValue : color$1.gray('Enter something to filter')}\n`;
  }

  renderOption(cursor, v, i) {
    let title;
    if (v.disabled) title = cursor === i ? color$1.gray().underline(v.title) : color$1.strikethrough().gray(v.title);
    else title = cursor === i ? color$1.cyan().underline(v.title) : v.title;
    return (v.selected ? color$1.green(figures.radioOn) : figures.radioOff) + '  ' + title
  }

  renderDoneOrInstructions() {
    if (this.done) {
      return this.value
        .filter(e => e.selected)
        .map(v => v.title)
        .join(', ');
    }

    const output = [color$1.gray(this.hint), this.renderInstructions(), this.renderCurrentInput()];

    if (this.filteredOptions.length && this.filteredOptions[this.cursor].disabled) {
      output.push(color$1.yellow(this.warn));
    }
    return output.join(' ');
  }

  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(cursor$1.hide);
    super.render();

    // print prompt

    let prompt = [
      style$1.symbol(this.done, this.aborted),
      color$1.bold(this.msg),
      style$1.delimiter(false),
      this.renderDoneOrInstructions()
    ].join(' ');

    if (this.showMinError) {
      prompt += color$1.red(`You must select a minimum of ${this.minSelected} choices.`);
      this.showMinError = false;
    }
    prompt += this.renderOptions(this.filteredOptions);

    this.out.write(this.clear + prompt);
    this.clear = clear$1(prompt, this.out.columns);
  }
}

var autocompleteMultiselect = AutocompleteMultiselectPrompt;

const color = kleur;
const Prompt = prompt$1;
const { style, clear } = util;
const { erase, cursor } = src;

/**
 * ConfirmPrompt Base Element
 * @param {Object} opts Options
 * @param {String} opts.message Message
 * @param {Boolean} [opts.initial] Default value (true/false)
 * @param {Stream} [opts.stdin] The Readable stream to listen to
 * @param {Stream} [opts.stdout] The Writable stream to write readline data to
 * @param {String} [opts.yes] The "Yes" label
 * @param {String} [opts.yesOption] The "Yes" option when choosing between yes/no
 * @param {String} [opts.no] The "No" label
 * @param {String} [opts.noOption] The "No" option when choosing between yes/no
 */
class ConfirmPrompt extends Prompt {
  constructor(opts={}) {
    super(opts);
    this.msg = opts.message;
    this.value = opts.initial;
    this.initialValue = !!opts.initial;
    this.yesMsg = opts.yes || 'yes';
    this.yesOption = opts.yesOption || '(Y/n)';
    this.noMsg = opts.no || 'no';
    this.noOption = opts.noOption || '(y/N)';
    this.render();
  }

  reset() {
    this.value = this.initialValue;
    this.fire();
    this.render();
  }

  exit() {
    this.abort();
  }

  abort() {
    this.done = this.aborted = true;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  submit() {
    this.value = this.value || false;
    this.done = true;
    this.aborted = false;
    this.fire();
    this.render();
    this.out.write('\n');
    this.close();
  }

  _(c, key) {
    if (c.toLowerCase() === 'y') {
      this.value = true;
      return this.submit();
    }
    if (c.toLowerCase() === 'n') {
      this.value = false;
      return this.submit();
    }
    return this.bell();
  }

  render() {
    if (this.closed) return;
    if (this.firstRender) this.out.write(cursor.hide);
    else this.out.write(clear(this.outputText, this.out.columns));
    super.render();

    this.outputText = [
      style.symbol(this.done, this.aborted),
      color.bold(this.msg),
      style.delimiter(this.done),
      this.done ? (this.value ? this.yesMsg : this.noMsg)
          : color.gray(this.initialValue ? this.yesOption : this.noOption)
    ].join(' ');

    this.out.write(erase.line + cursor.to(0) + this.outputText);
  }
}

var confirm = ConfirmPrompt;

var elements = {
  TextPrompt: text,
  SelectPrompt: select,
  TogglePrompt: toggle,
  DatePrompt: date,
  NumberPrompt: number,
  MultiselectPrompt: multiselect,
  AutocompletePrompt: autocomplete,
  AutocompleteMultiselectPrompt: autocompleteMultiselect,
  ConfirmPrompt: confirm
};

(function (exports) {
	const $ = exports;
	const el = elements;
	const noop = v => v;

	function toPrompt(type, args, opts={}) {
	  return new Promise((res, rej) => {
	    const p = new el[type](args);
	    const onAbort = opts.onAbort || noop;
	    const onSubmit = opts.onSubmit || noop;
	    const onExit = opts.onExit || noop;
	    p.on('state', args.onState || noop);
	    p.on('submit', x => res(onSubmit(x)));
	    p.on('exit', x => res(onExit(x)));
	    p.on('abort', x => rej(onAbort(x)));
	  });
	}

	/**
	 * Text prompt
	 * @param {string} args.message Prompt message to display
	 * @param {string} [args.initial] Default string value
	 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
	 * @param {function} [args.onState] On state change callback
	 * @param {function} [args.validate] Function to validate user input
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.text = args => toPrompt('TextPrompt', args);

	/**
	 * Password prompt with masked input
	 * @param {string} args.message Prompt message to display
	 * @param {string} [args.initial] Default string value
	 * @param {function} [args.onState] On state change callback
	 * @param {function} [args.validate] Function to validate user input
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.password = args => {
	  args.style = 'password';
	  return $.text(args);
	};

	/**
	 * Prompt where input is invisible, like sudo
	 * @param {string} args.message Prompt message to display
	 * @param {string} [args.initial] Default string value
	 * @param {function} [args.onState] On state change callback
	 * @param {function} [args.validate] Function to validate user input
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.invisible = args => {
	  args.style = 'invisible';
	  return $.text(args);
	};

	/**
	 * Number prompt
	 * @param {string} args.message Prompt message to display
	 * @param {number} args.initial Default number value
	 * @param {function} [args.onState] On state change callback
	 * @param {number} [args.max] Max value
	 * @param {number} [args.min] Min value
	 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
	 * @param {Boolean} [opts.float=false] Parse input as floats
	 * @param {Number} [opts.round=2] Round floats to x decimals
	 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
	 * @param {function} [args.validate] Function to validate user input
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.number = args => toPrompt('NumberPrompt', args);

	/**
	 * Date prompt
	 * @param {string} args.message Prompt message to display
	 * @param {number} args.initial Default number value
	 * @param {function} [args.onState] On state change callback
	 * @param {number} [args.max] Max value
	 * @param {number} [args.min] Min value
	 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
	 * @param {Boolean} [opts.float=false] Parse input as floats
	 * @param {Number} [opts.round=2] Round floats to x decimals
	 * @param {Number} [opts.increment=1] Number to increment by when using arrow-keys
	 * @param {function} [args.validate] Function to validate user input
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.date = args => toPrompt('DatePrompt', args);

	/**
	 * Classic yes/no prompt
	 * @param {string} args.message Prompt message to display
	 * @param {boolean} [args.initial=false] Default value
	 * @param {function} [args.onState] On state change callback
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.confirm = args => toPrompt('ConfirmPrompt', args);

	/**
	 * List prompt, split intput string by `seperator`
	 * @param {string} args.message Prompt message to display
	 * @param {string} [args.initial] Default string value
	 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
	 * @param {string} [args.separator] String separator
	 * @param {function} [args.onState] On state change callback
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input, in form of an `Array`
	 */
	$.list = args => {
	  const sep = args.separator || ',';
	  return toPrompt('TextPrompt', args, {
	    onSubmit: str => str.split(sep).map(s => s.trim())
	  });
	};

	/**
	 * Toggle/switch prompt
	 * @param {string} args.message Prompt message to display
	 * @param {boolean} [args.initial=false] Default value
	 * @param {string} [args.active="on"] Text for `active` state
	 * @param {string} [args.inactive="off"] Text for `inactive` state
	 * @param {function} [args.onState] On state change callback
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.toggle = args => toPrompt('TogglePrompt', args);

	/**
	 * Interactive select prompt
	 * @param {string} args.message Prompt message to display
	 * @param {Array} args.choices Array of choices objects `[{ title, value }, ...]`
	 * @param {number} [args.initial] Index of default value
	 * @param {String} [args.hint] Hint to display
	 * @param {function} [args.onState] On state change callback
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.select = args => toPrompt('SelectPrompt', args);

	/**
	 * Interactive multi-select / autocompleteMultiselect prompt
	 * @param {string} args.message Prompt message to display
	 * @param {Array} args.choices Array of choices objects `[{ title, value, [selected] }, ...]`
	 * @param {number} [args.max] Max select
	 * @param {string} [args.hint] Hint to display user
	 * @param {Number} [args.cursor=0] Cursor start position
	 * @param {function} [args.onState] On state change callback
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.multiselect = args => {
	  args.choices = [].concat(args.choices || []);
	  const toSelected = items => items.filter(item => item.selected).map(item => item.value);
	  return toPrompt('MultiselectPrompt', args, {
	    onAbort: toSelected,
	    onSubmit: toSelected
	  });
	};

	$.autocompleteMultiselect = args => {
	  args.choices = [].concat(args.choices || []);
	  const toSelected = items => items.filter(item => item.selected).map(item => item.value);
	  return toPrompt('AutocompleteMultiselectPrompt', args, {
	    onAbort: toSelected,
	    onSubmit: toSelected
	  });
	};

	const byTitle = (input, choices) => Promise.resolve(
	  choices.filter(item => item.title.slice(0, input.length).toLowerCase() === input.toLowerCase())
	);

	/**
	 * Interactive auto-complete prompt
	 * @param {string} args.message Prompt message to display
	 * @param {Array} args.choices Array of auto-complete choices objects `[{ title, value }, ...]`
	 * @param {Function} [args.suggest] Function to filter results based on user input. Defaults to sort by `title`
	 * @param {number} [args.limit=10] Max number of results to show
	 * @param {string} [args.style="default"] Render style ('default', 'password', 'invisible')
	 * @param {String} [args.initial] Index of the default value
	 * @param {boolean} [opts.clearFirst] The first ESCAPE keypress will clear the input
	 * @param {String} [args.fallback] Fallback message - defaults to initial value
	 * @param {function} [args.onState] On state change callback
	 * @param {Stream} [args.stdin] The Readable stream to listen to
	 * @param {Stream} [args.stdout] The Writable stream to write readline data to
	 * @returns {Promise} Promise with user input
	 */
	$.autocomplete = args => {
	  args.suggest = args.suggest || byTitle;
	  args.choices = [].concat(args.choices || []);
	  return toPrompt('AutocompletePrompt', args);
	};
} (prompts$1));

const prompts = prompts$1;

const passOn = ['suggest', 'format', 'onState', 'validate', 'onRender', 'type'];
const noop = () => {};

/**
 * Prompt for a series of questions
 * @param {Array|Object} questions Single question object or Array of question objects
 * @param {Function} [onSubmit] Callback function called on prompt submit
 * @param {Function} [onCancel] Callback function called on cancel/abort
 * @returns {Object} Object with values from user input
 */
async function prompt(questions=[], { onSubmit=noop, onCancel=noop }={}) {
  const answers = {};
  const override = prompt._override || {};
  questions = [].concat(questions);
  let answer, question, quit, name, type, lastPrompt;

  const getFormattedAnswer = async (question, answer, skipValidation = false) => {
    if (!skipValidation && question.validate && question.validate(answer) !== true) {
      return;
    }
    return question.format ? await question.format(answer, answers) : answer
  };

  for (question of questions) {
    ({ name, type } = question);

    // evaluate type first and skip if type is a falsy value
    if (typeof type === 'function') {
      type = await type(answer, { ...answers }, question);
      question['type'] = type;
    }
    if (!type) continue;

    // if property is a function, invoke it unless it's a special function
    for (let key in question) {
      if (passOn.includes(key)) continue;
      let value = question[key];
      question[key] = typeof value === 'function' ? await value(answer, { ...answers }, lastPrompt) : value;
    }

    lastPrompt = question;

    if (typeof question.message !== 'string') {
      throw new Error('prompt message is required');
    }

    // update vars in case they changed
    ({ name, type } = question);

    if (prompts[type] === void 0) {
      throw new Error(`prompt type (${type}) is not defined`);
    }

    if (override[question.name] !== undefined) {
      answer = await getFormattedAnswer(question, override[question.name]);
      if (answer !== undefined) {
        answers[name] = answer;
        continue;
      }
    }

    try {
      // Get the injected answer if there is one or prompt the user
      answer = prompt._injected ? getInjectedAnswer(prompt._injected, question.initial) : await prompts[type](question);
      answers[name] = answer = await getFormattedAnswer(question, answer, true);
      quit = await onSubmit(question, answer, answers);
    } catch (err) {
      quit = !(await onCancel(question, answers));
    }

    if (quit) return answers;
  }

  return answers;
}

function getInjectedAnswer(injected, deafultValue) {
  const answer = injected.shift();
    if (answer instanceof Error) {
      throw answer;
    }

    return (answer === undefined) ? deafultValue : answer;
}

function inject(answers) {
  prompt._injected = (prompt._injected || []).concat(answers);
}

function override(answers) {
  prompt._override = Object.assign({}, answers);
}

var lib = Object.assign(prompt, { prompt, prompts, inject, override });

var crossSpawn = {exports: {}};

var windows;
var hasRequiredWindows;

function requireWindows () {
	if (hasRequiredWindows) return windows;
	hasRequiredWindows = 1;
	windows = isexe;
	isexe.sync = sync;

	var fs = require$$0$1;

	function checkPathExt (path, options) {
	  var pathext = options.pathExt !== undefined ?
	    options.pathExt : process.env.PATHEXT;

	  if (!pathext) {
	    return true
	  }

	  pathext = pathext.split(';');
	  if (pathext.indexOf('') !== -1) {
	    return true
	  }
	  for (var i = 0; i < pathext.length; i++) {
	    var p = pathext[i].toLowerCase();
	    if (p && path.substr(-p.length).toLowerCase() === p) {
	      return true
	    }
	  }
	  return false
	}

	function checkStat (stat, path, options) {
	  if (!stat.isSymbolicLink() && !stat.isFile()) {
	    return false
	  }
	  return checkPathExt(path, options)
	}

	function isexe (path, options, cb) {
	  fs.stat(path, function (er, stat) {
	    cb(er, er ? false : checkStat(stat, path, options));
	  });
	}

	function sync (path, options) {
	  return checkStat(fs.statSync(path), path, options)
	}
	return windows;
}

var mode;
var hasRequiredMode;

function requireMode () {
	if (hasRequiredMode) return mode;
	hasRequiredMode = 1;
	mode = isexe;
	isexe.sync = sync;

	var fs = require$$0$1;

	function isexe (path, options, cb) {
	  fs.stat(path, function (er, stat) {
	    cb(er, er ? false : checkStat(stat, options));
	  });
	}

	function sync (path, options) {
	  return checkStat(fs.statSync(path), options)
	}

	function checkStat (stat, options) {
	  return stat.isFile() && checkMode(stat, options)
	}

	function checkMode (stat, options) {
	  var mod = stat.mode;
	  var uid = stat.uid;
	  var gid = stat.gid;

	  var myUid = options.uid !== undefined ?
	    options.uid : process.getuid && process.getuid();
	  var myGid = options.gid !== undefined ?
	    options.gid : process.getgid && process.getgid();

	  var u = parseInt('100', 8);
	  var g = parseInt('010', 8);
	  var o = parseInt('001', 8);
	  var ug = u | g;

	  var ret = (mod & o) ||
	    (mod & g) && gid === myGid ||
	    (mod & u) && uid === myUid ||
	    (mod & ug) && myUid === 0;

	  return ret
	}
	return mode;
}

var core;
if (process.platform === 'win32' || commonjsGlobal.TESTING_WINDOWS) {
  core = requireWindows();
} else {
  core = requireMode();
}

var isexe_1 = isexe$1;
isexe$1.sync = sync;

function isexe$1 (path, options, cb) {
  if (typeof options === 'function') {
    cb = options;
    options = {};
  }

  if (!cb) {
    if (typeof Promise !== 'function') {
      throw new TypeError('callback not provided')
    }

    return new Promise(function (resolve, reject) {
      isexe$1(path, options || {}, function (er, is) {
        if (er) {
          reject(er);
        } else {
          resolve(is);
        }
      });
    })
  }

  core(path, options || {}, function (er, is) {
    // ignore EACCES because that just means we aren't allowed to run it
    if (er) {
      if (er.code === 'EACCES' || options && options.ignoreErrors) {
        er = null;
        is = false;
      }
    }
    cb(er, is);
  });
}

function sync (path, options) {
  // my kingdom for a filtered catch
  try {
    return core.sync(path, options || {})
  } catch (er) {
    if (options && options.ignoreErrors || er.code === 'EACCES') {
      return false
    } else {
      throw er
    }
  }
}

const isWindows = process.platform === 'win32' ||
    process.env.OSTYPE === 'cygwin' ||
    process.env.OSTYPE === 'msys';

const path$2 = require$$0$2;
const COLON = isWindows ? ';' : ':';
const isexe = isexe_1;

const getNotFoundError = (cmd) =>
  Object.assign(new Error(`not found: ${cmd}`), { code: 'ENOENT' });

const getPathInfo = (cmd, opt) => {
  const colon = opt.colon || COLON;

  // If it has a slash, then we don't bother searching the pathenv.
  // just check the file itself, and that's it.
  const pathEnv = cmd.match(/\//) || isWindows && cmd.match(/\\/) ? ['']
    : (
      [
        // windows always checks the cwd first
        ...(isWindows ? [process.cwd()] : []),
        ...(opt.path || process.env.PATH ||
          /* istanbul ignore next: very unusual */ '').split(colon),
      ]
    );
  const pathExtExe = isWindows
    ? opt.pathExt || process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM'
    : '';
  const pathExt = isWindows ? pathExtExe.split(colon) : [''];

  if (isWindows) {
    if (cmd.indexOf('.') !== -1 && pathExt[0] !== '')
      pathExt.unshift('');
  }

  return {
    pathEnv,
    pathExt,
    pathExtExe,
  }
};

const which$1 = (cmd, opt, cb) => {
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  }
  if (!opt)
    opt = {};

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
  const found = [];

  const step = i => new Promise((resolve, reject) => {
    if (i === pathEnv.length)
      return opt.all && found.length ? resolve(found)
        : reject(getNotFoundError(cmd))

    const ppRaw = pathEnv[i];
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;

    const pCmd = path$2.join(pathPart, cmd);
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd
      : pCmd;

    resolve(subStep(p, i, 0));
  });

  const subStep = (p, i, ii) => new Promise((resolve, reject) => {
    if (ii === pathExt.length)
      return resolve(step(i + 1))
    const ext = pathExt[ii];
    isexe(p + ext, { pathExt: pathExtExe }, (er, is) => {
      if (!er && is) {
        if (opt.all)
          found.push(p + ext);
        else
          return resolve(p + ext)
      }
      return resolve(subStep(p, i, ii + 1))
    });
  });

  return cb ? step(0).then(res => cb(null, res), cb) : step(0)
};

const whichSync = (cmd, opt) => {
  opt = opt || {};

  const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
  const found = [];

  for (let i = 0; i < pathEnv.length; i ++) {
    const ppRaw = pathEnv[i];
    const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;

    const pCmd = path$2.join(pathPart, cmd);
    const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd
      : pCmd;

    for (let j = 0; j < pathExt.length; j ++) {
      const cur = p + pathExt[j];
      try {
        const is = isexe.sync(cur, { pathExt: pathExtExe });
        if (is) {
          if (opt.all)
            found.push(cur);
          else
            return cur
        }
      } catch (ex) {}
    }
  }

  if (opt.all && found.length)
    return found

  if (opt.nothrow)
    return null

  throw getNotFoundError(cmd)
};

var which_1 = which$1;
which$1.sync = whichSync;

var pathKey$1 = {exports: {}};

const pathKey = (options = {}) => {
	const environment = options.env || process.env;
	const platform = options.platform || process.platform;

	if (platform !== 'win32') {
		return 'PATH';
	}

	return Object.keys(environment).reverse().find(key => key.toUpperCase() === 'PATH') || 'Path';
};

pathKey$1.exports = pathKey;
// TODO: Remove this for the next major release
pathKey$1.exports.default = pathKey;

const path$1 = require$$0$2;
const which = which_1;
const getPathKey = pathKey$1.exports;

function resolveCommandAttempt(parsed, withoutPathExt) {
    const env = parsed.options.env || process.env;
    const cwd = process.cwd();
    const hasCustomCwd = parsed.options.cwd != null;
    // Worker threads do not have process.chdir()
    const shouldSwitchCwd = hasCustomCwd && process.chdir !== undefined && !process.chdir.disabled;

    // If a custom `cwd` was specified, we need to change the process cwd
    // because `which` will do stat calls but does not support a custom cwd
    if (shouldSwitchCwd) {
        try {
            process.chdir(parsed.options.cwd);
        } catch (err) {
            /* Empty */
        }
    }

    let resolved;

    try {
        resolved = which.sync(parsed.command, {
            path: env[getPathKey({ env })],
            pathExt: withoutPathExt ? path$1.delimiter : undefined,
        });
    } catch (e) {
        /* Empty */
    } finally {
        if (shouldSwitchCwd) {
            process.chdir(cwd);
        }
    }

    // If we successfully resolved, ensure that an absolute path is returned
    // Note that when a custom `cwd` was used, we need to resolve to an absolute path based on it
    if (resolved) {
        resolved = path$1.resolve(hasCustomCwd ? parsed.options.cwd : '', resolved);
    }

    return resolved;
}

function resolveCommand$1(parsed) {
    return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
}

var resolveCommand_1 = resolveCommand$1;

var _escape = {};

// See http://www.robvanderwoude.com/escapechars.php
const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;

function escapeCommand(arg) {
    // Escape meta chars
    arg = arg.replace(metaCharsRegExp, '^$1');

    return arg;
}

function escapeArgument(arg, doubleEscapeMetaChars) {
    // Convert to string
    arg = `${arg}`;

    // Algorithm below is based on https://qntm.org/cmd

    // Sequence of backslashes followed by a double quote:
    // double up all the backslashes and escape the double quote
    arg = arg.replace(/(\\*)"/g, '$1$1\\"');

    // Sequence of backslashes followed by the end of the string
    // (which will become a double quote later):
    // double up all the backslashes
    arg = arg.replace(/(\\*)$/, '$1$1');

    // All other backslashes occur literally

    // Quote the whole thing:
    arg = `"${arg}"`;

    // Escape meta chars
    arg = arg.replace(metaCharsRegExp, '^$1');

    // Double escape meta chars if necessary
    if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, '^$1');
    }

    return arg;
}

_escape.command = escapeCommand;
_escape.argument = escapeArgument;

var shebangRegex$1 = /^#!(.*)/;

const shebangRegex = shebangRegex$1;

var shebangCommand$1 = (string = '') => {
	const match = string.match(shebangRegex);

	if (!match) {
		return null;
	}

	const [path, argument] = match[0].replace(/#! ?/, '').split(' ');
	const binary = path.split('/').pop();

	if (binary === 'env') {
		return argument;
	}

	return argument ? `${binary} ${argument}` : binary;
};

const fs = require$$0$1;
const shebangCommand = shebangCommand$1;

function readShebang$1(command) {
    // Read the first 150 bytes from the file
    const size = 150;
    const buffer = Buffer.alloc(size);

    let fd;

    try {
        fd = fs.openSync(command, 'r');
        fs.readSync(fd, buffer, 0, size, 0);
        fs.closeSync(fd);
    } catch (e) { /* Empty */ }

    // Attempt to extract shebang (null is returned if not a shebang)
    return shebangCommand(buffer.toString());
}

var readShebang_1 = readShebang$1;

const path = require$$0$2;
const resolveCommand = resolveCommand_1;
const escape = _escape;
const readShebang = readShebang_1;

const isWin$1 = process.platform === 'win32';
const isExecutableRegExp = /\.(?:com|exe)$/i;
const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;

function detectShebang(parsed) {
    parsed.file = resolveCommand(parsed);

    const shebang = parsed.file && readShebang(parsed.file);

    if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;

        return resolveCommand(parsed);
    }

    return parsed.file;
}

function parseNonShell(parsed) {
    if (!isWin$1) {
        return parsed;
    }

    // Detect & add support for shebangs
    const commandFile = detectShebang(parsed);

    // We don't need a shell if the command filename is an executable
    const needsShell = !isExecutableRegExp.test(commandFile);

    // If a shell is required, use cmd.exe and take care of escaping everything correctly
    // Note that `forceShell` is an hidden option used only in tests
    if (parsed.options.forceShell || needsShell) {
        // Need to double escape meta chars if the command is a cmd-shim located in `node_modules/.bin/`
        // The cmd-shim simply calls execute the package bin file with NodeJS, proxying any argument
        // Because the escape of metachars with ^ gets interpreted when the cmd.exe is first called,
        // we need to double escape them
        const needsDoubleEscapeMetaChars = isCmdShimRegExp.test(commandFile);

        // Normalize posix paths into OS compatible paths (e.g.: foo/bar -> foo\bar)
        // This is necessary otherwise it will always fail with ENOENT in those cases
        parsed.command = path.normalize(parsed.command);

        // Escape command & arguments
        parsed.command = escape.command(parsed.command);
        parsed.args = parsed.args.map((arg) => escape.argument(arg, needsDoubleEscapeMetaChars));

        const shellCommand = [parsed.command].concat(parsed.args).join(' ');

        parsed.args = ['/d', '/s', '/c', `"${shellCommand}"`];
        parsed.command = process.env.comspec || 'cmd.exe';
        parsed.options.windowsVerbatimArguments = true; // Tell node's spawn that the arguments are already escaped
    }

    return parsed;
}

function parse$1(command, args, options) {
    // Normalize arguments, similar to nodejs
    if (args && !Array.isArray(args)) {
        options = args;
        args = null;
    }

    args = args ? args.slice(0) : []; // Clone array to avoid changing the original
    options = Object.assign({}, options); // Clone object to avoid changing the original

    // Build our parsed object
    const parsed = {
        command,
        args,
        options,
        file: undefined,
        original: {
            command,
            args,
        },
    };

    // Delegate further parsing to shell or non-shell
    return options.shell ? parsed : parseNonShell(parsed);
}

var parse_1 = parse$1;

const isWin = process.platform === 'win32';

function notFoundError(original, syscall) {
    return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: 'ENOENT',
        errno: 'ENOENT',
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args,
    });
}

function hookChildProcess(cp, parsed) {
    if (!isWin) {
        return;
    }

    const originalEmit = cp.emit;

    cp.emit = function (name, arg1) {
        // If emitting "exit" event and exit code is 1, we need to check if
        // the command exists and emit an "error" instead
        // See https://github.com/IndigoUnited/node-cross-spawn/issues/16
        if (name === 'exit') {
            const err = verifyENOENT(arg1, parsed);

            if (err) {
                return originalEmit.call(cp, 'error', err);
            }
        }

        return originalEmit.apply(cp, arguments); // eslint-disable-line prefer-rest-params
    };
}

function verifyENOENT(status, parsed) {
    if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, 'spawn');
    }

    return null;
}

function verifyENOENTSync(status, parsed) {
    if (isWin && status === 1 && !parsed.file) {
        return notFoundError(parsed.original, 'spawnSync');
    }

    return null;
}

var enoent$1 = {
    hookChildProcess,
    verifyENOENT,
    verifyENOENTSync,
    notFoundError,
};

const cp = require$$0$3;
const parse = parse_1;
const enoent = enoent$1;

function spawn(command, args, options) {
    // Parse the arguments
    const parsed = parse(command, args, options);

    // Spawn the child process
    const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);

    // Hook into child process "exit" event to emit an error if the command
    // does not exists, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
    enoent.hookChildProcess(spawned, parsed);

    return spawned;
}

function spawnSync(command, args, options) {
    // Parse the arguments
    const parsed = parse(command, args, options);

    // Spawn the child process
    const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);

    // Analyze if the command does not exist, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
    result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);

    return result;
}

crossSpawn.exports = spawn;
crossSpawn.exports.spawn = spawn;
crossSpawn.exports.sync = spawnSync;

crossSpawn.exports._parse = parse;
crossSpawn.exports._enoent = enoent;

var ejs = {};

var utils = {};

/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

(function (exports) {

	var regExpChars = /[|\\{}()[\]^$+*?.]/g;
	var hasOwnProperty = Object.prototype.hasOwnProperty;
	var hasOwn = function (obj, key) { return hasOwnProperty.apply(obj, [key]); };

	/**
	 * Escape characters reserved in regular expressions.
	 *
	 * If `string` is `undefined` or `null`, the empty string is returned.
	 *
	 * @param {String} string Input string
	 * @return {String} Escaped string
	 * @static
	 * @private
	 */
	exports.escapeRegExpChars = function (string) {
	  // istanbul ignore if
	  if (!string) {
	    return '';
	  }
	  return String(string).replace(regExpChars, '\\$&');
	};

	var _ENCODE_HTML_RULES = {
	  '&': '&amp;',
	  '<': '&lt;',
	  '>': '&gt;',
	  '"': '&#34;',
	  "'": '&#39;'
	};
	var _MATCH_HTML = /[&<>'"]/g;

	function encode_char(c) {
	  return _ENCODE_HTML_RULES[c] || c;
	}

	/**
	 * Stringified version of constants used by {@link module:utils.escapeXML}.
	 *
	 * It is used in the process of generating {@link ClientFunction}s.
	 *
	 * @readonly
	 * @type {String}
	 */

	var escapeFuncStr =
	  'var _ENCODE_HTML_RULES = {\n'
	+ '      "&": "&amp;"\n'
	+ '    , "<": "&lt;"\n'
	+ '    , ">": "&gt;"\n'
	+ '    , \'"\': "&#34;"\n'
	+ '    , "\'": "&#39;"\n'
	+ '    }\n'
	+ '  , _MATCH_HTML = /[&<>\'"]/g;\n'
	+ 'function encode_char(c) {\n'
	+ '  return _ENCODE_HTML_RULES[c] || c;\n'
	+ '};\n';

	/**
	 * Escape characters reserved in XML.
	 *
	 * If `markup` is `undefined` or `null`, the empty string is returned.
	 *
	 * @implements {EscapeCallback}
	 * @param {String} markup Input string
	 * @return {String} Escaped string
	 * @static
	 * @private
	 */

	exports.escapeXML = function (markup) {
	  return markup == undefined
	    ? ''
	    : String(markup)
	      .replace(_MATCH_HTML, encode_char);
	};

	function escapeXMLToString() {
	  return Function.prototype.toString.call(this) + ';\n' + escapeFuncStr;
	}

	try {
	  if (typeof Object.defineProperty === 'function') {
	  // If the Function prototype is frozen, the "toString" property is non-writable. This means that any objects which inherit this property
	  // cannot have the property changed using an assignment. If using strict mode, attempting that will cause an error. If not using strict
	  // mode, attempting that will be silently ignored.
	  // However, we can still explicitly shadow the prototype's "toString" property by defining a new "toString" property on this object.
	    Object.defineProperty(exports.escapeXML, 'toString', { value: escapeXMLToString });
	  } else {
	    // If Object.defineProperty() doesn't exist, attempt to shadow this property using the assignment operator.
	    exports.escapeXML.toString = escapeXMLToString;
	  }
	} catch (err) {
	  console.warn('Unable to set escapeXML.toString (is the Function prototype frozen?)');
	}

	/**
	 * Naive copy of properties from one object to another.
	 * Does not recurse into non-scalar properties
	 * Does not check to see if the property has a value before copying
	 *
	 * @param  {Object} to   Destination object
	 * @param  {Object} from Source object
	 * @return {Object}      Destination object
	 * @static
	 * @private
	 */
	exports.shallowCopy = function (to, from) {
	  from = from || {};
	  if ((to !== null) && (to !== undefined)) {
	    for (var p in from) {
	      if (!hasOwn(from, p)) {
	        continue;
	      }
	      if (p === '__proto__' || p === 'constructor') {
	        continue;
	      }
	      to[p] = from[p];
	    }
	  }
	  return to;
	};

	/**
	 * Naive copy of a list of key names, from one object to another.
	 * Only copies property if it is actually defined
	 * Does not recurse into non-scalar properties
	 *
	 * @param  {Object} to   Destination object
	 * @param  {Object} from Source object
	 * @param  {Array} list List of properties to copy
	 * @return {Object}      Destination object
	 * @static
	 * @private
	 */
	exports.shallowCopyFromList = function (to, from, list) {
	  list = list || [];
	  from = from || {};
	  if ((to !== null) && (to !== undefined)) {
	    for (var i = 0; i < list.length; i++) {
	      var p = list[i];
	      if (typeof from[p] != 'undefined') {
	        if (!hasOwn(from, p)) {
	          continue;
	        }
	        if (p === '__proto__' || p === 'constructor') {
	          continue;
	        }
	        to[p] = from[p];
	      }
	    }
	  }
	  return to;
	};

	/**
	 * Simple in-process cache implementation. Does not implement limits of any
	 * sort.
	 *
	 * @implements {Cache}
	 * @static
	 * @private
	 */
	exports.cache = {
	  _data: {},
	  set: function (key, val) {
	    this._data[key] = val;
	  },
	  get: function (key) {
	    return this._data[key];
	  },
	  remove: function (key) {
	    delete this._data[key];
	  },
	  reset: function () {
	    this._data = {};
	  }
	};

	/**
	 * Transforms hyphen case variable into camel case.
	 *
	 * @param {String} string Hyphen case string
	 * @return {String} Camel case string
	 * @static
	 * @private
	 */
	exports.hyphenToCamel = function (str) {
	  return str.replace(/-[a-z]/g, function (match) { return match[1].toUpperCase(); });
	};

	/**
	 * Returns a null-prototype object in runtimes that support it
	 *
	 * @return {Object} Object, prototype will be set to null where possible
	 * @static
	 * @private
	 */
	exports.createNullProtoObjWherePossible = (function () {
	  if (typeof Object.create == 'function') {
	    return function () {
	      return Object.create(null);
	    };
	  }
	  if (!({__proto__: null} instanceof Object)) {
	    return function () {
	      return {__proto__: null};
	    };
	  }
	  // Not possible, just pass through
	  return function () {
	    return {};
	  };
	})();
} (utils));

const name = "ejs";
const description = "Embedded JavaScript templates";
const keywords = [
	"template",
	"engine",
	"ejs"
];
const version = "3.1.9";
const author = "Matthew Eernisse <mde@fleegix.org> (http://fleegix.org)";
const license = "Apache-2.0";
const bin = {
	ejs: "./bin/cli.js"
};
const main = "./lib/ejs.js";
const jsdelivr = "ejs.min.js";
const unpkg = "ejs.min.js";
const repository = {
	type: "git",
	url: "git://github.com/mde/ejs.git"
};
const bugs = "https://github.com/mde/ejs/issues";
const homepage = "https://github.com/mde/ejs";
const dependencies = {
	jake: "^10.8.5"
};
const devDependencies = {
	browserify: "^16.5.1",
	eslint: "^6.8.0",
	"git-directory-deploy": "^1.5.1",
	jsdoc: "^4.0.2",
	"lru-cache": "^4.0.1",
	mocha: "^10.2.0",
	"uglify-js": "^3.3.16"
};
const engines = {
	node: ">=0.10.0"
};
const scripts = {
	test: "mocha -u tdd"
};
const _package = {
	name: name,
	description: description,
	keywords: keywords,
	version: version,
	author: author,
	license: license,
	bin: bin,
	main: main,
	jsdelivr: jsdelivr,
	unpkg: unpkg,
	repository: repository,
	bugs: bugs,
	homepage: homepage,
	dependencies: dependencies,
	devDependencies: devDependencies,
	engines: engines,
	scripts: scripts
};

const _package$1 = {
	__proto__: null,
	name: name,
	description: description,
	keywords: keywords,
	version: version,
	author: author,
	license: license,
	bin: bin,
	main: main,
	jsdelivr: jsdelivr,
	unpkg: unpkg,
	repository: repository,
	bugs: bugs,
	homepage: homepage,
	dependencies: dependencies,
	devDependencies: devDependencies,
	engines: engines,
	scripts: scripts,
	'default': _package
};

const require$$3 = /*@__PURE__*/getAugmentedNamespace(_package$1);

/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

(function (exports) {

	/**
	 * @file Embedded JavaScript templating engine. {@link http://ejs.co}
	 * @author Matthew Eernisse <mde@fleegix.org>
	 * @author Tiancheng "Timothy" Gu <timothygu99@gmail.com>
	 * @project EJS
	 * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
	 */

	/**
	 * EJS internal functions.
	 *
	 * Technically this "module" lies in the same file as {@link module:ejs}, for
	 * the sake of organization all the private functions re grouped into this
	 * module.
	 *
	 * @module ejs-internal
	 * @private
	 */

	/**
	 * Embedded JavaScript templating engine.
	 *
	 * @module ejs
	 * @public
	 */


	var fs = require$$0$1;
	var path = require$$0$2;
	var utils$1 = utils;

	var scopeOptionWarned = false;
	/** @type {string} */
	var _VERSION_STRING = require$$3.version;
	var _DEFAULT_OPEN_DELIMITER = '<';
	var _DEFAULT_CLOSE_DELIMITER = '>';
	var _DEFAULT_DELIMITER = '%';
	var _DEFAULT_LOCALS_NAME = 'locals';
	var _NAME = 'ejs';
	var _REGEX_STRING = '(<%%|%%>|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)';
	var _OPTS_PASSABLE_WITH_DATA = ['delimiter', 'scope', 'context', 'debug', 'compileDebug',
	  'client', '_with', 'rmWhitespace', 'strict', 'filename', 'async'];
	// We don't allow 'cache' option to be passed in the data obj for
	// the normal `render` call, but this is where Express 2 & 3 put it
	// so we make an exception for `renderFile`
	var _OPTS_PASSABLE_WITH_DATA_EXPRESS = _OPTS_PASSABLE_WITH_DATA.concat('cache');
	var _BOM = /^\uFEFF/;
	var _JS_IDENTIFIER = /^[a-zA-Z_$][0-9a-zA-Z_$]*$/;

	/**
	 * EJS template function cache. This can be a LRU object from lru-cache NPM
	 * module. By default, it is {@link module:utils.cache}, a simple in-process
	 * cache that grows continuously.
	 *
	 * @type {Cache}
	 */

	exports.cache = utils$1.cache;

	/**
	 * Custom file loader. Useful for template preprocessing or restricting access
	 * to a certain part of the filesystem.
	 *
	 * @type {fileLoader}
	 */

	exports.fileLoader = fs.readFileSync;

	/**
	 * Name of the object containing the locals.
	 *
	 * This variable is overridden by {@link Options}`.localsName` if it is not
	 * `undefined`.
	 *
	 * @type {String}
	 * @public
	 */

	exports.localsName = _DEFAULT_LOCALS_NAME;

	/**
	 * Promise implementation -- defaults to the native implementation if available
	 * This is mostly just for testability
	 *
	 * @type {PromiseConstructorLike}
	 * @public
	 */

	exports.promiseImpl = (new Function('return this;'))().Promise;

	/**
	 * Get the path to the included file from the parent file path and the
	 * specified path.
	 *
	 * @param {String}  name     specified path
	 * @param {String}  filename parent file path
	 * @param {Boolean} [isDir=false] whether the parent file path is a directory
	 * @return {String}
	 */
	exports.resolveInclude = function(name, filename, isDir) {
	  var dirname = path.dirname;
	  var extname = path.extname;
	  var resolve = path.resolve;
	  var includePath = resolve(isDir ? filename : dirname(filename), name);
	  var ext = extname(name);
	  if (!ext) {
	    includePath += '.ejs';
	  }
	  return includePath;
	};

	/**
	 * Try to resolve file path on multiple directories
	 *
	 * @param  {String}        name  specified path
	 * @param  {Array<String>} paths list of possible parent directory paths
	 * @return {String}
	 */
	function resolvePaths(name, paths) {
	  var filePath;
	  if (paths.some(function (v) {
	    filePath = exports.resolveInclude(name, v, true);
	    return fs.existsSync(filePath);
	  })) {
	    return filePath;
	  }
	}

	/**
	 * Get the path to the included file by Options
	 *
	 * @param  {String}  path    specified path
	 * @param  {Options} options compilation options
	 * @return {String}
	 */
	function getIncludePath(path, options) {
	  var includePath;
	  var filePath;
	  var views = options.views;
	  var match = /^[A-Za-z]+:\\|^\//.exec(path);

	  // Abs path
	  if (match && match.length) {
	    path = path.replace(/^\/*/, '');
	    if (Array.isArray(options.root)) {
	      includePath = resolvePaths(path, options.root);
	    } else {
	      includePath = exports.resolveInclude(path, options.root || '/', true);
	    }
	  }
	  // Relative paths
	  else {
	    // Look relative to a passed filename first
	    if (options.filename) {
	      filePath = exports.resolveInclude(path, options.filename);
	      if (fs.existsSync(filePath)) {
	        includePath = filePath;
	      }
	    }
	    // Then look in any views directories
	    if (!includePath && Array.isArray(views)) {
	      includePath = resolvePaths(path, views);
	    }
	    if (!includePath && typeof options.includer !== 'function') {
	      throw new Error('Could not find the include file "' +
	          options.escapeFunction(path) + '"');
	    }
	  }
	  return includePath;
	}

	/**
	 * Get the template from a string or a file, either compiled on-the-fly or
	 * read from cache (if enabled), and cache the template if needed.
	 *
	 * If `template` is not set, the file specified in `options.filename` will be
	 * read.
	 *
	 * If `options.cache` is true, this function reads the file from
	 * `options.filename` so it must be set prior to calling this function.
	 *
	 * @memberof module:ejs-internal
	 * @param {Options} options   compilation options
	 * @param {String} [template] template source
	 * @return {(TemplateFunction|ClientFunction)}
	 * Depending on the value of `options.client`, either type might be returned.
	 * @static
	 */

	function handleCache(options, template) {
	  var func;
	  var filename = options.filename;
	  var hasTemplate = arguments.length > 1;

	  if (options.cache) {
	    if (!filename) {
	      throw new Error('cache option requires a filename');
	    }
	    func = exports.cache.get(filename);
	    if (func) {
	      return func;
	    }
	    if (!hasTemplate) {
	      template = fileLoader(filename).toString().replace(_BOM, '');
	    }
	  }
	  else if (!hasTemplate) {
	    // istanbul ignore if: should not happen at all
	    if (!filename) {
	      throw new Error('Internal EJS error: no file name or template '
	                    + 'provided');
	    }
	    template = fileLoader(filename).toString().replace(_BOM, '');
	  }
	  func = exports.compile(template, options);
	  if (options.cache) {
	    exports.cache.set(filename, func);
	  }
	  return func;
	}

	/**
	 * Try calling handleCache with the given options and data and call the
	 * callback with the result. If an error occurs, call the callback with
	 * the error. Used by renderFile().
	 *
	 * @memberof module:ejs-internal
	 * @param {Options} options    compilation options
	 * @param {Object} data        template data
	 * @param {RenderFileCallback} cb callback
	 * @static
	 */

	function tryHandleCache(options, data, cb) {
	  var result;
	  if (!cb) {
	    if (typeof exports.promiseImpl == 'function') {
	      return new exports.promiseImpl(function (resolve, reject) {
	        try {
	          result = handleCache(options)(data);
	          resolve(result);
	        }
	        catch (err) {
	          reject(err);
	        }
	      });
	    }
	    else {
	      throw new Error('Please provide a callback function');
	    }
	  }
	  else {
	    try {
	      result = handleCache(options)(data);
	    }
	    catch (err) {
	      return cb(err);
	    }

	    cb(null, result);
	  }
	}

	/**
	 * fileLoader is independent
	 *
	 * @param {String} filePath ejs file path.
	 * @return {String} The contents of the specified file.
	 * @static
	 */

	function fileLoader(filePath){
	  return exports.fileLoader(filePath);
	}

	/**
	 * Get the template function.
	 *
	 * If `options.cache` is `true`, then the template is cached.
	 *
	 * @memberof module:ejs-internal
	 * @param {String}  path    path for the specified file
	 * @param {Options} options compilation options
	 * @return {(TemplateFunction|ClientFunction)}
	 * Depending on the value of `options.client`, either type might be returned
	 * @static
	 */

	function includeFile(path, options) {
	  var opts = utils$1.shallowCopy(utils$1.createNullProtoObjWherePossible(), options);
	  opts.filename = getIncludePath(path, opts);
	  if (typeof options.includer === 'function') {
	    var includerResult = options.includer(path, opts.filename);
	    if (includerResult) {
	      if (includerResult.filename) {
	        opts.filename = includerResult.filename;
	      }
	      if (includerResult.template) {
	        return handleCache(opts, includerResult.template);
	      }
	    }
	  }
	  return handleCache(opts);
	}

	/**
	 * Re-throw the given `err` in context to the `str` of ejs, `filename`, and
	 * `lineno`.
	 *
	 * @implements {RethrowCallback}
	 * @memberof module:ejs-internal
	 * @param {Error}  err      Error object
	 * @param {String} str      EJS source
	 * @param {String} flnm     file name of the EJS file
	 * @param {Number} lineno   line number of the error
	 * @param {EscapeCallback} esc
	 * @static
	 */

	function rethrow(err, str, flnm, lineno, esc) {
	  var lines = str.split('\n');
	  var start = Math.max(lineno - 3, 0);
	  var end = Math.min(lines.length, lineno + 3);
	  var filename = esc(flnm);
	  // Error context
	  var context = lines.slice(start, end).map(function (line, i){
	    var curr = i + start + 1;
	    return (curr == lineno ? ' >> ' : '    ')
	      + curr
	      + '| '
	      + line;
	  }).join('\n');

	  // Alter exception message
	  err.path = filename;
	  err.message = (filename || 'ejs') + ':'
	    + lineno + '\n'
	    + context + '\n\n'
	    + err.message;

	  throw err;
	}

	function stripSemi(str){
	  return str.replace(/;(\s*$)/, '$1');
	}

	/**
	 * Compile the given `str` of ejs into a template function.
	 *
	 * @param {String}  template EJS template
	 *
	 * @param {Options} [opts] compilation options
	 *
	 * @return {(TemplateFunction|ClientFunction)}
	 * Depending on the value of `opts.client`, either type might be returned.
	 * Note that the return type of the function also depends on the value of `opts.async`.
	 * @public
	 */

	exports.compile = function compile(template, opts) {
	  var templ;

	  // v1 compat
	  // 'scope' is 'context'
	  // FIXME: Remove this in a future version
	  if (opts && opts.scope) {
	    if (!scopeOptionWarned){
	      console.warn('`scope` option is deprecated and will be removed in EJS 3');
	      scopeOptionWarned = true;
	    }
	    if (!opts.context) {
	      opts.context = opts.scope;
	    }
	    delete opts.scope;
	  }
	  templ = new Template(template, opts);
	  return templ.compile();
	};

	/**
	 * Render the given `template` of ejs.
	 *
	 * If you would like to include options but not data, you need to explicitly
	 * call this function with `data` being an empty object or `null`.
	 *
	 * @param {String}   template EJS template
	 * @param {Object}  [data={}] template data
	 * @param {Options} [opts={}] compilation and rendering options
	 * @return {(String|Promise<String>)}
	 * Return value type depends on `opts.async`.
	 * @public
	 */

	exports.render = function (template, d, o) {
	  var data = d || utils$1.createNullProtoObjWherePossible();
	  var opts = o || utils$1.createNullProtoObjWherePossible();

	  // No options object -- if there are optiony names
	  // in the data, copy them to options
	  if (arguments.length == 2) {
	    utils$1.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA);
	  }

	  return handleCache(opts, template)(data);
	};

	/**
	 * Render an EJS file at the given `path` and callback `cb(err, str)`.
	 *
	 * If you would like to include options but not data, you need to explicitly
	 * call this function with `data` being an empty object or `null`.
	 *
	 * @param {String}             path     path to the EJS file
	 * @param {Object}            [data={}] template data
	 * @param {Options}           [opts={}] compilation and rendering options
	 * @param {RenderFileCallback} cb callback
	 * @public
	 */

	exports.renderFile = function () {
	  var args = Array.prototype.slice.call(arguments);
	  var filename = args.shift();
	  var cb;
	  var opts = {filename: filename};
	  var data;
	  var viewOpts;

	  // Do we have a callback?
	  if (typeof arguments[arguments.length - 1] == 'function') {
	    cb = args.pop();
	  }
	  // Do we have data/opts?
	  if (args.length) {
	    // Should always have data obj
	    data = args.shift();
	    // Normal passed opts (data obj + opts obj)
	    if (args.length) {
	      // Use shallowCopy so we don't pollute passed in opts obj with new vals
	      utils$1.shallowCopy(opts, args.pop());
	    }
	    // Special casing for Express (settings + opts-in-data)
	    else {
	      // Express 3 and 4
	      if (data.settings) {
	        // Pull a few things from known locations
	        if (data.settings.views) {
	          opts.views = data.settings.views;
	        }
	        if (data.settings['view cache']) {
	          opts.cache = true;
	        }
	        // Undocumented after Express 2, but still usable, esp. for
	        // items that are unsafe to be passed along with data, like `root`
	        viewOpts = data.settings['view options'];
	        if (viewOpts) {
	          utils$1.shallowCopy(opts, viewOpts);
	        }
	      }
	      // Express 2 and lower, values set in app.locals, or people who just
	      // want to pass options in their data. NOTE: These values will override
	      // anything previously set in settings  or settings['view options']
	      utils$1.shallowCopyFromList(opts, data, _OPTS_PASSABLE_WITH_DATA_EXPRESS);
	    }
	    opts.filename = filename;
	  }
	  else {
	    data = utils$1.createNullProtoObjWherePossible();
	  }

	  return tryHandleCache(opts, data, cb);
	};

	/**
	 * Clear intermediate JavaScript cache. Calls {@link Cache#reset}.
	 * @public
	 */

	/**
	 * EJS template class
	 * @public
	 */
	exports.Template = Template;

	exports.clearCache = function () {
	  exports.cache.reset();
	};

	function Template(text, opts) {
	  opts = opts || utils$1.createNullProtoObjWherePossible();
	  var options = utils$1.createNullProtoObjWherePossible();
	  this.templateText = text;
	  /** @type {string | null} */
	  this.mode = null;
	  this.truncate = false;
	  this.currentLine = 1;
	  this.source = '';
	  options.client = opts.client || false;
	  options.escapeFunction = opts.escape || opts.escapeFunction || utils$1.escapeXML;
	  options.compileDebug = opts.compileDebug !== false;
	  options.debug = !!opts.debug;
	  options.filename = opts.filename;
	  options.openDelimiter = opts.openDelimiter || exports.openDelimiter || _DEFAULT_OPEN_DELIMITER;
	  options.closeDelimiter = opts.closeDelimiter || exports.closeDelimiter || _DEFAULT_CLOSE_DELIMITER;
	  options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
	  options.strict = opts.strict || false;
	  options.context = opts.context;
	  options.cache = opts.cache || false;
	  options.rmWhitespace = opts.rmWhitespace;
	  options.root = opts.root;
	  options.includer = opts.includer;
	  options.outputFunctionName = opts.outputFunctionName;
	  options.localsName = opts.localsName || exports.localsName || _DEFAULT_LOCALS_NAME;
	  options.views = opts.views;
	  options.async = opts.async;
	  options.destructuredLocals = opts.destructuredLocals;
	  options.legacyInclude = typeof opts.legacyInclude != 'undefined' ? !!opts.legacyInclude : true;

	  if (options.strict) {
	    options._with = false;
	  }
	  else {
	    options._with = typeof opts._with != 'undefined' ? opts._with : true;
	  }

	  this.opts = options;

	  this.regex = this.createRegex();
	}

	Template.modes = {
	  EVAL: 'eval',
	  ESCAPED: 'escaped',
	  RAW: 'raw',
	  COMMENT: 'comment',
	  LITERAL: 'literal'
	};

	Template.prototype = {
	  createRegex: function () {
	    var str = _REGEX_STRING;
	    var delim = utils$1.escapeRegExpChars(this.opts.delimiter);
	    var open = utils$1.escapeRegExpChars(this.opts.openDelimiter);
	    var close = utils$1.escapeRegExpChars(this.opts.closeDelimiter);
	    str = str.replace(/%/g, delim)
	      .replace(/</g, open)
	      .replace(/>/g, close);
	    return new RegExp(str);
	  },

	  compile: function () {
	    /** @type {string} */
	    var src;
	    /** @type {ClientFunction} */
	    var fn;
	    var opts = this.opts;
	    var prepended = '';
	    var appended = '';
	    /** @type {EscapeCallback} */
	    var escapeFn = opts.escapeFunction;
	    /** @type {FunctionConstructor} */
	    var ctor;
	    /** @type {string} */
	    var sanitizedFilename = opts.filename ? JSON.stringify(opts.filename) : 'undefined';

	    if (!this.source) {
	      this.generateSource();
	      prepended +=
	        '  var __output = "";\n' +
	        '  function __append(s) { if (s !== undefined && s !== null) __output += s }\n';
	      if (opts.outputFunctionName) {
	        if (!_JS_IDENTIFIER.test(opts.outputFunctionName)) {
	          throw new Error('outputFunctionName is not a valid JS identifier.');
	        }
	        prepended += '  var ' + opts.outputFunctionName + ' = __append;' + '\n';
	      }
	      if (opts.localsName && !_JS_IDENTIFIER.test(opts.localsName)) {
	        throw new Error('localsName is not a valid JS identifier.');
	      }
	      if (opts.destructuredLocals && opts.destructuredLocals.length) {
	        var destructuring = '  var __locals = (' + opts.localsName + ' || {}),\n';
	        for (var i = 0; i < opts.destructuredLocals.length; i++) {
	          var name = opts.destructuredLocals[i];
	          if (!_JS_IDENTIFIER.test(name)) {
	            throw new Error('destructuredLocals[' + i + '] is not a valid JS identifier.');
	          }
	          if (i > 0) {
	            destructuring += ',\n  ';
	          }
	          destructuring += name + ' = __locals.' + name;
	        }
	        prepended += destructuring + ';\n';
	      }
	      if (opts._with !== false) {
	        prepended +=  '  with (' + opts.localsName + ' || {}) {' + '\n';
	        appended += '  }' + '\n';
	      }
	      appended += '  return __output;' + '\n';
	      this.source = prepended + this.source + appended;
	    }

	    if (opts.compileDebug) {
	      src = 'var __line = 1' + '\n'
	        + '  , __lines = ' + JSON.stringify(this.templateText) + '\n'
	        + '  , __filename = ' + sanitizedFilename + ';' + '\n'
	        + 'try {' + '\n'
	        + this.source
	        + '} catch (e) {' + '\n'
	        + '  rethrow(e, __lines, __filename, __line, escapeFn);' + '\n'
	        + '}' + '\n';
	    }
	    else {
	      src = this.source;
	    }

	    if (opts.client) {
	      src = 'escapeFn = escapeFn || ' + escapeFn.toString() + ';' + '\n' + src;
	      if (opts.compileDebug) {
	        src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
	      }
	    }

	    if (opts.strict) {
	      src = '"use strict";\n' + src;
	    }
	    if (opts.debug) {
	      console.log(src);
	    }
	    if (opts.compileDebug && opts.filename) {
	      src = src + '\n'
	        + '//# sourceURL=' + sanitizedFilename + '\n';
	    }

	    try {
	      if (opts.async) {
	        // Have to use generated function for this, since in envs without support,
	        // it breaks in parsing
	        try {
	          ctor = (new Function('return (async function(){}).constructor;'))();
	        }
	        catch(e) {
	          if (e instanceof SyntaxError) {
	            throw new Error('This environment does not support async/await');
	          }
	          else {
	            throw e;
	          }
	        }
	      }
	      else {
	        ctor = Function;
	      }
	      fn = new ctor(opts.localsName + ', escapeFn, include, rethrow', src);
	    }
	    catch(e) {
	      // istanbul ignore else
	      if (e instanceof SyntaxError) {
	        if (opts.filename) {
	          e.message += ' in ' + opts.filename;
	        }
	        e.message += ' while compiling ejs\n\n';
	        e.message += 'If the above error is not helpful, you may want to try EJS-Lint:\n';
	        e.message += 'https://github.com/RyanZim/EJS-Lint';
	        if (!opts.async) {
	          e.message += '\n';
	          e.message += 'Or, if you meant to create an async function, pass `async: true` as an option.';
	        }
	      }
	      throw e;
	    }

	    // Return a callable function which will execute the function
	    // created by the source-code, with the passed data as locals
	    // Adds a local `include` function which allows full recursive include
	    var returnedFn = opts.client ? fn : function anonymous(data) {
	      var include = function (path, includeData) {
	        var d = utils$1.shallowCopy(utils$1.createNullProtoObjWherePossible(), data);
	        if (includeData) {
	          d = utils$1.shallowCopy(d, includeData);
	        }
	        return includeFile(path, opts)(d);
	      };
	      return fn.apply(opts.context,
	        [data || utils$1.createNullProtoObjWherePossible(), escapeFn, include, rethrow]);
	    };
	    if (opts.filename && typeof Object.defineProperty === 'function') {
	      var filename = opts.filename;
	      var basename = path.basename(filename, path.extname(filename));
	      try {
	        Object.defineProperty(returnedFn, 'name', {
	          value: basename,
	          writable: false,
	          enumerable: false,
	          configurable: true
	        });
	      } catch (e) {/* ignore */}
	    }
	    return returnedFn;
	  },

	  generateSource: function () {
	    var opts = this.opts;

	    if (opts.rmWhitespace) {
	      // Have to use two separate replace here as `^` and `$` operators don't
	      // work well with `\r` and empty lines don't work well with the `m` flag.
	      this.templateText =
	        this.templateText.replace(/[\r\n]+/g, '\n').replace(/^\s+|\s+$/gm, '');
	    }

	    // Slurp spaces and tabs before <%_ and after _%>
	    this.templateText =
	      this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');

	    var self = this;
	    var matches = this.parseTemplateText();
	    var d = this.opts.delimiter;
	    var o = this.opts.openDelimiter;
	    var c = this.opts.closeDelimiter;

	    if (matches && matches.length) {
	      matches.forEach(function (line, index) {
	        var closing;
	        // If this is an opening tag, check for closing tags
	        // FIXME: May end up with some false positives here
	        // Better to store modes as k/v with openDelimiter + delimiter as key
	        // Then this can simply check against the map
	        if ( line.indexOf(o + d) === 0        // If it is a tag
	          && line.indexOf(o + d + d) !== 0) { // and is not escaped
	          closing = matches[index + 2];
	          if (!(closing == d + c || closing == '-' + d + c || closing == '_' + d + c)) {
	            throw new Error('Could not find matching close tag for "' + line + '".');
	          }
	        }
	        self.scanLine(line);
	      });
	    }

	  },

	  parseTemplateText: function () {
	    var str = this.templateText;
	    var pat = this.regex;
	    var result = pat.exec(str);
	    var arr = [];
	    var firstPos;

	    while (result) {
	      firstPos = result.index;

	      if (firstPos !== 0) {
	        arr.push(str.substring(0, firstPos));
	        str = str.slice(firstPos);
	      }

	      arr.push(result[0]);
	      str = str.slice(result[0].length);
	      result = pat.exec(str);
	    }

	    if (str) {
	      arr.push(str);
	    }

	    return arr;
	  },

	  _addOutput: function (line) {
	    if (this.truncate) {
	      // Only replace single leading linebreak in the line after
	      // -%> tag -- this is the single, trailing linebreak
	      // after the tag that the truncation mode replaces
	      // Handle Win / Unix / old Mac linebreaks -- do the \r\n
	      // combo first in the regex-or
	      line = line.replace(/^(?:\r\n|\r|\n)/, '');
	      this.truncate = false;
	    }
	    if (!line) {
	      return line;
	    }

	    // Preserve literal slashes
	    line = line.replace(/\\/g, '\\\\');

	    // Convert linebreaks
	    line = line.replace(/\n/g, '\\n');
	    line = line.replace(/\r/g, '\\r');

	    // Escape double-quotes
	    // - this will be the delimiter during execution
	    line = line.replace(/"/g, '\\"');
	    this.source += '    ; __append("' + line + '")' + '\n';
	  },

	  scanLine: function (line) {
	    var self = this;
	    var d = this.opts.delimiter;
	    var o = this.opts.openDelimiter;
	    var c = this.opts.closeDelimiter;
	    var newLineCount = 0;

	    newLineCount = (line.split('\n').length - 1);

	    switch (line) {
	    case o + d:
	    case o + d + '_':
	      this.mode = Template.modes.EVAL;
	      break;
	    case o + d + '=':
	      this.mode = Template.modes.ESCAPED;
	      break;
	    case o + d + '-':
	      this.mode = Template.modes.RAW;
	      break;
	    case o + d + '#':
	      this.mode = Template.modes.COMMENT;
	      break;
	    case o + d + d:
	      this.mode = Template.modes.LITERAL;
	      this.source += '    ; __append("' + line.replace(o + d + d, o + d) + '")' + '\n';
	      break;
	    case d + d + c:
	      this.mode = Template.modes.LITERAL;
	      this.source += '    ; __append("' + line.replace(d + d + c, d + c) + '")' + '\n';
	      break;
	    case d + c:
	    case '-' + d + c:
	    case '_' + d + c:
	      if (this.mode == Template.modes.LITERAL) {
	        this._addOutput(line);
	      }

	      this.mode = null;
	      this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
	      break;
	    default:
	      // In script mode, depends on type of tag
	      if (this.mode) {
	        // If '//' is found without a line break, add a line break.
	        switch (this.mode) {
	        case Template.modes.EVAL:
	        case Template.modes.ESCAPED:
	        case Template.modes.RAW:
	          if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
	            line += '\n';
	          }
	        }
	        switch (this.mode) {
	        // Just executing code
	        case Template.modes.EVAL:
	          this.source += '    ; ' + line + '\n';
	          break;
	          // Exec, esc, and output
	        case Template.modes.ESCAPED:
	          this.source += '    ; __append(escapeFn(' + stripSemi(line) + '))' + '\n';
	          break;
	          // Exec and output
	        case Template.modes.RAW:
	          this.source += '    ; __append(' + stripSemi(line) + ')' + '\n';
	          break;
	        case Template.modes.COMMENT:
	          // Do nothing
	          break;
	          // Literal <%% mode, append as raw output
	        case Template.modes.LITERAL:
	          this._addOutput(line);
	          break;
	        }
	      }
	      // In string mode, just add the output
	      else {
	        this._addOutput(line);
	      }
	    }

	    if (self.opts.compileDebug && newLineCount) {
	      this.currentLine += newLineCount;
	      this.source += '    ; __line = ' + this.currentLine + '\n';
	    }
	  }
	};

	/**
	 * Escape characters reserved in XML.
	 *
	 * This is simply an export of {@link module:utils.escapeXML}.
	 *
	 * If `markup` is `undefined` or `null`, the empty string is returned.
	 *
	 * @param {String} markup Input string
	 * @return {String} Escaped string
	 * @public
	 * @func
	 * */
	exports.escapeXML = utils$1.escapeXML;

	/**
	 * Express.js support.
	 *
	 * This is an alias for {@link module:ejs.renderFile}, in order to support
	 * Express.js out-of-the-box.
	 *
	 * @func
	 */

	exports.__express = exports.renderFile;

	/**
	 * Version of EJS.
	 *
	 * @readonly
	 * @type {String}
	 * @public
	 */

	exports.VERSION = _VERSION_STRING;

	/**
	 * Name for detection of EJS.
	 *
	 * @readonly
	 * @type {String}
	 * @public
	 */

	exports.name = _NAME;

	/* istanbul ignore if */
	if (typeof window != 'undefined') {
	  window.ejs = exports;
	}
} (ejs));

const vue = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ["eslint:recommended", "plugin:vue/vue3-essential"],
  overrides: [],
  parserOptions: {
    ecmaVersion: 6,
    sourceType: "module"
  },
  plugins: ["vue"],
  rules: {}
};
const vue_ts = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ["plugin:vue/vue3-essential", "standard-with-typescript"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json"]
  },
  plugins: ["vue"],
  rules: {}
};
const react = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ["plugin:react/recommended", "standard"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module"
  },
  plugins: ["react"],
  rules: {}
};
const react_ts = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: ["plugin:react/recommended", "standard-with-typescript"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    project: ["./tsconfig.json"]
  },
  plugins: ["react"],
  rules: {}
};
const lintFilesArr = {
  vue: ["./src/**/*.js", "./src/*.js", "./src/**/*.vue"],
  vue_ts: ["./src/**/*.ts", "./src/*.ts", "./src/**/*.vue"],
  react: ["./src/**/*.jsx", "./src/*.jsx", "./src/**/*.ts", "./src/*.ts"],
  react_ts: ["./src/**/*.tsx", "./src/*.tsx", "./src/**/*.ts", "./src/*.ts"]
};

const cwd = process.cwd();
const configRoot = path$3.join(cwd, "sp.config.json");
const __dirname = path$3.dirname(fileURLToPath(import.meta.url));
async function ejsCompile(templatePath, data = {}, options = {}) {
  return new Promise((resolve, reject) => {
    ejs.renderFile(templatePath, { data }, options, (err, str) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(str);
    });
  });
}
const mkdirSync = (dirname) => {
  if (fs$1.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirSync(path$3.dirname(dirname))) {
      fs$1.mkdirSync(dirname);
      return true;
    }
  }
};
const writeFile = (path2, content) => {
  if (fs$1.existsSync(path2)) {
    console.log("the file already exists~");
    return;
  }
  return fs$1.promises.writeFile(path2, content);
};
async function handleEjsToFile(name, dest, template, filename) {
  console.log(name, dest, template, filename);
  const templatePath = path$3.resolve(__dirname, template);
  const cpnPath = dest + `/${filename}`;
  const result = await ejsCompile(templatePath, {
    name,
    lowerName: name.toLowerCase(),
    cpnPath
  });
  mkdirSync(dest);
  const targetPath = path$3.resolve(dest, filename);
  writeFile(targetPath, result);
}
async function renderComponent(name, dest, frame) {
  const renderFrame = "../tep-ejs/component_" + frame + ".ejs";
  const suffix = frame.includes("vue") ? "vue" : frame.includes("ts") ? "ts" : "js";
  const renderCpnName = `${name}.${suffix}`;
  handleEjsToFile(name, dest, renderFrame, renderCpnName);
}
function formatTargetDir(targetDir) {
  return targetDir?.trim().replace(/\/+$/g, "");
}
function isEmpty(path2) {
  const files = fs$1.readdirSync(path2);
  return files.length === 0 || files.length === 1 && files[0] === ".git";
}
function isValidPackageName(projectName) {
  return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(
    projectName
  );
}
function toValidPackageName(projectName) {
  return projectName.trim().toLowerCase().replace(/\s+/g, "-").replace(/^[._]/, "").replace(/[^a-z0-9-~]+/g, "-");
}
function emptyDir(dir) {
  if (!fs$1.existsSync(dir)) {
    return;
  }
  for (const file of fs$1.readdirSync(dir)) {
    if (file === ".git") {
      continue;
    }
    fs$1.rmSync(path$3.resolve(dir, file), { recursive: true, force: true });
  }
}
function pkgFromUserAgent(userAgent) {
  if (!userAgent)
    return void 0;
  const pkgSpec = userAgent.split(" ")[0];
  const pkgSpecArr = pkgSpec.split("/");
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1]
  };
}
function copy(src, dest) {
  const stat = fs$1.statSync(src);
  if (stat.isDirectory()) {
    copyDir(src, dest);
  } else {
    fs$1.copyFileSync(src, dest);
  }
}
function copyDir(srcDir, destDir) {
  fs$1.mkdirSync(destDir, { recursive: true });
  for (const file of fs$1.readdirSync(srcDir)) {
    const srcFile = path$3.resolve(srcDir, file);
    const destFile = path$3.resolve(destDir, file);
    copy(srcFile, destFile);
  }
}
function getConfig() {
  if (!fs$1.existsSync(configRoot))
    initConfigFile();
  const data = fs$1.readFileSync(configRoot, "utf8");
  const loadDir = JSON.parse(data);
  return loadDir;
}
function initConfigFile(force) {
  force ? console.log("\u6B63\u5728\u521D\u59CB\u5316\u914D\u7F6E\u6587\u4EF6sp.config.json") : console.log("\u5728\u6B64\u8DEF\u5F84\u4E0A\u6CA1\u6709\u627E\u5230sp.config.json,\u5F00\u59CB\u521D\u59CB\u5316\u4E00\u4E2A\u914D\u7F6E\u6587\u4EF6\u3002");
  fs$1.copyFileSync(
    path$3.resolve(__dirname, "../tep-config/sp.config.json"),
    configRoot
  );
}
function loadCmd(command, args, text) {
  try {
    const loading = ora();
    loading.start(`${text}: \u547D\u4EE4\u6267\u884C\u4E2D...
`);
    const { stdout } = crossSpawn.exports.sync(command, args, {});
    if (stdout.toString())
      console.log(bgCyan("sp-cli-info "), stdout.toString());
    loading.succeed(`${text}: \u547D\u4EE4\u6267\u884C\u5B8C\u6210`);
  } catch (error) {
    console.log(bgRed(error));
    process.exit(1);
  }
}
function installEslintDep(type) {
  switch (type) {
    case "vue":
      loadCmd(
        "npm",
        ["install", "-D", "eslint-plugin-vue"],
        "\u5B89\u88C5eslint-plugin-vue"
      );
      loadCmd("npm", ["install", "-D", "eslint"], "\u5B89\u88C5eslint");
      break;
    case "vue_ts":
      loadCmd(
        "npm",
        [
          "install",
          "-D",
          "eslint-plugin-vue@latest",
          "eslint-config-standard-with-typescript@latest",
          "@typescript-eslint/eslint-plugin@^5.43.0",
          "eslint@^8.0.1",
          "eslint-plugin-import@^2.25.2",
          "eslint-plugin-n@^15.0.0",
          "eslint-plugin-promise@^6.0.0",
          "typescript@*"
        ],
        "\u5B89\u88C5vue+ts\u76F8\u5173\u4F9D\u8D56"
      );
      break;
    case "react":
      loadCmd(
        "npm",
        [
          "install",
          "-D",
          "eslint-plugin-react@latest",
          "eslint-config-standard@latest",
          "eslint@^8.0.1",
          "eslint-plugin-import@^2.25.2",
          "eslint-plugin-n@^15.0.0",
          "eslint-plugin-promise@^6.0.0"
        ],
        "\u5B89\u88C5react\u76F8\u5173\u4F9D\u8D56"
      );
      break;
    case "react_ts":
      loadCmd(
        "npm",
        [
          "install",
          "-D",
          "eslint-plugin-react@latest",
          "eslint-config-standard-with-typescript@latest",
          "@typescript-eslint/eslint-plugin@^5.43.0",
          "eslint@^8.0.1",
          "eslint-plugin-import@^2.25.2",
          "eslint-plugin-n@^15.0.0",
          "eslint-plugin-promise@^6.0.0",
          "typescript@*"
        ],
        "\u5B89\u88C5react+ts\u76F8\u5173\u4F9D\u8D56"
      );
      console.log("wait......");
      break;
    default:
      console.log(`Sorry, we are out of ${type}.`);
  }
}
function eslintAction(type) {
  const spConfig = getConfig();
  const addEslintConfig = Object.assign({}, spConfig);
  const getType = { vue, vue_ts, react, react_ts };
  for (const item in getType) {
    if (item === type) {
      addEslintConfig.esLint = getType[item];
      addEslintConfig.lintFilesArr = lintFilesArr[item];
    }
  }
  fs$1.writeFileSync(configRoot, JSON.stringify(addEslintConfig, null, 2));
}
function parseESLintResult(resultText) {
  const problems = extractEsLint(resultText, "problems");
  const errors = extractEsLint(resultText, "errors");
  const warnings = extractEsLint(resultText, "warnings");
  return {
    problems: +problems || 0,
    errors: +errors || 0,
    warnings: +warnings || 0
  };
}
function extractEsLint(resultText, type) {
  const problems = /([0-9]+) problems/;
  const warnings = /([0-9]+) warnings/;
  const errors = /([0-9]+) errors/;
  switch (type) {
    case "problems":
      return resultText.match(problems)[0].match(/[0-9]+/)[0];
    case "warnings":
      return resultText.match(warnings)[0].match(/[0-9]+/)[0];
    case "errors":
      return resultText.match(errors)[0].match(/[0-9]+/)[0];
    default:
      console.log(bgGreen("\u5F53\u524D\u9879\u76EE\u6CA1\u6709\u68C0\u6D4B\u51FA\u9519\u8BEF"));
      return;
  }
}

const FRAMEWORKS = [
  {
    name: "vue",
    display: "Vue",
    color: green,
    variants: [
      {
        name: "vue",
        display: "JavaScript",
        color: yellow
      },
      {
        name: "vue-ts",
        display: "TypeScript",
        color: blue
      },
      {
        name: "custom-create-vue",
        display: "Customize with create-vue",
        color: green,
        customCommand: "npm create vue@latest TARGET_DIR"
      }
    ]
  },
  {
    name: "react",
    display: "React",
    color: cyan,
    variants: [
      {
        name: "react",
        display: "JavaScript",
        color: yellow
      },
      {
        name: "react-ts",
        display: "TypeScript",
        color: blue
      }
    ]
  }
];
const TEMPLATES = FRAMEWORKS.map(
  (f) => f.variants && f.variants.map((v) => v.name) || [f.name]
).reduce((a, b) => a.concat(b), []);
const renameFiles = {
  _gitignore: ".gitignore"
};
async function createTep(argv) {
  const defaultTargetDir = "my-project";
  const argTargetDir = formatTargetDir(argv._[0]);
  const argTemplate = argv.template || argv.t;
  let targetDir = argTargetDir || defaultTargetDir;
  const getProjectName = () => targetDir === "." ? path$3.basename(path$3.resolve()) : targetDir;
  let result;
  try {
    result = await lib(
      [
        {
          type: argTargetDir ? null : "text",
          name: "projectName",
          message: reset("Project name:"),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir;
          }
        },
        {
          type: () => !fs$1.existsSync(targetDir) || isEmpty(targetDir) ? null : "confirm",
          name: "overwrite",
          message: () => (targetDir === "." ? "Current directory" : `Target directory "${targetDir}"`) + ` is not empty. Remove existing files and continue?`
        },
        {
          type: (_, { overwrite: overwrite2 }) => {
            if (overwrite2 === false) {
              throw new Error(red("\u2716") + " Operation cancelled");
            }
            return null;
          },
          name: "overwriteChecker"
        },
        {
          type: () => isValidPackageName(getProjectName()) ? null : "text",
          name: "packageName",
          message: reset("Package name:"),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) => isValidPackageName(dir) || "Invalid package.json name"
        },
        {
          type: argTemplate && TEMPLATES.includes(argTemplate) ? null : "select",
          name: "framework",
          message: typeof argTemplate === "string" && !TEMPLATES.includes(argTemplate) ? reset(
            `"${argTemplate}" isn't a valid template. Please choose from below: `
          ) : reset("Select a framework:"),
          initial: 0,
          choices: FRAMEWORKS.map((framework2) => {
            const frameworkColor = framework2.color;
            return {
              title: frameworkColor(framework2.display || framework2.name),
              value: framework2
            };
          })
        },
        {
          type: (framework2) => framework2 && framework2.variants ? "select" : null,
          name: "variant",
          message: reset("Select a variant:"),
          choices: (framework2) => framework2.variants.map((variant2) => {
            const variantColor = variant2.color;
            return {
              title: variantColor(variant2.display || variant2.name),
              value: variant2.name
            };
          })
        }
      ],
      {
        onCancel: () => {
          throw new Error(red("\u2716") + " Operation cancelled");
        }
      }
    );
  } catch (cancelled) {
    console.log(cancelled.message);
    return;
  }
  const { framework, overwrite, packageName, variant } = result;
  const root = path$3.join(cwd, targetDir);
  if (overwrite) {
    emptyDir(root);
  } else if (!fs$1.existsSync(root)) {
    fs$1.mkdirSync(root, { recursive: true });
  }
  const template = variant || framework || argTemplate;
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent);
  const pkgManager = pkgInfo ? pkgInfo.name : "npm";
  const isYarn1 = pkgManager === "yarn" && pkgInfo?.version.startsWith("1.");
  const { customCommand } = FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template) ?? {};
  if (customCommand) {
    const fullCustomCommand = customCommand.replace("TARGET_DIR", targetDir).replace(/^npm create/, `${pkgManager} create`).replace("@latest", () => isYarn1 ? "" : "@latest").replace(/^npm exec/, () => {
      if (pkgManager === "pnpm") {
        return "pnpm dlx";
      }
      if (pkgManager === "yarn" && !isYarn1) {
        return "yarn dlx";
      }
      return "npm exec";
    });
    const [command, ...args] = fullCustomCommand.split(" ");
    const { status } = crossSpawn.exports.sync(command, args, {
      stdio: "inherit"
    });
    process.exit(status ?? 0);
  }
  console.log(`
Scaffolding project in ${root}...`);
  const templateDir = path$3.resolve(
    fileURLToPath(import.meta.url),
    "../..",
    `template-${template}`
  );
  const write = (file, content) => {
    const targetPath = path$3.join(root, renameFiles[file] ?? file);
    if (content) {
      fs$1.writeFileSync(targetPath, content);
    } else {
      copy(path$3.join(templateDir, file), targetPath);
    }
  };
  const files = fs$1.readdirSync(templateDir);
  for (const file of files.filter((f) => f !== "package.json")) {
    write(file);
  }
  const pkg = JSON.parse(
    fs$1.readFileSync(path$3.join(templateDir, `package.json`), "utf-8")
  );
  pkg.name = packageName || getProjectName();
  write("package.json", JSON.stringify(pkg, null, 2));
  console.log(`
Done. Now run:
`);
  if (root !== cwd) {
    console.log(`  cd ${path$3.relative(cwd, root)}`);
  }
  switch (pkgManager) {
    case "yarn":
      console.log("  yarn");
      console.log("  yarn dev");
      break;
    default:
      console.log(`  ${pkgManager} install`);
      console.log(`  ${pkgManager} run dev`);
      break;
  }
}

const downloadRepo = promisify(download);
async function createGithubTep(args) {
  try {
    const questions = [
      {
        type: "text",
        name: "projectName",
        message: "What is the name of the project you want to create?",
        initial: "myGithubTepProject"
      },
      {
        type: "text",
        name: "repoAddress",
        message: "What's your github address",
        initial: "https://github.com/youGithubName/youRepoName.git"
      }
    ];
    const result = await lib(questions);
    const targetDir = path$3.join(cwd, result.projectName);
    console.log("targetDir", targetDir);
    console.log("github\u6A21\u677F\u4FE1\u606F\u662F---", result);
    if (fs$1.existsSync(targetDir)) {
      const result2 = await lib({
        type: "confirm",
        name: "value",
        message: "The folder exists, do you need to create a new folder to cover it?",
        initial: true
      });
      console.log(result2);
      result2.value === true ? emptyDir(targetDir) : process.exit(0);
      console.log("\u5220\u9664\u4E86\u539F\u6587\u4EF6\u5939\u91CC\u5168\u90E8\u7684\u5185\u5BB9");
    }
    await downloadRepo(`direct:${result.repoAddress}`, result.projectName, {
      clone: true
    });
    console.log("\u6A21\u677F\u521B\u5EFA\u6210\u529F\uFF01");
  } catch (error) {
    console.log(error.message);
    process.exit(0);
  }
}

async function addComponents(args) {
  console.log("\u8FD9\u91CC\u662Fadd\u547D\u4EE4\u7684\u6267\u884C\u903B\u8F91,create-sp add --name=NavBar ");
  const root = path$3.join(cwd, "sp.config.json");
  const initConfig = getConfig();
  const questions = {
    type: "select",
    name: "value",
    message: "Pick a frame",
    choices: [
      { title: "react+fn", value: "react_fn" },
      { title: "react+class", value: "react_class" },
      { title: "react+ts+fn", value: "react_ts_fn" },
      { title: "react+ts+class", value: "react_ts_class" },
      { title: "vue2", value: "vue2" },
      { title: "vue3", value: "vue3" },
      { title: "vue3+setup", value: "vue3_su" },
      { title: "vue3+ts", value: "vue3_ts" },
      { title: "vue3+ts+setup", value: "vue3_ts_su" }
    ],
    initial: 3
  };
  if (!initConfig.frame) {
    const { value } = await lib(questions);
    initConfig.frame = value;
    fs$1.writeFileSync(root, JSON.stringify(initConfig, null, 2));
  }
  const cpnPath = args.path || initConfig.componentsPath;
  renderComponent(args.name, cpnPath, initConfig.frame);
}

function initSP(args) {
  if (args.f || !fs$1.existsSync(configRoot)) {
    initConfigFile(true);
  } else
    console.log(
      "\u6587\u4EF6\u5DF2\u5B58\u5728\uFF0C\u5982\u679C\u9700\u8981\u5F3A\u5236\u521D\u59CB\u5316\u914D\u7F6E\u6587\u4EF6\uFF0C\u53EF\u4EE5\u6267\u884C `create-sp initSP -f` \u547D\u4EE4"
    );
}

function createRepo() {
  console.log("\u5904\u7406create-sp repo \u64CD\u4F5C\u7684\u903B\u8F91");
  const { token, repoName, githubUserName } = getConfig();
  const isEmpty = [token, repoName, githubUserName].every((item) => item != "");
  console.log(token, repoName, githubUserName);
  if (!isEmpty) {
    console.log(
      red("\u60A8\u6CA1\u6709\u5728\u914D\u7F6E\u6587\u4EF6\u4E2D\u8BBE\u7F6Etoken\u3001repoName\u3001githubUserName\u5C5E\u6027\u7684\u503C")
    );
    process.exit(0);
  }
  loadCmd("git", ["init"], "git\u521D\u59CB\u5316");
  loadCmd(
    "curl",
    [
      "-L",
      "-X",
      "POST",
      "-H",
      "Accept:application/vnd.github+json",
      "-H",
      `Authorization:Bearer ${token}`,
      "-H",
      "X-GitHub-Api-Version:2022-11-28",
      "https://api.github.com/user/repos",
      "-d",
      `{"name":"${repoName}","description":"This is your first repo!"}`
    ],
    "\u521B\u5EFAGithub\u4ED3\u5E93"
  );
  loadCmd(
    "git",
    [
      "remote",
      "add",
      "origin",
      `https://github.com/${githubUserName}/${repoName}.git`
    ],
    "\u5173\u8054\u8FDC\u7AEF\u4ED3\u5E93"
  );
  loadCmd("git", ["add", "."], "\u6267\u884Cgit add");
  loadCmd("git", ["commit", "-a", "-m", "\u521D\u59CB\u5316\u63D0\u4EA4"], "\u6267\u884Cgit commit");
  loadCmd("git", ["branch", "-M", "main"], "\u91CD\u547D\u540D\u5F53\u524D\u5206\u652F\u4E3Amain");
  loadCmd("git", ["push", "--set-upstream", "origin", "main"], "\u6267\u884Cgit push");
  process.exit(0);
}

async function lint(args) {
  if (args._[0] === "lint" && args.init) {
    console.log(green("create-sp lint --init\u7684\u6267\u884C\u903B\u8F91"));
    try {
      const usedFramework = await lib([
        {
          type: "select",
          name: "value",
          message: "Pick a framework",
          choices: [
            { title: "vue", value: "vue" },
            { title: "vue+ts", value: "vue_ts" },
            { title: "react", value: "react" },
            { title: "react+ts", value: "react_ts" }
          ],
          initial: 1
        }
      ]);
      installEslintDep(usedFramework.value);
      eslintAction(usedFramework.value);
      console.log("eslint\u521D\u59CB\u5316\u914D\u7F6E\u5B8C\u6210");
      return;
    } catch (cancelled) {
      console.log(cancelled.message);
      process.exit(1);
    }
  }
  if (args._[0] === "lint" && !args.init) {
    console.log("create-sp lint\u7684\u6267\u884C\u903B\u8F91");
    const config = getConfig();
    if (!config.esLint) {
      console.log(bgRed("\u8BF7\u5148\u6267\u884Ccreate-sp lint --init\u547D\u4EE4"));
      process.exit(1);
    }
    const eslint = new ESLint({ cwd, overrideConfig: config.esLint });
    const results = await eslint.lintFiles(config.lintFilesArr);
    const formatter = await eslint.loadFormatter("stylish");
    const resultText = formatter.format(results);
    if (resultText !== "") {
      console.log("resultText", resultText);
      const eslintResult = parseESLintResult(resultText);
      console.log(
        green(`esLint\u68C0\u67E5\u5B8C\u6BD5
    \u5171\u6709:${eslintResult.problems}\u4E2A\u95EE\u9898
    \u9519\u8BEF:${eslintResult.errors}
    \u8B66\u544A:${eslintResult.warnings}`)
      );
    } else {
      console.log(green("\u4F60\u7684\u9879\u76EE\u6CA1\u6709\u68C0\u67E5\u5230\u9519\u8BEF"));
    }
    process.exit(0);
  }
}

const argvMap = /* @__PURE__ */ new Map();
argvMap.set(["-v", "--version"], getVersion);
argvMap.set(["", "/", ".", "--template"], createTep);
argvMap.set(["githubTep"], createGithubTep);
argvMap.set(["add --name --path", "add --name"], addComponents);
argvMap.set(["initSP", "initSP -f"], initSP);
argvMap.set(["repo"], createRepo);
argvMap.set(["lint", "lint --init"], lint);
argvMap.set(["test"], (args) => {
  console.log("\u5F97\u5230args", args);
  console.log("\u8FD9\u662F\u6D4B\u8BD5\u547D\u4EE4,\u767D\u91D1\u4E4B\u661F\u811A\u624B\u67B6\u542F\u52A8\u6210\u529F\u4E86\uFF01");
});
function argAction(args) {
  let command;
  const argoption = [];
  for (const arg in args) {
    if (arg === "_") {
      command = args[arg][0] ?? "";
    } else {
      if (arg.length == 1 && typeof args[arg] == "boolean")
        argoption.push("-" + arg);
      else {
        argoption.push("--" + arg);
      }
    }
  }
  const argOptionResult = argoption.reduce((pre, cur) => {
    return pre + cur + " ";
  }, "").slice(0, -1);
  const noSpace = command === "" || command && !argOptionResult;
  const getCommandArg = (noSpace ? command + "" : command + " ") + argOptionResult;
  try {
    let action = null;
    argvMap.forEach((value, key) => {
      const comfirm = key.some((item) => {
        return item === getCommandArg;
      });
      if (comfirm) {
        action = key;
      }
    });
    console.log("action", action);
    const result = argvMap.get(action);
    result(args);
  } catch (error) {
    console.log("\u60A8\u8F93\u5165\u7684\u6307\u4EE4\u4E0D\u6B63\u786E");
  }
}

console.log("create-sp:\u6B63\u5728\u8FDB\u884C\u672C\u5730\u8C03\u8BD5\uFF01");
const args = minimist(process.argv.slice(2), { string: ["_"] });
console.log("args---", args);
argAction(args);
