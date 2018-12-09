/* Draw a crossword on an HTML canvas. */
'use strict';

/* Set on page load. */
var YEAR;
/* Loaded dynamically from the CSS */
var TODAY_HIGHLIGHT;
var UNRELEASED;


/* Customised grid with extra highlighting for today's clues. */
function AdventGrid(width, height, cellSize, blackSquares, eventListeners) {
    Grid.call(this, width, height, cellSize, blackSquares, eventListeners);
    this.cluesForToday = [];
}
var adventGridProto = Object.create(Grid.prototype);

adventGridProto.draw = function(ctx) {
    Grid.prototype.draw.call(this, ctx);
    for (var i = 0; i < this.cluesForToday.length; i++) {
        this.highlightClue(ctx, this.cluesForToday[i], TODAY_HIGHLIGHT);
    }
    this.highlightClue(ctx, this.highlighted, HIGHLIGHT);
    this.highlightCell(ctx);
    this.drawNumbers(ctx);
    this.drawLetters(ctx);
};

adventGridProto.setCluesForToday = function(clues) {
    this.cluesForToday = clues;
};

AdventGrid.prototype = adventGridProto;


/* Customised crossword able to withhold clues and highlight today's. */
function AdventCrossword(canvas, selectedClueDiv, allCluesDiv, clueJson, hiddenInput) {
    Crossword.call(this, canvas, selectedClueDiv, allCluesDiv, clueJson, hiddenInput);
}

var adventCrosswordProto = Object.create(Crossword.prototype);

adventCrosswordProto.createGrid = function() {
    this.grid = new AdventGrid(this.gridWidth, this.gridHeight, this.cellSize, BLACK_SQUARES);
    this.grid.draw(this.ctx);
}

/* Run through all clue divs and make sure none are highlighted. */
adventCrosswordProto.clearSelectedDiv = function() {
    for (var direction of DIRECTIONS) {
        for (var i = 0; i < this.clueDivs.length; i++) {
            var div = this.clueDivs[direction][i];
            div.classList.remove('highlighted');
        }
    }
}

adventCrosswordProto.loadClues = function() {
    var cluesForToday = [];
    for (var i = 0; i < DIRECTIONS.length; i++) {
        var direction = DIRECTIONS[i];
        this.clueDivs[direction] = [];
        var dirDivId = DIRECTION_NAMES[i] + "Div";
        var dirDiv = this.allCluesDiv.querySelector(`#${dirDivId}`);
        var clues = this.clueJson[direction];
        for (var clueNum in clues) {
            var clueDivId = direction + clueNum;
            var clueDiv = dirDiv.querySelector(`#${clueDivId}`);
            var clue = clues[clueNum];
            /* Create div if it doesn't exist. */
            if (clueDiv === null) {
                clueDiv = this.createClueDiv(clueNum, direction, clue);
                dirDiv.appendChild(clueDiv);
                this.grid.addListener(clueDiv);
            }
            if (isClueForToday(clue)) {
                cluesForToday.push(clueName(direction, clueNum));
                clueDiv.classList.add('today');
            } else {
                clueDiv.classList.remove('today');
            }
            /* Fill in text. */
            var clueNumDiv = clueDiv.querySelector('.clue-number');
            clueNumDiv.textContent = `${clueNum}.`;
            if (this.grid.isClueFilled(clueNum, direction)) {
                clueNumDiv.classList.add('solved');
            } else {
                clueNumDiv.classList.remove('solved');
            }
            var clueTextDiv = clueDiv.querySelector('.clue-text');
            clueTextDiv.textContent = `${clueToString(clues[clueNum])}`;
            if (clueDiv.textContent.indexOf('Released') !== -1) {
                clueDiv.classList.add('unreleased');
            } else {
                clueDiv.classList.remove('unreleased');
            }
            this.clueDivs[direction].push(clueDiv);
        }
    }
    this.grid.setCluesForToday(cluesForToday);
};

AdventCrossword.prototype = adventCrosswordProto;

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
        xwd.loadClues();
        xwd.grid.draw(xwd.ctx);
    });
    /* Reload every minute to update without a page refresh. */
    setTimeout(loadData, 5 * 1000, dataFile, xwd);
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
        var xwd = new AdventCrossword(canvas, clueText, allClues, clueJson, hiddenInput);
        xwd.setupCanvas();
        xwd.createGrid();
        xwd.setupGrid();
        xwd.grid.addListener(clueText);
        xwd.loadClues();
        xwd.grid.draw(xwd.ctx);
        /* Start automatic reload. */
        setTimeout(loadData, 5 * 1000, dataFile, xwd);
    });
}

/* The main entry point. */
function loadAdventXwd() {
    var canvas = document.getElementById('xwd');
    YEAR = parseInt(canvas.getAttribute('key'));
    COOKIE_KEY = `grid-state-${YEAR}`;
    var style = getComputedStyle(document.body);
    HIGHLIGHT = style.getPropertyValue('--highlight-color');
    TODAY_HIGHLIGHT = style.getPropertyValue('--today-color');
    UNRELEASED = style.getPropertyValue('--unreleased-color');
    var dataFile = `/static/xwd${YEAR}.json`;
    loadAll(dataFile);
}
