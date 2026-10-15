import { paletteIds } from "./palettes";
import { tokenize } from "./parser";
import { projects, projectMeta, skillGroups, filterProjects } from "../catalog";
import { profile } from "../content";
import {
  HOME,
  text,
  projectOutput,
  experienceOutput,
  educationOutput,
  skillOutput,
  contactOutput,
  files,
  directories,
  resolvePath,
  entries,
  descendants,
  searchableLines,
} from "./filesystem";
export const initialSession = { cwd: HOME, palette: "bone", history: [] };
export const registry = {
  help: "help [command] — list commands or explain one command",
  man: "man <command> — show command help",
  whoami: "Print the current virtual user",
  hostname: "Print the virtual host name",
  uname: "uname [-a] — print synthetic sandbox system information",
  about: "Read about.txt",
  ls: "ls [path] — list virtual files",
  pwd: "Print virtual directory",
  cd: "cd [path] — navigate; supports ~, .. and absolute paths",
  cat: "cat <file> — read portfolio content",
  tree: "tree [path] — display the virtual directory tree",
  find: "find <name> | find <path> <name> — search virtual paths",
  grep: "grep [-i] <text> <file> — search virtual file contents",
  echo: "echo [text] — print escaped text",
  projects: "projects [--featured | --all | --filter <technology>]",
  project: "project <slug> — full project details",
  skills: "skills [--backend] — technology categories",
  experience: "Professional experience",
  education: "Education details",
  timeline: "Experience and education",
  contact: "Contact options",
  socials: "Social profile links",
  resume: "Open resume link",
  theme: `theme [${paletteIds.join(" | ")}] — terminal palette`,
  history: "Session command history",
  clear: "Clear output (Ctrl+L)",
  date: "Local date and time",
  gui: "Return to visual portfolio",
  exit: "Alias for gui",
};
const MAX_HISTORY = 100;

function commandHelp(name) {
  if (!Object.hasOwn(registry, name))
    throw new Error(`No manual entry for ${name}. Type help.`);
  return text(`${name} — ${registry[name]}`);
}

function treeLines(path) {
  const lines = [path === HOME ? "~/" : path.split("/").at(-1) + "/"];
  function visit(directory, prefix = "") {
    const children = entries(directory);
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      const isDirectory = child.endsWith("/");
      lines.push(`${prefix}${last ? "└──" : "├──"} ${child}`);
      if (isDirectory)
        visit(
          resolvePath(child, directory),
          prefix + (last ? "    " : "│   "),
        );
    });
  }
  visit(path);
  return lines.map(text);
}
function distance(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = old;
    }
  }
  return row[b.length];
}
export function execute(input, previous = initialSession, now = new Date()) {
  const state = {
    ...previous,
    history: [...previous.history, input].slice(-MAX_HISTORY),
  };
  const result = (output = [], extra = {}) => ({ output, state, ...extra });
  try {
    const [command, ...args] = tokenize(input);
    if (!command) return { output: [], state: previous };
    if (!Object.hasOwn(registry, command)) {
      const suggestion = Object.keys(registry).sort(
        (a, b) => distance(command, a) - distance(command, b),
      )[0];
      throw new Error(
        `Unknown command: ${command}. ${distance(command, suggestion) <= 3 ? "Did you mean " + suggestion + "? " : ""}Type help.`,
      );
    }
    const usage = () => {
      throw new Error("Usage: " + command + " — " + registry[command]);
    };
    switch (command) {
      case "help": {
        if (args.length > 1) usage();
        if (args.length === 1) return result([commandHelp(args[0])]);
        return result(
          Object.entries(registry).map(([name, desc]) =>
            text(`${name.padEnd(12)} ${desc}`),
          ),
        );
      }
      case "man":
        if (args.length !== 1) usage();
        return result([commandHelp(args[0])]);
      case "whoami":
        if (args.length) usage();
        return result([text("ashiqe")]);
      case "hostname":
        if (args.length) usage();
        return result([text("portfolio.local")]);
      case "uname":
        if (args.length > 1 || (args.length === 1 && args[0] !== "-a"))
          usage();
        return result([
          text(
            args[0] === "-a"
              ? "PortfolioOS portfolio.local 1.0 sandbox arm64"
              : "PortfolioOS",
          ),
        ]);
      case "about":
        if (args.length) usage();
        return result(files[HOME + "/about.txt"]());
      case "pwd":
        if (args.length) usage();
        return result([text(state.cwd)]);
      case "ls": {
        if (args.length > 1) usage();
        const path = args.length ? resolvePath(args[0], state.cwd) : state.cwd;
        if (!directories.includes(path))
          throw new Error("Directory not found: " + path);
        return result(entries(path).map(text));
      }
      case "cd": {
        if (args.length > 1) usage();
        const path = resolvePath(args[0], state.cwd);
        if (!directories.includes(path))
          throw new Error("Directory not found: " + path);
        state.cwd = path;
        return result([text(path)]);
      }
      case "cat": {
        if (args.length !== 1) usage();
        const read = files[resolvePath(args[0], state.cwd)];
        if (!read)
          throw new Error(
            "File not found. Use ls to discover available files.",
          );
        return result(read());
      }
      case "tree": {
        if (args.length > 1) usage();
        const path = args.length ? resolvePath(args[0], state.cwd) : state.cwd;
        if (!directories.includes(path))
          throw new Error("Directory not found: " + path);
        return result(treeLines(path));
      }
      case "find": {
        if (args.length < 1 || args.length > 2) usage();
        const path = args.length === 2 ? resolvePath(args[0], state.cwd) : state.cwd;
        const query = args.at(-1).toLowerCase();
        if (!directories.includes(path))
          throw new Error("Directory not found: " + path);
        const matches = descendants(path).filter((candidate) =>
          candidate.split("/").at(-1).toLowerCase().includes(query),
        );
        return result(
          matches.length ? matches.map(text) : [text(`No matches for ${args.at(-1)}.`)],
        );
      }
      case "grep": {
        const insensitive = args[0] === "-i";
        const operands = insensitive ? args.slice(1) : args;
        if (operands.length !== 2) usage();
        const [query, target] = operands;
        const path = resolvePath(target, state.cwd);
        if (!files[path]) throw new Error("File not found: " + target);
        const normalize = (value) =>
          insensitive ? value.toLowerCase() : value;
        const matches = searchableLines(path).filter((line) =>
          normalize(line).includes(normalize(query)),
        );
        return result(
          matches.length ? matches.map(text) : [text(`No matches for ${query}.`)],
        );
      }
      case "echo":
        return result([text(args.join(" "))]);
      case "projects": {
        let options = {};
        if (args.length) {
          if (args.length === 1 && ["--featured", "--all"].includes(args[0]))
            options.featured = args[0] === "--featured";
          else if (args.length === 2 && args[0] === "--filter")
            options.technology = args[1];
          else usage();
        }
        const matches = filterProjects(options);
        return result(
          matches.length
            ? matches.map((x) => projectOutput(x.project))
            : [text("No matching projects. Try projects --all.")],
        );
      }
      case "project": {
        if (args.length !== 1) usage();
        const index = projectMeta.findIndex(
          (p) => p.slug === args[0].toLowerCase(),
        );
        if (index < 0)
          throw new Error(
            "Project not found. Available: " +
              projectMeta.map((p) => p.slug).join(", "),
          );
        return result([projectOutput(projects[index])]);
      }
      case "skills":
        if (args.length && (args.length !== 1 || args[0] !== "--backend"))
          usage();
        return result(
          skillOutput(
            args.length
              ? skillGroups.filter((g) => g.id === "backend")
              : skillGroups,
          ),
        );
      case "experience":
        if (args.length) usage();
        return result(experienceOutput());
      case "education":
        if (args.length) usage();
        return result(educationOutput());
      case "timeline":
        if (args.length) usage();
        return result([...experienceOutput(), ...educationOutput()]);
      case "contact":
        if (args.length) usage();
        return result(contactOutput());
      case "socials":
        if (args.length) usage();
        return result(
          profile.socials.map((s) => ({
            kind: "link",
            text: s.label,
            href: s.url,
          })),
        );
      case "resume":
        if (args.length) usage();
        return result(files[HOME + "/resume.pdf"]());
      case "theme":
        if (args.length > 1 || (args.length && !paletteIds.includes(args[0])))
          usage();
        if (args[0]) state.palette = args[0];
        return result(
          [
            text(
              `Terminal theme: ${state.palette}. Options: ${paletteIds.join(", ")}.`,
            ),
          ],
          { appearance: args[0] },
        );
      case "history":
        if (args.length) usage();
        return result(
          state.history.map((line, i) => text(`${i + 1}  ${line}`)),
        );
      case "clear":
        if (args.length) usage();
        return result([], { action: "clear" });
      case "date":
        if (args.length) usage();
        return result([text(now.toLocaleString())]);
      case "gui":
      case "exit":
        if (args.length) usage();
        return result([], { action: "gui" });
    }
  } catch (error) {
    return result([text(error.message)], { error: true });
  }
}
export function complete(input, state = initialSession) {
  const words = input.split(/\s+/);
  const command = words[0];
  const fragment = words.at(-1);
  let candidates = Object.keys(registry);
  if (words.length > 1) {
    if (command === "project") candidates = projectMeta.map((p) => p.slug);
    else if (command === "theme") candidates = paletteIds;
    else if (command === "projects")
      candidates =
        words[1] === "--filter"
          ? ["react", "mongodb", "express", "node.js", "tailwind", "stripe"]
          : ["--all", "--featured", "--filter"];
    else if (command === "skills") candidates = ["--backend"];
    else if (["cd", "ls", "cat", "tree", "find"].includes(command)) {
      const slash = fragment.lastIndexOf("/");
      const prefix = slash >= 0 ? fragment.slice(0, slash + 1) : "";
      const folder = prefix ? resolvePath(prefix, state.cwd) : state.cwd;
      candidates = entries(folder)
        .filter((x) => command !== "cd" || x.endsWith("/"))
        .map((x) => prefix + x.replace(/\/$/, ""));
    } else candidates = [];
  }
  return candidates
    .filter((x) => x.startsWith(fragment))
    .map((x) => [...words.slice(0, -1), x].join(" "));
}
