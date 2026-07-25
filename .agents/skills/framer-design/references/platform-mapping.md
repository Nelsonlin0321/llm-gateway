# Framer - Platform Mapping

## 1. HTML / CSS / WEB

### Font Loading

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### CSS Custom Properties

```css
:root {
  --background: #050608;
  --bg: var(--background);
  --surface1: #0D0F14;
  --surface2: #1E222B;
  --surface3: #373B47;
  --border: #1E222B;
  --border-visible: #373B47;
  --text1: #FFFFFF;
  --text2: #D8D9DE;
  --text3: #7C8190;
  --text4: #5B6070;
  --accent: #0A84FF;
  --accent-subtle: #041220;
  --success: #2FBE74;
  --success-bg: #12482B;
  --warning: #E7A93D;
  --warning-bg: #6A4512;
  --error: #F25555;
  --error-bg: #6B1717;

  --font-display: "Outfit", system-ui, sans-serif;
  --font-body: "Inter", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace;

  --text-display: 64px;
  --text-heading: 42px;
  --text-subheading: 24px;
  --text-body: 15px;
  --text-body-sm: 14px;
  --text-caption: 12px;
  --text-label: 11px;

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
  --radius-control: 8px;
  --radius-component: 16px;
  --radius-container: 24px;
  --radius-pill: 999px;

  --ease-fast: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-medium: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-slow: cubic-bezier(0.2, 0.8, 0.2, 1);
  --duration-fast: 140ms;
  --duration-medium: 220ms;
  --duration-slow: 320ms;

  --shadow-1: 0 14px 28px rgba(0, 0, 0, 0.22);
  --shadow-2: 0 20px 48px rgba(0, 0, 0, 0.30);
  --shadow-3: 0 32px 72px rgba(0, 0, 0, 0.42);
}

[data-theme="light"] {
  --background: #FFFFFF;
  --bg: var(--background);
  --surface1: #F6F6F7;
  --surface2: #EBEBEE;
  --surface3: #D8D9DE;
  --border: #EBEBEE;
  --border-visible: #D8D9DE;
  --text1: #050608;
  --text2: #5B6070;
  --text3: #7C8190;
  --text4: #A9ADB8;
  --accent: #0067D9;
  --accent-subtle: #EDF7FF;
  --success: #2FBE74;
  --success-bg: #EEF9F3;
  --warning: #E7A93D;
  --warning-bg: #FFF7E8;
  --error: #F25555;
  --error-bg: #FFF0F0;
  --shadow-1: 0 10px 30px rgba(9, 12, 18, 0.06);
  --shadow-2: 0 18px 42px rgba(9, 12, 18, 0.10);
  --shadow-3: 0 24px 64px rgba(9, 12, 18, 0.16);
}
```

## 2. SWIFTUI / iOS

### Font Registration

- Use `Outfit` for display.
- Use `Inter` for body.
- Use `IBMPlexMono` for code and traces.
- Register the fonts in the app bundle if you are not using system substitutes.

### Color Extension

```swift
import SwiftUI

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(.sRGB,
                  red: Double(r) / 255,
                  green: Double(g) / 255,
                  blue: Double(b) / 255,
                  opacity: Double(a) / 255)
    }
}

extension Color {
    static let framerBackground = Color(hex: "050608")
    static let framerSurface1 = Color(hex: "0D0F14")
    static let framerSurface2 = Color(hex: "1E222B")
    static let framerSurface3 = Color(hex: "373B47")
    static let framerBorder = Color(hex: "1E222B")
    static let framerBorderVisible = Color(hex: "373B47")
    static let framerText1 = Color(hex: "FFFFFF")
    static let framerText2 = Color(hex: "D8D9DE")
    static let framerText3 = Color(hex: "7C8190")
    static let framerText4 = Color(hex: "5B6070")
    static let framerAccent = Color(hex: "0A84FF")
    static let framerAccentSubtle = Color(hex: "041220")
}
```

### Font Extension

```swift
import SwiftUI

extension Font {
    static func framerDisplay(_ size: CGFloat, weight: Font.Weight = .semibold) -> Font {
        .custom("Outfit", size: size).weight(weight)
    }

    static func framerBody(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .custom("Inter", size: size).weight(weight)
    }

    static func framerMono(_ size: CGFloat, weight: Font.Weight = .medium) -> Font {
        .custom("IBM Plex Mono", size: size).weight(weight)
    }

    static let framerHero = framerDisplay(64, weight: .semibold)
    static let framerHeading = framerDisplay(42, weight: .semibold)
    static let framerSubheading = framerDisplay(24, weight: .semibold)
    static let framerBodyText = framerBody(15)
    static let framerBodySmall = framerBody(14)
    static let framerCaption = framerBody(12, weight: .medium)
    static let framerLabel = framerMono(11, weight: .semibold)
}
```

## 3. REACT / TAILWIND

### `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: {
          1: "var(--surface1)",
          2: "var(--surface2)",
          3: "var(--surface3)",
        },
        border: {
          DEFAULT: "var(--border)",
          visible: "var(--border-visible)",
        },
        text: {
          1: "var(--text1)",
          2: "var(--text2)",
          3: "var(--text3)",
          4: "var(--text4)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          subtle: "var(--accent-subtle)",
        },
        success: {
          DEFAULT: "var(--success)",
          bg: "var(--success-bg)",
        },
        warning: {
          DEFAULT: "var(--warning)",
          bg: "var(--warning-bg)",
        },
        error: {
          DEFAULT: "var(--error)",
          bg: "var(--error-bg)",
        },
      },
      fontFamily: {
        display: ["Outfit", "system-ui", "sans-serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
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
      borderRadius: {
        element: "4px",
        control: "8px",
        component: "16px",
        container: "24px",
        pill: "999px",
      },
      boxShadow: {
        1: "var(--shadow-1)",
        2: "var(--shadow-2)",
        3: "var(--shadow-3)",
      },
    },
  },
  plugins: [],
};
```

### Notes

- Use `font-display` only for hero moments, canvas titles, and high-contrast section heads.
- Use `font-mono` for shortcuts, traces, and code-like tokens.
- Keep `accent` usage narrow and intentional.
