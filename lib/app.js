// base modules
window.jQuery = $ = require('jquery');
require('bootstrap/dist/css/bootstrap.min.css');
require('bootstrap');
// core modules
Url = require("url");
Core = require('./core.js');
Audio = require('./audio.js');
Video = require('./video.js');
// app modules
require('./sidebar.css');
Ui = require('./sidebar.js');

window.addEventListener('beforeunload', (event) => {
    //event.preventDefault();
    //event.returnValue = '';
    Ui.store(); // store to cookie
});