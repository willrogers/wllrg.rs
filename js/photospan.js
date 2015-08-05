function photo_widths() {
    var lengths = [];
    var photos = $('.photos').children();
    for (var i = 0; i < photos.length; i++) {
        lengths.push($(photos[i]).width());
    }
    return lengths;
}

function move(left) {
    console.log('move left?' + left);
    console.log(photo_widths());
    var active = $('.photospan').data('active-photo');
    if ($('.photospan').is(':animated')) {
        console.log('moving');
        return;
    }
    var active_photo = $('.photospan').children()[active];
    var w = $(active_photo).width();
    var nphotos = $('.photospan').children().length;
    console.log('There are ' + nphotos + ' photos; active is ' + active);
    if (left && active === nphotos - 1) {
        console.log('at right, not doing anything');
        return;
    } else if (!left && active === 0) {
        console.log('at left, not doing anything');
        return;
    }
    var ml = parseInt($('.photospan').css('margin-left'));
    var nextml = left ? ml - w : ml + w;
    var nextactive = left ? active + 1 : active - 1;
    $('.photospan').animate({'margin-left': nextml}, 500);
    $('.photospan').data('active-photo', nextactive);
}

function render(urls) {
    height = 430;

    container = $('.photospan-container');
    photosdiv = $('.photospan');
    var psw = container.width();
    var w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;
    var extra = (w - psw) / 2;
    photosdiv.css({'margin-left': '-'.concat(extra.toString(), 'px'),
                   'overflow': 'hidden',
                   'width': '20000px'});
    photosdiv.data('activePhoto', 0);
    for (var i = 0; i < urls.length; i++) {
        img = $('<img/>', {
            src: urls[i],
            height: height,
            class: 'spanphoto'
        });
        img.css('float', 'left');
        img.appendTo(photosdiv);
        img.click(true, move);
    }
    console.log('image width:' + img.width());
    console.log('screen width:' + w);
    console.log('margin-left', '-'.concat(extra.toString()), 'px');
}

$(document).ready(function() {
    images = $('.photospan').children('img');
    urls = images.map(function() {return $(this).attr('src');}).get();
    $('.photospan > img').remove();
    console.log(urls);
    render(urls);
});

$(document).keydown(function(event) {
    if (event.keyCode === 39) {
        move(false);
    } else if (event.keyCode === 37) {
        move(true);
    }
});
