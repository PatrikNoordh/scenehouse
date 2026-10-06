interface ImportMetaEnv {
  readonly VITE_TMDB_KEY: string | undefined;
  readonly VITE_YOUTUBE_KEY: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
