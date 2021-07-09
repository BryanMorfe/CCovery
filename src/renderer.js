const { BrowserWindow, dialog } = require('electron').remote;
const Fs = require('fs');
const Jimp = require('jimp');

var heatMapImg;
var processedImage;
var currentPoints = [];
var colorPicker;
var lastMousePos = null;

const imgProcWorker = new Worker('./img_proc_worker.js');

const CMAP_DIVISIONS = 256;
const GRADIENT_CONTAINER_WIDTH = 400;
const GRADIENT_POINT_WIDTH = 20 + 4;
const MAX_ABS_POSITION_POINT = GRADIENT_CONTAINER_WIDTH - GRADIENT_POINT_WIDTH;

window.addEventListener('DOMContentLoaded', () => {
    document.getElementById("close-icon").addEventListener("click", function(e)  {
        var win = BrowserWindow.getFocusedWindow();
        win.close();
    });

    document.getElementById("minimize-icon").addEventListener("click", function(e) {
        var win = BrowserWindow.getFocusedWindow();
        win.minimize();
    });

    document.getElementById("maximize-icon").addEventListener("click", function(e)  {
        var win = BrowserWindow.getFocusedWindow();
        
        if (win.isMaximized()) {
            win.unmaximize();
        } else {
            win.maximize();
        }
    });

    document.getElementById("color-map-select").addEventListener("change", function(e) {
        loadPresetColorMap();
    });

    document.getElementById("reverse-btn").addEventListener("click", function(e) {
        for (var i = 0; i < currentPoints.length; ++i) {
            currentPoints[i].x = 1 - currentPoints[i].x;
        }

        var gradient = new Gradient(NUM_DIVISIONS, currentPoints);
        loadGradient(gradient);
    });

    document.getElementById("reset-btn").addEventListener("click", function(e) {
        loadPresetColorMap();
    });

    document.getElementById("save-btn").addEventListener("click", function(e) {
        var gradient = new Gradient(CMAP_DIVISIONS, currentPoints);
        var cmapData = getCmapForGradient(gradient);
        
        // build file and save it
        dialog.showSaveDialog({ defaultPath: "untitled.cmap", filters: [
            { name: 'Color Maps', extensions: ['cmap', 'map'] },
            { name: 'All Files', extensions: ['*'] }
        ] }).then((result) => {
            if (!result.canceled) {
                Fs.writeFile(result.filePath, cmapData, function() {
                    console.log("File saved!");
                });
            } else {
                console.log("Filed saving canceled");
            }
        }).catch((reason) => {
            console.log(reason);
        });
    });

    document.getElementById("gradient-points").addEventListener("contextmenu", function(e) {
        e.preventDefault();
        let thisX = this.getBoundingClientRect().left;
        let mouseX = e.clientX - thisX - 12;

        if (mouseX < 0) {
            mouseX = 0;
        } else if (mouseX > MAX_ABS_POSITION_POINT) {
            mouseX = MAX_ABS_POSITION_POINT;
        }

        mouseX /= MAX_ABS_POSITION_POINT;

        var gradient = new Gradient(NUM_DIVISIONS, currentPoints);

        let color = gradient.buildColorWithCoord(mouseX);
        currentPoints.push(new GradientPoint(color.red, color.green, color.blue, mouseX));

        gradient = new Gradient(NUM_DIVISIONS, currentPoints);
        loadGradient(gradient);

        return false;
    });

    document.getElementsByClassName("color-picker-invisible-container")[0].addEventListener("click", function(e) {
        destroyColorPicker();
    });

    imgProcWorker.onmessage = imgProcDone;

    // Fill gradient bar
    let gradientBar = document.getElementById('gradient-bar');
    for (let i = 0; i < NUM_DIVISIONS; ++i) {
        let verticalBar = document.createElement('div');
        verticalBar.classList.add("gradient-vertical-bar");
        gradientBar.appendChild(verticalBar);
    }

    Jimp.read(__dirname + '/../resources/img.png', function(err, img) {
        if (err)
            throw err;

        heatMapImg = img;

        loadPresetColorMap();
    });
});

function getGradientFromPreset(presetIdx) {
    currentPoints = new Array(COLOR_MAPS[presetIdx].length);

    for (let i = 0; i < COLOR_MAPS[presetIdx].length; ++i) {
        currentPoints[i] = Object.assign(new GradientPoint(0, 0, 0, 0), COLOR_MAPS[presetIdx][i]);
    }

    var gradient = new Gradient(NUM_DIVISIONS, currentPoints);

    return gradient;
}

function loadPresetColorMap() {
    let value = document.getElementById("color-map-select").value;
    var gradient = getGradientFromPreset(value);

    loadGradient(gradient);
}

function loadGradient(gradient) {
    let gradientBar = document.getElementById('gradient-bar');
    var lut = Array(NUM_DIVISIONS);

    updateVisualPoints();

    gradient.create(function(i, color) {
        let verticalBar = gradientBar.childNodes.item(i);
        verticalBar.style.backgroundColor = 'rgb(' + color.red + ',' + color.green + ',' + color.blue + ')';
        lut[i] = Object.assign({}, color);
    });

    processHeatmap(lut, gradient);
}

function processHeatmap(lut, gradient) {
    processedImage = heatMapImg.clone();

    imgProcWorker.postMessage({ img: processedImage.bitmap.data, width: processedImage.bitmap.width, height: processedImage.bitmap.height, lut: lut });
    
    /* This code is synchronuos. It will not lag behind UI updates, but it will block it.
    * processedImage.scan(0, 0, processedImage.bitmap.width, processedImage.bitmap.height, function(x, y, idx) {
        var luma = (this.bitmap.data[idx + 0] * 0.299 + this.bitmap.data[idx + 1] * 0.587 + this.bitmap.data[idx + 2] * 0.114) / 255;
        var color = gradient.buildColorWithCoord(luma);
        this.bitmap.data[idx + 0] = parseInt(color.red);
        this.bitmap.data[idx + 1] = parseInt(color.green);
        this.bitmap.data[idx + 2] = parseInt(color.blue);

        if (x == this.bitmap.width - 1 && y == this.bitmap.height - 1) {
            this.getBase64(Jimp.MIME_PNG, function(err, imgBase64) {
                if (err)
                    throw err;
        
                document.getElementById("preview-heat-map").setAttribute('src', imgBase64);
            });
        }
    });*/
}

function imgProcDone(e) {
    var img = e.data.img;

    processedImage.bitmap.data = img;

    processedImage.getBase64(Jimp.MIME_PNG, function(err, imgBase64) {
        if (err)
            throw err;

        document.getElementById("preview-heat-map").setAttribute('src', imgBase64);
    });
}

function getCmapForGradient(gradient) {
    var buffer = new Uint8Array(CMAP_DIVISIONS * 3);

    gradient.create(function(i, color) {
        buffer[3*i + 0] = parseInt(color.red);
        buffer[3*i + 1] = parseInt(color.green);
        buffer[3*i + 2] = parseInt(color.blue);
    });

    return buffer;
}

function updateVisualPoints() {
    let pointClickListener = function(e) {
        let gradientPoints = document.getElementById("gradient-points");
        let children = gradientPoints.childNodes;
        var index = Array.prototype.indexOf.call(children, this);
        
        Array.prototype.forEach.call(children, function(child) {
            child.removeAttribute("selected");
        });

        this.setAttribute("selected", "");

        let rgb = (new Gradient(NUM_DIVISIONS, currentPoints)).buildColorWithCoord(currentPoints[index].x);
        colorPicker = new ColorPicker(rgb, "color-picker");

        colorPicker.colorDidUpdate(function() {
            let rgb = colorPicker.getRgb();
            currentPoints[index] = new GradientPoint(rgb.red, rgb.green, rgb.blue, currentPoints[index].x);
            var gradient = new Gradient(NUM_DIVISIONS, currentPoints);
            loadGradient(gradient);
        });

        let pos = { x: e.clientX - 418 - 10, y: e.clientY - 274 - 30 };

        if (pos.x < 0) {
            pos.x = 20;
        }

        showColorPicker(pos);
    };

    let pointDblClickListener = function(e) {
        let gradientPoints = document.getElementById("gradient-points");
        let children = gradientPoints.childNodes;
        let index = Array.prototype.indexOf.call(children, this);
        
        if (currentPoints.length > 1) {
            currentPoints.splice(index, 1);
            var gradient = new Gradient(NUM_DIVISIONS, currentPoints);
            loadGradient(gradient);
        } else {
            dialog.showErrorBox("Can't Delete", "The last node can't be deleted!");
        }
        
        // use index to populate color picker
        console.log("Index: " + index);
    };

    let pointMovedListener = function(index, changeInPos) {
        var element = document.getElementById("gradient-points").childNodes[index];
        let newX = element.offsetLeft + changeInPos.dx;

        if (newX < 0) {
            newX = 0;
        } else if (newX > MAX_ABS_POSITION_POINT) {
            newX = MAX_ABS_POSITION_POINT;
        }

        let relX = newX / MAX_ABS_POSITION_POINT;

        element.style.left = newX + "px";
        currentPoints[index].x = relX;
        var gradient = new Gradient(NUM_DIVISIONS, currentPoints);
        loadGradient(gradient);
    };

    let gradientPoints = document.getElementById("gradient-points");
    gradientPoints.innerHTML = "";

    for (var i = 0; i < currentPoints.length; ++i) {
        var gradientPoint = document.createElement('div');
        gradientPoint.classList.add("gradient-point");
        gradientPoints.appendChild(gradientPoint);

        gradientPoint.style.left = (currentPoints[i].x * MAX_ABS_POSITION_POINT) + "px";
    }

    gradientPoints.childNodes.forEach(function(child, i) {
        child.addEventListener("click", pointClickListener);
        child.addEventListener("dblclick", pointDblClickListener);
        dragElement(child, i, pointMovedListener);
    });
}

function showColorPicker(coords) {
    if (colorPicker != undefined && colorPicker != null) {
        colorPicker.show(coords);
        document.getElementsByClassName("color-picker-invisible-container")[0].style.display = "block";
    }
}

function destroyColorPicker() {
    if (colorPicker != undefined && colorPicker != null) {
        colorPicker.hide();
        document.getElementsByClassName("color-picker-invisible-container")[0].style.display = "none";
        colorPicker = null;
    }
}

function dragElement(element, index, elementDragHandler) {
    element.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();

        lastMousePos = { x: e.clientX, y: e.clientY };
        document.onmouseup = finishDrag;
        document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();

        var dirVector = { dx: e.clientX - lastMousePos.x, dy: e.clientY - lastMousePos.y };
        lastMousePos = { x: e.clientX, y: e.clientY };

        elementDragHandler(index, dirVector);
    }

    function finishDrag() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}
