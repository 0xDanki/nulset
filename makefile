dev:
	pnpm -r dev

check:
	cd circuits && nargo compile
	pnpm -r -s build || true

clean:
	rm -rf node_modules */node_modules
