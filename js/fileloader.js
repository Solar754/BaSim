/*
* Add new scripts here
*/
let files = [
    "ba.js",
    "map.js",
    "controller.js",
    "player.js",
    "playerhealer.js",
    "playerhealerlogic.js",
    "runner.js",
    "healer.js",
    "cannon.js",
    "renderer.js",
    "rsrenderer.js",
    "item.js",
    "overlay.js",
    "simstate.js",
];
for (let file of files) {
    let new_script = document.createElement('script');
    new_script.setAttribute('src', './js/' + file);
    document.head.appendChild(new_script);
}
