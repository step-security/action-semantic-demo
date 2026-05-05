.PHONY: build
build:
	go build -o dist/tfclean ./cmd/tfclean

.PHONY: install
install:
	go install github.com/step-security/tfclean/cmd/tfclean

.PHONY: test
test:
	go test -race ./...