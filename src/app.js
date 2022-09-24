import { Loader } from '@googlemaps/js-api-loader';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

//data
var metadataName = [];
var metadata = [];

const apiOptions = {
  apiKey: 'AIzaSyAIDT9XdP5AwUbOjSvR8-9x8RKBXctzLGE',
  version: "beta"
};

const mapOptions = {
  "tilt": 0,
  "heading": 0,
  "zoom": 18,
  "center": { lat: 37.4217845, lng: -122.0847413 },
  "mapId": "ad76f8916d6d11a1",
}
const parsedData = {
  "latitude": 0,
  "longitude": 0,
  "altitude": 0,
  "identifier": "",
  "timestamp": 0,
  "floor label": "",
  "horizontal accuracy": 0,
  "vertical accuracy": 0,
  "confidence in location": 0.6827,
  "activity": ""
}
async function initMap() {
  const mapDiv = document.getElementById("map");
  const apiLoader = new Loader(apiOptions);
  await apiLoader.load();
  return new google.maps.Map(mapDiv, mapOptions);
}

let scene = new THREE.Scene();

function initWebGLOverlayView(map) {
  let renderer, camera, loader, loader2;
  const webGLOverlayView = new google.maps.WebGLOverlayView();

  webGLOverlayView.onAdd = () => {
    // set up the scene
    //scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75); // soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
    directionalLight.position.set(0.5, -1, 0.5);
    scene.add(directionalLight);
    scene.clear();
    // load the model    
    loader = new GLTFLoader();
    const source = "scene.gltf";
    // const pin = "pin.gltf";



    loader.load(
      source,
      gltf => {
        console.log("hor acc: " + parsedData['horizontal accuracy']);
        gltf.scene.scale.set(parsedData['horizontal accuracy'], parsedData['horizontal accuracy'], parsedData['vertical accuracy']);
        scene.add(gltf.scene);
      }
    );

    // loader2 = new GLTFLoader();
    // loader2.load(
    //   pin, 
    //   gltf => {
    //     gltf.scene.scale.set(1,1,1);
    //     gltf.scene.rotation.x = 180 * Math.PI/180; 
    //     scene.add(gltf.scene);
    //   }
    // );


  }

  webGLOverlayView.onContextRestored = ({ gl }) => {
    // create the three.js renderer, using the
    // maps's WebGL rendering context.

    renderer = new THREE.WebGLRenderer({
      canvas: gl.canvas,
      context: gl,
      ...gl.getContextAttributes(),
    });
    renderer.autoClear = false;

    // wait to move the camera until the 3D model loads    
    loader.manager.onLoad = () => {
      renderer.setAnimationLoop(() => {
        map.moveCamera({
          "tilt": mapOptions.tilt,
          "heading": mapOptions.heading,
          "zoom": mapOptions.zoom,
          "center": mapOptions.center
        });


        renderer.setAnimationLoop(null);
        // rotate the map 360 degrees 
        if (mapOptions.tilt < 67.5) {
          mapOptions.tilt += 0.5
        }
        // } else if (mapOptions.heading <= 360) {
        //     mapOptions.heading += 0.2;
        //   } else {
        //       renderer.setAnimationLoop(null)
        //     }
      });
    }
  }

  console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA" + parsedData.latitude);
  webGLOverlayView.onDraw = ({ gl, transformer }) => {
    // update camera matrix to ensure the model is georeferenced correctly on the map
    const latLngAltitudeLiteral = {
      lat: mapOptions.center.lat,
      lng: mapOptions.center.lng,
      altitude: parsedData.altitude 
    }

    const matrix = transformer.fromLatLngAltitude(latLngAltitudeLiteral);
    camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix);

    webGLOverlayView.requestRedraw();
    renderer.render(scene, camera);

    // always reset the GL state
    renderer.resetState();
  }
  webGLOverlayView.setMap(map);
}

(async () => {
  const map = await initMap();
  //scene.clear();
  initWebGLOverlayView(map);

  let counter = 0;

  // var loader = function (e) {
  //   let file = e.targets.files;

  //   let show = "<span>Selected FIle : </span>" + file[0].name;
  //   let output = documnet.getElementById("selector");
  //   output.innerHTML = show;
  //   output.classlist.add("active");
  // }

  var input = document.getElementById('input');
  // input.addEventListener('change', loader);
  input.addEventListener('change', function () {
    readXlsxFile(input.files[0]).then(function (data) {
      var i = 0;
      data.map((row, index) => {
        if (i == 0) {
          generateTableHead(row);
        }
        if (i > 0) {
          generateTableRows(row);
        }
        i++;
      });

    });
  });



  var updateButton = document.getElementById('updateButton');
  updateButton.addEventListener('click', function () {
    parseDataToVariables(counter);
    var text = document.getElementById("text");
    text.textContent = "name: " + parsedData.identifier + ", timestamp: " + parsedData.timestamp + ", floor:" + parsedData['floor label'] + ", activity: " + parsedData.activity;
    initWebGLOverlayView(map);
    counter++;
  })

  var previousbutton = document.getElementById('previousButton');
  previousbutton.addEventListener('click', function () {
    counter--;
    parseDataToVariables(counter);

    initWebGLOverlayView(map);
  })


  function generateTableHead(data) {
    for (let key of data) {
      let text = document.createTextNode(key);
      metadataName.push(text);
    }
  }

  function generateTableRows(data) {
    for (let key of data) {
      metadata.push(key);
    }
  }

  function parseDataToVariables(counter) {
    let indexOfMetadataName = 0;
    console.log("Metadata: " + metadata.length);
    for (let i = 0; i < counter * 10 + 10; i++) {
      if (i >= metadata.length - 1) {
        break;
      }
      let key = metadata[i];
      switch (indexOfMetadataName % 10) {
        case 0:
          parsedData.latitude = key;
          indexOfMetadataName++;
          console.log("Latitude entered: " + parsedData.latitude);
          break;
        case 1:
          parsedData.longitude = key;
          indexOfMetadataName++;
          break;
        case 2:
          parsedData.altitude = key;
          indexOfMetadataName++;
          break;
        case 3:
          parsedData.identifier = key;
          indexOfMetadataName++;
          break;
        case 4:
          parsedData.timestamp = key;
          indexOfMetadataName++;
          break;
        case 5:
          parsedData['floor label'] = key;
          indexOfMetadataName++;
          break;
        case 6:
          parsedData['horizontal accuracy'] = key;
          indexOfMetadataName++;
          break;
        case 7:
          parsedData['vertical accuracy'] = key;
          indexOfMetadataName++;
          break;
        case 8:
          parsedData['confidence in location'] = key;
          indexOfMetadataName++;
          break;
        case 9:
          parsedData.activity = key;
          indexOfMetadataName++;
          break;
        default:
          console.log(`End of one row. Last key is: ${key}.`);
      }

    }
    mapOptions.center.lat = parsedData.latitude;
    mapOptions.center.lng = parsedData.longitude;
    
  }

})();