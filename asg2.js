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

function connectVariablesToGLSL(){
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

// Globals related to UI elements
let g_selectedColor = [1.0,1.0,1.0,1.0];
let g_selectedSize = 5;
let g_globalAngle = 0;

// set up js actions for html elements
function addActionForHtmlUI(){

    document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderScene();});

}


function main() {
    // set up canvas
    setupWebGL();

    // set up shaders
    connectVariablesToGLSL();

    // actions for html
    addActionForHtmlUI();

    

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    // gl.clear(gl.COLOR_BUFFER_BIT);
    renderScene();
}

var g_shapesList = [];

function convertCoordEventToWebGL(ev){
    var x = ev.clientX;                                         
    var y = ev.clientY;                                         
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return ([x,y]);
}



// function renderScene(){
//     var startTime = performance.now();

//     var gloablRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
//     gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, gloablRotMat.elements);


//     // Clear <canvas>
//     gl.clear(gl.COLOR_BUFFER_BIT);

//     // draw body cube
//     var body = new Cube();
//     body.color = [1.0, 0.0, 0.0, 1.0];
//     body.matrix.translate(-.25,-.5,0.0);
//     body.matrix.scale(0.5,1,-0.5);
//     body.render();

//     // draw a left arm
//     var leftArm = new Cube();
//     leftArm.color = [1, 1, 0, 1];
//     leftArm.matrix.translate(.7,0,0.0);
//     leftArm.matrix.rotate(45,0,0, 1);
//     leftArm.matrix.scale(0.25,.7,.5);
//     leftArm.render();

//     // draw test box
//     var box = new Cube();
//     box.color = [1, 0, 1, 1];
//     box.matrix.translate(0,0,-.5,0);
//     box.matrix.rotate(-30,1,0,0);
//     box.matrix.scale(.5,.5,.5);
//     box.render();

// }

function renderScene(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var globalRotMat = new Matrix4().rotate(g_globalAngle, 0, 1, 0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

    // Body
    var body = new Cube();
    body.color = [0.5, 0.5, 0.5, 1.0]; // Gray
    body.matrix.translate(0, 0, 0);
    body.matrix.scale(1, 0.5, 0.5); // Elongated cube for the body
    body.render();

    // Head
    var head = new Cube();
    head.color = [0.5, 0.5, 0.5, 1.0];
    head.matrix.translate(0.75, 0.2, 0); // Position the head at the front of the body
    head.matrix.scale(0.3, 0.3, 0.3); // Smaller cube for the head
    head.render();

    // Legs
    var leg1 = new Cube(), leg2 = new Cube(), leg3 = new Cube(), leg4 = new Cube();
    var legs = [leg1, leg2, leg3, leg4];
    legs.forEach((leg, index) => {
        leg.color = [0.3, 0.2, 0.1, 1.0]; // Dark brown
        leg.matrix.translate(index < 2 ? 0.4 : -0.4, -0.5, index % 2 == 0 ? 0.2 : -0.2); // Position legs
        leg.matrix.scale(0.15, 0.4, 0.15); // Slim and tall segments for upper legs
        leg.render();

        // Lower leg (joint)
        var lowerLeg = new Cube();
        lowerLeg.color = [0.3, 0.2, 0.1, 1.0];
        lowerLeg.matrix.setTranslate(leg.matrix.elements[12], leg.matrix.elements[13] - 0.3, leg.matrix.elements[14]); // Start from upper leg position
        lowerLeg.matrix.rotate(-45, 1, 0, 0); // Simulate a knee joint by rotating lower leg
        lowerLeg.matrix.scale(0.15, 0.3, 0.15); // Shorter segment for lower legs
        lowerLeg.render();
    });

    // Tail (optional, for extended parts)
    var tail = new Cube();
    tail.color = [0.5, 0.5, 0.5, 1.0];
    tail.matrix.translate(-0.8, 0, 0); // Attach to the back of the body
    tail.matrix.scale(0.1, 0.1, 0.5); // Long and thin
    tail.matrix.rotate(30, 0, 0, 1); // Slight upward curve
    tail.render();
}


function sendTextToHTML(text, htmlID){ 
    var htmlElement = document.getElementById(htmlID);
    if(!htmlElement){
        console.log("failed to get " + htmlID + "from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}
