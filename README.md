# Channel Point Redeemer

Displays a video/image and plays a sound when channel points are redeemed.

# Install

1. Create a custom widget
1. Open editor
1. Paste `index.html` content in HTML code
1. Paste `index.css` content in CSS code
1. Paste `index.json` content in fields code
1. Compile `index.js` into `bundle.js` with browserify (just do `make build` if docker and makefile are both installed)
1. Paste `bundle.js` content in JS code

# Settings

You can define a specific title with these peculiar values:

- `{user}` to display redeemer username
- `{price}` to display redeemed price (on play text)
- `{reward}` to display won prize (on win text)