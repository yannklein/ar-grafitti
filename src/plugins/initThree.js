import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initARJS } from './initAR';
import {initCSS3DRenderer, iFrameElement} from './initCSS3DRenderer';

let mouse = new THREE.Vector2();

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

const addBox = (size, myScene) => {
  const texture = new THREE.TextureLoader().load('images/yann.jpg');
  const geometry = new THREE.BoxBufferGeometry(size, size, size);
  const material = new THREE.MeshBasicMaterial({ map: texture });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.y = size/2;
  myScene.add(mesh);
};

const addYoutubeVideo = (id, x, y, z, ry, myScene) => {
  myScene.add(new iFrameElement(id, x, y, z, ry));
}

const groundObject = (size, myScene) => {
  let geometry = new THREE.PlaneGeometry( size, size, 1 );
  const texture = new THREE.TextureLoader().load('images/table.jpg');
  let material = new THREE.MeshBasicMaterial( {map: texture, side: THREE.DoubleSide} );
  let ground = new THREE.Mesh( geometry, material );
  ground.rotation.x = - Math.PI / 2;
  ground.position.y = -0.01;
  myScene.add(ground);
}

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
  let camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 1500 );
  if (!withAR) {
    camera.position.z = 100;
    camera.position.y = 10;
  }
  scene.add(camera);

  let light = new THREE.AmbientLight( 0xffffff ); // soft white light
  light.intensity = 0.7;
  scene.add( light );

  // Control for non AR
  if (!withAR) {

    if (withCSS3D) {
      let controlsCSS3D = new OrbitControls( camera, rendererCSS3D.domElement );
      controlsCSS3D.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
      controlsCSS3D.dampingFactor = 0.25;
      controlsCSS3D.screenSpacePanning = false;
      controlsCSS3D.minDistance = 0;
      controlsCSS3D.maxDistance = 500;
      controlsCSS3D.maxPolarAngle = Math.PI / 2;
    }

    let controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 0;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;

  }

  // Add objects to the ThreeJS scene
  if (withAR) {
    let sceneAR = initARJS(scene, camera, onRenderFcts, renderer);
    addBox(1, sceneAR);
    if (withCSS3D) {
      addYoutubeVideo('pm-R3dvrUZg', 0, 0, -50, 0, sceneAR);
    }
  } else {
    addBox(20, scene);
    groundObject(200, scene);
    if (withCSS3D) {
      addYoutubeVideo('pm-R3dvrUZg', 0, 0, -50, 0, scene);
    }
  }

  // render the scene
  onRenderFcts.push(function(){
    if (withCSS3D) { rendererCSS3D.render( scene, camera ); }
    renderer.render( scene, camera );
  });

  // run the rendering loop
  var lastTimeMsec = null;
  requestAnimationFrame(function animate(nowMsec){
    // keep looping
    requestAnimationFrame( animate );
    if (!withAR) {
      controls.update();
    }
    // measure time
    lastTimeMsec  = lastTimeMsec || nowMsec-1000/60;
    var deltaMsec = Math.min(200, nowMsec - lastTimeMsec);
    lastTimeMsec  = nowMsec;
    // call each update function
    onRenderFcts.forEach(function(onRenderFct){
      onRenderFct(deltaMsec/1000, nowMsec/1000);
    });
  });

};


export { init };
