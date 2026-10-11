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

}
export type MovieDetails = Movie & { 
    tagline: string;
    runtime: number | null;
    genres: Genre[];
    cast: CastMember[];
    crew: CrewMember[];
    videos: Video[];
    releaseCertifications: ReleaseCertification[];
    recommendations: Movie[];
}

export type Person = {
    id: number;
    name: string;
    profilePath: string | null;
    knownForDepartment: string;
    knownFor: Movie[];
}

export type PagedResponse<T> = { 
    page: number;
    totalPages: number;
    totalResults: number;
    results: T[];
}

export type SortOption = 'popular' | 'rating' | 'newest' | 'title';

export type DiscoverFilters = {
    genreId: number | null;
    sort: SortOption;
}

export type ImageSize = 'profile' | 'poster' | 'backdrop';


