node_modules: package.json
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
	touch $@

clean:
	rm -rf demos/
