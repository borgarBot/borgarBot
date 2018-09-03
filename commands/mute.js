const {guildId} = require('../config.json');
var targetMember;
process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'mute',
    execute(message, args, client, Stats) {
        if(!message.member.permissions.has('MANAGE_ROLES')) return;
        if(message.channel.type == 'text') message.delete();
        const tagCount = message.mentions.users.array().length;
        const targetGuild = message.client.guilds.get(guildId);
        const muteRole = targetGuild.roles.find('name', 'Muted');
        if(tagCount) {
            targetMember = message.client.guilds.get(guildId).members.find('id', message.mentions.users.first().id);
        }
        else {
            const input = message.content.slice(message.content.indexOf(' ') + 1);
            if(input.charAt(input.length - 5) == '#') {
                let targetId = targetGuild.members.filter(m => m.user.tag == input).map(u => u.id);
                targetMember = targetGuild.members.find('id', targetId[0]);
            }
            else {
                try {
                    var targetUsername = targetGuild.members.filter(m => m.user.username == input).map(u => u.id);
                    targetMember = targetGuild.members.find('id', targetUsername[0]);
                }
                catch(e) {
                    try {
                        targetMember = targetGuild.members.find('displayName', input);
                    }
                    catch(e) {
                        try {
                            var targetDisplayName = targetGuild.members.filter(m => m.displayName.includes(input)).map(u => u.id);
                            targetMember = targetGuild.members.find('id', targetDisplayName[0]);
                        }
                        catch(e) {
                            try {
                                var targetUsername = targetGuild.members.filter(m => m.user.username.includes(input)).map(u => u.id);
                                targetMember = targetGuild.members.find('id', targetUsername[0]);
                            }
                            catch(e) {
                                return message.channel.send('Invalid user')
                                    .then(msg => {
                                        msg.delete(15000);
                                    });
                            }
                        }
                    } 
                }
            }
        }
        
        if(!targetMember.roles.find('name', 'Muted')) {
            targetMember.addRole(muteRole);
            return message.channel.send(`${targetMember.displayName} has been muted`)
            .then(msg => {
                msg.delete(15000);
            });
        }
        else {
            targetMember.removeRole(muteRole);
            return message.channel.send(`${targetMember.displayName} has been unmuted`)
            .then(msg => {
                msg.delete(15000);
            });
        }
    }
};