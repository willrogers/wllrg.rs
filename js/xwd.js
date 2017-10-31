/* Draw a crossword on an HTML canvas. */

AC_SQUARES = 13;
DN_SQUARES = 13;
LINE_WIDTH = 1;
CLUE_FILE = '/static/clues.json';

WHITE = 'white';
BLACK = 'black';
HIGHLIGHT = 'aqua';
GREYED = 'gainsboro';

coord = function(x, y) {
    return {x: x, y: y};
}

clue_seq = function(x, y, length, direction) {
    return {x: x, y: y, length: length, direction: direction};
}

clue_name = function(direction, number) {
    return {direction: direction, number: number};
}

BLACK_SQUARES = [[0, 0], [0, 2], [0, 4], [0, 6], [0, 8], [0, 10], [0, 12],
                 [1, 6],
                 [2, 0], [2, 2], [2, 4], [2, 6], [2, 8], [2, 10], [2, 12],
                 [3, 8],
                 [4, 0], [4, 2], [4, 4], [4, 6], [4, 8], [4, 9], [4, 10], [4, 12],
                 [5, 6],
                 [6, 0], [6, 1], [6, 2], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 10], [6, 11], [6, 12],
                 [7, 6],
                 [8, 0], [8, 2], [8, 3], [8, 4], [8, 6], [8, 8], [8, 10], [8, 12],
                 [9, 4],
                 [10, 0], [10, 2], [10, 4], [10, 6], [10, 8], [10, 10], [10, 12],
                 [11, 6],
                 [12, 0], [12, 2], [12, 4], [12, 6], [12, 8], [12, 10], [12, 12]]


function Grid(width, height, cellSize, black_squares) {
    this.width = width;
    this.height = height;
    this.black_squares = black_squares;
    this.cellSize = cellSize;
    this.clues = {
        'ac': {},
        'dn': {}
    };
    this.highlighted = null;
    this.figureOutClues();
}

Grid.prototype.drawNumbers = function(ctx) {
    ctx.fillStyle = BLACK;
    console.log('drawing numbers');
    directions = ['ac', 'dn'];
    for (i = 0; i < 2; i++) {
        direction = directions[i];
        for (var clueNumber in this.clues[direction]) {
            if (this.clues[direction].hasOwnProperty(clueNumber)) {
                var clue = this.clues[direction][clueNumber];
                this.drawNumber(ctx,
                                clueNumber,
                                coord(clue.x, clue.y));
            }
        }
    }
}

Grid.prototype.drawNumber = function(ctx, number, cell) {
    ctx.font = '28px serif';
    ctx.textBaseline = 'hanging';
    ctx.fillText(number, this.cellSize * cell.x + 3, this.cellSize * cell.y + 3);
}

Grid.prototype.figureOutClues = function() {
    /* Collect clues and write in numbers */
    var clueNumber = 1;
    /* loop from right to left then top to bottom */
    for (var j = 0; j < DN_SQUARES; j++) {
        for (var i = 0; i < AC_SQUARES; i++) {
            var cell = coord(i, j);
            var acrossCount = 0;
            var downCount = 0;
            if (cellInArray(WHITE_SQUARES, cell)) {
                /* Start of across clue */
                if (i === 0 || !cellInArray(WHITE_SQUARES, coord(i - 1, j))) {
                    acrossCount = 1;
                    for (var l = i + 1; l < AC_SQUARES; l++) {
                        if (cellInArray(WHITE_SQUARES, coord(l, j))) {
                            acrossCount += 1;
                        } else {
                            break;
                        }
                    }
                    if (acrossCount > 1) {
                        this.clues['ac'][clueNumber] = clue_seq(i, j, acrossCount, 'ac');
                    }
                }
                /* Start of down clue */
                if (j === 0 || !cellInArray(WHITE_SQUARES, coord(i, j - 1))) {
                    downCount = 1;
                    for (var l = j + 1; l < DN_SQUARES; l++) {
                        if (cellInArray(WHITE_SQUARES, coord(i, l))) {
                            downCount += 1;
                        } else {
                            break;
                        }
                    }
                    if (downCount > 1) {
                        this.clues['dn'][clueNumber] = clue_seq(i, j, downCount, 'dn');
                    }
                }
                if (acrossCount > 1 || downCount > 1) {
                    clueNumber += 1;

                }
            }
        }
    }
}

Grid.prototype.draw = function(ctx) {
    console.log('drawing the grid');
    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, this.width, this.height);
    /* Draw in the white squares. */
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            var cell = coord(i, j);
            if (cellInArray(WHITE_SQUARES, cell)) {
                fillSquare(ctx, this.cellSize, cell, WHITE);
            }
        }
    }
    this.highlightClue(ctx);
    this.drawNumbers(ctx);
}

Grid.prototype.onClick = function(event, canvas, ctx, eventTarget) {
    var x = Math.floor((event.pageX - canvas.offsetLeft - 2) /
            this.cellSize * window.devicePixelRatio);
    var y = Math.floor((event.pageY - canvas.offsetTop - 2) /
            this.cellSize * window.devicePixelRatio);
    cell = coord(x, y);
    if (cellInArray(WHITE_SQUARES, cell)) {
        var selected = checkForHighlight(this.clues, cell, this.highlighted);
        if (selected !== null) {
            this.highlighted = selected;
            emitEvent(eventTarget, selected);
        } else if (this.highlighted !== null) {
            var clue = this.clues[this.highlighted.direction][this.highlighted.number];
            emitEvent(eventTarget, null);
            this.highlighted = null;
        }
    }
    this.draw(ctx);
}

cellInArray = function(array, cell) {
    for (var k = 0; k < array.length; k++) {
        if (array[k][0] === cell.x && array[k][1] === cell.y) {
            return true;
        }
    }
    return false;
}

WHITE_SQUARES = []
for (var i = 0; i < AC_SQUARES; i++) {
    for (var j = 0; j < DN_SQUARES; j++) {
        cell = coord(i, j);
        if (!cellInArray(BLACK_SQUARES, cell)) {
            WHITE_SQUARES.push([i, j]);
        }
    }
}

loadJson = function(file, callback) {
    // see https://laracasts.com/discuss/channels/general-discussion/load-json-file-from-javascript
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);
}

CLUE_JSON = null;
loadJson(CLUE_FILE, function(response) {
    CLUE_JSON = JSON.parse(response);
});

fillSquare = function(ctx, cellSize, cell, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cellSize * cell.x + 2, cellSize * cell.y + 2,
            cellSize - 2, cellSize - 2);
}

cellInClue = function(clue, cell) {
    if (clue.direction === 'ac') {
        for (var i = clue.x; i < clue.x + clue.length; i++) {
            if (cell.x == i && cell.y == clue.y) {
                return true;
            }
        }
    }
    if (clue.direction === 'dn') {
        for (var i = clue.y; i < clue.y + clue.length; i++) {
            if (cell.x == clue.x && cell.y == i) {
                return true;
            }
        }
    }
    return false;
}

checkForHighlight = function(clues, cell, highlighted) {
    var directions = ['ac', 'dn'];
    for (var i = 0; i < 2; i++) {
        var direction = directions[i];
        for (var clueNumber in clues[direction]) {
            if (clues[direction].hasOwnProperty(clueNumber)) {
                var clue = clues[direction][clueNumber];
                if (cellInClue(clue, cell)) {
                    if ((highlighted === null) || (!(highlighted.direction === direction && highlighted.number === clueNumber))) {
                        return clue_name(direction, clueNumber);
                    }
                }
            }
        }
    }
    return null;
}

colorClue = function(ctx, cellSize, color, clue) {
    if (clue.direction === 'ac') {
        for (var i = clue.x; i < clue.x + clue.length; i++) {
            fillSquare(ctx, cellSize, coord(i, clue.y), color);
        }
    }
    if (clue.direction === 'dn') {
        for (var i = clue.y; i < clue.y + clue.length; i++) {
            fillSquare(ctx, cellSize, coord(clue.x, i), color);
        }
    }
}


greyOutClue = function(ctx, cellSize, clue) {
    colorClue(ctx, cellSize, GREYED, clue);
    drawNumbers(ctx, cellSize);
}

Grid.prototype.highlightClue = function(ctx) {
    if (this.highlighted !== null) {
        console.log(this.highlighted);
        var clue = this.clues[this.highlighted.direction][this.highlighted.number];
        console.log(clue);
        colorClue(ctx, this.cellSize, HIGHLIGHT, clue);
    }
}

emitEvent = function(elt, clue) {
    if (clue === null) {
        clue = clue_name(null, null);
    }
    var event = new CustomEvent('clue-selected', { detail:
        {
            'direction': clue.direction,
            'clueNumber': clue.number
        }
    }, true, true);
    elt.dispatchEvent(event);
}

drawGrid = function(canvas, eventTarget) {
    var ctx = canvas.getContext('2d');
    var width = 400;
    var height = 400;
    // Handle device scaling.
    canvas.width = width * window.devicePixelRatio;
    canvas.height = width * window.devicePixelRatio;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    var cellSize = Math.floor(Math.min(canvas.width / AC_SQUARES, canvas.height / DN_SQUARES));
    var width = cellSize * AC_SQUARES + 2;
    var height = cellSize * DN_SQUARES + 2;

    grid = new Grid(width, height, cellSize, BLACK_SQUARES);
    grid.draw(ctx);

    /* Add click listener to react to events */
    canvas.addEventListener('click', function(event) {
        grid.onClick(event, canvas, ctx, eventTarget);
    });
}
