# Icon classifiers

Models classify a crop by similarity to an embedding of every reference icon in `gk-img`.

- New cards or p-items: `pnpm refresh:classifier` re-embeds the icons; no retraining. CI does this automatically (`.github/workflows/classifier-refresh.yml`) and opens a PR.
- Retrain (`pnpm train:classifier`) only when `pnpm evaluate:classifier` drops or new art looks unlike anything before, e.g. a new idol. Real screenshot crops in `.classifier-data/<p_items|skill_cards>/<class>/` are optional extra training data.
