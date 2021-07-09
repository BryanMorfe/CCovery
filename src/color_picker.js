class ColorPicker {
    constructor(rgb, id) {
        this.colorPicker = document.getElementById(id);
        this.hsv = ColorPicker.rgbToHsv(rgb);

        this.hexInput = this.colorPicker.querySelector(".picker-data .rgb-hex-input");
        this.blkContainer = this.colorPicker.querySelector(".blackness-bg.picker-container");
        this.hueContainer = this.colorPicker.querySelector(".hue-slider.picker-container");
        this.blkPicker = this.blkContainer.getElementsByClassName("picker")[0];
        this.huePicker = this.hueContainer.getElementsByClassName("picker")[0];

        this.lastMousePos = null;

        this.setupEventListeners();
        this.updatePickerPositions();
        this.updateColorPickerUi();
    }

    setupEventListeners() {
        // blk
        var thisObj = this;
        this.setElementDrag(this.blkPicker, function(element, changeVector) {
            let newPos = { x: element.offsetLeft + changeVector.dx, y: element.offsetTop + changeVector.dy };

            if (newPos.x < -8) {
                newPos.x = -8;
            } else if (newPos.x > thisObj.blkContainer.offsetWidth - 8) {
                newPos.x = thisObj.blkContainer.offsetWidth - 8;
            }

            if (newPos.y < -8) {
                newPos.y = -8;
            } else if (newPos.y > thisObj.blkContainer.offsetHeight - 8) {
                newPos.y = thisObj.blkContainer.offsetHeight - 8;
            }

            thisObj.hsv.sat = (newPos.x + 8) / thisObj.blkContainer.offsetWidth;
            thisObj.hsv.val = 1 - (newPos.y + 8) / thisObj.blkContainer.offsetHeight;

            if (thisObj.hsv.sat > 1) {
                thisObj.hsv.sat = 1;
            } else if (thisObj.hsv.sat < 0) {
                thisObj.hsv.sat = 0;
            }

            if (thisObj.hsv.val > 1) {
                thisObj.hsv.val = 1;
            } else if (thisObj.hsv.val < 0) {
                thisObj.hsv.val = 0;
            }
            
            thisObj.updatePickerPositions();
            thisObj.updateColorPickerUi();
            
            if (thisObj.colorUpdateHandler) {
                thisObj.colorUpdateHandler();
            }
        });

        this.blkContainer.onclick = function(e) {
            console.log("blkContainer clicked");
            e = e || window.event;
            e.preventDefault();
            let rect = thisObj.blkContainer.getBoundingClientRect();

            let pos = { x: e.clientX - rect.left, y: e.clientY - rect.top };

            thisObj.hsv.sat = pos.x / thisObj.blkContainer.offsetWidth;
            thisObj.hsv.val = 1 - pos.y / thisObj.blkContainer.offsetHeight;

            thisObj.updatePickerPositions();
            thisObj.updateColorPickerUi();

            if (thisObj.colorUpdateHandler) {
                thisObj.colorUpdateHandler();
            }
        };

        // hue
        this.setElementDrag(this.huePicker, function(element, changeVector) {
            let newY = element.offsetTop + changeVector.dy;

            if (newY < -8) {
                newY = -8;
            } else if (newY > thisObj.hueContainer.offsetHeight - 8) {
                newY = thisObj.hueContainer.offsetHeight - 8;
            }

            thisObj.hsv.hue = 360 * (1 - (newY + 8) / thisObj.hueContainer.offsetHeight);

            if (thisObj.hsv.hue > 360) {
                thisObj.hsv.hue = 360;
            } else if (thisObj.hsv.hue < 0) {
                thisObj.hsv.hue = 0;
            }
            
            thisObj.updatePickerPositions();
            thisObj.updateColorPickerUi();
            
            if (thisObj.colorUpdateHandler) {
                thisObj.colorUpdateHandler();
            }
        });

        this.hueContainer.onclick = function(e) {
            e = e || window.event;
            e.preventDefault();
            let rect = thisObj.hueContainer.getBoundingClientRect();

            let posY = e.clientY - rect.top;

            thisObj.hsv.hue = 360 * (1 - posY / thisObj.hueContainer.offsetHeight);

            thisObj.updatePickerPositions();
            thisObj.updateColorPickerUi();

            if (thisObj.colorUpdateHandler) {
                thisObj.colorUpdateHandler();
            }
        };

        // Hex Input
        this.hexInput.onkeyup = function() {
            let val = this.value;

            let reg = /(#)?[0-9a-f]{6,6}/i;

            if ((val.length == 7 || (val.length == 6 && val[0] != '#')) && !val.match(reg)) {
                // dialog.showErrorBox("Invalid Input", "Invalid hex input. Only enter hex digits.");
            
                return false;
            }
        };

        this.hexInput.onchange = function() {
            let val = this.value;

            console.log("Hex input changed to " + val);

            let reg = /(#)?[0-9a-fA-F]{6,6}/g;

            if (val.match(reg)) {
                this.value  = val.toUpperCase();
                var rgb = ColorPicker.hexToRgb(val);
                thisObj.hsv = ColorPicker.rgbToHsv(rgb);
                console.log(val + " = " + JSON.stringify(rgb) + " = " + JSON.stringify(thisObj.hsv));

                thisObj.updatePickerPositions();
                thisObj.updateColorPickerUi();

                if (thisObj.colorUpdateHandler) {
                    thisObj.colorUpdateHandler();
                }

                if (val[0] != '#') {
                    this.val = '#' + val;
                }
            } else {
                // dialog.showErrorBox("Invalid Input", "Invalid hex color.");

                return false;
            }
        };
    }

    setElementDrag(element, dragHandler) {
        var thisObj = this;
        element.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();

            thisObj.lastMousePos = { x: e.clientX, y: e.clientY };
            document.onmouseup = finishDrag;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();

            var dirVector = { dx: e.clientX - thisObj.lastMousePos.x, dy: e.clientY - thisObj.lastMousePos.y };
            thisObj.lastMousePos = { x: e.clientX, y: e.clientY };

            dragHandler(element, dirVector);
        }

        function finishDrag() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    show(coords) {
        this.colorPicker.style.display = "block";
        this.colorPicker.style.left = coords.x + "px";
        this.colorPicker.style.top = coords.y + "px";
    }

    hide() {
        this.colorPicker.style.display = "none";
    }

    updateColorPickerUi() {
        let rgb = this.getRgb();
        let hex = ColorPicker.rgbToHex(rgb);

        this.colorPicker.querySelector(".hsb-data .hue").innerHTML = Math.round(this.hsv.hue) + "&deg;";
        this.colorPicker.querySelector(".hsb-data .sat").innerHTML = Math.round(100 * this.hsv.sat) + "%";
        this.colorPicker.querySelector(".hsb-data .blk").innerHTML = Math.round(100 * this.hsv.val) + "%";

        this.colorPicker.querySelector(".rgb-data .red").innerHTML = Math.round(rgb.red);
        this.colorPicker.querySelector(".rgb-data .green").innerHTML = Math.round(rgb.green);
        this.colorPicker.querySelector(".rgb-data .blue").innerHTML = Math.round(rgb.blue);

        this.colorPicker.querySelector(".sat-bg").style.background = "linear-gradient(to right, #ffffff, hsl(" + Math.round(this.hsv.hue) + ", 100%, 50%))";
        this.hexInput.value = hex;
    }

    updatePickerPositions() {
        let hue = 1 - (this.hsv.hue / 360.0);
        let val = 1 - this.hsv.val;
        let temp;

        if (this.colorPicker.style.block != "block") {
            temp = this.colorPicker.style.display;
            this.colorPicker.style.display = "block";
        }

        this.blkPicker.style.left = (this.hsv.sat * this.blkContainer.offsetWidth - this.blkPicker.offsetWidth / 2) + "px";
        this.blkPicker.style.top = (val * this.blkContainer.offsetHeight - this.blkPicker.offsetHeight / 2) + "px";
        this.huePicker.style.top = (hue * this.hueContainer.offsetHeight - this.huePicker.offsetHeight / 2) + "px";

        if (temp) {
            this.colorPicker.style.display = temp;
        }
    }

    getRgb() {
        return ColorPicker.hsvToRgb(this.hsv);
    }

    colorDidUpdate(handler) {
        this.colorUpdateHandler = handler;
    }

    static hsvToRgb(hsv) {
        var c = hsv.val * hsv.sat;
        var x = c * (1 - Math.abs((hsv.hue / 60) % 2 - 1));
        var m = hsv.val - c;

        const MAX_RGB = 255;

        if (hsv.hue < 60) {
            return {red: (c + m) * MAX_RGB, green: (x + m) * MAX_RGB, blue: m * MAX_RGB};
        } else if (hsv.hue < 120) {
            return {red: (x + m) * MAX_RGB, green: (c + m) * MAX_RGB, blue: m * MAX_RGB};
        } else if (hsv.hue < 180) {
            return {red: m * MAX_RGB, green: (c + m) * MAX_RGB, blue: (x + m) * MAX_RGB};
        } else if (hsv.hue < 240) {
            return {red: m * MAX_RGB, green: (x + m) * MAX_RGB, blue: (c + m) * MAX_RGB};
        } else if (hsv.hue < 300) {
            return {red: (x + m) * MAX_RGB, green: m * MAX_RGB, blue: (c + m) * MAX_RGB};
        } else {
            return {red: (c + m) * MAX_RGB, green: m * MAX_RGB, blue: (x + m) * MAX_RGB};
        }
    }

    static rgbToHsv(rgb) {
        var r = rgb.red / 255.0;
        var g = rgb.green / 255.0;
        var b = rgb.blue / 255.0;

        var max = Math.max(r, Math.max(g, b));
        var min = Math.min(r, Math.min(g, b));
        var diff = max - min;

        var h;
        var s;
        var v;

        if (diff == 0) {
            h = 0;
        } else if (max == r) {
            h = 60 * (((g - b) / diff) % 6);
        } else if (max == g) {
            h = 60 * (((b - r) / diff) + 2);
        } else {
            h = 60 * (((r - g) / diff) + 4);
        }

        h += 360;
        h = h % 360;

        if (max == 0) {
            s = 0;
        } else {
            s = diff / max;
        }

        v = max;

        return {hue: h, sat: s, val: v};
    }

    static rgbToHex(rgb) {
        let intToHexString = function(x) {
            if (x < 16) {
                return ("0" + x.toString(16)).toUpperCase();
            }
        
            return (x.toString(16)).toUpperCase();
        };

        var hexString = "#";
        hexString += intToHexString(Math.round(rgb.red)) + intToHexString(Math.round(rgb.green)) + intToHexString(Math.round(rgb.blue));

        return hexString;
    }

    static hexToRgb(hexStr) {
        if (hexStr[0] == '#') {
            hexStr = hexStr.substring(1);
        }
    
        return {red: parseInt(hexStr.slice(0,2), 16), green: parseInt(hexStr.slice(2,4), 16), blue: parseInt(hexStr.slice(4,6), 16)};
    }
}