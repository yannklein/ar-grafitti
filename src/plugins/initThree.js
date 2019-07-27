import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initARJS, isMarkerVisible } from './initAR';
import { uploadFile } from './initCloudinary';
// import {initCSS3DRenderer, iFrameElement} from './initCSS3DRenderer';

let mouse = new THREE.Vector2();
let controls, controlsCSS3D;
let camera;

var mousePos = null;
var strokeColor = [200,200,200];
var texture_canvas, texture_context, texture;
let uploadFrequency = 1000;
let isUploadPremitted = true;

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

const addBox = (x, y, z, size, myScene) => {
  const texture = new THREE.TextureLoader().load('images/yann.jpg');
  const geometry = new THREE.BoxBufferGeometry(size, size, size);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = size/2;
  mesh.position.set(x, mesh.position.y + y, z);
  myScene.add(mesh);
};

const groundObject = (size, myScene) => {
  let geometry = new THREE.PlaneGeometry( size, size, 1 );
  const texture = new THREE.TextureLoader().load('images/table.jpg');
  let material = new THREE.MeshBasicMaterial( {map: texture, side: THREE.DoubleSide} );
  let ground = new THREE.Mesh( geometry, material );
  ground.rotation.x = - Math.PI / 2;
  ground.position.y = -0.01;
  myScene.add(ground);
};

const graffitiUpdate = (scene, camera) => {
  var raycaster = new THREE.Raycaster();
  //Graffiti update
  raycaster.setFromCamera( mouse, camera );
  var meshIntersects = raycaster.intersectObjects( [scene.getObjectByName("graffiti")] );

  if ( meshIntersects.length > 0) {
    var x = meshIntersects[0].uv.x * texture_canvas.width;
    var y = (1 - meshIntersects[0].uv.y) * texture_canvas.height;

    var size = 1;
    if (mousePos == null){
      mousePos = {x, y};
    }else{
      texture_context.beginPath();
      texture_context.moveTo(mousePos.x, mousePos.y);
      texture_context.lineTo(x, y);
      strokeColor[0] += Math.round(Math.random()*100-50);
      if(strokeColor[0]<0){strokeColor[0]=0;}
      if(strokeColor[0]>255){strokeColor[0]=255;}
      strokeColor[1] += Math.round(Math.random()*100-50);
      if(strokeColor[1]<0){strokeColor[1]=0;}
      if(strokeColor[1]>255){strokeColor[1]=255;}
      strokeColor[2] += Math.round(Math.random()*100-50);
      if(strokeColor[2]<0){strokeColor[2]=0;}
      if(strokeColor[2]>255){strokeColor[2]=255;}
      texture_context.strokeStyle = 'rgb('+ strokeColor[0] +', '+ strokeColor[1] + ','+ strokeColor[2] +')';
      texture_context.lineWidth = 1;
      texture_context.stroke();
      mousePos = {x, y};
      var dataURL = texture_canvas.toDataURL();
      if (isUploadPremitted) {
        isUploadPremitted = false;
        setTimeout(() => {
          console.log(dataURL);
          console.log("image uploaded");
          isUploadPremitted = true;
          uploadFile(dataURL, document.getElementById("inputSecret").value);
        }, uploadFrequency);
      }
    }
    texture.needsUpdate = true;
  }
};

const graffitiCreate = (myScene) => {
  //Customizable texture
  let canvasSize = 256;
  texture_canvas = document.createElement ('canvas');
  texture_canvas.width = canvasSize;
  texture_canvas.height = canvasSize;
  texture_context = texture_canvas.getContext ('2d');
  texture_context.rect (0, 0, texture_canvas.width, texture_canvas.height);
  // texture_context.fillStyle = 'rgba(255, 255, 255, 1)';
  // texture_context.fill ();
  var img = new Image();
  img.onload = function() {
    texture_context.drawImage(img, 0, 0);
  };
  img.crossOrigin = "anonymous";
  img.src = 'https://res.cloudinary.com/yanninthesky/image/upload/grafitti.png';


  texture = new THREE.Texture (texture_canvas);
  texture.needsUpdate = true;
  //texture.flipY = false;

  let mesh = new THREE.Mesh(
        new THREE.PlaneGeometry( canvasSize, canvasSize ),
        new THREE.MeshBasicMaterial( { map: texture } )
    );
  mesh.rotation.x = - Math.PI / 2;
  mesh.name = "graffiti";
  mesh.scale.multiplyScalar(0.02);
  myScene.add( mesh );
};

const init = (withAR = false, withCSS3D = false) => {
  // init renderer
  let rendererCSS3D, renderer;
  let onRenderFcts =[];

  if (withCSS3D) {
    rendererCSS3D = initCSS3DRenderer({
      antialias : true,
      autoResize : true,
      alpha: true
    });

    rendererCSS3D.setSize( window.innerWidth, window.innerHeight );
    rendererCSS3D.domElement.style.position = 'absolute';
    rendererCSS3D.domElement.style.top = '0px';
    rendererCSS3D.domElement.style.left = '0px';
    document.body.appendChild( rendererCSS3D.domElement );
  }

  renderer = new THREE.WebGLRenderer({
    antialias : true,
    autoResize : true,
    alpha: true
  });
  renderer.setClearColor( new THREE.Color('lightgrey'), 0);
  renderer.setPixelRatio( window.devicePixelRatio );

  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.domElement.style.position = 'absolute';
  renderer.domElement.style.top = '0px';
  renderer.domElement.style.left = '0px';
  document.body.appendChild( renderer.domElement );

  // Scene settings
  let scene = new THREE.Scene();

  // Create a camera
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1500 );
  if (!withAR) {
    camera.position.z = 100;
    camera.position.y = 10;
  }
  scene.add(camera);

  let light = new THREE.AmbientLight( 0xffffff ); // soft white light
  light.intensity = 0.7;
  scene.add( light );

  // Add objects to the ThreeJS scene
  if (withAR) {
    let sceneAR = initARJS(scene, camera, onRenderFcts, renderer);
    // addBox(1, sceneAR);
    graffitiCreate(sceneAR);
    if (withCSS3D) {
    }
  } else {
    addBox(0, 30, 0, 20, scene);
    graffitiCreate(scene);
    groundObject(200, scene);
    if (withCSS3D) {
    }
  }

  // render the scene
  onRenderFcts.push(function(){
    if (withCSS3D) { rendererCSS3D.render( scene, camera ); }
    // console.log(`Marker visibility: ${isMarkerVisible()}`);
    if(mouse.down && isMarkerVisible()){
        graffitiUpdate(scene, camera);
    }
    renderer.render( scene, camera );
  });

  // run the rendering loop
  var lastTimeMsec = null;
  requestAnimationFrame(function animate(nowMsec){
    // keep looping
    requestAnimationFrame( animate );

    // measure time
    lastTimeMsec  = lastTimeMsec || nowMsec-1000/60;
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec  = nowMsec;
    // call each update function
    onRenderFcts.forEach(function(onRenderFct){
      onRenderFct(deltaMsec/1000, nowMsec/1000);
    });
  });

  function onDocumentTouchStart( event ) {
    event.clientX = event.touches[0].clientX;
    event.clientY = event.touches[0].clientY;

    mouse.x = ( ( event.clientX - renderer.domElement.offsetLeft ) / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( ( event.clientY - renderer.domElement.offsetTop ) / renderer.domElement.clientHeight ) * 2 + 1;
    mouse.down = true;
  };


  function onDocumentTouchEnd( event ) {
    mouse.down = false;
    mousePos = null;
  };

  function onDocumentMouseDown( event ) {
    mouse.x = ( ( event.clientX - renderer.domElement.offsetLeft ) / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( ( event.clientY - renderer.domElement.offsetTop ) / renderer.domElement.clientHeight ) * 2 + 1;
    mouse.down = (event.buttons != 0);
    if(!mouse.down){
      mousePos = null;
    }
  };

  document.addEventListener( 'mousedown', onDocumentMouseDown );
  document.addEventListener( 'mouseup', onDocumentMouseDown );
  document.addEventListener ('mousemove', onDocumentMouseDown );

  document.addEventListener( 'touchstart', onDocumentTouchStart );
  document.addEventListener ('touchend', onDocumentTouchEnd );
  document.addEventListener ('touchmove', onDocumentTouchStart );
};

export { init };
