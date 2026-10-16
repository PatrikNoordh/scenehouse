/**
 * MovieAI's browser side: sends the visitor's question to /api/ask, checks the
 * criteria that come back, and turns them into real TMDb movies. The language
 * model never picks movies itself, so it can't invent any.
 */

import type { Genre, Movie } from "../types/tmdb";
import type { MovieAiAnswer, MovieAiSort, MovieQuery } from "../types/movieAi";
import {
  discoverByQuery,
  getGenres,
  getRecommendations,
  searchMovies,
  searchPerson,
} from "./tmdb";
import {
  isRecord,
  readNullableNumber,
  readNullableString,
  readString,
  readStringArray,
} from "../utils/guards";

// Our own server function — never the model's API directly, so the key stays on the server.
const ASK_URL = "/api/ask";

// A chat shows a handful of cards, not a full page.
const MAX_RESULT = 6;

const SORT: MovieAiSort[] = ["popular", "rating", "newest"];

/**
 * An Error that also carries the HTTP status (429 busy, 502 bad answer…), or
 * null when the server couldn't be reached at all.
 */
export class LlmError extends Error {
  status: number | null;

  /**
   * @param message - A readable message, never containing a key or URL.
   * @param status - The HTTP status, or null if there was no response.
   */
  constructor(message: string, status: number | null) {
    super(message);
    this.name = "LlmError";
    this.status = status;
  }
}

/** @param value - A sort name from the model. @returns It as a MovieAiSort, or null if unknown. */
function toSort(value: string | null): MovieAiSort | null {
  return SORT.find((sort) => sort === value) ?? null;
}

/**
 * Checks the model's JSON field by field; a bad field becomes a safe default.
 * @param raw - The parsed JSON from /api/ask.
 * @throws {LlmError} With status 502 if it isn't an object at all.
 */
export function parseMovieQuery(raw: unknown): MovieQuery {
  if (!isRecord(raw)) {
    throw new LlmError("MovieAI sent an answer in the wrong format.", 502);
  }

  return {
    reply: readString(raw, "reply"),
    genres: readStringArray(raw, "genres"),
    yearFrom: readNullableNumber(raw, "yearFrom"),
    yearTo: readNullableNumber(raw, "yearTo"),
    director: readNullableString(raw, "director"),
    minRating: readNullableNumber(raw, "minRating"),
    sortBy: toSort(readNullableString(raw, "sortBy")),
    titleQuery: readNullableString(raw, "titleQuery"),
    similarTo: readNullableString(raw, "similarTo"),
  };
}

/**
 * Asks /api/ask for search criteria. A cancelled request is re-thrown as is.
 * @param question - The visitor's question.
 * @param signal - Lets the caller cancel the request.
 * @throws {LlmError} When the server can't be reached, answers with an error,
 *   or sends something that isn't valid criteria.
 */
async function fetchMovieQuery(
  question: string,
  signal?: AbortSignal,
): Promise<MovieQuery> {
  let response: Response;
  try {
    response = await fetch(ASK_URL, {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({ question }),
      signal,
    });
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new LlmError("Could not reach MovieAI.", null);
  }

  if (!response.ok) {
    throw new LlmError("MovieAI couldn't answer.", response.status);
  }

  let data: unknown;

  try {
    data = await response.json();
  } catch {
    throw new LlmError("MovieAI sent an answer in the wrong format.", 502);
  }
  return parseMovieQuery(data);
}

/**
 * Genre names → TMDb ids, ignoring case; unknown names are dropped.
 * @param names - Genre names from the model.
 * @param genres - TMDb's genre list.
 */
function toGenreIds(names: string[], genres: Genre[]): number[] {
  return names
    .map((name) =>
      genres.find((genre) => genre.name.toLowerCase() === name.toLowerCase()),
    )
    .filter((genre) => genre !== undefined)
    .map((genre) => genre.id);
}

/**
 * @param name - A person's name, e.g. a director.
 * @param signal - Lets the caller cancel the request.
 * @returns TMDb's best match's id, or null if nobody was found.
 */
async function findPersonId(
  name: string,
  signal?: AbortSignal,
): Promise<number | null> {
  const page = await searchPerson(name, 1, signal);
  return page.results[0]?.id ?? null;
}

/**
 * Picks one strategy: "similar to" → that movie's recommendations; a title →
 * title search; otherwise discover by genres, years, rating and director.
 * An unknown director gives no movies instead of ignoring the director.
 * @param query - The checked criteria.
 * @param signal - Lets the caller cancel the requests.
 */
async function findMovies(
  query: MovieQuery,
  signal?: AbortSignal,
): Promise<Movie[]> {
  if (query.similarTo !== null) {
    const found = await searchMovies(query.similarTo, 1, signal);
    const base = found.results[0];

    if (!base) return [];

    const recommended = await getRecommendations(base.id, 1, signal);
    return recommended.results;
  }

  if (query.titleQuery !== null) {
    const found = await searchMovies(query.titleQuery, 1, signal);
    return found.results;
  }

  const genres = query.genres.length > 0 ? await getGenres(signal) : [];

  const crewId =
    query.director !== null ? await findPersonId(query.director, signal) : null;

  if (query.director !== null && crewId === null) return [];

  const page = await discoverByQuery(
    {
      genreIds: toGenreIds(query.genres, genres),
      yearFrom: query.yearFrom,
      yearTo: query.yearTo,
      minRating: query.minRating,
      crewId,
      sort: query.sortBy ?? "popular",
    },
    signal,
  );
  return page.results;
}

/**
 * Answers a question with the model's sentence and up to six real TMDb movies.
 * @param question - The visitor's question, e.g. "movies by Christopher Nolan".
 * @param signal - Lets the chat cancel a question it no longer needs.
 * @returns { reply, movies }
 * @throws {LlmError} When MovieAI couldn't answer.
 */
export async function askMovieAssistant(
  question: string,
  signal?: AbortSignal,
): Promise<MovieAiAnswer> {
  const query = await fetchMovieQuery(question, signal);
  const movies = await findMovies(query, signal);

  return { reply: query.reply, movies: movies.slice(0, MAX_RESULT) };
}
