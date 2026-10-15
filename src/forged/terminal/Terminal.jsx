import { useEffect, useRef, useState } from "react";
import { usePortfolio } from "../context";
import { execute, complete } from "./commands";
import { palettes, saveAppearance } from "./palettes";
import { TerminalEntry, TerminalTitlebar } from "./TerminalChrome";

const MAX_TRANSCRIPT = 100;

export default function Terminal() {
  const { switchMode, terminal, setTerminal } = usePortfolio();
  const { session, entries, input } = terminal;
  const inputRef = useRef(null);
  const screenRef = useRef(null);
  const draft = useRef("");
  const follow = useRef(true);
  const [historyIndex, setHistoryIndex] = useState(null);
  const [announcement, setAnnouncement] = useState("");
  const [newOutput, setNewOutput] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const suggestions = complete(input, session);
  const terminalColor = palettes.find((palette) => palette.id === session.palette)
    ?.color;

  useEffect(() => {
    if (window.matchMedia("(pointer:fine)").matches) inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen || minimized) return;
    if (follow.current) screen.scrollTop = screen.scrollHeight;
    else setNewOutput(true);
  }, [entries, minimized]);

  const updateInput = (value) =>
    setTerminal((current) => ({ ...current, input: value }));

  const appendEntry = (entry) =>
    setTerminal((current) => ({
      ...current,
      entries: [...current.entries, entry].slice(-MAX_TRANSCRIPT),
    }));

  function submit(value = input) {
    if (!value.trim()) return;
    const result = execute(value, session);
    if (result.appearance) saveAppearance(result.appearance);
    setTerminal((current) => ({
      ...current,
      session: result.state,
      input: "",
      entries:
        result.action === "clear"
          ? []
          : [
              ...current.entries,
              {
                command: value,
                cwd: session.cwd,
                output: result.output,
                error: result.error,
              },
            ].slice(-MAX_TRANSCRIPT),
    }));
    setHistoryIndex(null);
    setAnnouncement(
      result.error
        ? "Command failed. Read the terminal output for details."
        : `Command ${value.split(" ")[0]} completed.`,
    );
    if (result.action === "gui") switchMode("visual");
  }

  function cancelInput() {
    if (!input) return;
    appendEntry({
      command: input + "^C",
      cwd: session.cwd,
      output: [],
      cancelled: true,
    });
    updateInput("");
    setHistoryIndex(null);
    setAnnouncement("Command cancelled.");
  }

  function showCompletions() {
    appendEntry({
      command: input,
      cwd: session.cwd,
      output: suggestions.map((value) => ({ kind: "text", text: value })),
      completion: true,
    });
    setAnnouncement(`${suggestions.length} completion options available.`);
  }

  function recallHistory(direction) {
    if (!session.history.length) return;
    if (historyIndex === null) draft.current = input;
    const next =
      direction === "up"
        ? Math.max(0, (historyIndex ?? session.history.length) - 1)
        : Math.min(
            session.history.length,
            (historyIndex ?? session.history.length) + 1,
          );
    setHistoryIndex(next === session.history.length ? null : next);
    updateInput(
      next === session.history.length ? draft.current : session.history[next],
    );
  }

  function keyDown(event) {
    if (event.ctrlKey && event.key.toLowerCase() === "c") {
      event.preventDefault();
      cancelInput();
      return;
    }
    if (event.ctrlKey && event.key.toLowerCase() === "l") {
      event.preventDefault();
      setTerminal((current) => ({ ...current, entries: [] }));
      return;
    }
    if (
      event.key === "Tab" &&
      !event.shiftKey &&
      suggestions.length &&
      (suggestions.length > 1 || suggestions[0] !== input)
    ) {
      event.preventDefault();
      if (suggestions.length === 1) updateInput(suggestions[0]);
      else showCompletions();
      return;
    }
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      recallHistory(event.key === "ArrowUp" ? "up" : "down");
    }
  }

  const windowClass = [
    "terminal-window",
    minimized && "minimized",
    maximized && "maximized",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <section
      className={`terminal-page palette-${session.palette}`}
      style={{ "--terminal": terminalColor }}
    >
      <div
        className={windowClass}
        role="region"
        aria-label="Portfolio terminal window"
      >
        <TerminalTitlebar
          minimized={minimized}
          maximized={maximized}
          onClose={() => switchMode("visual")}
          onMinimize={() => setMinimized((current) => !current)}
          onMaximize={() => {
            setMinimized(false);
            setMaximized((current) => !current);
          }}
        />
        <div
          className="terminal-screen"
          ref={screenRef}
          hidden={minimized}
          onScroll={(event) => {
            const screen = event.currentTarget;
            follow.current =
              screen.scrollTop + screen.clientHeight >= screen.scrollHeight - 40;
            if (follow.current) setNewOutput(false);
          }}
          onMouseDown={(event) => {
            if (!event.target.closest("a, button, input"))
              inputRef.current?.focus();
          }}
        >
          <div className="terminal-notice">
            <p>Portfolio sandbox — read-only virtual filesystem.</p>
            <p>Type &quot;help&quot; to list available commands.</p>
          </div>
          <div
            role="log"
            aria-label="Command output"
            aria-live="off"
            className="terminal-transcript"
          >
            {entries.map((entry, index) => (
              <TerminalEntry entry={entry} key={index} />
            ))}
          </div>
          <form
            className="terminal-prompt"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="command-input">
              ashiqe@portfolio {session.cwd.replace("/home/ashiqe", "~")} %
            </label>
            <input
              ref={inputRef}
              id="command-input"
              aria-label="Terminal command"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              autoComplete="off"
              value={input}
              onChange={(event) => {
                setHistoryIndex(null);
                updateInput(event.target.value);
              }}
              onKeyDown={keyDown}
            />
          </form>
          {newOutput && (
            <button
              className="new-output"
              onClick={() => {
                const screen = screenRef.current;
                if (screen) screen.scrollTop = screen.scrollHeight;
                follow.current = true;
                setNewOutput(false);
                inputRef.current?.focus();
              }}
            >
              New output ↓
            </button>
          )}
        </div>
      </div>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
