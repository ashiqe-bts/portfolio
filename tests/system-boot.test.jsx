import { afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useState } from "react";
import SystemBoot from "../src/forged/SystemBoot";

function setReducedMotion(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: query === "(prefers-reduced-motion: reduce)" ? matches : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

function renderBoot(props = {}) {
  function Harness() {
    const [visible, setVisible] = useState(true);
    return visible ? (
      <SystemBoot
        mode="visual"
        palette="bone"
        onComplete={() => setVisible(false)}
        {...props}
      />
    ) : (
      <main data-testid="destination">Portfolio</main>
    );
  }

  return render(<Harness />);
}

afterEach(() => {
  cleanup();
  document.body.classList.remove("boot-active");
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SystemBoot", () => {
  it("renders an accessible visual-mode system sequence and locks scrolling", () => {
    setReducedMotion(false);
    renderBoot();

    const dialog = screen.getByRole("dialog", {
      name: "Ashiqe system introduction",
    });
    expect(dialog.dataset.mode).toBe("visual");
    expect(dialog.className).toContain("palette-bone");
    expect(screen.getByRole("status").textContent).toBe(
      "Calibrating interface",
    );
    expect(document.body.classList.contains("boot-active")).toBe(true);
    expect(document.querySelector("svg").getAttribute("aria-hidden")).toBe(
      "true",
    );
  });

  it("advances deterministically, exposes Skip, and completes after 2.5 seconds", () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    renderBoot();

    expect(screen.queryByRole("button", { name: "Skip intro" })).toBeNull();
    act(() => vi.advanceTimersByTime(550));
    expect(screen.getByRole("button", { name: "Skip intro" })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe(
      "Indexing portfolio archive",
    );

    act(() => vi.advanceTimersByTime(1500));
    expect(screen.getByRole("status").textContent).toBe("Portfolio online");
    act(() => vi.advanceTimersByTime(450));
    expect(screen.getByTestId("destination")).toBeTruthy();
    expect(document.body.classList.contains("boot-active")).toBe(false);
  });

  it("lets visitors skip with the button or Escape", () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    const first = renderBoot();
    act(() => vi.advanceTimersByTime(550));
    fireEvent.click(screen.getByRole("button", { name: "Skip intro" }));
    expect(screen.getByTestId("destination")).toBeTruthy();

    first.unmount();
    renderBoot();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("destination")).toBeTruthy();
  });

  it("uses a brief static handoff when reduced motion is requested", () => {
    vi.useFakeTimers();
    setReducedMotion(true);
    renderBoot();

    const dialog = screen.getByRole("dialog", {
      name: "Ashiqe system introduction",
    });
    expect(dialog.className).toContain("reduced-motion");
    expect(screen.getByRole("status").textContent).toBe("Portfolio online");
    act(() => vi.advanceTimersByTime(400));
    expect(screen.getByTestId("destination")).toBeTruthy();
  });

  it("applies the saved terminal palette and clears timers on unmount", () => {
    vi.useFakeTimers();
    setReducedMotion(false);
    const onComplete = vi.fn();
    const view = render(
      <SystemBoot mode="terminal" palette="green" onComplete={onComplete} />,
    );

    const dialog = screen.getByRole("dialog", {
      name: "Ashiqe system introduction",
    });
    expect(dialog.dataset.mode).toBe("terminal");
    expect(dialog.className).toContain("palette-green");
    expect(dialog.style.getPropertyValue("--boot-signal")).toBe("#b7f68b");
    view.unmount();
    act(() => vi.runAllTimers());
    expect(onComplete).not.toHaveBeenCalled();
    expect(document.body.classList.contains("boot-active")).toBe(false);
  });
});
