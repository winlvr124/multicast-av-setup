<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules

- Simulation state (stream on/off, content, decoder statuses, event log) lives in `SimulationProvider` mounted in `src/routes/__root.tsx`, so the Dashboard and Floor Plan tabs always show the same state.
- Display/multicast rules are pure functions in `src/lib/av-sim.ts` with tests in `src/test/av-sim.test.ts`; UI components read them instead of re-deriving state.
- Floor-plan overlays use the uploaded image's pixel coordinates via an SVG viewBox of the same size, so markers stay aligned at any screen size.
- Floor-plan colour overrides (e.g. Source B tone) are scoped with the `palette-floor-plan` utility on the Floor Plan page root, so the Dashboard tab's palette stays untouched.
