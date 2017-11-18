/* Draw a crossword on an HTML canvas. */
'use strict';

var AC_SQUARES = 13;
var DN_SQUARES = 13;
var CLUE_FILE = '/static/clues.json';

var WHITE = 'white';
var BLACK = 'black';
var HIGHLIGHT = 'aqua';
var GREYED = 'gainsboro';

var BLACK_SQUARES = [[0, 0], [0, 2], [0, 4], [0, 6], [0, 8], [0, 10], [0, 12],
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
                 [12, 0], [12, 2], [12, 4], [12, 6], [12, 8], [12, 10], [12, 12]];

function loadJson(file, callback) {
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

var CLUE_JSON = null;
loadJson(CLUE_FILE, function(response) {
    CLUE_JSON = JSON.parse(response);
});

function Coord(x, y) {
    this.x = x;
    this.y = y;
}

Coord.prototype.toString = function() {
    return this.x + ',' + this.y;
};

Coord.prototype.equals = function(other) {
    return this.x === other.x && this.y === other.y;

};

function coord(x, y) {
    return new Coord(x, y);
}

function coordFromString(str) {
    var parts = str.split(',');
    var x = parts[0] - 0;
    var y = parts[1] - 0;
    return coord(x, y);
}

function clueSeq(x, y, length, direction) {
    return {x: x, y: y, length: length, direction: direction};
}

function clueName(direction, number) {
    return {direction: direction, number: number};
}

function isLetter(str) {
      return str.length === 1 && (str.match(/[a-z]/i) || str.match(/[A-Z]/i));
}

function cellInArray(array, cell) {
    for (var k = 0; k < array.length; k++) {
        if (array[k][0] === cell.x && array[k][1] === cell.y) {
            return true;
        }
    }
    return false;
}

function emitEvent(elt, clue) {
    if (clue === null) {
        clue = clueName(null, null);
    }
    var event = new CustomEvent('clue-selected', { detail:
        {
            'direction': clue.direction,
            'clueNumber': clue.number
        }
    }, true, true);
    elt.dispatchEvent(event);
}

function fillSquare(ctx, cellSize, cell, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cellSize * cell.x + 2, cellSize * cell.y + 2,
            cellSize - 2, cellSize - 2);
}

function cellInClue(clue, cell) {
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

function colorClue(ctx, cellSize, color, clue) {
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

function Grid(width, height, cellSize, blackSquares, eventTarget) {
    this.width = width;
    this.height = height;
    this.blackSquares = blackSquares;
    this.whiteSquares = [];
    this.cellSize = cellSize;
    this.eventTarget = eventTarget;
    this.clues = {
        'ac': {},
        'dn': {}
    };
    if (typeof Cookies.get('grid-state') === 'undefined') {
        this.letters = {};
    } else {
        this.letters = JSON.parse(Cookies.get('grid-state'));
    }
    this.highlighted = null;
    this.selectedCell = null;
    this.figureOutWhiteSquares();
    this.figureOutClues();
}

Grid.prototype.figureOutWhiteSquares = function() {
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            var cell = coord(i, j);
            if (!cellInArray(this.blackSquares, cell)) {
                this.whiteSquares.push([i, j]);
            }
        }
    }
};

Grid.prototype.drawNumbers = function(ctx) {
    ctx.fillStyle = BLACK;
    var directions = ['ac', 'dn'];
    for (var i = 0; i < 2; i++) {
        var direction = directions[i];
        for (var clueNumber in this.clues[direction]) {
            if (this.clues[direction].hasOwnProperty(clueNumber)) {
                var clue = this.clues[direction][clueNumber];
                this.drawNumber(ctx,
                                clueNumber,
                                coord(clue.x, clue.y));
            }
        }
    }
};

Grid.prototype.drawLetters = function(ctx) {
    ctx.fillStyle = BLACK;
    for (var key in this.letters) {
        var letter = this.letters[key];
        this.drawLetter(ctx,
                        letter,
                        coordFromString(key));
    }
};

Grid.prototype.drawNumber = function(ctx, number, cell) {
    ctx.fillStyle = BLACK;
    var fontSize = Math.round(this.cellSize * 0.35);
    ctx.font = fontSize + 'px serif';
    ctx.textBaseline = 'hanging';
    ctx.fillText(number, this.cellSize * (cell.x + 0.1), this.cellSize * (cell.y + 0.2));
};

Grid.prototype.drawLetter = function(ctx, letter, cell) {
    ctx.fillStyle = BLACK;
    var fontSize = Math.round(this.cellSize * 0.8);
    ctx.font = fontSize + 'px sans';
    ctx.textBaseline = 'hanging';
    ctx.fillText(letter, this.cellSize * (cell.x + 0.2), this.cellSize * (cell.y + 0.2));
};

Grid.prototype.figureOutClues = function() {
    /* Collect clues and write in numbers */
    var clueNumber = 1;
    /* loop from right to left then top to bottom */
    for (var j = 0; j < DN_SQUARES; j++) {
        for (var i = 0; i < AC_SQUARES; i++) {
            var cell = coord(i, j);
            var acrossCount = 0;
            var downCount = 0;
            if (cellInArray(this.whiteSquares, cell)) {
                /* Start of across clue */
                if (i === 0 || !cellInArray(this.whiteSquares, coord(i - 1, j))) {
                    acrossCount = 1;
                    for (var l = i + 1; l < AC_SQUARES; l++) {
                        if (cellInArray(this.whiteSquares, coord(l, j))) {
                            acrossCount += 1;
                        } else {
                            break;
                        }
                    }
                    if (acrossCount > 1) {
                        this.clues.ac[clueNumber] = clueSeq(i, j, acrossCount, 'ac');
                    }
                }
                /* Start of down clue */
                if (j === 0 || !cellInArray(this.whiteSquares, coord(i, j - 1))) {
                    downCount = 1;
                    for (var l = j + 1; l < DN_SQUARES; l++) {
                        if (cellInArray(this.whiteSquares, coord(i, l))) {
                            downCount += 1;
                        } else {
                            break;
                        }
                    }
                    if (downCount > 1) {
                        this.clues.dn[clueNumber] = clueSeq(i, j, downCount, 'dn');
                    }
                }
                if (acrossCount > 1 || downCount > 1) {
                    clueNumber += 1;

                }
            }
        }
    }
};

Grid.prototype.draw = function(ctx) {
    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, this.width, this.height);
    /* Draw in the white squares. */
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            var cell = coord(i, j);
            if (cellInArray(this.whiteSquares, cell)) {
                fillSquare(ctx, this.cellSize, cell, WHITE);
            }
        }
    }
    this.highlightClue(ctx);
    this.highlightCell(ctx);
    this.drawNumbers(ctx);
    this.drawLetters(ctx);
};

Grid.prototype.selectCell = function(cell, toggle) {
    this.selectedCell = cell;
    this.highlightClueFromCell(cell, toggle);
};

Grid.prototype.onClick = function(event, canvas, ctx, eventTarget) {
    var x = Math.floor((event.pageX - canvas.offsetLeft - 2) /
            this.cellSize);
    var y = Math.floor((event.pageY - canvas.offsetTop - 2) /
            this.cellSize);
    var cell = coord(x, y);
    if (cellInArray(this.whiteSquares, cell)) {
        this.selectCell(cell, true);
    }
    this.draw(ctx);
};

Grid.prototype.selectNextCell = function(eventTarget, back) {
    var step = back? -1: 1;
    if (this.highlighted !== null) {
        if (this.highlighted.direction === 'ac') {
            var next = coord(this.selectedCell.x + step, this.selectedCell.y);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else {
            var next = coord(this.selectedCell.x, this.selectedCell.y + step);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        }
    }
};

Grid.prototype.onPress = function(ctx, event, char, eventTarget) {
    var lastChar = null;
    if (this.selectedCell !== null) {
        /* virtual keyboard; rely on passed char */
        if (event.keyCode === 229) {
            if (char === 'backspace'){
                lastChar = 'Backspace'
            } else {
                lastChar = char.toUpperCase();
            }
        } else if (isLetter(event.key)) {
            lastChar = event.key.toUpperCase();
        } else {
            lastChar = event.key;
        }

        if (lastChar === 'Backspace') {
            this.letters[this.selectedCell] = '';
            this.selectNextCell(eventTarget, true);
        } else if (lastChar === 'ArrowLeft') {
            event.preventDefault();
            var next = coord(this.selectedCell.x - 1, this.selectedCell.y);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else if (lastChar === 'ArrowRight') {
            event.preventDefault();
            var next = coord(this.selectedCell.x + 1, this.selectedCell.y);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else if (lastChar === 'ArrowUp') {
            event.preventDefault();
            var next = coord(this.selectedCell.x, this.selectedCell.y - 1);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else if (lastChar === 'ArrowDown') {
            event.preventDefault();
            var next = coord(this.selectedCell.x, this.selectedCell.y + 1);
            if (cellInArray(this.whiteSquares, next)) {
                this.selectCell(next, false);
            }
        } else if (isLetter(lastChar)) {
            this.letters[this.selectedCell] = lastChar.toUpperCase();
            this.selectNextCell(eventTarget, false);
        }
    }
    Cookies.set('grid-state', JSON.stringify(this.letters));
    this.draw(ctx);
};

/** Highlight the clue containing the specified cell */
Grid.prototype.highlightClueFromCell = function(cell, toggle) {
    var cluesContainingCell = [];
    var directions = ['ac', 'dn'];
    for (var i = 0; i < 2; i++) {
        var direction = directions[i];
        for (var clueNumber in this.clues[direction]) {
            if (this.clues[direction].hasOwnProperty(clueNumber)) {
                var clue = this.clues[direction][clueNumber];
                if (cellInClue(clue, cell)) {
                    cluesContainingCell.push(clueName(direction, clueNumber));
                }
            }
        }
    }
    if (cluesContainingCell.length === 0) {
        console.log('cell in no clues?');
    } else if (cluesContainingCell.length == 1) {
        this.highlighted = cluesContainingCell[0];
        emitEvent(this.eventTarget, this.highlighted);
    } else {
        /* do we toggle? */
        if (this.highlighted === null) {
            this.highlighted = cluesContainingCell[0];
            emitEvent(this.eventTarget, this.highlighted);
        } else {
            if (toggle) {
                if (this.highlighted.direction === cluesContainingCell[0].direction && this.highlighted.number === cluesContainingCell[0].number) {
                    this.highlighted = cluesContainingCell[1];
                    emitEvent(this.eventTarget, this.highlighted);
                } else {
                    this.highlighted = cluesContainingCell[0];
                    emitEvent(this.eventTarget, this.highlighted);
                }
            }
        }
    }
};

Grid.prototype.highlightClue = function(ctx) {
    if (this.highlighted !== null) {
        var clue = this.clues[this.highlighted.direction][this.highlighted.number];
        colorClue(ctx, this.cellSize, HIGHLIGHT, clue);
    }
};

Grid.prototype.highlightCell = function(ctx) {
    if (this.selectedCell !== null) {
        fillSquare(ctx, this.cellSize, this.selectedCell, GREYED);
    }
};

/** The main entry point */
function drawGrid(canvas, eventTarget, hiddenInput) {
    var ctx = canvas.getContext('2d');
    var pixelWidth = canvas.clientWidth;
    var pixelHeight = canvas.clientHeight;

    // Set canvas attributes to the correct number of pixels on the device.
    canvas.setAttribute('width', pixelWidth * window.devicePixelRatio);
    canvas.setAttribute('height', pixelHeight * window.devicePixelRatio);
    // Ensure canvas size is correct according to CSS.
    canvas.style.width = pixelWidth;
    canvas.style.height = pixelHeight;
    // Draw using the correct number of pixels by scaling the context.
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    var cellSize = Math.floor(Math.min(pixelWidth / AC_SQUARES, pixelHeight / DN_SQUARES));
    var gridWidth = cellSize * AC_SQUARES + 2;
    var gridHeight = cellSize * DN_SQUARES + 2;

    var grid = new Grid(gridWidth, gridHeight, cellSize, BLACK_SQUARES, eventTarget);
    grid.draw(ctx);

    /* Add click listener to react to events */
    canvas.addEventListener('click', function(event) {
        grid.onClick(event, canvas, ctx, eventTarget);
        hiddenInput.style.position = 'absolute'
        hiddenInput.style.left = event.pageX + 'px';
        hiddenInput.style.top = event.pageY + 'px';
        hiddenInput.focus();
    });

    hiddenInput.value = ' ';
    /* Add keypress listener to react to keyboard events.
     * Other possible events to listen for are keypress, keydown
     * and input. */
    hiddenInput.addEventListener('keyup', function(event) {
        console.log('button pressed ' + event.key);
        console.log('hidden input val ' + hiddenInput.value);
        var char = '';
        if (hiddenInput.value === '') {
            char = 'backspace';
        } else {
            char = hiddenInput.value.charAt(1);
        }
        grid.onPress(ctx, event, char, eventTarget);
        hiddenInput.value = ' ';
    });
}
