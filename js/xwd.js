/* Draw a crossword on an HTML canvas. */
'use strict';

var AC_SQUARES = 13;
var DN_SQUARES = 13;
var CLUE_FILE = '/static/clues2018.json';

var DIRECTIONS = ['ac', 'dn'];

var WHITE = 'white';
var BLACK = 'black';
var CELL_HIGHLIGHT = '#87d3ff';
var HIGHLIGHT = '#d6f0ff';
var GREYED = 'gainsboro';
var UNRELEASED = 'lightgrey';


var BLACK_SQUARES = [[0, 5],
                 [1, 1], [1, 3], [1, 5], [1, 7], [1, 9], [1, 11],
                 [2, 7],
                 [3, 1], [3, 3], [3, 5], [3, 7], [3, 9], [3, 11],
                 [4, 5],
                 [5, 0], [5, 1], [5, 3], [5, 4], [5, 5], [5, 7], [5, 9], [5, 10], [5, 11],
                 [6, 6],
                 [7, 1], [7, 2], [7, 3], [7, 5], [7, 7], [7, 8], [7, 9], [7, 11], [7, 12],
                 [8, 7],
                 [9, 1], [9, 3], [9, 5], [9, 7], [9, 9], [9, 11],
                 [10, 5],
                 [11, 1], [11, 3], [11, 5], [11, 7], [11, 9], [11, 11],
                 [12, 7]]


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

function emitEvent(listeners, clue) {
    if (clue === null) {
        clue = clueName(null, null);
    }
    var event = new CustomEvent('clue-selected', { detail:
        {
            'direction': clue.direction,
            'clueNumber': clue.number
        }
    }, true, true);
    for (var i = 0; i < listeners.length; i++) {
        listeners[i].dispatchEvent(event);
    }
}

function fillSquare(ctx, cellSize, cell, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cellSize * cell.x + 1, cellSize * cell.y + 1,
            cellSize - 1, cellSize - 1);
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

function Grid(width, height, cellSize, blackSquares, eventListeners) {
    this.width = width;
    this.height = height;
    this.blackSquares = blackSquares;
    this.whiteSquares = [];
    this.cellSize = cellSize;
    this.eventListeners = [];
    /* each is a clueSeq */
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

Grid.prototype.addListener = function(listener) {
    this.eventListeners.push(listener);
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
    for (var i = 0; i < 2; i++) {
        var direction = DIRECTIONS[i];
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
    ctx.textAlign = 'left';
    ctx.fillText(number, this.cellSize * (cell.x + 0.1), this.cellSize * (cell.y + 0.1));
};

Grid.prototype.drawLetter = function(ctx, letter, cell) {
    ctx.fillStyle = BLACK;
    var fontSize = Math.round(this.cellSize * 0.7);
    ctx.font = fontSize + 'px sans';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(letter, this.cellSize * (cell.x + 0.5) + 1, this.cellSize * (cell.y + 0.5) + 1);
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

Grid.prototype.onClick = function(event, canvas, ctx) {
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

Grid.prototype.selectNextCell = function(back) {
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

Grid.prototype.onPress = function(ctx, event, char) {
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
            this.selectNextCell(true);
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
        } else if (lastChar === 'Tab') {
            console.log(this.highlighted);
            var matched = false;
            for (var i = 0; i < 2; i++) {
                var direction = DIRECTIONS[i];
                for (var clue in this.clues[direction]) {
                    if (this.clues[direction].hasOwnProperty(clue)) {
                        if (matched) {
                            this.setHighlightedClue(direction, clue);
                            matched = false;
                            break;
                        } else {
                            if (direction === this.highlighted.direction && clue === this.highlighted.number) {
                                matched = true;
                            }
                        }
                    }
                }
            }
        } else if (isLetter(lastChar)) {
            this.letters[this.selectedCell] = lastChar.toUpperCase();
            this.selectNextCell(false);
        }
    }
    Cookies.set('grid-state', JSON.stringify(this.letters), { expires: new Date(2018, 11, 31) } );
    this.draw(ctx);
};

/** Highlight the clue containing the specified cell */
Grid.prototype.highlightClueFromCell = function(cell, toggle) {
    var cluesContainingCell = [];
    for (var i = 0; i < 2; i++) {
        var direction = DIRECTIONS[i];
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
        emitEvent(this.eventListeners, this.highlighted);
    } else {
        /* do we toggle? */
        if (this.highlighted === null) {
            this.highlighted = cluesContainingCell[0];
            emitEvent(this.eventListeners, this.highlighted);
        } else {
            if (toggle) {
                if (this.highlighted.direction === cluesContainingCell[0].direction && this.highlighted.number === cluesContainingCell[0].number) {
                    this.highlighted = cluesContainingCell[1];
                    emitEvent(this.eventListeners, this.highlighted);
                } else {
                    this.highlighted = cluesContainingCell[0];
                    emitEvent(this.eventListeners, this.highlighted);
                }
            }
        }
    }
};

Grid.prototype.setHighlightedClue = function(direction, number) {
    this.highlighted = clueName(direction, number);
    var clue = this.clues[this.highlighted.direction][this.highlighted.number];
    this.selectedCell = coord(clue.x, clue.y);
    emitEvent(this.eventListeners, this.highlighted);
}

Grid.prototype.highlightClue = function(ctx) {
    if (this.highlighted !== null) {
        var clue = this.clues[this.highlighted.direction][this.highlighted.number];
        colorClue(ctx, this.cellSize, HIGHLIGHT, clue);
    }
};

Grid.prototype.highlightCell = function(ctx) {
    if (this.selectedCell !== null) {
        fillSquare(ctx, this.cellSize, this.selectedCell, CELL_HIGHLIGHT);
    }
};

function drawGrid(canvas, hiddenInput) {
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
    var gridWidth = cellSize * AC_SQUARES + 1;
    var gridHeight = cellSize * DN_SQUARES + 1;

    var grid = new Grid(gridWidth, gridHeight, cellSize, BLACK_SQUARES);
    grid.draw(ctx);

    /* Add click listener to react to events */
    canvas.addEventListener('click', function(event) {
        grid.onClick(event, canvas, ctx);
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
        event.preventDefault();
        console.log('button pressed ' + event.key);
        console.log('hidden input val ' + hiddenInput.value);
        var char = '';
        if (hiddenInput.value === '') {
            char = 'backspace';
        } else {
            char = hiddenInput.value.charAt(1);
        }
        grid.onPress(ctx, event, char);
        hiddenInput.value = ' ';
    });
    return grid;
}

function isClueActive(clue) {
    var dayOfMonth = new Date().getDate();
    var month = new Date().getMonth();
    var year = new Date().getFullYear();
    return (year > 2018 || (month === 11 && dayOfMonth >= clue[0]));
}

function clueToString(clue) {
    if (isClueActive(clue)) {
        return clue[1] + '\u00a0(' + clue[2] + ')';
    } else {
        return 'Released on ' + clue[0] + ' December';
    }
}

function loadClues(grid, div, canvas, clueDiv, clueJson, hiddenInput) {
    var ctx = canvas.getContext('2d');
    var clueDivs = [];
    var Directions = ["Across", "Down"];
    var dirs = ["ac", "dn"];
    var dns = ["across", "down"];
    for (var i = 0; i < DIRECTIONS.length; i++) {
        var direction = DIRECTIONS[i];
        var dirDiv = document.createElement("div");
        dirDiv.setAttribute("class", "clue-container");
        dirDiv.id = direction + "Div";
        div.appendChild(dirDiv);
        var titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "clue-header");
        titleDiv.textContent = Directions[i];
        dirDiv.appendChild(titleDiv);
        var clues = clueJson[direction];
        for (var clueNum in clues) {
            var clueDiv = document.createElement("div");
            clueDiv.id = clueNum + direction;
            clueDiv.setAttribute("class", "clue-text");
            clueDiv.setAttribute("clueNum", clueNum);
            clueDiv.setAttribute("direction", direction);
            clueDiv.textContent = clueNum + '. ' + clueToString(clues[clueNum]);
            if (clueDiv.textContent.indexOf('Released') === -1) {
                clueDiv.setAttribute('released', true);
            } else {
                clueDiv.style.backgroundColor = UNRELEASED;
                clueDiv.setAttribute('released', false);
            }
            clueDiv.addEventListener('clue-selected', function(event) {
                if (event.detail.direction !== null) {
                    if (event.detail.direction === this.getAttribute("direction") && event.detail.clueNumber === this.getAttribute("clueNum")) {
                        this.style.backgroundColor = HIGHLIGHT;
                    } else {
                        if (this.getAttribute('released') !== 'false') {
                            this.style.backgroundColor = WHITE;
                        } else {
                            this.style.backgroundColor = UNRELEASED;
                        }
                    }
                }
                grid.draw(ctx);

            });
            clueDiv.addEventListener('click', function(event) {
                var targetDiv = event.target;
                grid.setHighlightedClue(targetDiv.getAttribute('direction'), targetDiv.getAttribute('clueNum'));
                if (this.getAttribute('released') !== 'false') {
                    this.style.backgroundColor = WHITE;
                } else {
                    this.style.backgroundColor = UNRELEASED;
                }
                for (var i = 0; i < clueDivs.length; i++) {
                    div = clueDivs[i];
                    if (div.getAttribute('released') !== 'false') {
                        this.style.backgroundColor = WHITE;
                    } else {
                        div.style.backgroundColor = UNRELEASED;
                    }
                }
                grid.draw(ctx);
                hiddenInput.focus();
                targetDiv.style.backgroundColor = HIGHLIGHT;
            });
            clueDivs.push(clueDiv);
            grid.addListener(clueDiv);
            dirDiv.appendChild(clueDiv);
        }
    }
}

/** The main entry point */
function main() {
    loadJson(CLUE_FILE, function(response) {
        var clueJson = JSON.parse(response);
        var canvas = document.getElementById('xwd');
        var clueText = document.getElementById('selected-clue-text');
        var hiddenInput = document.getElementById('hidden-input');
        var allClues = document.getElementById('all-clues');
        clueText.addEventListener('clue-selected', function(event) {
            if (event.detail.direction !== null) {
                if (clueJson[event.detail.direction].hasOwnProperty(event.detail.clueNumber)) {
                    var direction = event.detail.direction === 'ac' ? 'across' : 'down';
                    clueText.textContent = event.detail.clueNumber + ' ' + direction + ': ' + clueToString(clueJson[event.detail.direction][event.detail.clueNumber]);
                    clueText.style.backgroundColor = HIGHLIGHT;
                } else {
                    clueText.textContent = 'No clue data';
                    clueText.style.backgroundColor = WHITE;
                }
            } else {
                clueText.textContent = 'No clue selected';
                clueText.style.backgroundColor = WHITE;
            }
        });
        var grid = drawGrid(canvas, hiddenInput);
        grid.addListener(clueText);
        loadClues(grid, allClues, canvas, clueText, clueJson, hiddenInput);
    });
}
