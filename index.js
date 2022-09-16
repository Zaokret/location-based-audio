window.AudioContext = window.AudioContext||window.webkitAudioContext;
var context = new AudioContext();
var buffer;

const Geo = navigator.geolocation;
Math.rad = function (val) { return val * Math.PI / 180; }

const radius = 500; // in meters
const center = {
    radius: radius, 
    latitude: 44.81161606873808,
    longitude: 20.465825835889994,
    name: 'center',
    url: './DJ_3maj_-_World_War_III.mp3',
    playCount: 0,
    playing: false,
    source: null,
    buffer: null 
}
const circles = [center]
let currentPosition = null;
const playingMessage = ' is playing right now.';

window.onload = function(){
    Geo.watchPosition(succesWatch, errorWatch)
}

function loadSong(songLocation, handler = null) {
    var request = new XMLHttpRequest();
    request.open('GET', songLocation.url, true); 
    request.responseType = 'arraybuffer';
    request.onload = function() {
        context.decodeAudioData(request.response, function(response) {
            songLocation.buffer = response;
            if(handler) {
                handler();
            }

        }, function () { console.error('The request failed.'); } );
    }
    request.send();
}

function succesWatch(position) {
    currentPosition = position
    document.getElementById('coords').innerHTML = 'Longitude: ' + position.coords.longitude + '<br>Latitude: ' + position.coords.latitude

    const nearest = getNearestCircles(currentPosition.coords)
    const active = circles.find(circle => circle.playing)
    if(!active) {
        if(nearest.length > 0) {
            updateMusic(nearest[0])
            document.getElementById('map').setAttribute('class', 'green')
        }
        else {
            console.log("Outside of all circles");
            document.getElementById('map').setAttribute('class', 'red')
        }
    }
    else {
        console.log('Already playing ' + active.name)
    }
    
    updateMap(position)
}

function getNearestCircles(point) {
    return circles
    .map(circle => {
        circle.distance = getDistance(circle, point)
        return circle;
    })
    .filter(circle => circle.distance < circle.radius)
    .sort((a,b) => a.playCount - b.playCount) // music with lower play count gets priority
    // .sort((a,b) => b.radius-a.radius) // smaller circle gets priority
    // .sort((a,b) => b.distance-a.distance) // closer circle gets priority
    
}

// This function takes in latitude and longitude of two locations
// and returns the distance between them as the crow flies (in meters)
function getDistance(coords1, coords2)
{
  var R = 6371000; // var R = 6.371; // km
  var dLat = Math.rad(coords2.latitude-coords1.latitude);
  var dLon = Math.rad(coords2.longitude-coords1.longitude);
  var lat1 = Math.rad(coords1.latitude);
  var lat2 = Math.rad(coords2.latitude);

  var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2); 
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  var d = R * c;
  return d;
}

function updateMusic(circle) {
    console.log('Inside of ' + circle.name)
    debugger
    if(!circle.buffer) {
        loadSong(circle, function() {
            
            if(!playButton) {
                addPlayButton();
            }
            playMusic(circle)
        })
    }
    else {
        playMusic(circle)
        if(!playButton) {
            addPlayButton();
        }
    }
}

function playMusic(circle) {
    debugger
    if(!circle.playing) {
        document.getElementById('playing').innerText = extractNameFromUrl(circle.url) + playingMessage;

        circle.playing = true;
        createSource(circle);
        if (context.state === 'suspended') {
            context.resume();
        }
    
        circle.source.start();
        circle.playCount++;
    }
}

function songEnded(circle) {
    document.getElementById('playing').innerText = 'Nothing' + playingMessage;
    circle.playing = false;
    circle.source.disconnect(context.destination);
    succesWatch(currentPosition)
    Geo.getCurrentPosition(succesWatch, errorWatch)
}

function createSource(circle) {
    circle.source = context.createBufferSource(); 
    circle.source.buffer = circle.buffer;
    circle.source.connect(context.destination);
    circle.source.addEventListener('ended', function() {songEnded(circle)}, {once: true})
}

var playButton;
function addPlayButton() {
    const el = document.createElement('button');
    el.innerText = 'Play'
    el.setAttribute('id', 'play')
    document.getElementById('controls').appendChild(el)
    el.addEventListener('click', function() {
        if (context.state === 'suspended') {
            context.resume();
        }
        circles.filter(circle=>circle.playing).forEach(circle=> circle.source.start())
    });
    playButton = el;
}

function updateMap(position) {
    const map = document.getElementById('map');
    map.setAttribute('src', buildGoogleMapUrl(position.coords))
}

function buildGoogleMapUrl({ longitude, latitude }) {
    return 'https://maps.google.com/maps?q=' + 
    latitude + '+' + longitude + 
    '&zoom=14&size=400x400&output=embed&center=' + 
    center.latitude + '+' + center.longitude; 
    // TODO: maybe a way to center the map on the current location, but show the marker of the destination?
}

function errorWatch(positionError) {
    console.log(positionError)
}

function extractNameFromUrl(url) {
    return '"' + url.replace(new RegExp('_', 'g'), ' ').replace('./', '').replace('.mp3', '') + '"';
}