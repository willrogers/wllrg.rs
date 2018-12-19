/* IIFE */
var adventXwd = (function adventXwdModule(xwdModule) {
/* Draw a crossword on an HTML canvas. */
'use strict';

/* Set on page load. */
var YEAR;
/* Loaded dynamically from the CSS */
var TODAY_HIGHLIGHT;
var UNRELEASED;


/* Customised grid with extra highlighting for today's clues. */
function AdventGrid(width, height, cellSize, blackSquares, correctAnswer, eventListeners) {
    xwd.Grid.call(this, width, height, cellSize, blackSquares, correctAnswer, eventListeners);
    this.cluesForToday = [];
    this.highlight = true;
    this.messageSquares = [[0, 1], [2, 1], [4, 1], [6, 1], [8, 1], [10, 1], [12, 1],
                           [12, 11], [10, 11], [8, 11], [6, 11], [4, 11], [2, 11], [0, 11]];
    this.correctlyClicked = 0;
}
var adventGridProto = Object.create(xwdModule.Grid.prototype);

adventGridProto.draw = function(ctx) {
    xwdModule.Grid.prototype.draw.call(this, ctx);
    if (this.highlight) {
        for (var i = 0; i < this.cluesForToday.length; i++) {
            this.highlightClue(ctx, this.cluesForToday[i], xwdModule.TODAY_HIGHLIGHT);
        }
        this.highlightClue(ctx, this.highlighted, xwdModule.HIGHLIGHT);
        this.highlightCell(ctx);
    } else {
        for (var i = 0; i < this.correctlyClicked; i++) {
            var messageSquare = this.messageSquares[i];
            var msgSqCoord = coord(messageSquare[0], messageSquare[1]);
            fillSquare(ctx, this.cellSize, msgSqCoord, 'red');
        }
    }
    this.drawNumbers(ctx);
    this.drawLetters(ctx);
};

adventGridProto.setCluesForToday = function(clues) {
    this.cluesForToday = clues;
};


adventGridProto.selectCell = function(cell, toggle) {
    if (this.highlight === true) {
        xwdModule.Grid.prototype.selectCell.call(this, cell, toggle);
    } else {
        var messageSquare = this.messageSquares[this.correctlyClicked];
        var msgSqCoord = coord(messageSquare[0], messageSquare[1]);
        if (msgSqCoord.equals(cell)) {
            console.log('Matched! ' + messageSquare);
            this.correctlyClicked += 1;
            if (this.correctlyClicked === this.messageSquares.length) {
                console.log('correct!');
                emitFinishedEvent(this.eventListeners);
                return;
            }
        } else {
            this.correctlyClicked = 0;
        }
    }

}

adventGridProto.unfinish = function() {
    this.correctlyClicked = 0;
    this.highlight = true;
}

AdventGrid.prototype = adventGridProto;


function AdventCrossword(canvas, selectedClueDiv, allCluesDiv, clueJson, hiddenInput, checkButton, allContent) {
    xwdModule.Crossword.call(this, canvas, selectedClueDiv, allCluesDiv, clueJson, hiddenInput, checkButton, allContent);
}

/* Customised crossword able to withhold clues and highlight today's. */
var adventCrosswordProto = Object.create(xwdModule.Crossword.prototype);

adventCrosswordProto.finished = function() {
    console.log('finished');
    var parent = self.allContent.parentElement;
    //self.allContent.classList.add('removed');
    var finalDiv = document.createElement('div');
    finalDiv.id = 'final-div';
    finalDiv.style['min-height'] = self.allContent.clientHeight + 'px';
    parent.appendChild(finalDiv);
    parent.removeChild(self.allContent);
    var backButton = document.createElement('a');
    backButton.textContent = 'back';
    backButton.onclick = function() {
        parent.removeChild(finalDiv);
        self.allContent.classList.remove('completed');
        self.grid.unfinish();
        parent.appendChild(self.allContent);
        parent.removeChild(this);
    }
    finalDiv.appendChild(backButton);
    finalDiv.textContent = 'Happy Christmas!';
    window.scroll({top: 0, left: 0, behavior: 'smooth' });

}

adventCrosswordProto.createGrid = function() {
    this.grid = new AdventGrid(this.gridWidth, this.gridHeight, this.cellSize, BLACK_SQUARES);
    this.grid.draw(this.ctx);
    this.grid.addListener(this.checkButton);
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
    var complete = true;
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
                cluesForToday.push(xwdModule.clueName(direction, clueNum));
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
                complete = false;
            }
            var clueTextDiv = clueDiv.querySelector('.clue-text');
            clueTextDiv.textContent = `${this.clueToString(clues[clueNum])}`;
            if (clueDiv.textContent.indexOf('Released') !== -1) {
                clueDiv.classList.add('unreleased');
            } else {
                clueDiv.classList.remove('unreleased');
            }
            this.clueDivs[direction].push(clueDiv);
        }
    }
    this.grid.setCluesForToday(cluesForToday);
    if (complete) {
        console.log('complete');
        this.onComplete();
    } else {
        console.log('incomplete');
        this.checkButton.classList.add('hidden');
    }
};

adventCrosswordProto.onComplete = function() {
    this.checkButton.classList.remove('hidden');
}

adventCrosswordProto.clueToString = function(clue) {
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


function loadData(dataFile, xwd, xwdModule) {
    xwdModule.loadJson(dataFile, function(response) {
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
    setTimeout(loadData, 5 * 1000, dataFile, xwd, xwdModule);
}

function loadAll(dataFile, xwdModule) {
    xwdModule.loadJson(dataFile, function(response) {
        var dataJson = JSON.parse(response);
        AC_SQUARES = dataJson["across-size"];
        DN_SQUARES = dataJson["down-size"];
        BLACK_SQUARES = dataJson["black-squares"];
        var clueJson = dataJson["clues"];
        var canvas = document.getElementById('xwd');
        var clueText = document.getElementById('selected-clue-text');
        var hiddenInput = document.getElementById('hidden-input');
        var allClues = document.getElementById('all-clues');
        var checkButton = document.getElementById('check-button');
        var allContent = document.getElementById('crossword-content');
        var xwd = new AdventCrossword(canvas, clueText, allClues, clueJson, hiddenInput, checkButton, allContent);
        xwd.setupCanvas();
        xwd.createGrid();
        xwd.setupGrid();
        xwd.grid.addListener(clueText);
        xwd.loadClues();
        xwd.grid.draw(xwd.ctx);
        /* Start automatic reload. */
        setTimeout(loadData, 5 * 1000, dataFile, xwd, xwdModule);
    });
}

/* The main entry point. */
function main() {
    var canvas = document.getElementById('xwd');
    YEAR = parseInt(canvas.getAttribute('key'));
    xwdModule.COOKIE_KEY = `grid-state-${YEAR}`;
    var style = getComputedStyle(document.body);
    xwdModule.HIGHLIGHT = style.getPropertyValue('--highlight-color');
    xwdModule.TODAY_HIGHLIGHT = style.getPropertyValue('--today-color');
    xwdModule.UNRELEASED = style.getPropertyValue('--unreleased-color');
    var dataFile = `/static/xwd${YEAR}.json`;
    loadAll(dataFile, xwdModule);
}

/* Exports */
return {"AdventGrid": AdventGrid, "AdventCrossword": AdventCrossword, "main": main};

}(xwd));
