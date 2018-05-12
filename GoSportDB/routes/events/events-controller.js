const Event = require('../../models/Event');
const Location = require('../../models/Location');
const datetime = require('../../models/DateTime');
const controller = {
    showEvents(req, res, eventRepository) {
        eventRepository.getAllEvents()
            .then((events) => {
                const mappedEvents = events.map((e) => {
                    return {
                        id: e.id,
                        name: e.name,
                        sport: e.sport,
                        datetime: e.datetime,
                        location: e.location,
                        admin: e.admin,
                        neededPlayers: e.neededPlayers,
                        players: e.players,
                    }
                });
                res.send(mappedEvents);
                return;
            })
            .catch(() => {
                res.send("Error");
                return;
            });
    },
    showEvent(req, res, eventRepository) {
        const id = +req.params.id;
        eventRepository.findEventByParams({ id }).then((events) => {
            if (events.length < 1) {
                res.send("No event with id: " + id);
                return;
            } else if (events.length > 1) {
                res.send("More than one event with id: " + id);
                return;
            }

            const event = {
                id: events[0].id,
                name: events[0].name,
                sport: events[0].sport,
                datetime: events[0].datetime,
                location: events[0].location,
                admin: events[0].admin,
                neededPlayers: events[0].neededPlayers,
                players: events[0].players,
            }
            res.send(event);
        });
        //const events = await Promise.resolve(eventRepository.findEventByParams.bind(eventRepository));
    },
    createEvent(req, res, eventRepository, userRepository, idGenerator) {
        const id = idGenerator.getEventId();
        const name = req.body.name;
        const sport = req.body.sport;
        const year = +req.body.year;
        const month = +req.body.month;
        const day = +req.body.day;
        const hours = +req.body.hours;
        const minutes = +req.body.minutes;
        datetime.year = year;
        datetime.month = month;
        datetime.dayOfMonth = day;
        datetime.hour = hours;
        datetime.minute = minutes;
        const longitude = +req.body.longitude;
        const latitude = +req.body.latitude;
        const location = new Location(longitude, latitude);
        const adminId = +req.body.adminId;
        const neededPlayers = +req.body.neededPlayers;
        const players = [];


        userRepository.findUserById(adminId).then((foundUsers) => {
            if (foundUsers.length !== 1) {
                res.send("Problem with finding user");
                return;
            }

            const user = foundUsers[0];

            const mappedUser = {
                id: user.id,
                email: user.email,
                username: user.username,
                city: user.city,
                password: user.password
            };

            players.push(mappedUser);

            const event = new Event(id, name, sport, datetime,
                location, mappedUser, neededPlayers,
                players);

            eventRepository.findEventByParams({ location, sport, datetime })
                .then((events) => {
                    if (events.length > 0) {
                        res.send("Event already exists");
                        return;
                    }
                    eventRepository.insertEvent(event)
                        .then(() => {
                            res.send(event);
                            return;
                        })
                        .catch(() => {
                            res.send("Error");
                            return;
                        });
                });
        });

    },
    addUserToEvent(req, res, eventRepository, userRepository) {
        const userId = +req.body.userId;
        const eventId = +req.params.id;
        userRepository.findUserById(userId).then((foundUsers) => {
            if (foundUsers.length !== 1) {
                res.send("Problem with finding user");
                return;
            }
            const user = foundUsers[0];

            const mappedUser = {
                id: user.id,
                email: user.email,
                username: user.username,
                city: user.city,
                password: user.password
            };

            eventRepository.findEventByParams({ id: eventId }).then((events) => {
                if (events.length == 0) {
                    res.send("No event with id: " + eventId);
                    return;
                } else if (events.length > 1) {
                    res.send("More than one event with id: " + eventId);
                    return;
                }

                const event = events[0];
                if (event.neededPlayers == -1 ||
                    event.players.length < event.neededPlayers) {
                    for (let i = 0; i < event.players.length; i += 1) {
                        if (event.players[i].id == userId) {
                            res.send('Already in the event');
                            return;
                        }
                    }
                    event.players.push(mappedUser);
                    eventRepository.removeEvent(eventId).then(() => {
                        eventRepository.insertEvent(event).then(() => {
                            res.send(event);
                            return;
                        });
                    });
                } else {
                    res.send('Maximum players reached');
                }
            });
        });

    },
    deleteEvent(req, res, eventRepository) {
        eventRepository.removeEvent(id)
            .then(() => {
                res.send("Event deleted");
                return;
            })
    }
}

module.exports = controller;