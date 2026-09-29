# Stage 6: AI Content Studio

Stage 6 passed the user's physical Android device testing and is approved for finalization on `development`. Final mobile typecheck and Expo Doctor (21/21) passed again before committing. The implementation and earlier test history are recorded below; earlier pending-approval notes are superseded by this approval.

## Architecture and behavior

- The existing local AI gateway and Ollama provider remain the only inference path. No paid provider, API key, model or timeout change was introduced. The follow-up preview cleanup adds SDK-compatible view capture and sharing dependencies.
- The existing generation endpoint accepts an optional typed content action alongside the original category request. Regenerate uses that original context; other actions use current editable content. Content language is independent of the global UI language.
- Whole-content tools: Regenerate, Shorten, Expand, Improve, four tones, Native Language/Pure Tamil, and Translate. Section tools: Rewrite, Shorten, Expand, Improve, four tones and Native Language. Section responses must match a strict single-field runtime schema; full responses must match the category schema. Existing controlled JSON repair is retained.
- Simple, Traditional, Positive and Premium are prompt instructions, not text substitutions. All six languages have localized controls. Tamil uses the Pure Tamil action; translation changes content language without changing the app language.
- A root ContentStudioProvider owns the active session, original request, current content, selected tone, pending action, errors and bounded 20-version Undo/Redo history. Manual editing remains enabled during inference. Late responses cannot overwrite concurrent edits; section actions preserve unrelated fields. One Retry is shown for a failed action.
- Drafts use an AsyncStorage adapter over a validated, versioned repository. Saves are serialized, updates retain identity/creation date, and corrupt storage is reported rather than overwritten. Up to 100 drafts are retained. History is session-only; saved drafts survive restart. Asset references remain URIs.
- Projects lists local drafts and reopens them into the Studio. Unsaved session replacement requires confirmation. Continue to Design passes a copied structured snapshot (content, language, original context and brand data) into the existing editor; it does not add a rendering/export engine.

## Files created

- `app/studio.tsx`
- `src/components/ContentStudio.tsx`
- `src/components/confirmStudioReplacement.ts`
- `src/i18n/studioStrings.ts`
- `src/providers/ContentStudioProvider.tsx`
- `src/screens/ContentStudioScreen.tsx`
- `src/screens/ProjectsScreen.tsx`
- `src/services/storage/contentDraftRepository.ts`
- `src/services/storage/contentDraftStorage.ts`
- `src/state/contentStudioStore.ts`
- `src/types/contentStudio.ts`
- `server/test/studio.test.ts`
- `server/STAGE_6_REPORT.md`

## Files modified

- `app/(tabs)/projects.tsx`
- `app/_layout.tsx`
- `src/i18n/strings.ts`
- `src/screens/CreatePosterScreen.tsx`
- `src/screens/PosterEditorScreen.tsx`
- `src/services/ai/aiClient.ts`
- `src/services/ai/useGeneration.ts`
- `server/src/ai/gateway.ts`
- `server/src/ai/localProvider.ts`
- `server/src/ai/mockProvider.ts`
- `server/src/ai/outputSchemas.ts`
- `server/src/ai/promptBuilder.ts`
- `server/src/ai/types.ts`
- `server/src/validation/generationRequest.ts`

Removed: `src/components/GeneratedContentEditor.tsx`, replaced by the Studio. The unrelated untracked root `App.tsx` was left untouched.

## Verification

| Check | Result |
| --- | --- |
| Mobile `npm run typecheck` | PASS |
| `npx expo-doctor` | PASS, 21/21 |
| Astrology/i18n/brand regression tests | PASS, 35/35 |
| Backend `npm run typecheck` | PASS |
| Backend `npm test` | PASS, 29/29 |
| Backend `npm run build` | PASS |
| Android production bundle export | PASS, 1,322 modules |
| Translation coverage | 306 keys in all six languages; 37 new Studio keys |
| Category coverage | All 22 category draft round-trips and section contracts tested |
| `git diff --check` | PASS |

Real local-AI tests through the mobile client and LAN backend passed:

- Tamil: Generate (47.1s), Shorten Career (17.6s), Positive tone (38.0s), Native Language (32.7s).
- English: Generate (21.2s), Improve (25.3s), Expand Career (10.2s), Translate to Tamil (47.4s).
- Final-build Tamil Career Rewrite: PASS, HTTP 200, real local inference, 19.8s. Both localhost and LAN health checks passed.
- The workflow asserted unrelated sections remained unchanged, original English request context remained English after translation, and lucky number was preserved.
- Manual edit/Undo and save/reopen/design snapshot round-trips passed in the Windows workflow with an injected storage adapter. Automated tests additionally cover AI failure, edits during inference, stale sessions, corrupt storage and save races.
- Physical AsyncStorage restoration, touch targets, keyboard behavior and visual quality still require the Android test below. Automated checks and a bundle export do not substitute for that test.

Environment files and local test artifacts remain ignored. See the follow-up results below for new preview dependencies and current warnings.

## Follow-up: poster preview cleanup

The duplicated multiline editor below the poster has been removed. Content remains editable in the Studio. The poster renders category sections individually, with separate gold headings, generous line height, and the saved brand contact information inside the canvas. Presentation controls never write to the generated text, original request or selected language.

Native layout measurements reduce body text from a responsive 14–18sp starting size to a 12sp minimum. If the content still needs more space, the canvas grows vertically; there is no fixed height, line truncation or hidden overflowing text. This intentionally favors readable, complete content over a fixed aspect ratio for very long Tamil text.

Style, Zodiac, Font and Background controls work independently. Zodiac changes only the displayed badge, not the generated prediction or original request. Explicit Poster Preview and Design Controls headings separate the areas.

PNG/JPEG buttons capture only the non-collapsible PosterCanvas native view and open the system share sheet. Navigation, floating settings, section headings outside the canvas and design controls are siblings/ancestors, not capture children. Temporary captures are released after sharing. This is a basic canvas capture, not a template/export engine or automatic gallery save.

Additional files created: `src/components/PosterCanvas.tsx`, `src/i18n/previewStrings.ts`.
Additional files changed: `src/screens/PosterEditorScreen.tsx`, `src/i18n/strings.ts`, `package.json`, `package-lock.json`, `app.json`, and this report.
Dependencies installed using Expo: `react-native-view-shot` 5.1.0 and `expo-sharing` ~57.0.22.

Follow-up verification:

- Mobile typecheck: PASS.
- Expo Doctor: PASS, 21/21.
- Regression tests: PASS, 35/35; now 320 keys in all six languages.
- Android bundle: PASS, 1,331 modules.
- Isolated React interaction test with eight near-700-character Tamil sections: every section rendered once; all 5 styles, 12 zodiac choices, 3 fonts and 3 backgrounds preserved exact frozen content and language. Simulated long native measurements exercised the 12sp floor without truncation. Both export callbacks targeted only the poster ref. Native layout and capture modules were mocked in this test; it does not prove device rendering or image contents.
- No accessible Android device/ADB was available. Actual Tamil glyph rendering, long-canvas overflow and PNG/JPEG image inspection remain PENDING on the user's device.
- npm audit reports 14 moderate advisories in the dependency tree, no high/critical advisories. No forced upgrades were applied. Terminal colour and Git line-ending notices are also present.

On Android, reopen a long Tamil draft and Continue to Design. Confirm all eight sections occur once inside the poster. Cycle presentation controls and verify text/language remain unchanged. Export PNG and JPEG, open both images and check the complete poster, brand information and final section are present with no screen controls. Stop for device approval; do not commit/push.

## Final zodiac consistency correction

This correction supersedes the earlier badge-only Zodiac behavior. The preview previously allowed its displayed sign to drift away from the original generation request, while output validation checked structure rather than sign names.

The original request's `zodiacId` is now authoritative for generation, Studio operations and poster display. The Zodiac control opens an explanatory confirmation and returns to Create with the current category, content language and zodiac preselected. The user selects a new sign and explicitly generates matching content. Existing edits remain until replacement is confirmed; no content is silently relabeled, deleted or regenerated.

A shared validator scans every generated field for other signs using all six translated names, native inflection stems, common romanizations and symbols. The local provider allows one repair under the existing deadline; persistently inconsistent output fails with `ZODIAC_MISMATCH`. The gateway, mobile response parser, Studio design handoff and poster/export guards independently enforce consistency. Older drafts/manual edits remain recoverable in the Studio, but conflicting text cannot be used as a poster or exported until corrected. This is a zodiac-name consistency check, not a calculation or verification of astrological predictions.

Local Ollama calls now use a stable context-derived seed and temperature zero. Identical requests get identical seeds; changing zodiac/language changes the seed. This follows [Ollama's documented seed behavior](https://docs.ollama.com/modelfile#valid-parameters-and-values). The existing local model is retained, with no paid provider or API keys. Repeatability is scoped to the same model/runtime and request; model/runtime upgrades are not promised byte-identical results.

Real backend tests using the mobile client, all eight Daily Rasi fields, and live local inference:

| Case | Result | HTTP | Time |
| --- | --- | --- | --- |
| Aries, English | PASS | 200 | 29.8s |
| Aquarius, English | PASS | 200 | 15.5s |
| Mesham (Aries), Tamil | PASS | 200 | 23.6s |
| Kumbam (Aquarius), Tamil | PASS | 200 | 22.5s |
| Repeated identical Aries English request | PASS, byte-identical content | 200 | 8.9s |

Aries and Aquarius results differed in both languages. All responses passed schema, language metadata, request-zodiac identity and cross-language sign-name checks.

Final checks: mobile typecheck PASS; Expo Doctor 21/21 PASS; backend typecheck/build PASS; backend tests 36/36 PASS; existing regression tests 35/35 PASS with 321 keys in six languages; diff whitespace check PASS. The new tests cover every section against all 12 signs in six languages, native aliases/inflections, repeatable seeds, one repair, final rejection and preserving manual edits. Mocked-native React checks also verify that incorrect legacy content hides the poster/disables exports and all presentation controls preserve text/language. These tests do not replace real Android rendering verification.

Files created for this correction:

- `src/features/astrology/zodiacConsistency.ts`
- `server/src/ai/generationSeed.ts`
- `server/test/zodiacConsistency.test.ts`

Files modified for this correction:

- `server/src/ai/gateway.ts`
- `server/src/ai/localProvider.ts`
- `server/src/ai/mockProvider.ts`
- `server/src/ai/promptBuilder.ts`
- `src/services/ai/aiClient.ts`
- `src/services/ai/errorMessages.ts`
- `src/types/generation.ts`
- `src/state/contentStudioStore.ts`
- `src/components/ContentStudio.tsx`
- `src/screens/CreatePosterScreen.tsx`
- `src/screens/PosterEditorScreen.tsx`
- `src/i18n/previewStrings.ts`
- `server/STAGE_6_REPORT.md`

No dependencies, secrets or environment settings were changed for this correction. Branch remains `development`. No commit or push.

## Android approval checklist

Keep the Windows computer and phone on the same LAN. The verified backend address is `http://192.168.1.2:3001`; it may change if DHCP assigns another address. Ollama stays loopback-only; the backend listens on `0.0.0.0:3001`. Health is available at `/health`.

Start Expo from a PowerShell window if it is not running:

```powershell
Set-Location E:\AstroPosterAI
npx expo start --lan --clear
```

1. Tamil -> Daily Rasi Palan -> Generate. Confirm the Studio opens.
2. Edit Career manually, then use Career's AI Edit -> Shorten. Confirm every other section stays unchanged.
3. Apply Positive tone, then Pure Tamil. Undo the last AI action and optionally Redo.
4. Save Draft, reopen it from Projects, and verify content after an app restart.
5. Continue to Design and verify the structured content/context is carried into the existing preview.
6. Generate English content, Improve, Expand Career, then Translate to Tamil. Verify the global UI language does not change and all fields remain editable.
7. Check keyboard scrolling, action sheets and Tamil readability. During an AI action, edit text and confirm a late result cannot erase it.
8. With the backend temporarily unavailable, verify existing content remains visible and exactly one Retry appears; restore the backend and retry.

Stop after device testing and obtain the user's PASS before committing or pushing. No Stage 7 features are included.
