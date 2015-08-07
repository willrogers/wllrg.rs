function screen_width() {
    return window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
}

function photo_widths() {
    var lengths = [];
    var photos = $('.photospan').children();
    for (var i = 0; i < photos.length; i++) {
        lengths.push($(photos[i]).width());
    }
    return lengths;
}

function move(right) {
    console.log('move right?' + right);
    if ($('.photospan').is(':animated')) {
        console.log('moving');
        return;
    }
    var active = $('.photospan').data('active-photo');
    var active_photo = $('.photospan').children()[active];
    var w = $(active_photo).width();
    var nphotos = $('.photospan').children().length;
    console.log('There are ' + nphotos + ' photos; active is ' + active);
    var ml = parseInt($('.photospan').css('margin-left'));
    var photosdiv = $('.photospan');
    var extra = photosdiv.data('extra');
    var nextml = right ? ml + w : ml - w;
    var total = 0;
    $.each(photo_widths(),function() {
        total += this;
     });
    console.log('nextml' + nextml + ' total' + total);
    if (right && active === 0) {
        console.log('at left');
        return;
    } else if (!right && active === nphotos - 1) {
        console.log('at right');
        return;
    }
    var nextactive = right ? active - 1 : active + 1;
    if (nextactive === 0 || nextml > -extra) {
        nextml = -extra;
    } else if (nextactive === nphotos - 1 || nextml < screen_width() - total -extra) {
        nextml = screen_width() - total - extra;
    }
    var next_active_photo = $('.photospan').children()[nextactive];
    $(next_active_photo).css('opacity', 1.0);
    $(active_photo).css('opacity', 0.7);
    $('.photospan').animate({'margin-left': nextml}, 300);
    $('.photospan').data('active-photo', nextactive);
}

function render(urls) {
    var height = 430;

    var container = $('.photospan-container');
    var photosdiv = $('.photospan');
    var extra = (screen_width() - container.width()) / 2;
    photosdiv.css({'margin-left': '-'.concat(extra.toString(), 'px'),
                   'overflow': 'hidden',
                   'width': '20000px'});
    photosdiv.data('activePhoto', 0);
    photosdiv.data('extra', extra);
    for (var i = 0; i < urls.length; i++) {
        var img = $('<img/>', {
            src: urls[i],
            height: height,
            class: 'spanphoto'
        });
        img.css('float', 'left');
        if (i > 0) {
            img.css('opacity', 0.7);
        }
        img.appendTo(photosdiv);
        img.click(true, move);
    }
    console.log('margin-left', '-'.concat(extra.toString()), 'px');
}

$(document).ready(function() {
    var images = $('.photospan').children('img');
    var urls = images.map(function() {return $(this).attr('src');}).get();
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
