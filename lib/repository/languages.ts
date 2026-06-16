import { getRepoExtension, getRepoFileName } from "@/lib/repository/paths";

const extensionLanguageMap: Record<string, string> = {
  ts: "typescript",
  tsx: "tsx",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  py: "python",
  pyw: "python",
  pyi: "python",
  rb: "ruby",
  erb: "ruby",
  rake: "ruby",
  gemspec: "ruby",
  ru: "ruby",
  thor: "ruby",
  jbuilder: "ruby",
  rabl: "ruby",
  podspec: "ruby",
  builder: "ruby",
  go: "go",
  rs: "rust",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  swift: "swift",
  php: "php",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cs: "csharp",
  fs: "fsharp",
  fsx: "fsharp",
  vb: "vbnet",
  css: "css",
  scss: "scss",
  sass: "sass",
  less: "less",
  html: "html",
  htm: "html",
  xml: "xml",
  svg: "xml",
  json: "json",
  jsonc: "json",
  json5: "json",
  md: "markdown",
  mdx: "markdown",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  ini: "ini",
  cfg: "ini",
  conf: "ini",
  sql: "sql",
  prisma: "prisma",
  sh: "bash",
  bash: "bash",
  zsh: "bash",
  fish: "bash",
  ps1: "powershell",
  psm1: "powershell",
  bat: "batch",
  cmd: "batch",
  vue: "vue",
  svelte: "svelte",
  dart: "dart",
  lua: "lua",
  pl: "perl",
  pm: "perl",
  r: "r",
  scala: "scala",
  sc: "scala",
  clj: "clojure",
  cljs: "clojure",
  ex: "elixir",
  exs: "elixir",
  erl: "erlang",
  hrl: "erlang",
  hs: "haskell",
  lhs: "haskell",
  nim: "nim",
  zig: "zig",
  tf: "terraform",
  hcl: "terraform",
  dockerfile: "dockerfile",
  makefile: "makefile",
  cmake: "cmake",
  gradle: "gradle",
  groovy: "groovy",
  proto: "protobuf",
  tex: "latex",
  rst: "restructuredtext",
  txt: "text",
  log: "text",
  m: "objc",
  mm: "objc",
  asm: "assembly",
  s: "assembly",
  f: "fortran",
  f90: "fortran",
  f95: "fortran",
  cr: "crystal",
  ml: "ocaml",
  mli: "ocaml",
  jl: "julia",
  rkt: "racket",
  lisp: "lisp",
  cl: "lisp",
  coffee: "coffeescript",
  litcoffee: "coffeescript",
  styl: "stylus",
  stylu: "stylus",
  pas: "pascal",
  pp: "pascal",
  v: "verilog",
  sv: "systemverilog",
  vhd: "vhdl",
  vhdl: "vhdl",
  sol: "solidity",
  move: "move",
  wat: "wasm",
  wgsl: "wgsl",
  graphql: "graphql",
  gql: "graphql",
  gqls: "graphql",
  tfvars: "terraform",
};

export const repositoryCodeExtensions = new Set(Object.keys(extensionLanguageMap));

const basenameLanguageMap: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "makefile",
  gemfile: "ruby",
  "gemfile.lock": "ruby",
  rakefile: "ruby",
  podfile: "ruby",
  "podfile.lock": "ruby",
  "cargo.toml": "rust",
  "cargo.lock": "rust",
  "go.mod": "go",
  "go.sum": "go",
  "cmakelists.txt": "cmake",
  "compose.yaml": "yaml",
  "compose.yml": "yaml",
  "docker-compose.yml": "yaml",
  "docker-compose.yaml": "yaml",
  procfile: "text",
};

const languageLabels: Record<string, string> = {
  typescript: "TypeScript",
  tsx: "TSX",
  javascript: "JavaScript",
  jsx: "JSX",
  python: "Python",
  ruby: "Ruby",
  go: "Go",
  rust: "Rust",
  java: "Java",
  kotlin: "Kotlin",
  swift: "Swift",
  php: "PHP",
  c: "C",
  cpp: "C++",
  csharp: "C#",
  fsharp: "F#",
  vbnet: "VB.NET",
  css: "CSS",
  scss: "SCSS",
  sass: "Sass",
  less: "Less",
  html: "HTML",
  xml: "XML",
  json: "JSON",
  markdown: "Markdown",
  yaml: "YAML",
  toml: "TOML",
  ini: "INI",
  sql: "SQL",
  prisma: "Prisma",
  bash: "Shell",
  powershell: "PowerShell",
  batch: "Batch",
  vue: "Vue",
  svelte: "Svelte",
  dart: "Dart",
  lua: "Lua",
  perl: "Perl",
  r: "R",
  scala: "Scala",
  clojure: "Clojure",
  elixir: "Elixir",
  erlang: "Erlang",
  haskell: "Haskell",
  nim: "Nim",
  zig: "Zig",
  terraform: "Terraform",
  dockerfile: "Dockerfile",
  makefile: "Makefile",
  cmake: "CMake",
  gradle: "Gradle",
  groovy: "Groovy",
  protobuf: "Protobuf",
  latex: "LaTeX",
  restructuredtext: "reStructuredText",
  text: "Text",
  objc: "Objective-C",
  assembly: "Assembly",
  fortran: "Fortran",
  crystal: "Crystal",
  ocaml: "OCaml",
  julia: "Julia",
  racket: "Racket",
  lisp: "Lisp",
  coffeescript: "CoffeeScript",
  stylus: "Stylus",
  pascal: "Pascal",
  verilog: "Verilog",
  systemverilog: "SystemVerilog",
  vhdl: "VHDL",
  solidity: "Solidity",
  move: "Move",
  wasm: "WebAssembly",
  wgsl: "WGSL",
  graphql: "GraphQL",
};

const knownLanguageKeys = new Set(Object.keys(languageLabels));

function isNoiseLanguage(value: string) {
  return /^\d+$/.test(value) || value === "o" || value === "a" || value === "in" || value === "as" || value === "am" || value === "ac" || value === "app" || value === "bin" || value === "bak" || value === "archangel";
}

export function canonicalRepositoryLanguage(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase().trim();

  if (!normalized || isNoiseLanguage(normalized)) {
    return null;
  }

  if (knownLanguageKeys.has(normalized)) {
    return normalized;
  }

  const fromExtension = extensionLanguageMap[normalized];

  if (fromExtension && knownLanguageKeys.has(fromExtension)) {
    return fromExtension;
  }

  return null;
}

export function languageFromExtension(extension: string | null) {
  if (!extension) {
    return null;
  }

  return canonicalRepositoryLanguage(extension);
}

export function languageFromRepoPath(repoPath: string) {
  const basename = getRepoFileName(repoPath).toLowerCase();
  const fromBasename = basenameLanguageMap[basename];

  if (fromBasename) {
    return fromBasename;
  }

  return languageFromExtension(getRepoExtension(repoPath));
}

export function isRepositoryCodeExtension(extension: string | null | undefined) {
  return Boolean(extension && repositoryCodeExtensions.has(extension.toLowerCase()));
}

export function isRepositoryCodePath(repoPath: string) {
  return Boolean(languageFromRepoPath(repoPath));
}

export function resolveRepositoryLanguage(repoPath: string, extension: string | null | undefined, stored: string | null | undefined) {
  return languageFromRepoPath(repoPath) || canonicalRepositoryLanguage(extension) || canonicalRepositoryLanguage(stored);
}

export function labelRepositoryLanguage(language: string) {
  const canonical = canonicalRepositoryLanguage(language) || language.toLowerCase();
  return languageLabels[canonical] || language.charAt(0).toUpperCase() + language.slice(1);
}

export function repositoryLanguageFilterTokens(canonical: string) {
  const normalized = canonicalRepositoryLanguage(canonical);

  if (!normalized) {
    return [];
  }

  const tokens = new Set<string>([normalized, labelRepositoryLanguage(normalized).toLowerCase()]);

  for (const [extension, language] of Object.entries(extensionLanguageMap)) {
    if (language === normalized) {
      tokens.add(extension);
    }
  }

  for (const [basename, language] of Object.entries(basenameLanguageMap)) {
    if (language === normalized) {
      tokens.add(basename);
    }
  }

  return Array.from(tokens);
}

export function listRepositoryLanguageChoices(rawValues: Array<string | null | undefined>) {
  const choices = new Map<string, string>();

  for (const raw of rawValues) {
    const canonical = canonicalRepositoryLanguage(raw);

    if (!canonical) {
      continue;
    }

    choices.set(canonical, labelRepositoryLanguage(canonical));
  }

  return Array.from(choices.entries())
    .map(([value, label]) => ({ value, label }))
    .sort((left, right) => left.label.localeCompare(right.label, "en"));
}
