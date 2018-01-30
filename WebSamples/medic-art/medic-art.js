let isHoloJs = (typeof holographic !== 'undefined');

let canvas = document.createElement(isHoloJs ? 'exp-holo-canvas' : 'canvas');
if (!isHoloJs) {
    document.body.appendChild(canvas);
    document.body.style.margin = document.body.style.padding = 0;
    canvas.style.width = canvas.style.height = "100%";
}

let renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
let scene = new THREE.Scene();
let camera = (isHoloJs && holographic.renderMode > 0) ? new THREE.HolographicCamera() : new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 1000);
let clock = new THREE.Clock();
let models = [];

let ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8);
let directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.5);
let pointLight = new THREE.PointLight(0xFFFFFF, 0.5);

renderer.setSize(window.innerWidth, window.innerHeight);

directionalLight.position.set(0, 2, 0);

scene.add(ambientLight);
scene.add(directionalLight);
scene.add(pointLight);

scene.add(camera);

var onProgressModel = function (xhr) {
    console.log("progress");
};

var onErrorModel = function (xhr) {
    console.log("model load error", xhr);
};

// FBXLoader expects the Zlib library to be in window? Inflate.min.js does not put it there so do it manually to make FBXLoader happy
window.Zlib = Zlib;

// Load the FBX model.
// After the FBX file is added to the solution, right click on it, goto Properties and make sure that:
//   1. "Item type" is "Does not participate in build"
//   2. Content is "yes"
// Alternatively, host the FBX file online and use the URL here.
var fbxLoader = new THREE.FBXLoader();

//////////////////////////////////////////////////////////////////////

var transformLoadedObject = function(object, options) {
    options = options || {};

    if (options.frustumCulled == false)
        object.frustumCulled = false;

    if (options.exclude) {
        if (object.children)
            object.children.forEach(function(node) {
                for (var i = 0; i < options.exclude.length; i++) {
                    if (node.name.includes(options.exclude[i])) {
                        object.remove(node);
                    }
                }
            });
    }

    if (object.children)
        object.children.forEach(function(node) {
            if (options.frustumCulled == false)
                object.frustumCulled = false;

            if (options.debug)
                console.log(node);

            if (node instanceof THREE.Mesh) {
                if (options.userData)
                    node.userData = options.userData;
            }
        });

    if (options.position && options.position.lat)
        object.position.copy( Transform.projectVector3(options.position.lng, options.position.lat, options.position.elevation || 100) );
    else if (options.position)
        object.position.copy(options.position);

    if (options.shadow) {
        object.castShadow = true;
        object.receiveShadow = true;

        if (object.children)
            object.children.forEach(function(node) {
                node.castShadow = true;
                node.receiveShadow = true;
            });
    }

    if (options.rotation) {
        object.rotation.x = options.rotation.x * Math.PI/180;
        object.rotation.y = options.rotation.y * Math.PI/180;
        object.rotation.z = options.rotation.z * Math.PI/180;
    }

    if (options.scale)
        object.scale.set(options.scale, options.scale, options.scale);

    if (options.name)
        object.name = 'building';

    if (options.vertexEulerTransform){
        if (object.geometry && object.geometry.vertices)
            for (var i = 0 ; i < object.geometry.vertices.length; i ++){
                object.geometry.vertices[i].applyEuler(options.vertexEulerTransform);
            }
    }

    if (options.vertexTranslation){
        if (object.geometry && object.geometry.vertices)
            object.geometry.applyMatrix( new THREE.Matrix4().setTranslation( options.vertexTranslation.x, options.vertexTranslation.y, options.vertexTranslation.z));
    }
};

var loadFBX = function(path, options, callback) {
    if (options.fromDisk) {
        var object = self.FBXLoader.parse(options.contents);
        transformLoadedObject(object, options);
        CLEAR.SceneService.scene.add( object );
        if (callback)
            callback(object);
    } else {
        fbxLoader.load(path, function( object ) {
            transformLoadedObject(object, options);
            object.frustumCulled = false;
            models.push(object);
            scene.add(object);
            if (callback)
                callback(object);
        }, onProgressModel, onErrorModel );
    }
};


//////////////////////////////////////////////////////////////////////


var path = '';
//path = 'MASTER/fbx/F-18E_cockpit.FBX';
//path = 'MASTER/fbx/green.fbx';
path = 'fbx/Brain_Model.fbx';
//path = 'fbx/Sample_Ship.fbx';
//path = 'fbx/formica rufa.fbx';
loadFBX(path, {}, function(object) {
    object.scale.multiplyScalar(0.25);
    console.log(object);
});
/*
loadFBX(path, {debug:true, frustumCulled:false, rotation:new THREE.Vector3(90, 90, 0), position:new THREE.Vector3(0, 0, 6000), scale:0.012, shadow:false, doublesided:true, shininess:1,
    exclude:[
        'Camera_Switcher',
        'panel_RM',
        'panel_RR',
        'panel_RL',
        'ej_seat2',
        'ej_seat2_b',
        'c_stick_R1',
        'c_stick_R2',
        'pRMinst',
        'pRM_need01',
        'pRM_need02',
        'pRM_need03',
        'pRM_need04',
        'panel_RL',
        'panel_RLa',
        'panel_RRa',
        'panel_RR',
        'panel_RC',
        'cRRlamp',
        'lamp_br-t2',
        'pedal_R1',
        'pedal_R2',
        'can_jet_hd'
    ],
    userData:{selectable:true}
}, function(object) {
    console.log(object);
    for (var i = 0; i < object.children.length; i++) {
        if (object.children[i].name.includes("panel_FM1")) {
            for (var k = 0; k < object.children[i].material.length; k++) {
                if (object.children[i].material[k].name.includes("pFM_key")) {
                    object.children[i].material[k].emissive.r = 0;
                    object.children[i].material[k].emissive.g = 0;
                    object.children[i].material[k].emissive.b = 0;
                }
                if (object.children[i].material[k].name.includes("screen")) {
                    object.children[i].material[k].opacity = 0;
                }
            }
        }
        if (object.children[i].name.includes("lock-s_ind")) {
            for (var k = 0; k < object.children[i].material.length; k++) {
                if (object.children[i].material[k].name.includes("pFM_key6")) {
                    object.children[i].material[k].emissive.r = 0;
                    object.children[i].material[k].emissive.g = 0;
                    object.children[i].material[k].emissive.b = 0;
                }
            }
        }
    }
    for (var i = 0; i < object.children.length; i++) {
        if (object.children[i].name.includes("panel_FC")) {
            for (var k = 0; k < object.children[i].material.length; k++) {
                if (object.children[i].material[k].name.includes("screen")) {
                    object.children[i].material[k].opacity = 0;
                }
            }
        }
    }
});
/**/

var spatialInputTracking = false;
var graspedModel = -1;
var lastSpatialInputX = 0;
var lastSpatialInputY = 0;
var lastSpatialInputZ = 0;

function insideModel(i, x, y, z) {
    if (i >= models.length) {
        return false;
    }
    let obj = models[i];
    //TODO Inefficient?
    var bbox = new THREE.Box3().setFromObject(obj);

    if (bbox.containsPoint({x,y,z})) {
        return true;
    } else {
        return false;
    }

    // var radius = 0.1;
    // //TODO Do proper bounds checking?
    // if ((obj.position.x - radius <= x && x <= obj.position.x + radius)
    //     && (obj.position.y - radius <= y && y <= obj.position.y + radius)
    //     && (obj.position.z - radius <= z && z <= obj.position.z + radius)) {
    //     return true;
    // } else {
    //     return false;
    // }
}

function onSpatialSourcePress(spatialInputEvent) {
    console.log("onSpatialSourcePress");
    // Remember last hand position
    lastSpatialInputX = spatialInputEvent.x;
    lastSpatialInputY = spatialInputEvent.y;
    lastSpatialInputZ = spatialInputEvent.z;

    console.log("click {" + lastSpatialInputX + ", " + lastSpatialInputY + ", " + lastSpatialInputZ + "}");

    //TODO Do for all models?
    let index = 0;
    if (index >= models.length) {
        return;
    }
    let obj = models[index];

    console.log("box {" + obj.position.x + ", " + obj.position.y + ", " + obj.position.z + "}");
    console.log("diff {" + (obj.position.x - lastSpatialInputX) + ", " + (obj.position.y - lastSpatialInputY) + ", " + (obj.position.z - lastSpatialInputZ) + "}");

    spatialInputTracking = true;
    if (insideModel(index, lastSpatialInputX, lastSpatialInputY, lastSpatialInputZ)) {
        graspedModel = index;
    } else {
        graspedModel = -1;
    }
}

function onSpatialSourceRelease(spatialInputEvent) {
    console.log("onSpatialSourceRelease");
    spatialInputTracking = false;
    graspedModel = -1;
}

function onSpatialSourceUpdate(spatialInputEvent) {
    if (spatialInputTracking === true) {
        // Compute new cube position based on hand delta movement
        if (graspedModel >= 0) {
            let obj = models[graspedModel];
            obj.position.x = obj.position.x - (lastSpatialInputX - spatialInputEvent.x);
            obj.position.y = obj.position.y - (lastSpatialInputY - spatialInputEvent.y);
            obj.position.z = obj.position.z - (lastSpatialInputZ - spatialInputEvent.z);
        } else {
            for (var obj of models) {
                obj.position.x = obj.position.x - 3 * (lastSpatialInputX - spatialInputEvent.x);
                obj.position.y = obj.position.y - 3 * (lastSpatialInputY - spatialInputEvent.y);
                obj.position.z = obj.position.z - 3 * (lastSpatialInputZ - spatialInputEvent.z);
            }
        }

        // Remember last hand position
        lastSpatialInputX = spatialInputEvent.x;
        lastSpatialInputY = spatialInputEvent.y;
        lastSpatialInputZ = spatialInputEvent.z;
    }
}



var controls;

if (!isHoloJs || holographic.renderMode === 0) {
    camera.position.set(0, 0, 1);
    controls = new THREE.OrbitControls(camera, canvas);
} else {
    // add event listener for spatial input (hands)
    canvas.addEventListener("sourcepress", onSpatialSourcePress);
    canvas.addEventListener("sourcerelease", onSpatialSourceRelease);
    canvas.addEventListener("sourceupdate", onSpatialSourceUpdate);
    // treat source lost the same way as source release - stop moving the cube when hands input is lost
    canvas.addEventListener("sourcelost", onSpatialSourceRelease);
}

function initColors (geometry) {
    return geometry.addAttribute('color', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.array.length).fill(1.0), 3));
}

function update (delta, elapsed) {
    window.requestAnimationFrame(() => update(clock.getDelta(), clock.getElapsedTime()));

    pointLight.position.set(0 + 2.0 * Math.cos(elapsed * 0.5), 0, -1.5 + 2.0 * Math.sin(elapsed * 0.5));

    if (camera.update) camera.update();

    renderer.render(scene, camera);
}

function start () {
    update(clock.getDelta(), clock.getElapsedTime());
}

start();