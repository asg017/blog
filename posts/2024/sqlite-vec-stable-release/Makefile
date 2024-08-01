node_modules: package.json package-lock.json
	npm i
	touch $@

dist: index.js node_modules $@
	rm -rf $@ || true
	mkdir $@
	./node_modules/.bin/esbuild \
		--minify --bundle --format=esm  --splitting \
		--out-extension:.js=.min.js \
    --out-extension:.css=.min.css \
		$< --outdir=$@
	cp node_modules/lite-youtube-embed/src/lite-yt-embed.css $@
	touch $@

clean:
	rm -rf demos/
