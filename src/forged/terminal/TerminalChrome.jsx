import PropTypes from "prop-types";
import { ExternalLink } from "../ui";

const formatPromptPath = (path) => path.replace("/home/ashiqe", "~");

function Output({ item }) {
  if (item.kind === "project")
    return (
      <div className="terminal-project">
        <h2>{item.project.title}</h2>
        <p>{item.project.description}</p>
        <p>{item.project.tools.join(" · ")}</p>
        <ExternalLink href={item.project.github}>
          {item.project.github}
        </ExternalLink>
        <ExternalLink href={item.project.demo}>{item.project.demo}</ExternalLink>
      </div>
    );
  if (item.kind === "link")
    return (
      <p className="terminal-line">
        <ExternalLink href={item.href}>{item.text} ↗</ExternalLink>
      </p>
    );
  return <p className="terminal-line">{item.text}</p>;
}
Output.propTypes = { item: PropTypes.object.isRequired };

export function TerminalEntry({ entry }) {
  return (
    <section
      className={[
        "terminal-entry",
        entry.error && "terminal-error",
        entry.completion && "terminal-completions",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <p className="terminal-command">
        <span>ashiqe@portfolio {formatPromptPath(entry.cwd)} %</span>{" "}
        {entry.command}
      </p>
      {entry.output.map((item, index) => (
        <Output key={index} item={item} />
      ))}
    </section>
  );
}
TerminalEntry.propTypes = { entry: PropTypes.object.isRequired };

export function TerminalTitlebar({
  minimized,
  maximized,
  onClose,
  onMinimize,
  onMaximize,
}) {
  return (
    <header className="terminal-titlebar">
      <div className="terminal-window-controls" aria-label="Window controls">
        <button
          className="terminal-close"
          aria-label="Close terminal"
          onClick={onClose}
        />
        <button
          className="terminal-minimize"
          aria-label={minimized ? "Restore terminal" : "Minimize terminal"}
          aria-pressed={minimized}
          onClick={onMinimize}
        />
        <button
          className="terminal-maximize"
          aria-label={
            maximized ? "Exit full-screen terminal" : "Maximize terminal"
          }
          aria-pressed={maximized}
          onClick={onMaximize}
        />
      </div>
      <h1>ashiqe — zsh — portfolio</h1>
      <span className="terminal-titlebar-spacer" aria-hidden="true" />
    </header>
  );
}
TerminalTitlebar.propTypes = {
  minimized: PropTypes.bool.isRequired,
  maximized: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onMinimize: PropTypes.func.isRequired,
  onMaximize: PropTypes.func.isRequired,
};
