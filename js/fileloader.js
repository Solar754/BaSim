/*
* Add new scripts here
*/
let files = [
    "ba.js",
    "map.js",
    "player.js",
    "runner.js",
    "healer.js",
    "renderer.js",
    "rsrenderer.js",
    "item.js",
    "overlay.js",
    "simstate.js",
    "controller.js"
];
for (let file of files) {
    let new_script = document.createElement('script');
    new_script.setAttribute('src', './js/' + file);
    document.head.appendChild(new_script);
}
