site: dist

sqlite3.wasm:
	curl -L -o $@ https://github.com/asg017/blog/releases/download/blobs/sqlite3.wasm

sqlite3.mjs:
	curl -L -o $@ https://github.com/asg017/blog/releases/download/blobs/sqlite3.mjs

movies.bit.db:
	curl -L -o $@ https://github.com/asg017/blog/releases/download/blobs/movies.bit.db


node_modules: package.json package-lock.json
	npm i
	touch $@

dist: index.js hero.js sqlite.js styles.css node_modules Makefile movies.bit.db sqlite3.wasm sqlite3.mjs
	rm -rf $@ || true
	mkdir $@
	./node_modules/.bin/esbuild \
		--minify --bundle --format=esm  --splitting \
		--out-extension:.js=.min.js \
    --out-extension:.css=.min.css \
		$< --outdir=$@
	cp sqlite3.wasm $@
	cp movies.bit.db $@
	touch $@

clean:
	rm -rf node_modules/ dist/ movies.bit.db sqlite3.wasm sqlite3.mjs

.PHONY: site clean
