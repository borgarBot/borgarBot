const sequelize = require('sequelize');
const snekfetch = require('snekfetch');
const {prefix} = require('../config.json');
process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));
var memberStats;
var repeatNumber;

module.exports = {
    name: 'borgar',
    async execute(message, args, client, Users) {
        const tagCount = message.mentions.users.array().length;
        if(!isNaN(args[0])) repeatNumber = parseInt(args[0]);
        else if(!isNaN(args[1])) repeatNumber = parseInt(args[1]);
        else repeatNumber = 1;
        memberStats = await Users.findOne({where: {userId: message.member.user.id}});
        if(!memberStats) await Users.create({userId: message.member.user.id}).then(s => memberStats = s);
        await memberStats.update({borgarCount: memberStats.borgarCount + repeatNumber});
        for(let i = 0; i < repeatNumber; i++) {
            const {body} = await snekfetch.get('https://danbooru.donmai.us/posts.json?random=true&limit=1&tags=rating:s+hamburger');
            if(tagCount) message.mentions.users.first().send({files: [await body[0].file_url]});
            else message.channel.send({files: [await body[0].file_url]});
        }
    }
}