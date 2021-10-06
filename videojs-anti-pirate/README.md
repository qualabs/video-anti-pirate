# videojs-anti-pirate

## Build
To build this plugin just run:
```sh
npm install
npm run build
```

When the build process finishes, use the `dist/videojs-anti-pirate-dist.js` file for distribution.

## Usage

This is the simplest case. Get the script in whatever way you prefer and include the plugin _after_ you include [video.js][videojs], so that the `videojs` global is available.

```html
<script src="//path/to/video.min.js"></script>
<script src="//path/to/videojs-anti-pirate.dist.js"></script>
<script>
  var player = videojs('my-video');
  player.antiPirate();

  player.antiPirate().src({
    src: 'https://url/index.mpd',
    server: 'https://your/license/server',
    token: 'JWT'
  })
</script>
```

## Testing
For a simple test player, after building, run:
```sh
   npx serve
```
And point your browser to [http://localhost:5000/example/](http://localhost:5000/example/)

## License
MIT. Copyright Qualabs