/**
 *  Go to list members page (e.g. https://twitter.com/dev_lists/lists/angular/members)
 *  and run this code in the console.
 *  (tested in Chrome)
 */

(function () {
    var scrollDown = function (callback) {
       var timelineEnd = $('.stream-container .timeline-end.has-more-items');
       if (timelineEnd.length == 0) return callback();

       window.scrollTo(0, document.body.scrollHeight);
       setTimeout(scrollDown.bind(null, callback), 100);
    }

    var getUsernames = function () {
        var usernames = '';
        var $usernames = $('.stream-container .username');
        
        var i;  
        for (i = 0; i < $usernames.length; i++) {
            usernames += $usernames[i].innerHTML + '\n';
        }

        console.log = console.__proto__.log;

        console.log(usernames);
    }

    scrollDown(getUsernames());
})();
