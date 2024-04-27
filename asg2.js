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

// Constants
const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

// Global variables
let canvas;
let gl;
let a_Position;
let u_FragColor;
var u_ModelMatrix;
var u_GlobalRotateMatrix;
let u_Size;
let g_selectedType = POINT;
let g_selectedSides = 14;


function setupWebGL() {
    // Retrieve <canvas> element
    canvas = document.getElementById('webgl');

    // Get the rendering context for WebGL
    gl = canvas.getContext("webgl", { preseveDrawingBuffer: true }); // gl = getWebGLContext(canvas);
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }
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
    // Button
    document.getElementById('green').onclick = function() { g_selectedColor = [0.0,1.0,0.0,1.0]; }; 
    document.getElementById('red').onclick = function() { g_selectedColor = [1.0,0.0,0.0,1.0]; };
    document.getElementById('clearButton').onclick = function() { g_shapesList = []; renderScene();}; 

    // Buttons that change cursor shape directly
    document.getElementById('pointButton').onclick = function() { g_selectedType = POINT; }; 
    document.getElementById('triButton').onclick = function() { g_selectedType = TRIANGLE; };
    document.getElementById('circleButton').onclick = function() { g_selectedType = CIRCLE; };

    document.getElementById('angleSlide').addEventListener('mousemove', function() { g_globalAngle = this.value; renderScene();});

    // Sliders
    document.getElementById('redSlide').addEventListener('mouseup', function() { g_selectedColor[0] = this.value/100; });
    document.getElementById('greenSlide').addEventListener('mouseup', function() { g_selectedColor[1] = this.value/100; });
    document.getElementById('blueSlide').addEventListener('mouseup', function() { g_selectedColor[2] = this.value/100; });

    // Slider to change the size
    document.getElementById('sizeSlide').addEventListener('mouseup', function() { g_selectedSize = this.value; });

    document.getElementById('sideSlide').addEventListener('mouseup',
        function() { g_selectedSides = this.value; });

    document.getElementById('drawPicutre').addEventListener('click', drawStarPattern);

    document.getElementById('redSlide').addEventListener('mouseup', updateBrushColor);
    document.getElementById('greenSlide').addEventListener('mouseup', updateBrushColor);
    document.getElementById('blueSlide').addEventListener('mouseup', updateBrushColor);
    document.getElementById('alphaSlide').addEventListener('input', updateBrushColor); // Immediate feedback on alpha change


}


function main() {
    // set up canvas
    setupWebGL();

    // set up shaders
    connectVariablesToGLSL();

    // actions for html
    addActionForHtmlUI();

    // Register function (event handler) to be called on a mouse press
    // canvas.onmousedown = click;
    // canvas.onmousemove = function(ev) { if(ev.buttons==1) {click(ev)} }; 

    // Specify the color for clearing <canvas>
    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    // Clear <canvas>
    // gl.clear(gl.COLOR_BUFFER_BIT);
    renderScene();
}



var g_shapesList = [];



// function click(ev) {
//     let [x, y] = convertCoordEventToWebGL(ev);  // extract the event click and return in in webgl coord

//     let point;
//     if(g_selectedType == POINT){
//         point = new Point();
//     } else if((g_selectedType == TRIANGLE)){
//         point = new Triangle();
//     }
//     else {
//         point = new Circle();
//         point.sides = g_selectedSides;
//     }




//     point.position=[x,y];
//     point.color = g_selectedColor.slice();
//     point.size = g_selectedSize;
//     g_shapesList.push(point);

//     renderAllShapes();

// }

function convertCoordEventToWebGL(ev){
    var x = ev.clientX;                                         
    var y = ev.clientY;                                         
    var rect = ev.target.getBoundingClientRect();

    x = ((x - rect.left) - canvas.width/2)/(canvas.width/2);
    y = (canvas.height/2 - (y - rect.top))/(canvas.height/2);
    return ([x,y]);
}

function renderScene(){
    var startTime = performance.now();

    var gloablRotMat = new Matrix4().rotate(g_globalAngle,0,1,0);
    gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, gloablRotMat.elements);


    // Clear <canvas>
    gl.clear(gl.COLOR_BUFFER_BIT);

    // var len = g_points.length;
    var len = g_shapesList.length;


    // for (var i = 0; i < len; i++) {
    //     g_shapesList[i].render();
    // }

    // drawTriangle3D([-1.0,0.0,0.0, -0.5,-1.0,0.0, 0.0,0.0,0.0]);

    // draw body cube
    var body = new Cube();
    body.color = [1.0, 0.0, 0.0, 1.0];
    body.matrix.translate(-.25,-.5,0.0);
    body.matrix.scale(0.5,1,-0.5);
    body.render();

    // draw a left arm
    var leftArm = new Cube();
    leftArm.color = [1, 1, 0, 1];
    leftArm.matrix.translate(.7,0,0.0);
    leftArm.matrix.rotate(45,0,0, 1);
    leftArm.matrix.scale(0.25,.7,.5);
    leftArm.render();

    // draw test box
    var box = new Cube();
    box.color = [1, 0, 1, 1];
    box.matrix.translate(0,0,-.5,0);
    box.matrix.rotate(-30,1,0,0);
    box.matrix.scale(.5,.5,.5);
    box.render();



    var duration = performance.now() - startTime;
    sendTextToHTML("numdot " + len + 
                   " ms: " + Math.floor(duration) + 
                   " fps: " + Math.floor(10000/duration), 
                   "numdot");

    sendTextToHTML(g_selectedSides, 
    "numside");
}

function sendTextToHTML(text, htmlID){ 
    var htmlElement = document.getElementById(htmlID);
    if(!htmlElement){
        console.log("failed to get " + htmlID + "from HTML");
        return;
    }
    htmlElement.innerHTML = text;
}

function drawStarPattern() {
    const numTriangles = 20; // Total triangles in the star
    const radius = 0.5; // Radius of the circle where the tips of the star reach
    let triangles = [];

    for (let i = 0; i < numTriangles; i++) {
        const angle = 2 * Math.PI * i / numTriangles;
        const nextAngle = 2 * Math.PI * (i + 1) / numTriangles;
        
        // Center of the canvas
        const center = [0, 0];

        // Vertices of the triangle
        const firstVertex = [center[0] + radius * Math.sin(angle), center[1] + radius * Math.cos(angle)];
        const secondVertex = [center[0] + radius * Math.sin(nextAngle), center[1] + radius * Math.cos(nextAngle)];

        // Base of the triangle closer to center
        const baseRadius = radius * 0.5; // Adjust this value to get the desired look
        const thirdVertex = [
            center[0] + baseRadius * Math.sin(angle + Math.PI / numTriangles),
            center[1] + baseRadius * Math.cos(angle + Math.PI / numTriangles)
        ];

        triangles.push({
            vertices: [...firstVertex, ...secondVertex, ...thirdVertex],
            color: [1, 0, 0, 1] // Red color, you can make this dynamic
        });
    }

    triangles.forEach(tri => {
        drawTri(tri.vertices, tri.color);
    });
}

function drawTri(vertices, color) {
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    
    var a_Position = gl.getAttribLocation(gl.program, 'a_Position');
    gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_Position);

    var u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
    gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);

    gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function updateBrushColor() {
    let red = document.getElementById('redSlide').value / 100;
    let green = document.getElementById('greenSlide').value / 100;
    let blue = document.getElementById('blueSlide').value / 100;
    let alpha = parseFloat(document.getElementById('alphaSlide').value); // Get alpha value from slider

    g_selectedColor = [red, green, blue, alpha]; // Update global color with alpha
}

document.getElementById('redSlide').addEventListener('mouseup', updateBrushColor);
document.getElementById('greenSlide').addEventListener('mouseup', updateBrushColor);
document.getElementById('blueSlide').addEventListener('mouseup', updateBrushColor);
document.getElementById('alphaSlide').addEventListener('input', updateBrushColor); // Immediate feedback on alpha change
