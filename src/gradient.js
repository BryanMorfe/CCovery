class GradientPoint {
    constructor(r, g, b, x = 0.0) {
        this.color = {red : r, green : g, blue : b};
        this.x = x;
    }

    distance(coordX) {
        return Math.abs(coordX - this.x);
    }
}

class Gradient {
    constructor(nDivisions, points) {
        this.nDivisions = nDivisions;
        this.points = [...points];
        this.points.sort(function(lhs, rhs) {
            if (lhs.x < rhs.x) {
                return -1;
            } else if (lhs.x == rhs.x) {
                return 0;
            } else {
                return 1;
            }
        });

        // Add principal points if needed
        if (this.points[0].x > 0) {
            this.points.splice(0, 0, new GradientPoint(this.points[0].color.red,
                                                       this.points[0].color.green,
                                                       this.points[0].color.blue, 0));
        }

        if (this.points[this.points.length - 1].x < 1) {
            this.points.push(new GradientPoint(this.points[this.points.length - 1].color.red,
                                               this.points[this.points.length - 1].color.green,
                                               this.points[this.points.length - 1].color.blue, 1));
        }
    }

    getSurroundingPoints(coordX) {
        for (var i = 0; i < this.points.length - 1; ++i) {
            if (this.points[i].x <= coordX && this.points[i + 1].x >= coordX) {
                return [this.points[i], this.points[i + 1]];
            }
        }

        return null;
    }

    buildColor(i) {
        let coordX = i / (this.nDivisions - 1);
        return this.buildColorWithCoord(coordX);
    }

    buildColorWithCoord(coordX) {
        let srPoints = this.getSurroundingPoints(coordX);
        let maxDistance = srPoints[0].distance(srPoints[1].x);
        let distanceToPointBelow = srPoints[0].distance(coordX) / maxDistance;
        let distanceToPointAbove = srPoints[1].distance(coordX) / maxDistance;

        return { red: Math.round(srPoints[0].color.red * (1 - distanceToPointBelow) + srPoints[1].color.red * (1 - distanceToPointAbove)),
                green: Math.round(srPoints[0].color.green * (1 - distanceToPointBelow) + srPoints[1].color.green * (1 - distanceToPointAbove)),
                blue: Math.round(srPoints[0].color.blue * (1 - distanceToPointBelow) + srPoints[1].color.blue * (1 - distanceToPointAbove)) };
    }

    create(colorCallback) {
        var color;
        for (var i = 0; i < this.nDivisions; ++i) {
            color = this.buildColor(i);
            colorCallback(i, color);
        }
    }

    reverse() {        
        for (let i = 0; i < this.points.length / 2; ++i) {
            this.points[i].x = 1 - this.points[i].x;
            this.points[this.points.length - i - 1].x = 1 - this.points[this.points.length - i - 1].x;
            var temp = this.points[i];
            this.points[i] = this.points[this.points.length - i - 1];
            this.points[this.points.length - i - 1] = temp;
        }

        if (this.points.length % 2 !== 0)
        {
            let mid = Math.round(this.points.length / 2);
            this.points[mid].x = 1 - this.points[mid];
        }
    }
}

const COLOR_MAPS = [
    [new GradientPoint(0, 0, 0, 0), new GradientPoint(255, 255, 255, 1)], // Black to White
    [new GradientPoint(20, 11, 52, 0), new GradientPoint(132, 32, 107, 0.33),
     new GradientPoint(229, 92, 48, 0.67), new GradientPoint(246, 215, 70, 1)], // Inferno
    [new GradientPoint(12, 7, 134, 0), new GradientPoint(202, 70, 120, 0.5), new GradientPoint(239, 248, 33, 1)], // Plasma
    [new GradientPoint(68, 1, 84, 0), new GradientPoint(40, 140, 140, 0.5), new GradientPoint(253, 231, 37, 1)], // Viridis
    [new GradientPoint(0, 0, 4, 0), new GradientPoint(113, 36, 128, 0.33),
     new GradientPoint(241, 63, 93, 0.67), new GradientPoint(252, 253, 190, 1)], // Magma
    [new GradientPoint(50, 60, 50, 0), new GradientPoint(0, 220, 20, 1)], // False Green
    [new GradientPoint(50, 50, 60, 0), new GradientPoint(0, 20, 220, 1)], // False Blue
    [new GradientPoint(0, 0, 100, 0), new GradientPoint(0, 0, 255, 0.2), new GradientPoint(0, 255, 255, 0.4),
     new GradientPoint(255, 255, 0, 0.6), new GradientPoint(255, 0, 0, 0.8), new GradientPoint(100, 0, 0, 1)], // Jet
    [new GradientPoint(255, 0, 255, 0), new GradientPoint(0, 255, 255, 1)], // Cool
];

const NUM_DIVISIONS = 200;
