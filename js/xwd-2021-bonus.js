/* IIFE */
(function adventBonusModule(global) {

console.log("loading bonus code");

/* Override with custom behaviour for ths year. */
adventXwd.AdventCrossword.prototype.finished = function() {
    console.log("this one!")
    var parent = self.allContent.parentElement;
    //self.allContent.classList.add('removed');
    self.finalDiv = document.createElement('div');
    self.finalDiv.id = 'final-div';
    self.finalDiv.style['min-height'] = self.allContent.clientHeight + 'px';
    parent.appendChild(self.finalDiv);
    parent.removeChild(self.allContent);
    var backButton = document.createElement('a');
    backButton.id = 'final-back';
    backButton.textContent = 'Back';
    backButton.classList.add('xwd-button');
    backButton.onclick = function() {
        parent.removeChild(self.finalDiv);
        self.allContent.classList.remove('completed');
        self.grid.unfinish(self.ctx);
        parent.appendChild(self.allContent);
    }
    const prompt = document.createElement('p');
    prompt.textContent = 'The grid is correct. Please enter the hidden message:';
    var response = document.createElement('p');
    var input = document.createElement('input');
    var checkDiv = document.createElement('div');
    var checkButton = document.createElement('a');
    checkButton.classList.add('xwd-button');
    checkButton.textContent = 'Check'
    checkButton.onclick = function() {
        if (input.value.toLowerCase().replace(/[^a-z]/g, '') === 'goodbyetotwentytwentyone') {
            window.location.href = '/xwd2021pt2.html'
        } else {
            response.textContent = 'nope';
        }
    }
    var cookies = JSON.parse(Cookies.get(COOKIE_KEY));
    /* Specifically delete the cells that don't match the new grid. */
    var toDelete = ["1,0", "3,0", "5,0", "7,0", "9,0", "11,0",
                    "0,1", "1,1", "2,1", "3,1", "4,1", "5,1", "7,1", "8,1", "9,1", "10,1", "11,1", "12,1",
                    "1,2", "3,2", "5,2", "7,2", "9,2", "11,2",
                    "0,3", "1,3", "2,3", "4,3", "5,3", "6,3", "7,3", "8,3", "9,3", "10,3", "11,3", "12,3",
                    "1,4", "3,4", "5,4", "7,4", "9,4", "11,4",
                    "0,5", "1,5", "2,5", "4,5", "5,5", "6,5",
                    "5,6", "9,6"

                ];
    for (var d of toDelete) {
        delete cookies[d];
    }
    Cookies.set('grid-state-2021pt2', JSON.stringify(cookies), { expires: new Date(9999, 11, 31) });
    
    self.finalDiv.appendChild(prompt);
    checkDiv.appendChild(input);
    checkDiv.appendChild(checkButton);
    self.finalDiv.appendChild(checkDiv);
    self.finalDiv.appendChild(response);
    self.finalDiv.appendChild(backButton);
    scrollToTop();
}


/* Exports */
/*
var adventXwd = {};
adventXwd.AdventGrid = AdventGrid;
adventXwd.AdventCrossword = AdventCrossword;
adventXwd.main = main;
global.adventXwd = adventXwd;
*/

}(window));
