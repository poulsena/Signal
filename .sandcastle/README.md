# Sandcastle workflow

This project runs every model through Osaurus's OpenAI-compatible Chat
Completions API and uses upstream Pi as the coding harness:

1. `openai-chatgpt/gpt-5.6-sol` plans from a read-only Sandcastle branch.
2. A configured local Osaurus model implements on a named branch.
3. The workflow runs `pnpm check`, unit tests, and a production build.
4. `openai-chatgpt/gpt-5.6-sol` reviews an isolated fork of the implementation
   branch.
5. A rejection and the verification output return to the same local Pi
   session for repair. The loop runs up to three times by default.
6. Only an approved, green implementation branch is fast-forwarded into the
   original host branch. A moved or tracked-dirty host branch aborts the merge.

Review branches cannot alter the implementation branch. Planner or reviewer
mutations are treated as gate failures. Untracked host files are allowed and
are not copied into Sandcastle worktrees.

## One-time setup

1. Open Osaurus's Management window with `Cmd+Shift+M`.
2. Under **Providers**, add OpenAI and use browser sign-in with the ChatGPT /
   Codex account. Confirm `openai-chatgpt/gpt-5.6-sol` appears in the model
   list.
3. Under **Models**, install or select the local coding model you want to use.
   This setup defaults to `qwen3.8-27b-mxfp8`.
4. Keep the Osaurus server loopback-only. Docker Desktop reaches it through
   `host.docker.internal`; LAN exposure and an Osaurus access key are not
   required on this Mac.
5. Copy `.sandcastle/.env.example` to `.sandcastle/.env`, then verify or change
   the exact model IDs returned by:

   ```sh
   curl http://127.0.0.1:1337/v1/models
   ```

6. Build the sandbox image:

   ```sh
   pnpm sandcastle:build
   ```

The real `.sandcastle/.env`, logs, Pi sessions, worktrees, and shared pnpm
cache are ignored by Git. Osaurus keeps the upstream OpenAI credential in the
macOS Keychain; it is never copied into the container. The container sends no
Osaurus or OpenAI credential.

## Pi provider

The image installs the upstream Pi release Sandcastle's resumable provider is
designed for. `pi-models.json` defines Osaurus as an `openai-completions`
provider. Its placeholder key only satisfies Pi's custom-provider schema;
Osaurus ignores it on the loopback connection and no real credential enters
the container.

Pi and Sandcastle share the native `~/.pi/agent/sessions` layout, so rejected
reviews resume the original implementation conversation instead of starting a
context-free repair. Keep Pi pinned and repeat the model/tool and session-resume
smoke tests before updating Pi, Sandcastle, or Osaurus.

## Run it

The normal issue flow selects the next open `ready-for-agent` issue:

```sh
pnpm sandcastle
```

You can select a particular ready issue or run an ad-hoc task:

```sh
pnpm sandcastle -- --issue 123
pnpm sandcastle -- --task "Add the requested validation"
pnpm sandcastle -- --task-file /path/to/task.md
```

Issue lookup uses the host's GitHub CLI login. The agents receive the issue
text in their prompts and do not receive GitHub credentials or permission to
change issue state.

Commit the workflow setup before its first real run. The runner requires a
clean tracked worktree so it can prove that the reviewed branch is exactly the
branch being merged; untracked drafts may remain present.

## Failure behavior

- Failed checks or a rejected review go back to the local implementer.
- Missing or malformed structured review output aborts without merging.
- Exhausting the review rounds aborts and leaves the implementation branch for
  inspection.
- A changed host `HEAD`, tracked host edits, or a non-fast-forward merge aborts
  even after approval.
- Logs and captured role sessions live under `.sandcastle/` and remain local.
