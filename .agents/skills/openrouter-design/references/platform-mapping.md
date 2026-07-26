# OpenRouter - Platform Mapping

## Font loading (required)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap" rel="stylesheet" />
```

Observed production also loads proprietary **Gordita** for brand lockups. Free previews use Plus Jakarta Sans for both display and body.

Icons (fallback):

```html
<link rel="stylesheet" href="https://unpkg.com/lucide-static@1.8.0/font/lucide.css" />
```

---

## CSS custom properties

```css
:root,
[data-theme="light"] {
  --background: #fcfcfe;
  --bg: var(--background);
  --surface1: #ffffff;
  --surface2: #f4f4f5;
  --surface3: #e4e4e7;
  --border: #e4e4e7;
  --border-visible: #d4d4d8;
  --text1: #03080a;
  --text2: #71717a;
  --text3: #a1a1aa;
  --text4: #d4d4d8;
  --accent: #7624f4;
  --accent-subtle: rgba(118, 36, 244, 0.08);
  --accent-foreground: #fcfcfe;
  --accent-hover: #7624f4e0;
  --success: #00bf6f;
  --warning: #ffab00;
  --error: #ff2d55;
  --success-bg: #e8fbf3;
  --warning-bg: #fff8e6;
  --error-bg: #fff0f3;

  --font-display: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-body: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --display: 56px;
  --heading: 24px;
  --subheading: 18px;
  --body: 16px;
  --body-sm: 14px;
  --caption: 12px;
  --label: 12px;

  --space-2xs: 2px;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --space-3xl: 64px;
  --space-4xl: 96px;

  --radius-element: 4px;
  --radius-control: 6px;
  --radius-component: 8px;
  --radius-container: 12px;
  --radius-pill: 999px;

  --shadow-1: 0 1px 3px rgba(3, 8, 10, 0.06), 0 1px 2px rgba(3, 8, 10, 0.04);
  --shadow-2: 0 4px 12px rgba(3, 8, 10, 0.08);
  --shadow-3: 0 16px 40px rgba(3, 8, 10, 0.12);

  --ease: cubic-bezier(0.2, 0.8, 0.2, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 320ms;
}

[data-theme="dark"],
:root[data-theme="dark"] {
  --background: #03080a;
  --bg: var(--background);
  --surface1: rgba(252, 252, 254, 0.02);
  --surface2: rgba(252, 252, 254, 0.04);
  --surface3: rgba(252, 252, 254, 0.08);
  --border: rgba(252, 252, 254, 0.08);
  --border-visible: rgba(252, 252, 254, 0.14);
  --text1: #fcfcfe;
  --text2: #A1A1AA;
  --text3: rgba(252, 252, 254, 0.45);
  --text4: rgba(252, 252, 254, 0.28);
  --accent: #7624f4;
  --accent-subtle: rgba(118, 36, 244, 0.08);
  --accent-foreground: #fcfcfe;
  --accent-hover: #7624f4e0;
  --success: #00bf6f;
  --warning: #ffab00;
  --error: #ff2d55;
  --success-bg: rgba(0, 191, 111, 0.08);
  --warning-bg: rgba(255, 171, 0, 0.08);
  --error-bg: rgba(255, 45, 85, 0.08);

  --shadow-1: none;
  --shadow-2: 0 8px 24px rgba(0, 0, 0, 0.35);
  --shadow-3: 0 20px 48px rgba(0, 0, 0, 0.45);
}

/* Prefer dark as product default when no theme is set in this skill's previews */
html.openrouter-dark,
body[data-theme="dark"] {
  color-scheme: dark;
}

body {
  margin: 0;
  font-family: var(--font-body);
  font-size: var(--body);
  line-height: 1.5;
  background: var(--background);
  color: var(--text1);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, .display {
  font-family: var(--font-display);
  letter-spacing: -0.02em;
}

.mono, code, kbd, pre {
  font-family: var(--font-mono);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 32px;
  border-radius: var(--radius-control);
  font-size: var(--body-sm);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: background var(--duration-fast) var(--ease),
    color var(--duration-fast) var(--ease),
    border-color var(--duration-fast) var(--ease),
    opacity var(--duration-fast) var(--ease);
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-foreground);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: transparent;
  color: var(--text1);
  border: 1px solid var(--border-visible);
}

.btn-secondary:hover {
  background: var(--surface2);
}

.card {
  background: var(--surface1);
  border: 1px solid var(--border);
  border-radius: var(--radius-component);
  padding: var(--space-lg);
}
```

---

## Tailwind (`tailwind.config` extend)

```js
// tailwind.config.js - fragment
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface1: "var(--surface1)",
        surface2: "var(--surface2)",
        surface3: "var(--surface3)",
        border: "var(--border)",
        "border-visible": "var(--border-visible)",
        text1: "var(--text1)",
        text2: "var(--text2)",
        text3: "var(--text3)",
        text4: "var(--text4)",
        accent: "var(--accent)",
        "accent-subtle": "var(--accent-subtle)",
        "accent-foreground": "var(--accent-foreground)",
        success: "var(--success)",
        warning: "var(--warning)",
        error: "var(--error)",
        ink: "#03080a",
        cloud: "#fcfcfe",
        volt: "#c8ff00",
        grape: "#7624f4",
        royal: "#035ade",
        coral: "#ff6849",
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ['"Plus Jakarta Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        element: "4px",
        control: "6px",
        component: "8px",
        container: "12px",
      },
      spacing: {
        "2xs": "2px",
        xs: "4px",
        sm: "8px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        "2xl": "48px",
        "3xl": "64px",
        "4xl": "96px",
      },
    },
  },
};
```

---

## SwiftUI (approximate)

```swift
import SwiftUI

extension Color {
  static let orInk = Color(red: 0.012, green: 0.031, blue: 0.039)      // #03080A
  static let orCloud = Color(red: 0.988, green: 0.988, blue: 0.996)    // #FCFCFE
  static let orVolt = Color(red: 0.784, green: 1.0, blue: 0.0)         // #C8FF00
  static let orGrape = Color(red: 0.463, green: 0.141, blue: 0.957)    // #7624F4
  static let orRoyal = Color(red: 0.012, green: 0.353, blue: 0.871)    // #035ADE
  static let orSuccess = Color(red: 0.0, green: 0.749, blue: 0.435)
  static let orError = Color(red: 1.0, green: 0.176, blue: 0.333)
  static let orWarning = Color(red: 1.0, green: 0.671, blue: 0.0)
}

extension Font {
  static func orDisplay(_ size: CGFloat = 34) -> Font {
    .system(size: size, weight: .bold, design: .rounded)
  }
  static func orBody(_ size: CGFloat = 16) -> Font {
    .system(size: size, weight: .regular, design: .default)
  }
  static func orMono(_ size: CGFloat = 13) -> Font {
    .system(size: size, weight: .regular, design: .monospaced)
  }
}

struct ORPrimaryButtonStyle: ButtonStyle {
  var dark: Bool = true
  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.system(size: 14, weight: .medium))
      .foregroundStyle(dark ? Color.orInk : Color.orCloud)
      .padding(.horizontal, 32)
      .frame(height: 44)
      .background(Color.orGrape) // Accent primary both modes; orVolt is brand-mark only
      .clipShape(RoundedRectangle(cornerRadius: 6, style: .continuous))
      .opacity(configuration.isPressed ? 0.8 : 1)
  }
}
```

---

## Brand color anchors (always available)

| Name | Hex | Role |
|------|-----|------|
| `or-ink` | `#03080A` | Dark canvas |
| `or-cloud` | `#FCFCFE` | Light canvas / dark text |
| `or-volt` | `#C8FF00` | Brand mark only |
| `or-grape` / Accent | `#7624F4` | Dark + light primary |
| `or-royal` | `#035ADE` | Links / charts |
| `or-coral` | `#FF6849` | Accent secondary |
