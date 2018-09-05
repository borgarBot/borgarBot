const sequelize = require('sequelize');
const {botId} = require('../config.json');
process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'stat',
    async execute(message, args, client, Users) {
        const tagCount = message.mentions.users.array().length;
        if(tagCount) {
            if(message.mentions.users.first().id == botId) return message.channel.send('I AM THE BORGAR OVERLORD', {code: 'x1'});
            var targetMember = message.mentions.members.first();
        }
        else var targetMember = message.member;
        var memberStats = await Users.findOne({where: {userId: targetMember.id}});
        if(memberStats && (memberStats.borgarCount > 0 || memberStats.burgerCount > 0))
            message.channel.send(`${targetMember.displayName} has used borgar ${memberStats.borgarCount} times and burger ${memberStats.burgerCount} times`);
        else message.channel.send(`${targetMember.displayName} has never used a command!`);
    }
}