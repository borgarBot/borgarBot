const sequelize = require('sequelize');
const {botId} = require('../config.json');
process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'stat',
    async execute(message, args, client, Stats) {
        const tagCount = message.mentions.users.array().length;
        if(message.mentions.users.first().id == botId) return message.channel.send('I AM THE BORGAR OVERLORD', {code: 'x1'});
        if(tagCount) var memberStats = await Stats.findOne({where: {userId: message.mentions.users.first().id}});
        else var memberStats = await Stats.findOne({where: {userId: message.author.id}});
        if(memberStats) message.channel.send(`${message.mentions.members.first().displayName} has used borgar ${memberStats.borgarCount} times and burger ${memberStats.burgerCount} times`);
        else message.channel.send(`${message.mentions.members.first().displayName} has never used a command!`);
    }
}