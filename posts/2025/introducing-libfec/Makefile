dist: index.mjs
	rm -rf $@ || true
	mkdir $@
	deno bundle --minify $< -o $@/index.js