# TestFlight CI (fastlane Path B)

Unattended TestFlight uploads driven by GitHub Actions on `v*` tag pushes. The `beta` lane:

1. Authenticates to App Store Connect via an API key (no 2FA prompts).
2. Fetches signing assets via `match` (read-only) from a private certs repo.
3. Runs `flutter build ipa --release --export-method=app-store`.
4. Uploads the produced `.ipa` to TestFlight with `pilot`.

## Required GitHub Actions Secrets

Configure these under Settings -> Secrets and variables -> Actions in the
`QDaria/zipminator-pqc` repo (or whichever repo hosts the workflow).

| Secret | Purpose | How to obtain |
|---|---|---|
| `ASC_API_KEY_ID` | Key ID for the App Store Connect API key (e.g. `ABCDE12345`). | App Store Connect -> Users and Access -> Integrations -> App Store Connect API -> Keys. Create a key with the `App Manager` role and copy the Key ID. |
| `ASC_API_KEY_ISSUER_ID` | Issuer ID that owns the API key. | Same page as above, shown at the top of the Keys tab as `Issuer ID`. |
| `ASC_API_KEY_CONTENT` | Base64 of the `AuthKey_<KEYID>.p8` file. | Download the `.p8` from App Store Connect (only offered once). Then: `base64 -i AuthKey_ABCDE12345.p8 \| pbcopy` on macOS, or `base64 -w0 AuthKey_ABCDE12345.p8` on Linux. Paste the output as the secret value. |
| `MATCH_GIT_URL` | SSH or HTTPS URL of the private certs repo managed by `match`. | Create a dedicated private repo (e.g. `QDaria/certificates`). Run `bundle exec fastlane match init` locally to populate it with appstore certs and profiles. Use the git URL here. |
| `MATCH_PASSWORD` | Passphrase that encrypts the contents of the certs repo. | Whatever passphrase was chosen when running `fastlane match init` the first time. Store it in a password manager; rotating it re-encrypts the repo. |
| `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` | Backup credential for Transporter fallback. | Generate at https://appleid.apple.com -> Sign-In and Security -> App-Specific Passwords. Label it `fastlane CI`. |

`match` also needs SSH access to the certs repo when `MATCH_GIT_URL` is an `ssh://`
or `git@` URL. The workflow currently assumes HTTPS + token in the URL; if you
switch to SSH add a deploy key secret (`MATCH_GIT_SSH_KEY`) and wire
`ssh-agent` in the workflow before `fastlane beta`.

## Local Smoke Test (optional)

```bash
cd app/ios
bundle install
export ASC_API_KEY_ID=...
export ASC_API_KEY_ISSUER_ID=...
export ASC_API_KEY_CONTENT=$(base64 -i AuthKey_XXXXXXXX.p8)
export MATCH_GIT_URL=git@github.com:QDaria/certificates.git
export MATCH_PASSWORD=...
bundle exec fastlane beta
```

## Trigger

Push a tag matching `v*` (for example `v0.1.0`) on the default branch. The
workflow `.github/workflows/testflight.yml` reacts to the tag, builds the IPA,
and uploads to TestFlight. Build processing on Apple's side takes 10-30 minutes
after upload before the build is available to testers.

## Bumping the Build Number

Flutter injects `CFBundleShortVersionString` / `CFBundleVersion` from the
`version:` line in `app/pubspec.yaml` (format `x.y.z+buildNumber`). TestFlight
rejects duplicate build numbers for a given version, so bump the `+N` suffix
before tagging a new release.

## Follow-up TODOs Before First Run

1. Replace `TODO_ITC_TEAM_ID` and `TODO_DEVELOPER_TEAM_ID` in `Appfile`.
2. Replace the `git_url` placeholder in `Matchfile` with the real certs repo URL.
3. Run `fastlane match init` locally once to seed the certs repo.
4. Register the above 6 secrets in GitHub Actions.
5. Push a `v*` tag to trigger the first TestFlight build.
