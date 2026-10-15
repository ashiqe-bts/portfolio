import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useState } from "react";
import {
  palettes,
  appearanceKey,
  readAppearance,
  saveAppearance,
} from "../src/forged/terminal/palettes";
import {
  execute,
  complete,
  initialSession,
} from "../src/forged/terminal/commands";
import { referencesFor } from "../src/forged/associations";
import { experiences } from "../src/forged/content";
import { projects } from "../src/forged/catalog";
import { PortfolioContext } from "../src/forged/context";
import Terminal from "../src/forged/terminal/Terminal";
import Skills from "../src/forged/Skills";
import ProjectArtwork from "../src/forged/ProjectArtwork";
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
});
describe("terminal appearance", () => {
  it("ignores the legacy default, validates and persists every explicit palette", () => {
    localStorage.setItem("forged-terminal-theme", "green");
    expect(readAppearance()).toBe("bone");
    for (const { id } of palettes) {
      expect(execute(`theme ${id}`).state.palette).toBe(id);
      expect(complete("theme ", initialSession)).toContain(`theme ${id}`);
      saveAppearance(id);
      expect(readAppearance()).toBe(id);
    }
    localStorage.setItem(appearanceKey, "unknown");
    expect(readAppearance()).toBe("bone");
    expect(execute("theme unknown").error).toBe(true);
  });
  it("survives blocked storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw Error("blocked");
    });
    expect(readAppearance()).toBe("bone");
    expect(() => saveAppearance("amber")).not.toThrow();
  });
  function renderTerminal(switchMode = vi.fn()) {
    window.matchMedia = vi.fn(() => ({ matches: false }));
    Element.prototype.scrollIntoView = vi.fn();
    function Harness() {
      const [terminal, setTerminal] = useState({
        session: initialSession,
        entries: [],
        input: "",
      });
      return (
        <PortfolioContext.Provider
          value={{
            terminal,
            setTerminal,
            switchMode,
            setPaletteOpen: vi.fn(),
          }}
        >
          <Terminal />
        </PortfolioContext.Provider>
      );
    }
    render(<Harness />);
    return switchMode;
  }
  it("uses command-only themes with a Bone default", () => {
    renderTerminal();
    expect(screen.queryByRole("group", { name: "Terminal appearance" })).toBe(
      null,
    );
    expect(document.querySelector(".terminal-page").className).toContain(
      "palette-bone",
    );
    const input = screen.getByRole("textbox", { name: "Terminal command" });
    fireEvent.change(input, { target: { value: "theme amber" } });
    fireEvent.submit(input.closest("form"));
    expect(document.querySelector(".terminal-page").className).toContain(
      "palette-amber",
    );
    expect(readAppearance()).toBe("amber");
  });
  it("provides functional macOS window controls", () => {
    const switchMode = renderTerminal();
    expect(screen.getByText("ashiqe — zsh — portfolio")).toBeTruthy();
    const screenElement = document.querySelector(".terminal-screen");
    fireEvent.click(screen.getByRole("button", { name: "Minimize terminal" }));
    expect(screenElement.hidden).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Maximize terminal" }));
    expect(screenElement.hidden).toBe(false);
    expect(document.querySelector(".terminal-window").className).toContain(
      "maximized",
    );
    fireEvent.click(screen.getByRole("button", { name: "Close terminal" }));
    expect(switchMode).toHaveBeenCalledWith("visual");
  });
  it("cancels input with Ctrl+C and bounds the transcript", () => {
    renderTerminal();
    const input = screen.getByRole("textbox", { name: "Terminal command" });
    fireEvent.change(input, { target: { value: "echo pending" } });
    fireEvent.keyDown(input, { key: "c", ctrlKey: true });
    expect(input.value).toBe("");
    expect(document.querySelector(".terminal-command").textContent).toContain(
      "echo pending^C",
    );
    for (let index = 0; index < 101; index += 1) {
      fireEvent.change(input, { target: { value: `echo ${index}` } });
      fireEvent.submit(input.closest("form"));
    }
    expect(document.querySelectorAll(".terminal-entry")).toHaveLength(100);
  });
  it("prints safe candidates when Tab completion is ambiguous", () => {
    renderTerminal();
    const input = screen.getByRole("textbox", { name: "Terminal command" });
    fireEvent.change(input, { target: { value: "p" } });
    fireEvent.keyDown(input, { key: "Tab" });
    expect(document.querySelector(".terminal-completions").textContent).toContain(
      "projects",
    );
    expect(input.value).toBe("p");
  });
});
describe("verified stack references", () => {
  it("uses exact records and explicit spelling/acronym aliases", () => {
    expect(referencesFor("Nest.js").experiences).toEqual([experiences[0]]);
    expect(referencesFor("Express.js").projects.map((x) => x.project)).toEqual(
      projects.slice(0, 4),
    );
    expect(referencesFor("MySql").experiences).toEqual([experiences[0]]);
    expect(referencesFor("Tailwind").projects).toHaveLength(5);
    expect(referencesFor("Figma")).toEqual({ projects: [], experiences: [] });
    expect(referencesFor("Git").projects).toEqual([]);
  });
  it("restores a pinned technology and renders original experience excerpts", () => {
    render(
      <MemoryRouter
        initialEntries={["/skills?category=backend&technology=Nest.js"]}
      >
        <Skills />
      </MemoryRouter>,
    );
    expect(document.querySelector(".technology-detail h3").textContent).toBe(
      "Nest.js",
    );
    for (const point of experiences[0].points)
      expect(screen.getByText(point)).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Find a technology"), {
      target: { value: "zzzz" },
    });
    expect(screen.getByText("No technologies found.")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reset selection" }));
    expect(document.querySelector(".technology-detail")).toBeNull();
  });
});
it("falls back to the unchanged original project image on cover failure", () => {
  render(<ProjectArtwork project={projects[0]} slug="techtribe" />);
  const img = screen.getByRole("img");
  fireEvent.error(img);
  expect(img.getAttribute("src")).toBe(projects[0].image);
  expect(img.hasAttribute("srcset")).toBe(false);
});
