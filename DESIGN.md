# Design System Strategy: The Serpent’s Edge

## 1. Overview & Creative North Star
**Creative North Star: "The Curated Terrarium"**

This design system moves away from the "industrial" look of standard breeding sites, instead adopting a high-end editorial aesthetic that mirrors the precision and beauty of a curated exotic habitat. The system is built on **Organic Brutalism**: a framework that uses rigid, minimalist structures (inspired by shadcn/ui) but softens them through deep tonal layering, intentional asymmetry, and the juxtaposition of sharp digital precision with characterful, organic typography.

To break the "template" feel, layouts should embrace **breathtaking negative space**. Use large typography offsets where headlines bleed into margins, and treat images not as boxed content, but as focal specimens housed within sophisticated, layered glass containers.

---

## 2. Colors & Surface Architecture
The palette is rooted in the "Deep Forest" spectrum, using slate and gold to signify authority and luxury.

### The "No-Line" Rule
Sectioning must be achieved through **background shifts**, never through 1px solid lines. To separate a "Habitat Features" section from a "Genetics" section, transition from `surface` (#121414) to `surface_container_low` (#1a1c1c). This creates a seamless, "molded" look rather than a fragmented one.

### Surface Hierarchy & Nesting
Treat the interface as a physical stack of materials.
- **Base Layer:** `surface` (#121414) - The dark void of the forest.
- **Secondary Layer:** `surface_container` (#1e2020) - Used for primary content blocks.
- **Top Layer/Interactive:** `surface_container_highest` (#333535) - For cards and floating menus.

### The "Glass & Gold" Rule
- **Glassmorphism:** For floating navigation or modal overlays, use `surface_variant` (#333535) at 60% opacity with a `20px` backdrop-blur. This mimics the glass of a premium terrarium.
- **Signature Accents:** Use `tertiary` (#e9c176) exclusively for high-value interactions (e.g., "Purchase" or "Reserve"). Never use gold for decorative lines; it must represent "value."

---

## 3. Typography
The typographic soul of this system lies in the tension between the modern and the ancient.

| Level | Token | Font Family | Size | Character |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Noto Serif | 3.5rem | Bold, authoritative, organic. |
| **Headline**| `headline-md`| Noto Serif | 1.75rem | Used for specimen names. |
| **Title** | `title-lg` | Inter | 1.375rem | Medium weight, high-readability. |
| **Body** | `body-md` | Inter | 0.875rem | Regular weight, clean slate grey. |
| **Label** | `label-sm` | Inter | 0.6875rem | All-caps, wide tracking (0.1em). |

**Editorial Direction:** Use `display-lg` for impactful storytelling (e.g., "The 2024 Morph Collection") and pair it with `label-sm` in `primary` (#9ed1bd) for a technical, scientific feel.

---

## 4. Elevation & Depth
In this system, light doesn't hit the UI; it glows from within it.

* **The Layering Principle:** Avoid shadows on standard cards. Instead, place a `surface_container_highest` card on a `surface` background. The contrast in value provides the necessary lift.
* **Ambient Shadows:** For high-priority floating elements (Modals), use a shadow: `0px 20px 40px rgba(0, 0, 0, 0.4)`. The shadow color must be the `surface_container_lowest` (#0d0f0f) to maintain the dark atmosphere.
* **The "Ghost Border":** If accessibility requires a border, use `outline_variant` (#414843) at **15% opacity**. It should be felt, not seen.

---

## 5. Components

### Buttons
* **Primary:** Background: `primary` (#9ed1bd), Text: `on_primary` (#00382a). Radius: `md` (0.375rem). High-contrast, sleek.
* **Tertiary (The "Gold Standard"):** Background: `tertiary` (#e9c176), Text: `on_tertiary` (#412d00). Use only for final conversion points.
* **Ghost:** Background: Transparent, Border: `outline_variant` (#414843) at 20%.

### Cards (Specimen Display)
* **Structure:** No borders. Background: `surface_container_low`.
* **Interaction:** On hover, the background shifts to `surface_container_high`.
* **Content:** Large image at the top, `headline-sm` for the snake's name, and `label-md` for the genetic markers (using `primary_container` backgrounds).

### Input Fields
* **State:** Darkest background (`surface_container_lowest`).
* **Focus:** A subtle `primary` (#9ed1bd) 1px glow. Avoid the standard blue focus ring; use a soft `0px 0px 8px` glow of the primary green.

### Specimen "Trait" Chips
* Use `surface_variant` for the container with `on_surface_variant` text.
* **Pro-tip:** For recessive traits, use a `tertiary_container` chip to subtly highlight rarity without overwhelming the UI.

---

## 6. Do’s and Don’ts

### Do
* **DO** use asymmetric layouts. A headline might be left-aligned while the body text is tucked into a 6-column grid on the right.
* **DO** use `secondary_container` for secondary UI elements to keep the "Slate Gray" sophisticated feel.
* **DO** use the `12` (3rem) or `16` (4rem) spacing tokens between sections to allow the design to breathe.

### Don't
* **DON'T** use 100% white (#FFFFFF). Always use `on_surface` (#e2e2e2) to reduce eye strain and maintain the premium dark mode feel.
* **DON'T** use divider lines to separate list items. Use a `1px` shift in background color or `1.5` (0.375rem) vertical spacing.
* **DON'T** use sharp 90-degree corners. Even a `sm` radius (0.125rem) is required to mimic the organic nature of the brand.