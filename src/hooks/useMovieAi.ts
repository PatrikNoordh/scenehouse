/**
 * The MovieAI conversation: the messages, whether MovieAI is thinking, and
 * ask / retry. Owned by the layout, so the chat survives page changes.
 */

import { useEffect, useRef, useState } from "react";
import { askMovieAssistant } from "../api/llm";
import type { ChatMessage, ErrorMessage } from "../types/movieAi";

export type UseMovieAiResult = {
  messages: ChatMessage[];
  isThinking: boolean;
  ask: (question: string) => void;
  retry: (failed: ErrorMessage) => void;
};

/**
 * Asks only when the visitor sends a question, so the request starts in ask(),
 * not in an effect. Each question gets its own AbortController; answers that
 * arrive after a cancel are ignored. A failure adds an error bubble that
 * remembers the question — never the technical error text.
 * @returns The conversation and the ask / retry actions.
 */
export function useMovieAi(): UseMovieAiResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => controllerRef.current?.abort();
  }, []);

  /** @param question - The visitor's text; empty text and double-sends are ignored. */
  function ask(question: string) {
    const text = question.trim();
    if (text === "" || isThinking) return;

    const controller = new AbortController();
    controllerRef.current = controller;
    const questionId = crypto.randomUUID();

    setMessages((current) => [
      ...current,
      { id: questionId, role: "user", text },
    ]);
    setIsThinking(true);

    askMovieAssistant(text, controller.signal)
      .then((answer) => {
        if (controller.signal.aborted) return;
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text: answer.reply,
            movies: answer.movies,
          },
        ]);
        setIsThinking(false);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (controller.signal.aborted) return;
        setMessages((current) => [
          ...current,
          { id: crypto.randomUUID(), role: "error", question: text, questionId },
        ]);
        setIsThinking(false);
      });
  }

  /**
   * Removes the failed question and its error bubble, then asks again.
   * @param failed - The error bubble whose "Try again" was clicked.
   */
  function retry(failed: ErrorMessage) {
    setMessages((current) =>
      current.filter(
        (message) =>
          message.id !== failed.id && message.id !== failed.questionId,
      ),
    );
    ask(failed.question);
  }

  return { messages, isThinking, ask, retry };
}
