SRC_DIR := posts/2024
DIST_DIR := dist/2024

serve:
	python -m http.server -d dist
site:
	deno run \
		--allow-read=.,../sqlite-vec/dist/.wasm/sqlite3.wasm \
		--allow-write=. \
		--allow-env=VSCODE_TEXTMATE_DEBUG \
		--allow-run \
		build.tsx

site-watch:
	watchexec --ignore dist/ --ignore '**/node_modules/**' -- make site

clean:
	rm -f $(DIST_DIR)/*.html
