import { projects, projectMeta, skillGroups } from "../catalog";
import { profile, experiences, education } from "../content";
export const HOME = "/home/ashiqe";
export const text = (value) => ({ kind: "text", text: value });
export const projectOutput = (project) => ({ kind: "project", project });
export const experienceOutput = () =>
  experiences.flatMap((x) => [
    text([x.company, x.role, x.duration, x.location, x.type].join("\n")),
    ...x.points.map(text),
    text(x.tech.join(" · ")),
    { kind: "link", text: x.company, href: x.logo },
  ]);
export const educationOutput = () =>
  education.flatMap((x) => [
    text([x.degree, x.institution, x.duration, x.location].join("\n")),
    ...x.courses.map(text),
  ]);
export const skillOutput = (groups) =>
  groups.flatMap((x) => [text(x.label), ...x.skills.map((s) => text(s.name))]);
export const contactOutput = () => [
  { kind: "link", text: profile.phone, href: profile.phone },
  { kind: "link", text: "Contact", href: "/contact?mode=visual" },
  ...profile.socials.map((s) => ({ kind: "link", text: s.label, href: s.url })),
];
export const files = {
  [HOME + "/about.txt"]: () => [text(profile.name), text(profile.introduction)],
  [HOME + "/contact.txt"]: contactOutput,
  [HOME + "/resume.pdf"]: () => [
    { kind: "link", text: "resume.pdf", href: profile.resume },
  ],
  [HOME + "/experience/work.txt"]: experienceOutput,
  [HOME + "/experience/education.txt"]: educationOutput,
  ...Object.fromEntries(
    projects.map((p, i) => [
      HOME + "/projects/" + projectMeta[i].slug + ".txt",
      () => [projectOutput(p)],
    ]),
  ),
  ...Object.fromEntries(
    skillGroups.map((g) => [
      HOME + "/skills/" + g.id + ".txt",
      () => skillOutput([g]),
    ]),
  ),
};
export const directories = [
  HOME,
  HOME + "/projects",
  HOME + "/experience",
  HOME + "/skills",
];
export function resolvePath(path = "~", cwd = HOME) {
  if (!path || path === "~" || path === "/") return HOME;
  let expanded;
  if (path.startsWith("~/")) expanded = HOME + path.slice(1);
  else if (path === HOME || path.startsWith(HOME + "/")) expanded = path;
  else if (path.startsWith("/")) expanded = HOME + path;
  else expanded = cwd + "/" + path;
  const root = HOME.split("/").filter(Boolean);
  const result = [...root];
  const relative = expanded.startsWith(HOME)
    ? expanded.slice(HOME.length)
    : expanded;
  for (const part of relative.split("/")) {
    if (part === "..") {
      if (result.length > root.length) result.pop();
    }
    else if (part && part !== ".") result.push(part);
  }
  return "/" + result.join("/");
}
export function entries(cwd) {
  return [
    ...directories.filter((x) => x !== cwd).map((x) => x + "/"),
    ...Object.keys(files),
  ]
    .filter(
      (x) =>
        x.startsWith(cwd + "/") &&
        !x
          .slice(cwd.length + 1)
          .replace(/\/$/, "")
          .includes("/"),
    )
    .map((x) => x.slice(cwd.length + 1));
}

export function descendants(path) {
  const prefix = path === HOME ? HOME + "/" : path + "/";
  return [...directories, ...Object.keys(files)]
    .filter((candidate) => candidate !== path && candidate.startsWith(prefix))
    .sort((a, b) => a.localeCompare(b));
}

export function searchableLines(path) {
  const read = files[path];
  if (!read) return [];
  return read().flatMap((item) => {
    if (item.kind === "text") return String(item.text).split("\n");
    if (item.kind === "link") return [item.text, item.href];
    if (item.kind === "project")
      return [
        item.project.title,
        item.project.description,
        item.project.tools.join(" · "),
        item.project.github,
        item.project.demo,
      ].filter(Boolean);
    return [];
  });
}
