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
