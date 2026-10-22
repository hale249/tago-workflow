.DEFAULT_GOAL := help
.PHONY: help run build fmt fmt-check vet test cover lint vulncheck ci docker

GOLANGCI_LINT ?= golangci-lint   # v2.x, built with Go >= 1.27
GOVULNCHECK   ?= govulncheck     # go install golang.org/x/vuln/cmd/govulncheck@latest

help:       ## list targets
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | sed 's/:.*## /\t/'

run:        ## all roles in one process
	go run ./cmd all
build:      ## static binary in bin/
	CGO_ENABLED=0 go build -trimpath -o bin/tago ./cmd
fmt:        ## gofmt the module
	gofmt -w .
fmt-check:  ## fail if any file is not gofmt'ed
	@out="$$(gofmt -l .)"; if [ -n "$$out" ]; then echo "gofmt needed:"; echo "$$out"; exit 1; fi
vet:        ## go vet
	go vet ./...
test:       ## tests with the race detector
	go test -race -count=1 ./...
cover:      ## tests with coverage report in bin/coverage.out
	@mkdir -p bin
	go test -race -count=1 -coverprofile=bin/coverage.out ./...
	go tool cover -func=bin/coverage.out | tail -1
lint:       ## golangci-lint (strict set, see .golangci.yml)
	@command -v $(firstword $(GOLANGCI_LINT)) >/dev/null || { echo "golangci-lint v2 not found: https://golangci-lint.run/welcome/install/"; exit 1; }
	$(GOLANGCI_LINT) run ./...
vulncheck:  ## known-vulnerability scan of code + deps
	@command -v $(firstword $(GOVULNCHECK)) >/dev/null || { echo "govulncheck not found: go install golang.org/x/vuln/cmd/govulncheck@latest"; exit 1; }
	$(GOVULNCHECK) ./...
ci: fmt-check vet test lint vulncheck  ## everything CI runs
docker:     ## container image
	docker build -t tago-backend .
