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

drawNumber = function(ctx, cellSize, number, cell) {
    ctx.font = '28px serif';
    ctx.textBaseline = 'hanging';
    ctx.fillText(number, cellSize * cell.x + 3, cellSize * cell.y + 3);
}

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
                        clues['ac'][clueNumber] = clue_seq(i, j, acrossCount, 'ac');
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
                        clues['dn'][clueNumber] = clue_seq(i, j, downCount, 'dn');
                    }
                }
                if (acrossCount > 1 || downCount > 1) {
                    drawNumber(ctx, cellSize, clueNumber, coord(i, j));
                    clueNumber += 1;
                }
            }
        }
    }
    return clues;
}

greyOutClue = function(ctx, cellSize, clue) {
    colorClue(ctx, cellSize, GREYED, clue);
    drawNumbers(ctx, cellSize);
}

unhighlightClue = function(ctx, cellSize, clue) {
    colorClue(ctx, cellSize, WHITE, clue);
    drawNumbers(ctx, cellSize);
}

highlightClue = function(ctx, cellSize, clue) {
    colorClue(ctx, cellSize, 'aqua', clue);
    drawNumbers(ctx, cellSize);
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
    ctx.fillStyle = BLACK;
    ctx.strokeStyle = BLACK;
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, width, height);
    /* Draw in the white squares. */
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            var cell = coord(i, j);
            if (cellInArray(WHITE_SQUARES, cell)) {
                fillSquare(ctx, cellSize, cell, WHITE);
            }
        }
    }

    clues = drawNumbers(ctx, cellSize);
    /* Add click listener to react to events */
    var highlighted = null;
    canvas.addEventListener('click', function(event) {
        var x = Math.floor((event.pageX - canvas.offsetLeft - 2) /
                cellSize * window.devicePixelRatio);
        var y = Math.floor((event.pageY - canvas.offsetTop - 2) /
                cellSize * window.devicePixelRatio);
        cell = coord(x, y);
        if (cellInArray(WHITE_SQUARES, cell)) {
            /* Clear previous highlight */
            if (highlighted !== null) {
                var clue = clues[highlighted.direction][highlighted.number];
                unhighlightClue(ctx, cellSize, clue);
                emitEvent(eventTarget, null);
            }
            var selected = checkForHighlight(clues, cell, highlighted);
            if (selected !== null) {
                var clue = clues[selected.direction][selected.number];
                highlightClue(ctx, cellSize, clue);
                highlighted = selected;
                emitEvent(eventTarget, selected);
            } else if (highlighted !== null) {
                var clue = clues[highlighted.direction][highlighted.number];
                unhighlightClue(ctx, cellSize, clue);
                emitEvent(eventTarget, null);
                highlighted = null;
            }
        }
    });
}
