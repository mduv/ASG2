// ColoredPoint.js (c) 2012 matsuda
// Vertex shader program
var VSHADER_SOURCE =
    'attribute vec4 a_Position;\n' +
    'uniform mat4 u_ModelMatrix;\n' +
    'uniform mat4 u_GlobalRotateMatrix;\n' +
    'void main() {\n' +
    ' gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;\n' +
    '}\n';

// Fragment shader program
var FSHADER_SOURCE =
    'precision mediump float;\n' +
    'uniform vec4 u_FragColor;\n' +
    'void main() {\n' +
    '  gl_FragColor = u_FragColor;\n' +
    '}\n';


// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
var u_ModelMatrix;
var u_GlobalRotateMatrix;

let g_earAngle = 0;
let g_upperLegAngle = 0;
let g_lowerLegAngle = 0;

g_earAnimation = false;
g_legsAnimation = false;
g_toesAnimation = false;

function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preseveDrawingBuffer: true }); // gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
    // Initialize shaders
    if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
        console.log('Failed to intialize shaders.');
        return;
    }

    // // Get the storage location of a_Position
    a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    if (a_Position < 0) {
        console.log('Failed to get the storage location of a_Position');
        return;
    }

    // Get the storage location of u_FragColor
    u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    if (!u_FragColor) {
        console.log('Failed to get the storage location of u_FragColor');
        return;
    }

    u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
    if (!u_ModelMatrix) {
        console.log('Failed to get u_ModelMatrix');
        return;
    }

    u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
    if (!u_GlobalRotateMatrix) {
        console.log('Failed to get u_GlobalRotateMatrix');
        return;
    }

    var identityM = new Matrix4();
    gl.uniformMatrix4fv(u_ModelMatrix, false, identityM.elements);

}

// Global variables related to UI elements
let g_globalAngleX = 30;
let g_globalAngleY = 0;

// Set up actions for the HTML UI elements
function addActionsForHTMLUI() {
    // Slider Events
    document.getElementById('xcamera_slider').addEventListener('mousemove', function () { g_globalAngleX = parseInt(this.value); renderScene(); });
    document.getElementById('ycamera_slider').addEventListener('mousemove', function () { g_globalAngleY = parseInt(this.value); renderScene(); });

    document.getElementById('ear_slider').addEventListener('input', function() {
        g_earAngle = this.value; renderScene();
    });

    document.getElementById('upper_leg_slider').addEventListener('input', function() {
        g_upperLegAngle = this.value; renderScene();
    });

    document.getElementById('lower_leg_slider').addEventListener('input', function() {
        g_lowerLegAngle = this.value; renderScene();
    });

    document.getElementById('on_ear').onclick = function() { g_earAnimation = true; };
    document.getElementById('off_ear').onclick = function() { g_earAnimation = false; };
    document.getElementById('on_legs').onclick = function() { g_legsAnimation = true; };
    document.getElementById('off_legs').onclick = function() { g_legsAnimation = false; };
    document.getElementById('on_toes').onclick = function() { g_toesAnimation = true; };
    document.getElementById('off_toes').onclick = function() { g_toesAnimation = false; };     

}

function main() {
    setupWebGL();
    connectVariablesToGLSL();
    addActionsForHTMLUI();
    gl.clearColor(0.3, 0.8, 0.2, 1.0);
    renderScene();
    requestAnimationFrame(tick);
}

var g_startTime = performance.now()/1000.0;
var g_seconds = performance.now()/1000.0 - g_startTime;
function tick() {
  g_seconds = performance.now()/1000.0-g_startTime;
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
    if (g_earAnimation) {
      g_earAngle = 45*Math.sin(g_seconds);
    }
  
    if (g_legsAnimation) {
        g_upperLegAngle = 45*Math.sin(g_seconds);
    }
  
    if (g_toesAnimation) {
        g_lowerLegAngle = 45*Math.sin(g_seconds);
    }
  
  }




function renderScene() {
    // Calculate global rotation matrix
    var globalRotMat = new Matrix4();
    globalRotMat.rotate(g_globalAngleX, 0, 1, 0);
    globalRotMat.rotate(g_globalAngleY, 1, 0, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Clear the canvas
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw the rabbit-like creature
    drawRabbit();
}

function drawRabbit() {
    // Define body
    var body = new Cube();
    body.color = [1.0, 1.0, 1.0, 1.0]; // White body
    body.matrix.translate(0, 0, 0); // Hopping effect
    body.matrix.scale(0.3, 0.2, 0.4); // Elongated body
    body.render();

    // Define head
    var head = new Cube();
    head.color = [1.0, 1.0, 1.0, 1.0];
    head.matrix.translate(0.2, 0.15, 0);
    head.matrix.scale(0.2, 0.2, 0.2);
    head.render();

    // Define ears using a loop for both ears
    for (var i = -1; i <= 1; i += 2) {
        var ear = new Cube();
        ear.color = [1.0, 1.0, 1.0, 1.0];
        ear.matrix.translate(0.2, 0.35, i * 0.05);
        ear.matrix.rotate(g_earAngle, 0, 0, 1);
        ear.matrix.scale(0.05, 0.15, 0.05);
        ear.render();
    }

    // Define legs using a loop for all four
    var legPositions = [[0.15, -0.1, 0.15], [0.15, -0.1, -0.15], [-0.15, -0.1, 0.15], [-0.15, -0.1, -0.15]];
    front = true;
    for (var i = 0; i < legPositions.length; i++) {
        var upperLeg = new Cube();
        upperLeg.color = [1.0, 1.0, 1.0, 1.0]; // White upper leg
        upperLeg.matrix.translate(...legPositions[i]);
        if (front) {
            upperLeg.matrix.rotate(g_upperLegAngle, 1, 0, 0); // Use global angle for the upper leg rotation
            front = false;
        } else {
            upperLeg.matrix.rotate(-g_upperLegAngle, 1, 0, 0); // Use global angle for the upper leg rotation
            front = true;
        }
        upperLeg.matrix.scale(0.05, 0.2, 0.05); // Change to 0.2 for leg length
        // Save the transformation state of the upper leg
        var upperLegMatrix = new Matrix4(upperLeg.matrix);
        upperLeg.render();

        var lowerLeg = new Cube();
        lowerLeg.color = [1.0, 1.0, 1.0, 1.0]; // White lower leg
        // Start the lower leg's transformation relative to the upper leg
        lowerLeg.matrix = upperLegMatrix;
        lowerLeg.matrix.translate(0, -0.2, 0); // Move down to the end of the upper leg
        lowerLeg.matrix.rotate(g_lowerLegAngle, 1, 0, 0); // Use global angle for the lower leg rotation
        lowerLeg.matrix.scale(1, 0.5, 1); // Non-uniform scaling to maintain thickness
        lowerLeg.render();
    }

    // Define tail
    var tail = new Cube();
    tail.color = [1.0, 0.8, 0.6, 1.0];
    tail.matrix.translate(-0.3, 0.05, 0);
    tail.matrix.scale(0.1, 0.1, 0.1);
    tail.render();
}