dev:
	pnpm -r dev

check:
	cd circuits && circom verify_nonmembership.circom --r1cs --wasm -o compiled
	pnpm -r -s build || true

clean:
	rm -rf node_modules */node_modules
	rm -rf circuits/compiled circuits/target
