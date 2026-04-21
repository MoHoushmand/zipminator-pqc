# Fastlane (iOS TestFlight)

Path B: CI-only TestFlight uploads via App Store Connect API key.

## Required GitHub secrets

Set these in GitHub repo settings, Secrets and variables, Actions:

- `ASC_API_KEY_ID`: Key ID from App Store Connect (Users and Access, Keys). 10-char alphanumeric.
- `ASC_API_ISSUER_ID`: Issuer ID shown at the top of the Keys page. UUID format.
- `ASC_API_KEY_CONTENT`: Base64-encoded contents of the downloaded `.p8` file. Generate with `base64 -i AuthKey_XXXXXX.p8 | pbcopy` on macOS.

Generate the API key at https://appstoreconnect.apple.com/access/api with role "App Manager" or higher. Download once; Apple does not allow re-download.

## Manual lane

```bash
cd app/ios
bundle exec fastlane beta
```

Local env requires `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, and `ASC_API_KEY_CONTENT` (base64 `.p8`).

## Verification lane

```bash
cd app/ios
bundle exec fastlane verify
```

Runs without uploading. Use in CI to smoke-test the wiring before flipping the `if` gate on the testflight job.
