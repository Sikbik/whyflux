# Art masters

Lossless PNG masters of the generated art. The site serves the WebP
exports in public/art/, made with:

    magick assets-src/art/NAME.png -level 1%,100% -quality 84 -define webp:method=6 public/art/NAME.webp

`-level 1%,100%` crushes the 1-2/255 edge noise to true black so screen blending stays clean.
