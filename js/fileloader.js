let files = [
    "ba.js",
    "map.js",
    "player.js",
    "runner.js",
    "healer.js",
    "renderer.js",
    "rsrenderer.js",
    "simstate.js",
    "item.js"
];

for (let file of files) {
    let my_awesome_script = document.createElement('script');
    my_awesome_script.setAttribute('src', './js/' + file);
    document.head.appendChild(my_awesome_script);
}
