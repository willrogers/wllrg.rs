/* Draw a crossword on an HTML canvas. */

AC_SQUARES = 13;
DN_SQUARES = 13;
LINE_WIDTH = 1;
CLUE_FILE = '/static/clues.json';

WHITE = 'white';
BLACK = 'black';
HIGHLIGHT = 'aqua';
GREYED = 'gainsboro';


BLACK_SQUARES = [[0, 0], [0, 2], [0, 4], [0, 6], [0, 8], [0, 10], [0, 12],
                 [1, 8],
                 [2, 0], [2, 2], [2, 4], [2, 6], [2, 8], [2, 10], [2, 12],
                 [3, 4],
                 [4, 0], [4, 1], [4, 2], [4, 4], [4, 6], [4, 8], [4, 9], [4, 10], [4, 12],
                 [5, 6],
                 [6, 0], [6, 2], [6, 4], [6, 5], [6, 6], [6, 7], [6, 8], [6, 10], [6, 12],
                 [7, 6],
                 [8, 0], [8, 2], [8, 3], [8, 4], [8, 6], [8, 8], [8, 10], [8, 11], [8, 12],
                 [9, 8],
                 [10, 0], [10, 2], [10, 4], [10, 6], [10, 8], [10, 10], [10, 12],
                 [11, 4],
                 [12, 0], [12, 2], [12, 4], [12, 6], [12, 8], [12, 10], [12, 12]]

cellInArray = function(array, x, y) {
    for (var k = 0; k < array.length; k++) {
        if (array[k][0] === x && array[k][1] === y) {
            return true;
        }
    }
    return false;
}

WHITE_SQUARES = []
for (var i = 0; i < AC_SQUARES; i++) {
    for (var j = 0; j < DN_SQUARES; j++) {
        if (!cellInArray(BLACK_SQUARES, i, j)) {
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

drawNumber = function(ctx, cellSize, number, x, y) {
    ctx.font = '28px serif';
    ctx.textBaseline = 'hanging';
    ctx.fillText(number, cellSize * x + 3, cellSize * y + 3);
}

fillSquare = function(ctx, cellSize, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cellSize * x + 2, cellSize * y + 2, cellSize - 2, cellSize - 2);
}

cellInClue = function(clueX, clueY, length, direction, x, y) {
    if (direction === 'ac') {
        for (var i = clueX; i < clueX + length; i++) {
            if (x == i && y == clueY) {
                return true;
            }
        }
    }
    if (direction === 'dn') {
        for (var i = clueY; i < clueY + length; i++) {
            if (x == clueX && y == i) {
                return true;
            }
        }
    }
    return false;
}

checkForHighlight = function(clues, x, y, highlightedClue) {
    var directions = ['ac', 'dn'];
    for (var i = 0; i < 2; i++) {
        var direction = directions[i];
        for (var clueNumber in clues[direction]) {
            if (clues[direction].hasOwnProperty(clueNumber)) {
                details = clues[direction][clueNumber];
                clueX = details[0];
                clueY = details[1];
                clueLength = details[2];
                if (cellInClue(clueX, clueY, clueLength, direction, x, y)) {
                    if ((highlightedClue === null) || (!(highlightedClue[0] === direction && highlightedClue[1] === clueNumber))) {
                        return [direction, clueNumber];
                    }
                }
            }
        }
    }
    return null;
}

colorClue = function(ctx, cellSize, color, direction, x, y, length) {
    if (direction === 'ac') {
        for (var i = x; i < x + length; i++) {
            fillSquare(ctx, cellSize, i, y, color);
        }
    }
    if (direction === 'dn') {
        for (var i = y; i < y + length; i++) {
            fillSquare(ctx, cellSize, x, i, color);
        }
    }
}

drawNumbers = function(ctx, cellSize) {
    /* Collect clues and write in numbers */
    ctx.fillStyle = BLACK;
    var clueNumber = 1;
    var clues = {
        'ac': {},
        'dn': {}
    };
    /* loop from right to left then top to bottom */
    for (var j = 0; j < DN_SQUARES; j++) {
        for (var i = 0; i < AC_SQUARES; i++) {
            var acrossCount = 0;
            var downCount = 0;
            if (cellInArray(WHITE_SQUARES, i, j)) {
                /* Start of across clue */
                if (i === 0 || !cellInArray(WHITE_SQUARES, i - 1, j)) {
                    acrossCount = 1;
                    for (var l = i + 1; l < AC_SQUARES; l++) {
                        if (cellInArray(WHITE_SQUARES, l, j)) {
                            acrossCount += 1;
                        } else {
                            break;
                        }
                    }
                    if (acrossCount > 1) {
                        clues['ac'][clueNumber] = [i, j, acrossCount];
                    }
                }
                /* Start of down clue */
                if (j === 0 || !cellInArray(WHITE_SQUARES, i, j - 1)) {
                    downCount = 1;
                    for (var l = j + 1; l < DN_SQUARES; l++) {
                        if (cellInArray(WHITE_SQUARES, i, l)) {
                            downCount += 1;
                        } else {
                            break;
                        }
                    }
                    if (downCount > 1) {
                        clues['dn'][clueNumber] = [i, j, downCount];
                    }
                }
                if (acrossCount > 1 || downCount > 1) {
                    drawNumber(ctx, cellSize, clueNumber, i, j);
                    clueNumber += 1;
                }
            }
        }
    }
    return clues;
}

greyOutClue = function(ctx, cellSize, direction, x, y, length) {
    colorClue(ctx, cellSize, GREYED, direction, details, x, y, length);
    drawNumbers(ctx, cellSize);
}

unhighlightClue = function(ctx, cellSize, direction, x, y, length) {
    colorClue(ctx, cellSize, WHITE, direction, x, y, length);
    drawNumbers(ctx, cellSize);
}

highlightClue = function(ctx, cellSize, direction, x, y, length) {
    colorClue(ctx, cellSize, 'aqua', direction, x, y, length);
    drawNumbers(ctx, cellSize);
}

emitEvent = function(elt, direction, clueNumber) {
    var event = new CustomEvent('clue-selected', { detail:
        {
            'direction': direction,
            'clueNumber': clueNumber
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
    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, width, height);
    /* Draw in the white squares. */
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            if (cellInArray(WHITE_SQUARES, i, j)) {
                fillSquare(ctx, cellSize, i, j, WHITE);
            }
        }
    }

    clues = drawNumbers(ctx, cellSize);
    /* Add click listener to react to events */
    var highlightedClue = null;
    canvas.addEventListener('click', function(event) {
        var x = Math.floor((event.pageX - canvas.offsetLeft - 2) / cellSize * window.devicePixelRatio);
        var y = Math.floor((event.pageY - canvas.offsetTop - 2) / cellSize * window.devicePixelRatio);
        done = false;
        if (cellInArray(WHITE_SQUARES, x, y)) {
            /* Clear previous highlight */
            if (highlightedClue !== null) {
                var direction = highlightedClue[0];
                var clueNumber = highlightedClue[1];
                var details = clues[direction][clueNumber];
                var clueX = details[0];
                var clueY = details[1];
                var clueLength = details[2];
                unhighlightClue(ctx, cellSize, direction, clueX, clueY, clueLength);
                emitEvent(eventTarget, null, null);
            }
            var clue = checkForHighlight(clues, x, y, highlightedClue);
            if (clue !== null) {
                var direction = clue[0];
                var clueNumber = clue[1];
                var details = clues[direction][clueNumber];
                var clueX = details[0];
                var clueY = details[1];
                var clueLength = details[2];
                highlightClue(ctx, cellSize, direction, clueX, clueY, clueLength);
                highlightedClue = clue;
                emitEvent(eventTarget, clue[0], clue[1]);
            } else if (highlightedClue !== null) {
                var direction = highlightedClue[0];
                var clueNumber = highlightedClue[1];
                var details = clues[direction][clueNumber];
                var clueX = details[0];
                var clueY = details[1];
                var clueLength = details[2];
                unhighlightClue(ctx, cellSize, direction, clueX, clueY, clueLength);
                emitEvent(eventTarget, null, null);
                highlightedClue = null;
            }
        }
    });
}
