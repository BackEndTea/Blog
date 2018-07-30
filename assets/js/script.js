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
            return;
        }
        item.parentElement.setAttribute('style', 'text-align: center;')
    });
})();
