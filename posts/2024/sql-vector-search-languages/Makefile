demos:
	mkdir -p $@

demos/demo.bun.ts: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-bun/demo.ts
demos/demo.deno.ts: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-deno/demo.ts
demos/demo.mjs: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-node/demo.mjs
demos/demo.py: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-python/demo.py
demos/demo.c: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-c/demo.c
demos/demo.go: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-go/demo.go
demos/demo.rb: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-ruby/demo.rb
demos/demo.rs: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-rust/demo.rs
demos/demo.sql: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-sqlite/demo.sql
demos/index.html: demos
	curl -L -o $@ https://github.com/asg017/sqlite-vec/raw/main/examples/simple-wasm/index.html

all: demos/demo.bun.ts demos/demo.deno.ts demos/demo.mjs demos/demo.py demos/demo.c demos/demo.go demos/demo.rb demos/demo.rs demos/demo.sql demos/demo.py demos/index.html


node_modules: package.json package-lock.json
	npm i
	touch $@

dist: index.js all node_modules
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
