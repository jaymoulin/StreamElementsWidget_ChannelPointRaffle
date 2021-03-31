.PHONY: build/image build

node_modules:
	docker run --rm -v ${PWD}:/app -u $$(id -u) -w /app node:alpine yarn install
build/www:
	mkdir -p build/www
build/image: build/www
	docker build -t jaymoulin/browserify .
build: build/image node_modules
	docker run --rm -v ${PWD}:/app -u $$(id -u) jaymoulin/browserify
