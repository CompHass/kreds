# Harbor Image Pipeline

This repository builds and publishes the Kreds production image to Harbor using GitHub Actions.

## Workflow

Workflow file: `.github/workflows/build-push-harbor.yml`

Triggers:

- Push to `main`
- Manual `workflow_dispatch`

Published image format:

```text
harbor.hasslab.pro/kreds/kreds:<12-char-git-sha>
harbor.hasslab.pro/kreds/kreds-migrate:<12-char-git-sha>
```

The workflow intentionally does not publish `latest`.

## Required Harbor Setup

Create project `kreds` in Harbor before running the workflow.

Recommended Harbor robot account permissions for pushing from CI:

- Project: `kreds`
- Permission: push/pull repository images

## Required GitHub Secrets

Configure these repository secrets in GitHub:

- `HARBOR_USERNAME`: Harbor username or robot account name
- `HARBOR_PASSWORD`: Harbor password or robot account token

## Deploy Tag

After a successful run, use the printed 12-character tag in the IaC manifests:

```text
harbor.hasslab.pro/kreds/kreds:<12-char-git-sha>
harbor.hasslab.pro/kreds/kreds-migrate:<12-char-git-sha>
```

Update both IaC files:

- `manifests/kreds/deployment.yaml`
- `manifests/kreds/migration-job.yaml`

## Security Scan

The workflow scans the built image with Trivy before pushing. It fails on HIGH or CRITICAL vulnerabilities.

## Build-Time Environment

The Docker build uses non-secret placeholder values for environment variables required by Next.js static analysis. Real runtime values are injected by Kubernetes through `kreds-secret` and `kreds-config`.

The app image uses the `runner` Docker target. The migration image uses the `migration` target and keeps the tooling required for `pnpm db:push`.
