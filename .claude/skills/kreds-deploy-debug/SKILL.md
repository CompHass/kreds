---
name: kreds-deploy-debug
description: Diagnose why kreds.hasslab.pro is running a stale version, deploy didn't show up, or ArgoCD looks out of sync. Use whenever a bug report says "not seeing my changes in prod", "deploy didn't work", "still old version", "ArgoCD out of sync", or after pushing to main and the site doesn't reflect it.
metadata:
  domain: devops
  triggers: deploy, argocd, stale version, out of sync, image tag, rollout, gitops, kustomize, prod not updated
  scope: kreds
---

# Kreds Deploy Debug — GitOps Pipeline Trace

Kreds deploys via CI → `CompHass/iac` commit → ArgoCD auto-sync (see CLAUDE.md "Deploy Strategy").
There is no `argocd-image-updater` wiring on this app — the CI job is the only thing that bumps
image tags. When prod looks stale, walk the pipeline in order; don't just restart pods.

## Step 1 — Did the CI job actually run and push a new tag?

```bash
gh run list --repo eduhass/kreds --workflow build-push-harbor.yml --limit 5
gh run view --repo eduhass/kreds <run-id> --log | grep -i "update-manifests\|newTag\|error"
```

If the run failed at `build-scan-push` (Trivy gate) or never triggered, that's the root cause —
no image was pushed, so nothing downstream can update.

**Known footgun (see CLAUDE.md):** the `update-manifests` step sets `TAG` for `yq`'s `strenv(TAG)`.
If `TAG` isn't `export`ed, `yq` silently writes `newTag: ""`, kustomize ignores the empty tag, and
the deployment stays pinned to the old tag *while CI reports success*. Check the actual diff in the
`iac` commit (step 3) — don't trust a green CI run alone.

## Step 2 — Did the image actually land in the registry?

```bash
docker manifest inspect docker.io/eduhass/kreds:<expected-tag> >/dev/null && echo "exists"
```

## Step 3 — Did `iac` get the commit with the right tag?

```bash
git -C /path/to/iac log --oneline -5 -- manifests/kreds/kustomization.yaml
git -C /path/to/iac show HEAD -- manifests/kreds/kustomization.yaml
```

Confirm `newTag` in the diff matches the tag from step 1/2. If it's empty or unchanged, that's the
`TAG` export footgun above — fix the workflow step, don't patch the manifest by hand as a permanent fix.

## Step 4 — Is ArgoCD actually synced to that commit?

```bash
kubectl config use-context hasslab-k3s
kubectl -n argocd get application kreds -o jsonpath='{.status.sync.status} {.status.health.status}{"\n"}'
kubectl -n argocd get application kreds -o jsonpath='{.status.sync.revision}{"\n"}'
```

Compare `revision` against the `iac` commit SHA from step 3. If ArgoCD is behind:
```bash
kubectl -n argocd get application kreds -o yaml | grep -A5 syncPolicy   # confirm automated+selfHeal still set
argocd app sync kreds   # or via kubectl patch if argocd CLI isn't logged in
```

## Step 5 — Is the running pod actually on the new image?

```bash
kubectl -n kreds get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[0].image}{"\n"}{end}'
```

If ArgoCD says synced but the pod still shows the old image tag, check for a stuck rollout
(`kubectl -n kreds rollout status deployment/kreds`) or an `imagePullBackOff`.

## Quick triage table

| Symptom | Most likely stage |
|---|---|
| CI run red | Step 1 — fix the workflow/tests, nothing else matters yet |
| CI green but `iac` diff shows `newTag: ""` | Step 1 footgun — unexported `TAG` in the workflow |
| `iac` has correct tag, ArgoCD `sync.status != Synced` | Step 4 — force sync or check `selfHeal` got disabled |
| ArgoCD `Synced`+`Healthy` but pod image is old | Step 5 — rollout stuck, or you're reading a stale `kubectl` cache — re-fetch |
