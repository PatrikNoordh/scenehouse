/**
 * MovieAI's chat: a floating "Ask MovieAI" button and the chat panel it opens —
 * messages, movie cards, suggestion chips and the question input.
 */

import { useEffect, useRef, useState } from "react";
import type { FormEvent, MouseEvent } from "react";
import { Send, Sparkles, X } from "lucide-react";
import ScrollContainer from "react-indiana-drag-scroll";

import type { Movie } from "../../types/tmdb";
import type { ChatMessage, ErrorMessage } from "../../types/movieAi";
import MiniMovieCard from "./MiniMovieCard";
import styles from "./ChatWidget.module.css";

// Example questions, shown as chips above the input.
const SUGGESTIONS = [
  "A horror movie from the 2020s",
  "Movies by Christopher Nolan",
  "Something like Interstellar",
];

// Same limit as the server function, so the visitor can't type more than it accepts.
const MAX_QUESTION_LENGTH = 300;

type Props = {
  messages: ChatMessage[];
  isThinking: boolean;
  cartMovieIds: Set<number>;
  onAsk: (question: string) => void;
  onRetry: (failed: ErrorMessage) => void;
  onRent: (movie: Movie) => void;
  moviePath: (id: number) => string;
};

/**
 * Presentational: the conversation comes in as props and every action is
 * reported up; only whether the panel is open and the typed draft live here.
 * - The panel is a native <dialog> opened with showModal(): Esc, the focus trap
 *   and the backdrop come from the browser. Opening moves focus to the input.
 * - The message list scrolls to the newest bubble, and is an aria-live region
 *   so screen readers hear new answers.
 * - The movie cards scroll sideways with mouse drag (react-indiana-drag-scroll),
 *   swipe or Tab; hideScrollbars={false} because the library's own hiding
 *   would block trackpad and touch scrolling — the CSS hides the bar instead.
 * - Clicking a movie closes the chat, so the detail page is visible; the
 *   conversation is kept because it lives in the parent.
 * @param props.messages - The conversation, oldest first.
 * @param props.isThinking - True while a question is on its way.
 * @param props.cartMovieIds - Ids of movies already in the cart.
 * @param props.onAsk - Called with a question (typed or a suggestion).
 * @param props.onRetry - Called with the error bubble whose "Try again" was clicked.
 * @param props.onRent - Called with a movie when its Rent button is clicked.
 * @param props.moviePath - Builds the detail URL for a movie id.
 */
export default function ChatWidget({
  messages,
  isThinking,
  cartMovieIds,
  onAsk,
  onRetry,
  onRent,
  moviePath,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
      inputRef.current?.focus();
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages.length, isThinking]);

  /** Sends the typed question; ignored while MovieAI is thinking or the box is empty. */
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isThinking || draft.trim() === "") return;
    onAsk(draft);
    setDraft("");
  }

  /** A click on the backdrop lands on the <dialog> itself: close the chat. */
  function handleDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) setIsOpen(false);
  }

  /**
   * One bubble per message; the switch on `role` lets TypeScript know which
   * fields each kind of message has.
   * @param message - The message to draw.
   */
  function renderMessage(message: ChatMessage) {
    switch (message.role) {
      case "user":
        return (
          <p key={message.id} className={styles.user}>
            {message.text}
          </p>
        );

      case "assistant":
        return (
          <div key={message.id} className={styles.assistant}>
            <p className={styles.bubble}>{message.text}</p>
            {message.movies.length === 0 ? (
              <p className={styles.empty}>
                No movies matched. Try asking another way.
              </p>
            ) : (
              <ScrollContainer
                className={styles.scroller}
                vertical={false}
                hideScrollbars={false}
              >
                <ul className={styles.movies}>
                  {message.movies.map((movie) => (
                    <MiniMovieCard
                      key={movie.id}
                      movie={movie}
                      to={moviePath(movie.id)}
                      inCart={cartMovieIds.has(movie.id)}
                      onRent={() => onRent(movie)}
                      onOpen={() => setIsOpen(false)}
                    />
                  ))}
                </ul>
              </ScrollContainer>
            )}
          </div>
        );

      case "error":
        return (
          <div key={message.id} className={styles.error}>
            <p>MovieAI couldn't answer right now. Try again.</p>
            <button
              type="button"
              className={styles.retry}
              onClick={() => onRetry(message)}
              disabled={isThinking}
            >
              Try again
            </button>
          </div>
        );
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.launcher}
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        <Sparkles size={20} aria-hidden="true" />
        <span className={styles.launcherText}>Ask MovieAI</span>
      </button>

      <dialog
        ref={dialogRef}
        className={styles.panel}
        aria-labelledby="movieai-title"
        onClose={() => setIsOpen(false)}
        onClick={handleDialogClick}
      >
        <div className={styles.inner}>
          <header className={styles.header}>
            <span className={styles.avatar} aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <div>
              <h2 id="movieai-title" className={styles.title}>
                MovieAI
              </h2>
              <p className={styles.subtitle}>Finds movies in the shop</p>
            </div>
            <button
              type="button"
              className={styles.close}
              onClick={() => setIsOpen(false)}
              aria-label="Close MovieAI"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div ref={listRef} className={styles.messages} aria-live="polite">
            {messages.length === 0 && (
              <p className={styles.welcome}>
                Hi! Tell me what you're in the mood for, and I'll find movies
                in the shop.
              </p>
            )}
            {messages.map(renderMessage)}
            {isThinking && (
              <p className={styles.thinking}>MovieAI is thinking…</p>
            )}
          </div>

          <div
            className={styles.suggestions}
            role="group"
            aria-label="Suggestions"
          >
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className={styles.chip}
                onClick={() => onAsk(suggestion)}
                disabled={isThinking}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label htmlFor="movieai-input" className={styles.label}>
              Ask MovieAI
            </label>
            <input
              id="movieai-input"
              ref={inputRef}
              className={styles.input}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={MAX_QUESTION_LENGTH}
              placeholder="Describe a movie you'd like…"
              autoComplete="off"
            />
            <button
              type="submit"
              className={styles.send}
              aria-label="Send"
              disabled={isThinking || draft.trim() === ""}
            >
              <Send size={18} aria-hidden="true" />
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
