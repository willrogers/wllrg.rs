/* Draw a crossword on an HTML canvas. */

AC_SQUARES = 13;
DN_SQUARES = 13;
LINE_WIDTH = 1;


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

drawNumber = function(ctx, cellSize, number, x, y) {
    ctx.font = '18px serif';
    ctx.textBaseline = 'hanging';
    ctx.fillText(number, cellSize * x + 3, cellSize * y + 3);
}

fillSquare = function(ctx, cellSize, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(cellSize * x + 2, cellSize * y + 2, cellSize - 2, cellSize - 2);
}

cellInClue = function(details, direction, x, y) {
    if (direction === 'ac') {
        for (var i = details[0]; i < details[0] + details[2]; i++) {
            if (x == i && y == details[1]) {
                return true;
            }
        }
    }
    if (direction === 'dn') {
        for (var i = details[1]; i < details[1] + details[2]; i++) {
            if (x == details[0] && y == i) {
                return true;
            }
        }
    }
    return false;
}

colorClue = function(ctx, cellSize, color, direction, number, details) {
    if (direction === 'ac') {
        for (var i = details[0]; i < details[0] + details[2]; i++) {
            fillSquare(ctx, cellSize, i, details[1], color);
        }
        ctx.fillStyle = 'black';
        drawNumber(ctx, cellSize, number, details[0], details[1]);
    }
    if (direction === 'dn') {
        for (var i = details[1]; i < details[1] + details[2]; i++) {
            fillSquare(ctx, cellSize, details[0], i, color);
        }
        ctx.fillStyle = 'black';
        drawNumber(ctx, cellSize, number, details[0], details[1]);
    }
}

unhighlightClue = function(ctx, cellSize, direction, number, details) {
    colorClue(ctx, cellSize, 'white', direction, number, details);
}

highlightClue = function(ctx, cellSize, direction, number, details) {
    colorClue(ctx, cellSize, 'aqua', direction, number, details);
}

drawGrid = function(canvas, ac_squares, dn_squares) {
    var ctx = canvas.getContext('2d');
    canvas.width = 602;
    canvas.height = 602;
    var xpos = canvas.offsetLeft;
    var ypos = canvas.offsetTop;
    var cellSize = Math.floor(Math.min(canvas.width / AC_SQUARES, canvas.height / DN_SQUARES));
    var width = cellSize * AC_SQUARES + 2;
    var height = cellSize * DN_SQUARES + 2;
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, width, height);
    /* Draw in the white squares. */
    for (var i = 0; i < AC_SQUARES; i++) {
        for (var j = 0; j < DN_SQUARES; j++) {
            if (cellInArray(WHITE_SQUARES, i, j)) {
                fillSquare(ctx, cellSize, i, j, 'white');
            }
        }
    }
    /* Collect clues and write in numbers */
    ctx.fillStyle = 'black';
    var clueNumber = 1;
    var acClues = {};
    var dnClues = {};
    /* loop from right to left then top to bottom */
    for (var j = 0; j < DN_SQUARES; j++) {
        for (var i = 0; i < AC_SQUARES; i++) {
            acrossCount = 0;
            downCount = 0;
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
                        acClues[clueNumber] = [i, j, acrossCount];
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
                        dnClues[clueNumber] = [i, j, downCount];
                    }
                }
                if (acrossCount > 1 || downCount > 1) {
                    drawNumber(ctx, cellSize, clueNumber, i, j);
                    clueNumber += 1;
                }
            }
        }
    }
    var highlightedClue = null;
    canvas.addEventListener('click', function(event) {
        var x = Math.floor((event.pageX - xpos - 2) / cellSize);
        var y = Math.floor((event.pageY - ypos - 2) / cellSize);
        done = false;
        if (cellInArray(WHITE_SQUARES, x, y)) {
            console.log('clicked in white cell (' + x + ', ' + y + ')');
            if (highlightedClue !== null) {
                direction = highlightedClue[0];
                number = highlightedClue[1];
                if (direction === 'ac') {
                    unhighlightClue(ctx, cellSize, direction, number, acClues[number]);
                } else {
                    unhighlightClue(ctx, cellSize, direction, number, dnClues[number]);
                }
            }
            for (var clueNumber in acClues) {
                if (acClues.hasOwnProperty(clueNumber)) {
                    if (cellInClue(acClues[clueNumber], 'ac', x, y)) {
                        highlightClue(ctx, cellSize, 'ac', clueNumber, acClues[clueNumber]);
                        highlightedClue = ['ac', clueNumber];
                        done = true;
                    }
                }
            }
            if (!done) {
                for (var clueNumber in dnClues) {
                    if (dnClues.hasOwnProperty(clueNumber)) {
                        if (cellInClue(dnClues[clueNumber], 'dn', x, y)) {
                            highlightClue(ctx, cellSize, 'dn', clueNumber, dnClues[clueNumber]);
                            highlightedClue = ['dn', clueNumber];
                        }
                    }
                }
            }
        }
    });
    console.log('done');
}

window.onload = function() {
    var canvas = document.getElementById('xwd');
    drawGrid(canvas, AC_SQUARES, DN_SQUARES);
}
