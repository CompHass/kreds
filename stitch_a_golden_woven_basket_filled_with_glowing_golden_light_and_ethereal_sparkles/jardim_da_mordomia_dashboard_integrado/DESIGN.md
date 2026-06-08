---
name: Sylvan Growth System
colors:
  surface: '#fff8f5'
  surface-dim: '#f2d4bf'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1e9'
  surface-container: '#ffeadc'
  surface-container-high: '#ffe3cf'
  surface-container-highest: '#fbddc7'
  on-surface: '#28180b'
  on-surface-variant: '#42493e'
  inverse-surface: '#3f2d1e'
  inverse-on-surface: '#ffede2'
  outline: '#72796e'
  outline-variant: '#c2c9bb'
  surface-tint: '#3b6934'
  primary: '#154212'
  on-primary: '#ffffff'
  primary-container: '#2d5a27'
  on-primary-container: '#9dd090'
  inverse-primary: '#a1d494'
  secondary: '#4c6700'
  on-secondary: '#ffffff'
  secondary-container: '#caec7d'
  on-secondary-container: '#506b03'
  tertiary: '#755b00'
  on-tertiary: '#ffffff'
  tertiary-container: '#d2a501'
  on-tertiary-container: '#503d00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#bcf0ae'
  primary-fixed-dim: '#a1d494'
  on-primary-fixed: '#002201'
  on-primary-fixed-variant: '#23501e'
  secondary-fixed: '#cdef7f'
  secondary-fixed-dim: '#b2d266'
  on-secondary-fixed: '#151f00'
  on-secondary-fixed-variant: '#394d00'
  tertiary-fixed: '#ffdf90'
  tertiary-fixed-dim: '#f0c12c'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#584400'
  background: '#fff8f5'
  on-background: '#28180b'
  surface-variant: '#fbddc7'
typography:
  headline-xl:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 24px
  element-gap: 16px
  section-margin: 48px
---

## Brand & Style

This design system shifts away from artificial neon aesthetics toward a **Premium Organic** style. It captures the tranquility of a misty morning in a lush forest, designed to feel nurturing, growth-oriented, and approachable for children while maintaining a high-end, polished execution for adult users.

The visual narrative is built on "Atmospheric Organicism"—a blend of natural textures and modern digital glass.
- **Glassmorphism (Morning Mist):** Surfaces use "frosted leaf" effects—high-performance background blurs with soft white tints and organic, non-linear edge highlights that mimic dew on a petal.
- **Organic Geometry:** Departure from rigid squares. Containers use variable corner radii and "blob" shapes to mimic the unpredictability of nature.
- **Tone & Voice:** Encouraging and playful. The UI acts as a digital gardener, guiding the user through progress with tactile feedback and soft, welcoming visuals.

## Colors

The palette is rooted in the "Deep Forest" spectrum, replacing synthetic purples with earthy, grounding tones.

- **Primary (Emerald/Moss):** Used for core branding and significant actions. It provides deep contrast against the misty background.
- **Secondary (Sage/Leaf):** Used for success states, progress bars, and growth indicators.
- **Tertiary (Primícias Gold):** A soft, sun-drenched highlight reserved for achievements, premium features, and special "blooming" moments.
- **Neutral (Earth Brown):** Used primarily for typography and structural grounding to ensure readability and a sense of stability.
- **Gradients:** Use "Photosynthetic Gradients"—transitions from deep emerald to vibrant sage, avoiding pure black or gray in favor of tinted deep greens.

## Typography

The typography strategy balances friendly accessibility with modern precision. 

- **Display & Headlines:** **Plus Jakarta Sans** is used for its soft, rounded terminals that feel welcoming to younger audiences while remaining clean and professional. It should be typeset with tight letter-spacing for a premium, editorial feel.
- **Body & Interface:** **Be Vietnam Pro** provides exceptional legibility for both children and adults. Its contemporary structure feels fresh and pairs perfectly with the organic UI elements.
- **Hierarchy:** Use Earth Brown (#4A3728) for headings to provide a softer, more natural contrast than pure black. Secondary body text should use a desaturated Forest Green to maintain the monochromatic harmony of the environment.

## Layout & Spacing

The layout follows a **Fluid Organic Grid**. While structure is maintained for usability, the spacing rhythm is designed to feel "breathable" and less rigid.

- **Safe Margins:** Large 24px outer margins provide a frame for the content, emphasizing the "window into the forest" metaphor.
- **Floating Containers:** Components often "float" over the background mist, using generous padding (32px+) to prevent the UI from feeling cramped.
- **Asymmetric Balance:** For storytelling sections (like children's progress), allow for slight offsets in element positioning to mimic the natural growth of a forest floor.
- **Responsive Behavior:** On mobile, components transition to full-width cards with large touch targets (minimum 48px height) to accommodate younger users' motor skills.

## Elevation & Depth

Depth is created through **Atmospheric Layering** rather than traditional shadows.

1.  **The Mist Layer (Base):** A soft, tinted background gradient (#F0F4F0 to #FFFFFF).
2.  **The Frosted Leaf (Surface):** Glassmorphic containers with a `backdrop-filter: blur(20px)` and a subtle `0.5px` inner border colored in a semi-transparent Sage Green. 
3.  **The Canopy (High Elevation):** Elements that need immediate attention use a very soft, diffused shadow tinted with the primary green (#2D5A27 at 8% opacity) to feel as if they are floating above the mist.
4.  **Tactile Press:** Interactive elements do not just "sink"; they should feel "squishy" or "organic," utilizing slight scale downs (0.98x) and inner glows when active.

## Shapes

The shape language is defined by **Softened Bio-curves**.

- **Primary Shapes:** Standard containers use a base 16px (rounded-lg) radius.
- **Organic Modifiers:** Interactive "Growth" cards use irregular border radii (e.g., `40% 60% 70% 30% / 40% 50% 60% 50%`) to create pebble-like or leaf-like forms.
- **Buttons:** Buttons are consistently pill-shaped to provide a safe, friendly silhouette for children and a modern "app" feel for adults.
- **Icons:** Icons must have rounded caps and joins, with a slightly heavier stroke weight (2px) to feel substantial and tactile.

## Components

### Buttons
Primary buttons use a "Sunkissed Gradient" (Sage to Emerald) with a subtle golden inner glow on the top edge. Secondary buttons use the "Frosted Leaf" glass style with Forest Green text.

### Progress Indicators (The Sapling)
Instead of standard bars, use growing vines or filling leaf shapes. As the user nears completion, the "Primícias Gold" highlight begins to "bloom" at the tip of the indicator.

### Cards & Containers
Cards should always feature a soft backdrop blur. For children's content, cards can include 3D organic "stickers"—high-fidelity renders of mossy rocks, acorns, or saplings that overlap the card's boundaries.

### Input Fields
Inputs are grounded with Earth Brown borders (at 20% opacity) that thicken and turn Emerald Green on focus. The cursor should be the Primary Emerald color.

### Iconography & Imagery
- **3D Assets:** Use high-detail, "squishy" 3D models of trees and plants. They should have a soft, matte texture rather than a shiny plastic look.
- **Illustrations:** Use hand-drawn, textured brushes to add a "storybook" quality to instructional screens.