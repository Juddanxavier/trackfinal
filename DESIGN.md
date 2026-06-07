---
name: Gajan Traders
description: Shipment tracking and logistics interface
colors:
  primary: "#e63329"
  secondary: "#c5e98a"
  neutral-bg: "#f0eeeb"
  neutral-ink: "#131818"
  neutral-muted: "#5a5a5a"
typography:
  display:
    fontFamily: "ABC Normal, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 8vw, 5.5rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-1.76px"
  heading:
    fontFamily: "ABC Normal, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.25rem, 3vw, 1.625rem)"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-0.48px"
  title:
    fontFamily: "ABC Normal, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.57
    letterSpacing: "-0.22px"
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 2
    letterSpacing: "0.05em"
    textTransform: "uppercase"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "16px 28px"
    typography: "body"
    fontWeight: 600
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.lg}"
    padding: "16px 28px"
    border: "1px solid {colors.neutral-ink}20"
    typography: "body"
    fontWeight: 600
  input-text:
    backgroundColor: "#ffffff"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.lg}"
    padding: "16px 48px 16px 16px"
    border: "1px solid #e4e4e4"
  card-default:
    backgroundColor: "#ffffff"
    textColor: "{colors.neutral-ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-ink}"
    typography: "label"
    textTransform: "uppercase"
---

# Design System: Gajan Traders

## 1. Overview

**Creative North Star: "The Manifest"**

A logistics manifest is functional, precise, and trustworthy. Every item has its place. No decorative flourishes, no ornament — just clear information in a deliberate hierarchy. The interface earns trust through clarity and speed, not visual appeal.

The system treats red as signal, not decoration. `#e63329` appears only where action is demanded: primary buttons, active states, urgent status indicators. Against the warm neutral ground (`#f0eeeb`), the red doesn't shout — it directs. The charcoal ink (`#131818`) holds a 13.5:1 contrast against the background, ensuring body text is never a readability question.

**Key Characteristics:**
- Flat by default: depth through tonal layering, not shadows
- Red as a functional signal, not an accent for its own sake
- Two-typeface system: ABC Normal for display/headings (personality), Inter for body (readability)
- Generous whitespace around information blocks; tight spacing inside them
- No decorative borders, no gradient text, no glass effects

## 2. Colors

Red as active signal on a warm neutral ground. Secondary green for positive confirmation states only.

### Primary
- **Signal Red** (`#e63329`): Primary buttons, active navigation indicators, the "Track Now" CTA, shipment status badges for exceptions. Never used on backgrounds or decorative elements. Its rarity is the point.

### Secondary
- **Mint** (`#c5e98a`): Positive status indicators (delivered, confirmed), secondary accents on success states. Never used for interactive elements.

### Neutral
- **Warm Paper** (`#f0eeeb`): Page background. The interface ground. Creates the warm-logistics feel without being a literal white app.
- **Ink** (`#131818`): Body text, headings, primary content. Near-black with subtle warmth.
- **Muted Ink** (`#5a5a5a`): Secondary text, metadata, timestamps. Holds a 4.7:1 contrast against the page background — meets WCAG AA for body text.
- **Surface** (`#ffffff`): Cards, inputs, elevated containers. Pure white against the warm ground for clear separation.

### Named Rules
**The Signal Rule.** Red is used on less than 10% of any given screen. It appears on interactive elements only — never on backgrounds, dividers, or decorative accents. If red occupies more than one element per viewport tier, one of them is wrong.

## 3. Typography

**Display Font:** ABC Normal (with Inter as fallback for unsupported environments)
**Body Font:** Inter (with system-ui fallback)
**Label/Mono Font:** Inter

**Character:** ABC Normal brings a slightly compressed, efficient character to headings — fitting for a logistics interface where every pixel is cargo space. Inter handles body copy with neutral, highly readable proportions. The pairing is purposeful contrast: display type with personality, body type that gets out of the way.

### Hierarchy
- **Display** (Semi Bold, clamp 2.5rem–5.5rem, 1.0 line-height): Hero headlines on the landing page. Reserved for the main value proposition.
- **Heading** (Semi Bold, clamp 1.25rem–1.625rem, 1.45 line-height, -0.48px tracking): Section headers, modal titles, card headings.
- **Title** (Semi Bold, 1.375rem, 1.57 line-height, -0.22px tracking): Sub-section headers, feature titles.
- **Body** (Regular, 1rem, 1.43 line-height, max-width 65ch): Paragraphs, descriptions, tracking event descriptions.
- **Label** (Semi Bold, 0.75rem, 2.0 line-height, 0.05em tracking, uppercase): Navigation links, section eyebrows, form labels, metadata tags.

### Named Rules
**The Manifest Rule.** Every heading earns its place. If a heading can be removed without losing information, remove it. The typography hierarchy is a cargo list, not a table of contents.

## 4. Elevation

Flat by default. The system uses tonal separation — white surfaces against a warm paper background — rather than shadows to create depth. This keeps the interface calm and legible, avoids the "stacked papers" visual noise that plagues logistics dashboards.

- **Surface separation**: achieved through background color contrast (white cards on `#f0eeeb`), not box-shadows.
- **Interactive elevation**: buttons and interactive elements have no resting shadow. On hover, a subtle inset or tint change replaces shadow.

## 5. Components

### Buttons
- **Shape:** Rounded rectangle (12px radius)
- **Primary:** Signal Red (`#e63329`) background, white text, semi-bold weight. Padding: 16px top/bottom, 28px left/right. Text is sentence case.
- **Hover:** Darken primary by 8% (no shadow). Transition: 200ms ease.
- **Focus:** 2px ring offset 2px, using primary at 30% opacity.
- **Secondary / Ghost:** Transparent background, ink text, 1px border at 12% ink opacity. Hover: background fills to 5% ink.

### Cards / Containers
- **Corner Style:** 16px radius (xl)
- **Background:** White (`#ffffff`)
- **Shadow Strategy:** None. Separation is purely tonal against the `#f0eeeb` page background.
- **Border:** None for default cards. Tracking result cards use a subtle 1px `#e4e4e4` border for event separation on white backgrounds.
- **Internal Padding:** 20px standard.

### Inputs / Fields
- **Style:** White background, 1px solid `#e4e4e4` stroke, 12px radius.
- **Focus:** Border shifts to Signal Red, 2px ring at 10% red opacity.
- **Placeholder:** Muted Ink (`#5a5a5a`) — meets 4.5:1 contrast against white.
- **Error:** Red border with red-tinted background at 5% opacity.

### Navigation
- **Style:** Clean type-driven nav. Links use the Label typography (0.75rem, uppercase, semi-bold).
- **Default:** Muted Ink (`#5a5a5a`).
- **Hover:** Full Ink (`#131818`), underline indicator from left.
- **Active / Current:** Full Ink with Signal Red underline indicator.

### Timeline (Tracking Page)
- **Style:** Vertical line + dot system. Past events use gray filled dots. Current event uses Signal Red dot with ring. Future events use hollow dots.
- **Spacing:** 28px vertical gap between events. 40px left gutter for the dot+line column.
- **Dot size:** 8px for past/future, 12px for current event.

## 6. Do's and Don'ts

### Do:
- **Do** use Signal Red for exactly one interactive element per viewport tier (the primary action).
- **Do** separate surfaces through background color, never shadows.
- **Do** keep body text at Muted Ink (`#5a5a5a`) or darker. No light gray text on white.
- **Do** use the two-typeface system: ABC Normal for display/headings, Inter for everything else.
- **Do** let white space replace decorative elements. If a section feels empty, add breathing room, not ornaments.

### Don't:
- **Don't** use red for backgrounds, dividers, or decorative accents. Red is for interaction only.
- **Don't** use gradient text (`background-clip: text` with gradient). Emphasis comes from weight or size.
- **Don't** use glassmorphism, blurred backdrops, or frosted effects.
- **Don't** use side-stripe borders (border-left/right > 1px as accent).
- **Don't** stack cards inside cards. Nested cards are prohibited.
- **Don't** use bounce or elastic easing on transitions. Standard cubic-bezier only.
- **Don't** use marketing buzzwords in UI text ("streamline", "empower", "seamless", "next-generation").
- **Don't** use tiny uppercase tracked eyebrows above every section. One is voice; repetition is AI grammar.
- **Don't** ship motion that has no `prefers-reduced-motion` fallback.
