# Docker Hub Image Pipeline

This repository builds and publishes the Kreds production image to Docker Hub using GitHub Actions.

## Workflow

Workflow file: `.github/workflows/build-push-harbor.yml`

Triggers:

- Push to `main`
- Manual `workflow_dispatch`

Published image format:

```text
eduhass/kreds:<12-char-git-sha>
eduhass/kreds-migrate:<12-char-git-sha>
```

The workflow intentionally does not publish `latest`.

## Required Docker Hub Setup

Create repositories `eduhass/kreds` and `eduhass/kreds-migrate` in Docker Hub before running the workflow.

Recommended Docker Hub access token permissions for pushing from CI:

- Repository: `eduhass/kreds`
- Repository: `eduhass/kreds-migrate`
- Permission: read/write

## Required GitHub Secrets

Configure these repository secrets in GitHub:

- `DOCKERHUB_USERNAME`: Docker Hub username
- `DOCKERHUB_TOKEN`: Docker Hub access token

## Deploy Tag

After a successful run, use the printed 12-character tag in the IaC manifests:

```text
eduhass/kreds:<12-char-git-sha>
eduhass/kreds-migrate:<12-char-git-sha>
```

Update both IaC files:

- `manifests/kreds/deployment.yaml`
- `manifests/kreds/migration-job.yaml`

## Security Scan

The workflow scans the built image with Trivy before pushing. It fails on HIGH or CRITICAL vulnerabilities.

## Build-Time Environment

The Docker build uses non-secret placeholder values for environment variables required by Next.js static analysis. Real runtime values are injected by Kubernetes through `kreds-secret` and `kreds-config`.

The app image uses the `runner` Docker target. The migration image uses the `migration` target and keeps the tooling required for `pnpm db:push`.
