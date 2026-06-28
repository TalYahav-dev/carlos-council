# UX / UI Review — Carlos Council

_Reviewed as if preparing for the first public users. Honest about strengths and gaps._

## Overall impression

The product is **more polished than most early repos**. It has a coherent design system, a
warm and restrained palette (stone neutrals + an amber/gold accent), tasteful serif/sans
pairing (Instrument Serif + DM Sans), real-time streaming with a typewriter effect, phase
progress, session history, and a reduced-motion path. The core experience — watching six
agents think and argue — is genuinely compelling.

The biggest gap is **identity**: the product is named after a dog who is meant to be its
emotional anchor, but Carlos was almost invisible in the UI.

## What was weak before

| Area | Issue |
|------|-------|
| **Carlos presence** | Only a gold "C" letter badge, a small star, and a paw icon in one loading state. No face, no warmth, no story in the product. |
| **First-run / blank canvas** | The landing page is an empty textarea. New users get no examples and no sense of what a good brief looks like. |
| **Onboarding** | No guidance on the four phases or what to expect before the first run. |
| **Empty states** | Session history has a basic "no sessions" line; the main view shows little before a session starts. |
| **Accessibility** | Minimal ARIA labels; decorative SVGs mostly fine, but interactive controls (icon buttons) lack labels; focus states are inconsistent. |
| **Copy tone** | Competent but corporate. Carlos's "wise companion" character barely came through. |
| **Theme** | Light mode only (acceptable, but worth noting). |

## What was improved in this pass

- **Carlos has a face.** Added an original `carlos-mark.svg` — a paw at the center of a
  four-point strategy compass (the four phases). It's now the **favicon** and the **hero
  badge** on the default landing layout.
- **Warm guide line.** The hero now reads: _"Carlos brings the council to order — and
  stays until you have a plan worth keeping."_ — establishing him as a steady companion
  without being childish.
- **First-run onboarding.** Added **example-brief starter chips** under the composer
  (shown only when empty) so a new user can launch a real council in one click and learn
  by example.
- **Consistent identity** across favicon, README hero, and docs.

These are deliberately **additive and low-risk** — they don't touch the streaming engine
or the existing layout logic, and they respect `prefers-reduced-motion`.

## What still needs future design work

1. **A real Carlos illustration.** The SVG mark is a strong placeholder, but the product
   deserves a proper character — a warm, grounded dog who appears in the hero, the
   clarification moment ("Carlos is thinking…"), and the final-plan reveal. Production
   prompts are ready in [`ASSET_GENERATION_PLAN.md`](ASSET_GENERATION_PLAN.md).
2. **Onboarding flow.** A first-visit overlay or 3-step "how the council works" explainer
   would orient newcomers to the four phases.
3. **Empty states with personality.** "No sessions yet — give Carlos something to chew
   on" style copy, paired with the mark.
4. **Accessibility pass.** Label every icon button, ensure visible focus rings, verify
   keyboard navigation through the brief → clarify → replay flow, and check color contrast
   on muted text (`--text-muted` on `--bg` is borderline for small text).
5. **Mobile polish.** The layout is responsive, but test touch targets, the session
   sidebar open/close, and the clarification form on small screens.
6. **Dark mode.** The CSS-variable system makes this cheap to add later.
7. **Loading-moment delight.** The clarification pause and final synthesis are natural
   places for a small Carlos moment (a calm "the council is deliberating" beat).

## Accessibility quick checklist (for contributors)

- [ ] All icon-only buttons have `aria-label`.
- [ ] Visible focus states on all interactive elements.
- [ ] Keyboard path: compose brief → submit → answer clarification → read final.
- [ ] Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text.
- [ ] `prefers-reduced-motion` respected (already true for animations).
- [ ] Streaming output is announced politely (consider `aria-live="polite"`).
