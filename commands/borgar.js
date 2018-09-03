const sequelize = require('sequelize');
const snekfetch = require('snekfetch');
const {prefix} = require('../config.json');
process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));
var repeatNumber;

module.exports = {
    name: 'borgar',
    async execute(message, args, client, Stats) {
        const tagCount = message.mentions.users.array().length;
        if(!isNaN(args[0])) repeatNumber = parseInt(args[0]);
        else if(!isNaN(args[1])) repeatNumber = parseInt(args[1]);
        else repeatNumber = 1;
        var memberStats = await Stats.findOne({where: {userId: message.member.user.id}});
        if(!memberStats) {
            await Stats.create({userId: message.member.user.id});
            var memberStats = await Stats.findOne({where: {userId: message.member.user.id}});
        }
        await memberStats.update({borgarCount: memberStats.borgarCount + repeatNumber});
        for(let i = 0; i < repeatNumber; i++) {
            const {body} = await snekfetch.get('https://danbooru.donmai.us/posts.json?random=true&limit=1&tags=rating:s+hamburger');
            if(tagCount) message.guild.members.find('id', message.mentions.users.first().id).send({files: [await body[0].file_url]});
            else message.channel.send({files: [await body[0].file_url]});
        }
    }
}