'use strict';
var config = require('./config');
var TwitterWrapper = require('./twitter-wrapper');
var _ = require('underscore');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var twitter = new TwitterWrapper(config.twitter);
var argv = process.argv;

var getLists = function (path) {
    return fs.readdirAsync(path)

        // Get files
        .then((lists) => {
            return Promise.props(_.chain(lists)
                .map((list) => { return [list.split('.')[0], fs.readFileAsync(path + '/' + list, 'utf8')]; })
                .object()
                .value()
            );
        })

        // Filter usernames
        .then((lists) => {
            return _.object(_.map(lists, (list, listName) => {
                return [
                    listName,
                    _.chain(list.split('\n'))
                        .filter((val) => { return val[0] == '@' && val.length > 1 })
                        .map((val) => { return val.trim().slice(1); })
                        .value()
                ]
            }))
        });
};

var updateTwitter = function (lists) {
    return twitter.getLists()

        // Create unexisting Lists
        .then((existingLists) => {
            var existingListNames = _.map(existingLists, (list) => { return list.name; });
            let listNames = _.map(lists, (value, key) => { return key; });

            let toCreate = _.difference(listNames, existingListNames);
            if (toCreate.length > 0) console.log('Lists to create: ' + toCreate);

            return Promise.all(_.map(toCreate, twitter.createList.bind(twitter)));
        })

        // Get List Members
        .then(() => {
            return Promise.props(_.object(_.map(lists, (usernames, listName) => {
                return [listName, twitter.getListMembers(listName)];
            })));
        })

        // Change Lists
        .then((members) => {
            return Promise.all(_.map(members, (existingUsers, listName) => {
                return twitter.changeList(listName, lists[listName], existingUsers);
            }));
        });
};

if (!argv[2]) {
    console.error('You should indicate the lists folder');
    process.exit(1);
}

getLists(argv[2])
    .then(updateTwitter);


