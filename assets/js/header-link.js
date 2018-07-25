(function () {
    document.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach(function (item) {
        var id =item.getAttribute('id');
        if (!id) {
            return;
        }
        var newNode = document.createElement('a');
        newNode.setAttribute('class', 'header-link');
        newNode.setAttribute('href', "#" + id);
        var iNode = document.createElement('i');
        iNode.setAttribute('class', 'fa fa-link');
        newNode.appendChild(iNode);
        //var newNode = '<a href="#'+ id + '" class="header-link"><i class="fa fa-link"></i></a>';
        item.appendChild(newNode);
    });
})();
