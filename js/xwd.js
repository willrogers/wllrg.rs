/* Draw a crossword on an HTML canvas. */
'use strict';

var DIRECTIONS = ['ac', 'dn'];
var DIRECTION_NAMES = ['Across', 'Down'];

/* Set on page load. */
var YEAR;
var COOKIE_KEY;
/* Loaded dynamically from the CSS */
var HIGHLIGHT;
var TODAY_HIGHLIGHT;
var UNRELEASED;
/* Loaded from JSON. */
var AC_SQUARES;
var DN_SQUARES;
var BLACK_SQUARES;
/* Hard-coded */
var WHITE = 'white';
var BLACK = 'black';
var CELL_HIGHLIGHT = '#87d3ff';


function loadJson(file, callback) {
    // see https://laracasts.com/discuss/channels/general-discussion/load-json-file-from-javascript
    var xobj = new XMLHttpRequest();
    xobj.overrideMimeType("application/json");
    xobj.open('GET', file, true);
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a
            // value but simply returns undefined in asynchronous mode
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
    if (typeof Cookies.get(COOKIE_KEY) === 'undefined') {
        this.letters = {};
    } else {
        this.letters = JSON.parse(Cookies.get(COOKIE_KEY));
    }
    /* A clueName. */
    this.highlighted = null;
    this.selectedCell = null;
    /* A list of clueNames. */
    this.cluesForToday = [];
    this.figureOutWhiteSquares();
    this.figureOutClues();
}

Grid.prototype.addListener = function(listener) {
    this.eventListeners.push(listener);
};

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
    for (var i = 0; i < this.cluesForToday.length; i++) {
        this.highlightClue(ctx, this.cluesForToday[i], TODAY_HIGHLIGHT);
    }
    this.highlightClue(ctx, this.highlighted, HIGHLIGHT);
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
                lastChar = 'Backspace';
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
    Cookies.set(COOKIE_KEY, JSON.stringify(this.letters), { expires: new Date(YEAR + 1, 11, 31) } );
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
};

Grid.prototype.setCluesForToday = function(clues) {
    this.cluesForToday = clues;
};

Grid.prototype.highlightClue = function(ctx, clue, color) {
    if (clue !== null) {
        var clue = this.clues[clue.direction][clue.number];
        colorClue(ctx, this.cellSize, color, clue);
    }
};

Grid.prototype.highlightCell = function(ctx) {
    if (this.selectedCell !== null) {
        fillSquare(ctx, this.cellSize, this.selectedCell, CELL_HIGHLIGHT);
    }
};

function Crossword(canvas, selectedClueDiv, allCluesDiv, clueJson, hiddenInput) {
    this.selectedClueDiv = selectedClueDiv;
    this.allCluesDiv = allCluesDiv;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.clueJson = clueJson;
    this.hiddenInput = hiddenInput;
    this.clueDivs = {'ac': [], 'dn': []};
    selectedClueDiv.addEventListener('clue-selected', function(event) {
        if (event.detail.direction !== null) {
            if (clueJson[event.detail.direction].hasOwnProperty(event.detail.clueNumber)) {
                var direction = event.detail.direction === 'ac' ? 'across' : 'down';
                var clueString = clueToString(clueJson[event.detail.direction][event.detail.clueNumber]);
                var clueText = `${event.detail.clueNumber} ${direction}: ${clueString}`;
                selectedClueDiv.textContent = clueText;
                selectedClueDiv.classList.add('highlighted');
            } else {
                selectedClueDiv.textContent = 'No clue data';
                selectedClueDiv.classList.remove('highlighted');
            }
        } else {
            selectedClueDiv.textContent = 'No clue selected';
            selectedClueDiv.classList.remove('highlighted');
        }
    });
    for (var direction of DIRECTION_NAMES) {
        var dirDiv = document.createElement("div");
        dirDiv.setAttribute("class", "clue-container");
        dirDiv.id = direction + "Div";
        this.allCluesDiv.appendChild(dirDiv);
        var titleDiv = document.createElement("div");
        titleDiv.setAttribute("class", "clue-header");
        titleDiv.textContent = direction;
        dirDiv.appendChild(titleDiv);
    }
}

Crossword.prototype.clearSelectedDiv = function() {
    for (var direction of DIRECTIONS) {
        for (var i = 0; i < this.clueDivs.length; i++) {
            var div = this.clueDivs[direction][i];
            div.classList.remove('highlighted');
        }
    }
}

Crossword.prototype.createClueDiv = function(clueNum, direction, clue) {
    var clueDiv = document.createElement("div");
    clueDiv.id = clueNum + direction;
    clueDiv.setAttribute("class", "clue-text");
    clueDiv.setAttribute("clueNum", clueNum);
    clueDiv.setAttribute("direction", direction);
    /* Get reference to Crossword object. */
    var self = this;
    clueDiv.addEventListener('clue-selected', function(event) {
        if (event.detail.direction !== null) {
            if (event.detail.direction === this.getAttribute("direction") && event.detail.clueNumber === this.getAttribute("clueNum")) {
                this.classList.add('highlighted');
            } else {
                this.classList.remove('highlighted');
            }
        }
        self.grid.draw(self.ctx);

    });
    clueDiv.addEventListener('click', function(event) {
        var targetDiv = event.target;
        self.grid.setHighlightedClue(
            targetDiv.getAttribute('direction'),
            targetDiv.getAttribute('clueNum')
        );
        self.clearSelectedDiv();
        self.grid.draw(self.ctx);
        self.hiddenInput.focus();
        targetDiv.classList.add('highlighted');
    });
    return clueDiv;
}

Crossword.prototype.loadClues = function() {
    var Directions = ["Across", "Down"];
    var cluesForToday = [];
    for (var i = 0; i < DIRECTIONS.length; i++) {
        var direction = DIRECTIONS[i];
        this.clueDivs[direction] = [];
        var dirDivId = DIRECTION_NAMES[i] + "Div";
        var dirDiv = this.allCluesDiv.querySelector(`#${dirDivId}`);
        dirDiv.querySelectorAll(".clue-text").forEach(el => {
            dirDiv.removeChild(el);
        });
        var clues = this.clueJson[direction];
        for (var clueNum in clues) {
            var clueDivId = clueNum + direction;
            var clueDiv = dirDiv.querySelector(`#${dirDivId}`);
            var clue = clues[clueNum];
            if (clueDiv === null) {
                clueDiv = this.createClueDiv(clueNum, direction, clue);
            }
            if (isClueForToday(clue)) {
                cluesForToday.push(clueName(direction, clueNum));
                clueDiv.classList.add('today');
            }
            clueDiv.textContent = clueNum + '. ' + clueToString(clues[clueNum]);
            if (clueDiv.textContent.indexOf('Released') === -1) {
                clueDiv.setAttribute('released', true);
            } else {
                clueDiv.setAttribute('released', false);
                clueDiv.classList.add('unreleased');
            }
            this.clueDivs[direction].push(clueDiv);
            this.grid.addListener(clueDiv);
            dirDiv.appendChild(clueDiv);
        }
    }
    this.grid.setCluesForToday(cluesForToday);
    this.grid.draw(this.ctx);
};

Crossword.prototype.drawGrid = function() {
    var self = this;
    var pixelWidth = this.canvas.clientWidth;
    var pixelHeight = this.canvas.clientHeight;

    // Set this.canvas attributes to the correct number of pixels on the device.
    this.canvas.setAttribute('width', pixelWidth * window.devicePixelRatio);
    this.canvas.setAttribute('height', pixelHeight * window.devicePixelRatio);
    // Ensure canvas size is correct according to CSS.
    this.canvas.style.width = pixelWidth;
    this.canvas.style.height = pixelHeight;
    // Draw using the correct number of pixels by scaling the context.
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    var cellSize = Math.floor(Math.min(pixelWidth / AC_SQUARES, pixelHeight / DN_SQUARES));
    var gridWidth = cellSize * AC_SQUARES + 1;
    var gridHeight = cellSize * DN_SQUARES + 1;

    var grid = new Grid(gridWidth, gridHeight, cellSize, BLACK_SQUARES);
    grid.draw(this.ctx);

    /* Add click listener to react to events */
    this.canvas.addEventListener('click', function(event) {
        grid.onClick(event, self.canvas, self.ctx);
        self.hiddenInput.style.position = 'absolute';
        self.hiddenInput.style.left = event.pageX + 'px';
        self.hiddenInput.style.top = event.pageY + 'px';
        self.hiddenInput.focus();
    });

    this.hiddenInput.value = ' ';
    /* Add keypress listener to react to keyboard events.
     * Other possible events to listen for are keypress, keydown
     * and input. */
    this.hiddenInput.addEventListener('keyup', function(event) {
        event.preventDefault();
        console.log('button pressed ' + event.key);
        console.log('hidden input val ' + self.hiddenInput.value);
        var char = '';
        if (self.hiddenInput.value === '') {
            char = 'backspace';
        } else {
            char = self.hiddenInput.value.charAt(1);
        }
        grid.onPress(self.ctx, event, char);
        self.hiddenInput.value = ' ';
    });
    this.grid = grid;
};

function isClueActive(clue) {
    var dayOfMonth = new Date().getDate();
    var currentMonth = new Date().getMonth();
    var currentYear = new Date().getFullYear();
    return (currentYear > YEAR || (currentMonth === 11 && dayOfMonth >= clue[0]));
}

function isClueForToday(clue) {
    var dayOfMonth = new Date().getDate();
    var currentMonth = new Date().getMonth();
    var currentYear = new Date().getFullYear();
    return (currentYear === YEAR && (currentMonth === 11 && dayOfMonth === clue[0]));
}

function clueToString(clue) {
    // Use template literals
    var clueString = '';
    if (isClueActive(clue, YEAR)) {
        clueString = `${clue[1]}\u00a0(${clue[2]})`;
        if (isClueForToday(clue, YEAR)) {
            clueString = `(New) ${clueString}`;
        }
    } else {
        clueString = `Released on ${clue[0]} December`;
    }
    return clueString;
}

function loadData(dataFile, xwd) {
    loadJson(dataFile, function(response) {
        var dataJson = JSON.parse(response);
        AC_SQUARES = dataJson["across-size"];
        DN_SQUARES = dataJson["down-size"];
        BLACK_SQUARES = dataJson["black-squares"];
        var clueJson = dataJson["clues"];
        xwd.clueJson = clueJson;
    });
    /* Reload every minute to update without a page refresh. */
    setTimeout(loadData, 60 * 1000, dataFile, xwd);
}

function loadAll(dataFile) {
    loadJson(dataFile, function(response) {
        var dataJson = JSON.parse(response);
        AC_SQUARES = dataJson["across-size"];
        DN_SQUARES = dataJson["down-size"];
        BLACK_SQUARES = dataJson["black-squares"];
        var clueJson = dataJson["clues"];
        var canvas = document.getElementById('xwd');
        var clueText = document.getElementById('selected-clue-text');
        var hiddenInput = document.getElementById('hidden-input');
        var allClues = document.getElementById('all-clues');
        var xwd = new Crossword(canvas, clueText, allClues, clueJson, hiddenInput);
        xwd.drawGrid();
        xwd.grid.addListener(clueText);
        xwd.loadClues();
        /* Start automatic reload. */
        setTimeout(loadData, 60 * 1000, dataFile, xwd);
    });
}

/* The main entry point. */
function main() {
    var canvas = document.getElementById('xwd');
    YEAR = parseInt(canvas.getAttribute('year'));
    COOKIE_KEY = `grid-state-${YEAR}`;
    var style = getComputedStyle(document.body);
    HIGHLIGHT = style.getPropertyValue('--highlight-color');
    TODAY_HIGHLIGHT = style.getPropertyValue('--today-color');
    UNRELEASED = style.getPropertyValue('--unreleased-color');
    var dataFile = `/static/xwd${YEAR}.json`;
    loadAll(dataFile);
}
