'use strict';
var Twitter = require('twitter');
var _ = require('underscore');
var Promise = require('bluebird');

var chunk = function (array, size) {
    return _.toArray(_.groupBy(array, function(element, i){
        return Math.floor(i/size);
    }));
};

class TwitterWrapper {
    constructor(config) {
        this.config = config;
        this.client = new Twitter(config);

        this.get = Promise.promisify(this.client.get, {context: this.client});
        this.post = Promise.promisify(this.client.post, {context: this.client});
    }

    getLists() {
        return this.get('lists/list', {screen_name: this.config.username});
    }

    createList(name) {
        return this.post('lists/create', {name: name});
    }

    getListMembers(name) {
        return this.get('lists/members', {
            owner_screen_name: this.config.username,
            slug: name,
            count: 5000 // It's the max
        }).then((members) => {
            return _.map(members.users, (user) => {
                return user.screen_name;
            });
        });
    }

    changeList(listName, newUsernames, oldUsernames) {
        let toLowerCase = (username) => { return username.toLowerCase(); };
        newUsernames = _.map(newUsernames, toLowerCase);
        oldUsernames = _.map(oldUsernames, toLowerCase);

        let toAdd = _.difference(newUsernames, oldUsernames);
        let toRemove = _.difference(oldUsernames, newUsernames);

        return Promise.all([
            this.addToList(listName, toAdd),
            this.removeFromList(listName, toRemove)
        ])
    }

    addToList(listName, usernames) {
        if (usernames.length == 0) return;

        console.log('Adding ' + usernames + ' to ' + listName);
        usernames = chunk(usernames, 100);

        return Promise.all(_.map(usernames, (usernames) => {
            return this.post('lists/members/create_all', {
                owner_screen_name: this.config.username,
                slug: listName,
                screen_name: usernames.join(',')
            });
        }));
    }

    removeFromList(listName, usernames) {
        if (usernames.length == 0) return;

        console.log('Removing ' + usernames + ' from ' + listName);
        usernames = chunk(usernames, 100);

        return Promise.all(_.map(usernames, (usernames) => {
            return this.post('lists/members/destroy_all', {
                owner_screen_name: this.config.username,
                slug: listName,
                screen_name: usernames.join(',')
            });
        }));
    }
}

module.exports = TwitterWrapper;