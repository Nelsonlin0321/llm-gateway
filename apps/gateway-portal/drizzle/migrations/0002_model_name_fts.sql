CREATE INDEX "model_name_fts_idx" ON "model" USING gin (to_tsvector('simple'::regconfig, "name"));
