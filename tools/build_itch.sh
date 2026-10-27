#!/bin/sh
# Builds dist/palm-itch.zip for itch.io (HTML game, index.html at the zip root).
# Only the files the game loads go in; all paths in the game are relative, so it runs inside itch's iframe as is.
set -e
cd "$(dirname "$0")/.."
mkdir -p dist && rm -f dist/palm-itch.zip
zip -qr9 dist/palm-itch.zip index.html src sfx music.mp3 favicon.svg apple-touch-icon.png og.jpg
unzip -l dist/palm-itch.zip | tail -1
