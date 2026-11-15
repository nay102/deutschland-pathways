# Local typography

The active website uses **Poppins**, matching the supplied Wörterbuch reference. The `poppins-400.woff2`, `poppins-500.woff2`, `poppins-600.woff2`, `poppins-700.woff2`, and `poppins-800.woff2` files were copied unchanged from the adjacent `rafis-woerterbuch/assets/vendor/webfonts/` project. Its CSS confirmed the family and weight mappings. Every font loads locally through `@font-face`; no font CDN or system installation is required.

Poppins is distributed under the SIL Open Font License; the original copyright notice and full license from the [Google Fonts Poppins repository](https://github.com/google/fonts/tree/main/ofl/poppins) are included in `Poppins-OFL.txt`.

## Archived assets

These earlier local, unmodified variable TrueType assets are retained for reference and are not loaded or preloaded by the website.

- **Sora**, weights 100–800, previously used for headings and numerals. Source: [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/sora). Original downloaded filename: `Sora[wght].ttf`.
- **Manrope**, weights 200–800, previously used for body text and controls. Source: [Google Fonts repository](https://github.com/google/fonts/tree/main/ofl/manrope). Original downloaded filename: `Manrope[wght].ttf`.

Both are distributed under the SIL Open Font License. The full original license and copyright notices are included as `Sora-OFL.txt` and `Manrope-OFL.txt`. Manrope's original `FONTLOG.txt` is included as well. Keep these files with any redistributed copy of the fonts. Only the asset filenames were simplified; the font binaries were not modified.

## Bengali typography

`SolaimanLipi.ttf` is an unchanged copy of the locally installed `SolaimanLipi_20-04-07.ttf`, version 1.6.1, designed by Solaiman Karim and published by Ekushey. [OmicronLab distributes the same original filename](https://www.omicronlab.com/bangla-fonts.html). Its embedded notice identifies SIL Open Font License 1.0; the notice and full license are included in `SolaimanLipi-OFL.txt`.

The shared font stack selects SolaimanLipi for the Bengali Unicode block, Bengali danda punctuation, and joining controls. Latin text continues to use Poppins. This applies to mixed-language names, descriptions, search fields, and profile text on every page. The bundled font works without a network connection or installed system font. Keep its license with redistributed copies.
