(function () {
    // add `target="_blank"` into all outer links.

    document.querySelectorAll('a[href]').forEach(function(item) {
        var host = document.location.host;
        var re = new RegExp(host, "g");
        if (item.getAttribute('href').match(/\/\//) && !item.getAttribute('href').match(re)) {
            item.setAttribute('target', '_blank');
        }
    });

    // center all images.
    document.querySelectorAll("article img").forEach(function(item) {
        if(item.matches('.emoji, .eye-catch')) {
            console.log(item);
            return;
        }
        item.parentElement.setAttribute('style', 'text-align: center;')
    });

    // stick aside.
    var style = window.getComputedStyle(document.getElementsByClassName('site-aside')[0]);
    var topSpacing = style.getPropertyValue('padding-top');
    $(".site-aside .sticky").sticky({
        topSpacing: parseInt(topSpacing)
    });
})();
