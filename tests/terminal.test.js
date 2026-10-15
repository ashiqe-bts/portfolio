import { describe, it, expect } from "vitest";
import {
  execute,
  complete,
  initialSession,
} from "../src/forged/terminal/commands.js";
import { HOME, resolvePath } from "../src/forged/terminal/filesystem.js";
import { projects } from "../src/assets/data.js";
const run = (input, state = initialSession) => execute(input, state);
describe("portfolio terminal", () => {
  it("returns every unchanged project description in source order", () => {
    expect(
      run("projects --all")
        .output.filter((x) => x.kind === "project")
        .map((x) => x.project),
    ).toEqual(projects);
  });
  it("resolves a project slug and supports React aliases", () => {
    expect(run("project techtribe").output[0].project).toEqual(projects[0]);
    expect(run("projects --filter react").output).toHaveLength(6);
    expect(run("projects --featured").output).toHaveLength(2);
  });
  it("navigates the virtual filesystem without escaping its root", () => {
    const state = run("cd projects").state;
    expect(run("pwd", state).output[0].text).toBe("/home/ashiqe/projects");
    expect(run("cat techtribe.txt", state).output[0].project).toEqual(
      projects[0],
    );
    expect(run("cd ../../../../", state).state.cwd).toBe("/home/ashiqe");
    expect(resolvePath("../../../../projects", HOME)).toBe(
      "/home/ashiqe/projects",
    );
    expect(resolvePath("/projects", HOME)).toBe("/home/ashiqe/projects");
    expect(resolvePath("/etc/passwd", HOME)).toBe(
      "/home/ashiqe/etc/passwd",
    );
  });
  it("rejects executable shell syntax, control characters and oversized input", () => {
    expect(run("projects; alert(1)").error).toBe(true);
    expect(run("echo safe && whoami").output[0].text).toContain(
      "Unsupported shell syntax",
    );
    expect(run("echo $(whoami)").error).toBe(true);
    expect(run("echo `whoami`").error).toBe(true);
    expect(run("echo hello\nwhoami").error).toBe(true);
    expect(run("a".repeat(513)).output[0].text).toBe(
      "Command is too long (maximum 512 characters).",
    );
    expect(run("projects --wrong").error).toBe(true);
    expect(run('project "techtribe').error).toBe(true);
    expect(run("cat /etc/passwd").error).toBe(true);
  });
  it("provides familiar read-only shell commands over portfolio content", () => {
    expect(run("whoami").output[0].text).toBe("ashiqe");
    expect(run("hostname").output[0].text).toBe("portfolio.local");
    expect(run("uname -a").output[0].text).toContain("PortfolioOS");
    expect(run('echo "hello portfolio"').output[0].text).toBe(
      "hello portfolio",
    );
    expect(run("tree projects").output.map((x) => x.text).join("\n")).toContain(
      "techtribe.txt",
    );
    expect(run("find techtribe").output[0].text).toBe(
      "/home/ashiqe/projects/techtribe.txt",
    );
    expect(
      run('grep -i "software engineer" about.txt')
        .output.map((x) => x.text)
        .join("\n"),
    ).toContain("Software Engineer");
    expect(run("help grep").output[0].text).toContain("grep [-i]");
    expect(run("man tree").output[0].text).toContain("tree [path]");
  });
  it("bounds command history to the newest 100 entries", () => {
    let state = initialSession;
    for (let index = 0; index < 105; index += 1)
      state = run(`echo ${index}`, state).state;
    expect(state.history).toHaveLength(100);
    expect(state.history[0]).toBe("echo 5");
    expect(state.history.at(-1)).toBe("echo 104");
  });
  it("supports theme, aliases, helpful errors and completions", () => {
    expect(run("theme amber").state.palette).toBe("amber");
    expect(run("exit").action).toBe("gui");
    expect(run("gui").action).toBe("gui");
    expect(run("hlep").output[0].text).toContain("help");
    expect(complete("project tech", initialSession)).toContain(
      "project techtribe",
    );
    expect(complete("cd pro", initialSession)).toContain("cd projects");
    expect(complete("find pro", initialSession)).toContain("find projects");
    expect(complete("grep -i soft", initialSession)).toEqual([]);
  });
});
