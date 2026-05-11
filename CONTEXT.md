# Phase 1: Gajan Traders Homepage Redesign - Discuss Phase

## Project Overview
- **Project**: Gajan Traders - single-brand international courier company (NOT a multi-carrier platform/marketplace)
- **Current State**: Simple homepage exists at `apps/web/app/page.tsx`
- **Goal**: Complete redesign with modern SaaS + logistics hybrid aesthetic
- **Reference Brands**: TrackingMore (clean SaaS), Garudavega (trusted courier)

---

## Tech Stack
- **Framework**: Next.js 16.1.7 with Turbopack
- **Styling**: Tailwind CSS v4, shadcn/ui (radix-nova style)
- **Animations**: framer-motion ^12.38.0
- **Icons**: lucide-react
- **Fonts**: Geist (sans + mono)
- **Language**: TypeScript
- **Package Manager**: pnpm

---

## Design Direction

### Color Palette
- **Primary**: Blue-based (`--primary: 221.2 83.2% 53.3%`)
- **Target**: Blue/navy/emerald gradients (not currently implemented)
- **Background**: White/light with dark contrast sections
- **UI Elements**: Glassmorphism, soft shadows, rounded-2xl containers

### Typography
- **Font**: Geist Sans (already configured)
- **Hierarchy**: Large typography with strong hierarchy
- **Style**: Professional sans-serif, clean and modern

### Visual Style
- Minimal but visually rich
- Soft gradients, floating UI cards
- Subtle animations and microinteractions (framer-motion)
- Aviation/logistics inspired visuals
- Modern fintech startup appearance
- NOT a marketplace/carrier aggregation feel

---

## Required Sections (9 Total)

### 1. Hero Section
**Components**:
- Bold headline
- Tracking input (prominent, accessible)
- CTA buttons (Get Quote, Track Package)
- Animated world map (or air cargo visuals)
- Badge: "Delivering to 200+ Countries Worldwide"

**States**:
- Default: Clean, promotional feel
- With tracking input: Shows tracking form
- Animations: Fade-in on load, subtle parallax

### 2. Trust Metrics Section
**Stats**:
- Countries served
- Parcels delivered
- Years in business
- Success rate
- Customer satisfaction

**Style**: Grid layout, animated counters, professional presentation

### 3. Services Section
**7 Services**:
1. International Courier
2. Express Delivery
3. Student Baggage
4. Food Items (international)
5. Documents
6. Business Logistics
7. Door Pickup

**Layout**: Card grid with icons, hover effects
**Style**: Glassmorphic cards, rounded-2xl

### 4. Shipment Tracking Experience
**Components**:
- Timeline-based UI
- Delivery status cards
- Progress indicators

**Design**: TrackingMore-style clean tracking interface
**States**: In transit, customs, delivered, exception

### 5. Why Choose Us Section
**6 Features**:
1. Fast customs clearance
2. Secure packaging
3. Affordable pricing
4. Live tracking
5. 24/7 support
6. Worldwide network

**Layout**: Two-column (features list + visual), checkmarks

### 6. Global Coverage Section
**Components**:
- Interactive world map
- Highlighted destination countries
- Route animations (airplane paths)

**Implementation**: SVG map or library (react-simple-maps, leaflet, etc.)
**Fallback**: Static map with highlighted regions

### 7. Testimonials Section
**Style**: Premium card layout
**Content**: International delivery success stories
**Demographics**: Students, families, businesses, NRIs

### 8. Mobile App/Dashboard Section
**Features**:
- Shipment updates
- Booking
- Pickup scheduling
- Notifications

**Layout**: Device mockup showcase

### 9. CTA Section
**Headline**: "Ship Worldwide With Confidence"
**Buttons**: Get Quote, Contact Sales
**Style**: Gradient background, centered

---

## Gray Areas / Decisions Needed

### Map Implementation
- **Option A**: SVG-based map (react-simple-maps) - lighter, customizable
- **Option B**: Leaflet/Mapbox - interactive, but heavier
- **Option C**: CSS/PNG based with CSS animations
- **Decision**: Need to determine if real map interactivity required or decorative

### Animation Budget
- **Scope**: Which sections need animations vs static?
- **Performance**: Limit animations on mobile
- **Recommendation**: Core animations on hero, scroll-triggered for other sections

### World Map Data
- **Question**: Should destinations be configurable (CMS) or hardcoded?
- **Recommendation**: Start with hardcoded 10-15 major countries

### Testimonials Source
- **Question**: Static content or from API?
- **Recommendation**: Static for Phase 1, API-ready structure

### Icon Library
- **Current**: lucide-react (already installed)
- **Question**: Need custom logistics icons?
- **Recommendation**: Use lucide-react + custom SVG for specialized icons (plane, package)

### Color Scheme Specifics
- **Emerald accent**: Need hex values for emerald gradients
- **Navy depth**: Define navy gradient range
- **Recommendation**:
  - Primary Blue: #3B82F6 to #1E40AF (blue-500 to blue-900)
  - Emerald accent: #10B981 to #047857 (emerald-500 to emerald-700)
  - Navy: #0F172A to #1E3A5F (slate-900 to blue-900 range)

---

## Technical Constraints

### Performance
- Minimize large assets (map SVGs, high-res images)
- Lazy load below-fold sections
- Optimize animations for 60fps
- Mobile-first responsive breakpoints

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation for tracking input
- Proper contrast ratios
- Screen reader support for map (alt text)

### Browser Support
- Modern browsers (last 2 versions)
- Progressive enhancement for animations

---

## File Structure
```
apps/web/
├── app/
│   ├── page.tsx           # Homepage (to be redesigned)
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles + CSS variables
├── components/
│   └── ui/                # shadcn/ui components
├── lib/
│   └── utils.ts           # Utility functions
```

---

## Implementation Order (Recommended)
1. Global styles + color variables update
2. Header component (navigation)
3. Hero section with world map
4. Trust metrics with animated counters
5. Services grid
6. Tracking experience section
7. Why choose us
8. Global coverage map
9. Testimonials
10. Mobile app section
11. Final CTA
12. Footer

---

## Success Criteria
- [ ] Single-brand feel (NOT marketplace)
- [ ] Premium, trustworthy appearance
- [ ] All 9 sections implemented
- [ ] Smooth animations (framer-motion)
- [ ] Mobile responsive
- [ ] Fast load times
- [ ] Clean code, maintainable structure
