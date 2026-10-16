export type Movie = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  voteAverage: number;
  genreIds: number[];
};

export type Genre = {
  id: number;
  name: string;
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  profilePath: string | null;
};

export type Video = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

export type ReleaseCertification = {
  country: string;
  certification: string;
};
export type MovieDetails = Movie & {
  tagline: string;
  runtime: number | null;
  genres: Genre[];
  cast: CastMember[];
  crew: CrewMember[];
  videos: Video[];
  releaseCertifications: ReleaseCertification[];
  recommendations: Movie[];
};

export type Person = {
  id: number;
  name: string;
  profilePath: string | null;
  knownForDepartment: string;
  knownFor: Movie[];
};

export type PagedResponse<T> = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
};

export type SortOption = "popular" | "rating" | "newest" | "title";

export type DiscoverFilters = {
  genreId: number | null;
  sort: SortOption;
};

// MovieAI's discover criteria, already as TMDb ids. null / [] = no limit.
export type DiscoverQuery = {
  genreIds: number[];
  yearFrom: number | null;
  yearTo: number | null;
  minRating: number | null;
  crewId: number | null;
  sort: SortOption;
};

// What the user picked in the catalog; stored in the URL as ?q=&genre=&sort=.
// query '' = not searching.
export type CatalogFilters = DiscoverFilters & {
  query: string;
};

export type ImageSize = "profile" | "poster" | "backdrop";
