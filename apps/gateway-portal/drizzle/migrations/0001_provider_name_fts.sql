CREATE INDEX "llm_provider_name_fts_idx" ON "llm_provider" USING gin (to_tsvector('simple'::regconfig, "name"));
