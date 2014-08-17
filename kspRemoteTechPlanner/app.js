﻿/// <reference path="scripts/typings/jquery/jquery.d.ts" />
/// <reference path="scripts/typings/easeljs/easeljs.d.ts" />
/// <reference path="scripts/typings/createjs-lib/createjs-lib.d.ts" />
/// <reference path="scripts/typings/tweenjs/tweenjs.d.ts" />
/// <reference path="model/body.ts" />
/// <reference path="model/bodydata.ts" />
/// <reference path="model/userdata.ts" />
/// <reference path="model/antenna.ts" />
/// <reference path="model/antennadata.ts" />
/// <reference path="model/satellites.ts" />
/// <reference path="view/entireview.ts" />
/// <reference path="view/nightview.ts" />
// values
var _body;
var _antenna;
var _satellites;

// Entire View
var stageEntire;
var viewEntire;

// Night View
var stageNight;
var viewNight;

// startup
$(function () {
    init();
});

// method definitions
function init() {
    // init values
    _body = new Body();
    _antenna = new Antenna();
    _satellites = new Satellites();
    _satellites.antenna = _antenna;
    _satellites.body = _body;

    // init views
    stageEntire = new createjs.Stage($("canvas#entire")[0]);
    viewEntire = new EntireView(stageEntire, 10000, 800);
    viewEntire.body = _body;
    viewEntire.satellites = _satellites;

    stageNight = new createjs.Stage($("canvas#night")[0]);
    viewNight = new NightView(stageNight, 5000, 400);
    viewNight.body = _body;
    viewNight.satellites = _satellites;

    // load user data
    var cookieExists = UserData.loadCookie();
    if (cookieExists.body) {
        for (var i in UserData.userBodies) {
            addUserDataSelection("body", UserData.userBodies[i].name);
        }
    }
    if (cookieExists.antenna) {
        for (var i in UserData.userAntennas) {
            addUserDataSelection("antenna", UserData.userAntennas[i].name);
        }
    }

    // add event handlers
    $("select#body").on("change", onBodySelect);
    $("button.manual-input#body_detail").on("click", function (ev) {
        $("div.manual-input#body").slideToggle();
    });
    $("button.manual-input#body_reset").on("click", function (ev) {
        onBodySelect(ev);
    });

    $("button.manual-input#body_add").on("click", onUserBodyAdd);
    $("button.manual-input#body_remove").on("click", onUserBodyRemove);

    $("select#antenna").on("change", onAntennaSelect);
    $("button.manual-input#antenna_detail").on("click", function (ev) {
        $("div.manual-input#antenna").slideToggle();
    });
    $("button.manual-input#antenna_reset").on("click", function (ev) {
        onAntennaSelect(ev);
    });

    $("button.manual-input#antenna_add").on("click", onUserAntennaAdd);
    $("button.manual-input#antenna_remove").on("click", onUserAntennaRemove);

    $("form#calculator").find("input,select").on("keypress", function (ev) {
        if (ev.keyCode == 13)
            update();
    });
    $("button#calculate").on("click", function (ev) {
        update();
    });
    $("button#reset").on("click", function (ev) {
        reset();
    });

    // finallize
    reset();
    update();
}

function update() {
    // update objects
    _body.name = $("input#body_name").val();
    _body.color = $("input#body_color").val();
    _body.radius = parseFloat($("input#body_radius").val());
    _body.stdGravParam = parseFloat($("input#body_stdGravParam").val());
    _body.soi = parseFloat($("input#body_soi").val());

    _antenna.name = $("input#antenna_name").val();
    if ($("input#antenna_type").val() == "omni") {
        _antenna.type = 0 /* omni */;
    } else if ($("input#antenna_type").val() == "dish") {
        _antenna.type = 1 /* dish */;
    }
    _antenna.range = parseFloat($("input#antenna_range").val());
    _antenna.elcConsumption = parseFloat($("input#antenna_elcConsumption").val());

    _satellites.count = parseInt($("input#count").val());
    _satellites.altitude = parseFloat($("input#altitude").val());
    _satellites.elcConsumption = parseFloat($("input#elcConsumption").val());

    // show objects
    viewEntire.innerSize = (_body.radius + _satellites.altitude + _antenna.range) * 2 * 1.05;

    viewEntire.show();
    stageEntire.update();
    viewNight.show();
    stageNight.update();
}

function reset() {
    $("select#body").val("Kerbin");
    $("input#count").val((4).toString());
    $("input#altitude").val((1000).toString());
    $("input#elcConsumption").val((0.01).toString());
    $("select#antenna").val("Communotron 16");
    onBodySelect(null);
    onAntennaSelect(null);
}

// event handler
// retrieve data of selected body.
function onBodySelect(ev) {
    var b;
    if ($("select#body > optgroup[label='User data']").length == 1)
        b = UserData.userBodies[$("select#body").val()]; // aquire data from UserData first,
    if (b == undefined)
        b = BodyData.getBody($("select#body").val()); // then from BodyData.

    $("input#body_name").val(b.name);
    $("input#body_color").val(b.color);
    $("input#body_radius").val(b.radius.toString());
    $("input#body_stdGravParam").val(b.stdGravParam.toString());
    $("input#body_soi").val(b.soi.toString());
}

// add new data to user's body
function onUserBodyAdd(ev) {
    update();
    if (UserData.userBodies[_body.name] == undefined)
        addUserDataSelection("body", _body.name); // add option to body selector.
    UserData.userBodies[_body.name] = new Body(); // create new instance and put data into it with cutting reference.
    UserData.userBodies[_body.name].name = _body.name;
    UserData.userBodies[_body.name].color = _body.color;
    UserData.userBodies[_body.name].radius = _body.radius;
    UserData.userBodies[_body.name].stdGravParam = _body.stdGravParam;
    UserData.userBodies[_body.name].soi = _body.soi;
    UserData.saveCookie();
}

// remove user's body data which has the same name as body_name in body_detail.
function onUserBodyRemove(ev) {
    update();
    delete UserData.userBodies[_body.name];
    UserData.saveCookie();
    removeUserDataSelection("body", _body.name, function () {
        return UserData.loadCookie().body;
    });
}

// retrieve data of selected antenna.
function onAntennaSelect(ev) {
    var a;
    if ($("select#antenna > optgroup[label='User data']").length == 1)
        a = UserData.userAntennas[$("select#antenna").val()]; // aquire data from UserData first,
    if (a == undefined)
        a = AntennaData.getAntenna($("select#antenna").val()); // then from AntennaData.

    $("input#antenna_name").val(a.name);
    if (a.type == 0 /* omni */) {
        $("input#antenna_type").val("omni");
    } else if (a.type == 1 /* dish */) {
        $("input#antenna_type").val("dish");
    }
    $("input#antenna_range").val(a.range.toString());
    $("input#antenna_elcConsumption").val(a.elcConsumption.toString());
}

// add new data to user's antenna
function onUserAntennaAdd(ev) {
    update();
    if (UserData.userAntennas[_antenna.name] == undefined)
        addUserDataSelection("antenna", _antenna.name); // add option to antenna selector.
    UserData.userAntennas[_antenna.name] = new Antenna(); // create new instance and put data into it with cutting reference.
    UserData.userAntennas[_antenna.name].name = _antenna.name;
    UserData.userAntennas[_antenna.name].type = _antenna.type;
    UserData.userAntennas[_antenna.name].range = _antenna.range;
    UserData.userAntennas[_antenna.name].elcConsumption = _antenna.elcConsumption;
    UserData.saveCookie();
}

// remove user's antenna data which has the same name as antenna_name in antenna_detail.
function onUserAntennaRemove(ev) {
    update();
    delete UserData.userAntennas[_antenna.name];
    UserData.saveCookie();
    removeUserDataSelection("antenna", _antenna.name, function () {
        return UserData.loadCookie().antenna;
    });
}

// add select option for user's data to selector.
function addUserDataSelection(data, name) {
    if ($("select#" + data + " > optgroup[label='User data']").length == 0)
        $("select#" + data).append("<optgroup label='User data'></optgroup>"); // make one.
    $("select#" + data + " > optgroup[label='User data']").append("<option>" + name + "</option>"); // add option for user's data to selector.
}

// remove select option for user's data from selector.
function removeUserDataSelection(data, name, isDataRemaining) {
    $("optgroup[label='User data'] > option:contains('" + name + "')").remove();
    if (!isDataRemaining()) {
        $("select#" + data + " > optgroup[label='User data']").remove(); // remove User data option-group.
    }
}
//# sourceMappingURL=app.js.map
