window.AudioContext = window.AudioContext||window.webkitAudioContext;
var context = new AudioContext();
var source, buffer;

const Geo = navigator.geolocation;
Math.rad = function (val) { return val * Math.PI / 180; }

const radius = 500; // in meters
const center = {
    latitude: 44.81161606873808,
    longitude: 20.465825835889994,
    name: 'center',
    url: './DJ_3maj_-_World_War_III.mp3',
    radius: radius, // TODO: maybe make it customizable
    buffer: null // TODO: load buffer if it's empty
}
const circles = [center];

var playButton;
function addPlayButton() {
    const el = document.createElement('button');
    el.innerText = 'Play'
    el.setAttribute('id', 'play')
    document.body.appendChild(el)
    el.addEventListener('click', play);
    playButton = el;
}

window.onload = function(){
    loadSong(center)
}

function loadSong(songLocation) {
    var request = new XMLHttpRequest();
    request.open('GET', songLocation.url, true); 
    request.responseType = 'arraybuffer';
    request.onload = function() {
        context.decodeAudioData(request.response, function(response) {

            buffer = response;
            songLocation.buffer = response;
            Geo.watchPosition(succesWatch, errorWatch)

        }, function () { console.error('The request failed.'); } );
    }
    request.send();
}

function succesWatch(position) {
    const nearest = getNearestCircles(position.coords)
    if(nearest.length > 0) {
        updateMusic(nearest[0])
        document.getElementById('map').setAttribute('class', 'green')
    }
    else {
        console.log("Outside of all circles");
        document.getElementById('map').setAttribute('class', 'red')
    }
    
    updateMap(position)
}

function getNearestCircles(point) {
    return circles
    .map(circle => ({...circle, distance: getDistance(circle, point)}))
    .filter(circle => circle.distance < radius)
    .sort((a,b) => b.radius-a.radius) // smaller circle gets priority
    .sort((a,b) => b.distance-a.distance) // for now every circle is the same
    
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

    // TODO: create source and load buffer here
    if(!source) {
        createSource();
    }
    
    if(!playButton) {
        addPlayButton();
    }

    play()
}

function play() {
    if (context.state === 'suspended') {
        context.resume();
    }

    source.start();
}

// TODO: create source from songLocation object
function createSource() {
    source = context.createBufferSource(); 
    source.buffer = buffer;
    source.connect(context.destination);
    source.addEventListener('ended', function() {

        source.disconnect(context.destination);
        createSource();
        Geo.getCurrentPosition(succesWatch, errorWatch)

    }, {once: true})
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