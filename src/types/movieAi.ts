/**
 * Shapes for MovieAI: the search criteria the language model returns, and the
 * answer the chat shows. The model only fills in criteria — the movies always
 * come from TMDb.
 */

import type { Movie, SortOption } from "./tmdb";

// The sorts MovieAI may ask for — TMDb's discover can't sort by title like the catalog does.
export type MovieAiSort = Exclude<SortOption, "title">;

// What /api/ask returns once checked. null / [] = criterion not given.
export type MovieQuery = {
  reply: string;
  genres: string[];
  yearFrom: number | null;
  yearTo: number | null;
  director: string | null;
  actor: string | null;
  minRating: number | null;
  sortBy: MovieAiSort | null;
  titleQuery: string | null;
  similarTo: string | null;
};

// What askMovieAssistant returns: the model's sentence plus real TMDb movies.
export type MovieAiAnswer = {
  reply: string;
  movies: Movie[];
};

// ==== Chat messages — one type per kind of bubble, told apart by `role` ====

export type UserMessage = {
  id: string;
  role: "user";
  text: string;
};

// movies: [] = MovieAI answered, but TMDb found nothing.
export type AssistantMessage = {
  id: string;
  role: "assistant";
  text: string;
  movies: Movie[];
};

// Remembers the failed question and its bubble, so "Try again" can resend it.
export type ErrorMessage = {
  id: string;
  role: "error";
  question: string;
  questionId: string;
};

export type ChatMessage = UserMessage | AssistantMessage | ErrorMessage;
