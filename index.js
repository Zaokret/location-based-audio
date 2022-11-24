window.AudioContext = window.AudioContext || window.webkitAudioContext;
var context = new AudioContext();
var buffer;

const Geo = navigator.geolocation;
Math.rad = function (val) {
  return (val * Math.PI) / 180;
};

const radius = 1000; // in meters
const drugstore = {
  radius: radius,
  latitude: 44.819057843074006,
  longitude: 20.489055399999998,
  name: "Drugstore",
  url: "./DJ 3maj - Here Be Dragons ( Original Mix ).mp3",
  playCount: 0,
  playing: false,
  source: null,
  buffer: null,
  presave: "https://www.gate.fm/izLglREvL",
};

const barutana = {
  radius: radius,
  latitude: 44.82387756348147,
  longitude: 20.447610532124834,
  name: "Barutana",
  url: "./DJ 3maj - Here Be Dragons ( Original Mix ).mp3",
  playCount: 0,
  playing: false,
  source: null,
  buffer: null,
  presave: "https://www.gate.fm/izLglREvL",
};

const hangar = {
  radius: radius,
  latitude: 44.82622414602859,
  longitude: 20.474560296618737,
  name: "Hangar",
  url: "./DJ 3maj - Here Be Dragons ( Original Mix ).mp3",
  playCount: 0,
  playing: false,
  source: null,
  buffer: null,
  presave: "https://www.gate.fm/izLglREvL",
};

const tunnel = {
  radius: radius,
  latitude: 45.2515032112469,
  longitude: 19.863086828836362,
  name: "Tunnel",
  url: "./DJ 3maj - Here Be Dragons ( Original Mix ).mp3",
  playCount: 0,
  playing: false,
  source: null,
  buffer: null,
  presave: "https://www.gate.fm/izLglREvL",
};

const circles = [hangar, barutana, hangar, tunnel];
let currentPosition = null;
const playingMessage = " is playing right now.";

window.onload = function () {
  Geo.watchPosition(succesWatch, errorWatch);
  addLocationsToPage();
};

function addLocationsToPage() {
  const paragraph = document.getElementById("locations");
  if (paragraph) {
    circles.forEach((circle) => {
      const link = document.createElement("a");
      link.setAttribute("href", buildGoogleMapUrl(circle, false));
      link.setAttribute("target", "_blank");
      link.innerText =
        extractNameFromUrl(circle.url) + " (" + circle.radius + "m radius)";
      paragraph.appendChild(link);
      paragraph.appendChild(document.createElement("br"));
    });
  }
}

function loadSong(songLocation, handler = null) {
  var request = new XMLHttpRequest();
  request.open("GET", songLocation.url, true);
  request.responseType = "arraybuffer";
  request.onload = function () {
    context.decodeAudioData(
      request.response,
      function (response) {
        songLocation.buffer = response;
        if (handler) {
          handler();
        }
      },
      function () {
        console.error("The request failed.");
      }
    );
  };
  request.send();
}

function succesWatch(position) {
  const difference = currentPosition
    ? getDistance(position, currentPosition)
    : 99999999;
  currentPosition = position;
  const coordinates = document.getElementById("coords");
  if (coordinates) {
    coordinates.innerHTML =
      "Longitude: " +
      position.coords.longitude +
      "<br>Latitude: " +
      position.coords.latitude;
  }

  const nearest = getNearestCircles(currentPosition.coords);
  const active = circles.find((circle) => circle.playing);
  if (!active) {
    if (nearest.length > 0) {
      updateMusic(nearest[0]);
      document.getElementById("map").classList.add("active");
    } else {
      console.log("Outside of all circles");
      document.getElementById("map").classList.remove("active");

      document.getElementById("play").remove();
      playButton = null;
      document.getElementById("presave").remove();
      presaveButton = null;
    }
  } else {
    console.log("Already playing " + active.name);
  }

  if (difference > 10) {
    updateMap(position);
  }
}

function getNearestCircles(point) {
  return circles
    .map((circle) => {
      circle.distance = getDistance(circle, point);
      return circle;
    })
    .filter((circle) => circle.distance < circle.radius)
    .sort((a, b) => a.playCount - b.playCount); // music with lower play count gets priority
  // .sort((a,b) => b.radius-a.radius) // smaller circle gets priority
  // .sort((a,b) => b.distance-a.distance) // closer circle gets priority
}

// This function takes in latitude and longitude of two locations
// and returns the distance between them as the crow flies (in meters)
function getDistance(coords1, coords2) {
  var R = 6371000; // var R = 6.371; // km
  var dLat = Math.rad(coords2.latitude - coords1.latitude);
  var dLon = Math.rad(coords2.longitude - coords1.longitude);
  var lat1 = Math.rad(coords1.latitude);
  var lat2 = Math.rad(coords2.latitude);

  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function updateMusic(circle) {
  console.log("Inside of " + circle.name);
  if (!circle.buffer) {
    loadSong(circle, function () {
      if (!playButton) {
        addPlayButton();
        addPresaveButton();
      }
      playMusic(circle);
    });
  } else {
    playMusic(circle);
    if (!playButton) {
      addPlayButton();
      addPresaveButton();
    }
  }
}

function playMusic(circle) {
  if (!circle.playing) {
    const playing = document.getElementById("playing");
    if (playing) {
      playing.innerText = extractNameFromUrl(circle.url) + playingMessage;
    }

    circle.playing = true;
    createSource(circle);
    if (context.state === "suspended") {
      context.resume();
    }

    circle.source.start();
    circle.playCount++;
  }
}

function songEnded(circle) {
  const playing = document.getElementById("playing");
  if (playing) {
    playing.innerText = "Nothing" + playingMessage;
  }

  circle.playing = false;
  circle.source.disconnect(context.destination);
  succesWatch(currentPosition);
  Geo.getCurrentPosition(succesWatch, errorWatch);
}

function createSource(circle) {
  circle.source = context.createBufferSource();
  circle.source.buffer = circle.buffer;
  circle.source.connect(context.destination);
  circle.source.addEventListener(
    "ended",
    function () {
      songEnded(circle);
    },
    { once: true }
  );
}

var playButton;
function addPlayButton() {
  const el = document.createElement("button");
  el.innerText = "Play";
  el.setAttribute("id", "play");
  document.getElementById("controls").appendChild(el);
  el.addEventListener("click", function () {
    if (context.state === "suspended") {
      context.resume();
    }
    circles
      .filter((circle) => circle.playing)
      .forEach((circle) => circle.source.start());
  });
  playButton = el;
}

var presaveButton;
function addPresaveButton() {
  const el = document.createElement("button");
  el.innerText = "Pre-Save";
  el.setAttribute("id", "presave");

  document.getElementById("controls").appendChild(el);

  el.addEventListener("click", function () {
    circles
      .filter((circle) => circle.playing)
      .forEach((circle) => window.open(circle.presave, "_blank"));
  });

  presaveButton = el;
}

function updateMap(position) {
  const map = document.getElementById("map");
  map.setAttribute("src", buildGoogleMapUrl(position.coords));
}

function buildGoogleMapUrl({ longitude, latitude }, embed = true) {
  let url =
    "https://maps.google.com/maps?q=" + latitude + "+" + longitude + "&z=14"; // &size=400x400
  if (embed) {
    url += "&output=embed";
  }
  return url;
  // TODO: maybe a way to center the map on the current location, but show the marker of the destination?
}

function errorWatch(positionError) {
  console.log(positionError);
}

function extractNameFromUrl(url) {
  return (
    '"' +
    url
      .replace(new RegExp("_", "g"), " ")
      .replace("./", "")
      .replace(".mp3", "") +
    '"'
  );
}
