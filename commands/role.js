const sequelize = require('sequelize');
const {guildId} = require('../config.json');
const {namedColors} = require('../colors.json');

process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'role',
    async execute(message, args, client, Users) {
        message.delete();
        var option = args.length ? args.shift().toLowerCase() : '';

        const getRole = (async () => {
            var userRow = await Users.findOne({where: {userId: message.author.id}});
            if(!userRow) await Users.create({userId: message.author.id}).then(r => userRow = r);
            const targetGuild = message.client.guilds.get(guildId);
           
            if(userRow.roleId) var role = targetGuild.roles.get(userRow.roleId);
            else {
                await targetGuild.createRole({
                    name: message.author.id,
                    color: 'DEFAULT',
                    position: targetGuild.roles.find(r => r.name =='Members').position + 1
                })
                var role = await targetGuild.roles.find(r => r.name == message.author.id);
                targetGuild.members.get(message.author.id).addRole(role);
                await userRow.update({roleId: role.id});
            }

            return role;
        });

        if(option == 'name') {
            const filter = response => {
                return response.author.id == message.author.id;
            };

            message.channel.send('Please enter your role\'s new name within the next 60 seconds').then(m => {
                message.channel.awaitMessages(filter, {maxMatches: 1, time: 60000, errors: ['time']})
                    .then(async collected => {
                        m.delete();
                        getRole().then(r => r.setName(collected.first().content));
                        collected.first().delete();
                        message.channel.send('Success!').then(msg => msg.delete(5000))
                    })
                    .catch(collected => {
                        m.delete();
                        message.channel.send('No response detected').then(msg => msg.delete(15000));
                    });
            });
        }
        else if(option == 'color') {
            const filter = response => {
                return response.author.id == message.author.id;
            };

            message.channel.send(`Please enter your role\'s new color (from the list below or an rgb/hex code) in the next 60 seconds
${namedColors.map(c => c.name).join(', ')}, none`).then(m => {
                message.channel.awaitMessages(filter, {maxMatches: 1, time: 60000, errors: ['time']})
                    .then(collected => {
                        m.delete();
                        var colorArgs  = collected.first().content.split(/ +/);
                        var nameStr = colorArgs.length == 2 ? colorArgs[0].concat(` ${colorArgs[1]}`) : colorArgs[0];
                        var isHex = (colorArgs[0].length == 6 || (colorArgs[0].length == 7 && colorArgs[0].startsWith('#'))) && !collected.first().content.includes(',');
                        const colorNames = namedColors.map(c => c.name);
                        var wasNamed = false;
                        if(colorNames.includes(nameStr.toLowerCase())) {
                            const namedCode = namedColors[colorNames.indexOf(nameStr)].code.split(' ');
                            var firstArg = namedCode[0];
                            var secondArg = namedCode[1];
                            var thirdArg = namedCode[2];
                            wasNamed = true;
                            isHex = false;
                        }
                        if(collected.first().content.toLowerCase() == 'none') var totalColor = 'DEFAULT';
                        else if(!isHex) {
                            if(colorArgs.length >= 3 || wasNamed) {
                                if(!wasNamed) {
                                    var firstArg = colorArgs[0];
                                    var secondArg = colorArgs[1];
                                    var thirdArg = colorArgs[2];
                                }
                                var r = firstArg.endsWith(',') ? parseInt(firstArg.slice(0, -1)) : parseInt(firstArg);
                                var g = secondArg.endsWith(',') ? parseInt(secondArg.slice(0, -1)) : parseInt(secondArg);
                                var b = parseInt(thirdArg);
                            }
                            else {
                                var totalArgs = colorArgs[0].endsWith(',') ? colorArgs[0] : colorArgs[0].concat(',');
                                if(colorArgs.length == 2) totalArgs = totalArgs.concat(colorArgs[1]);
                                var splitArgs = totalArgs.split(',');
                                var r = parseInt(splitArgs[0]);
                                var g = parseInt(splitArgs[1]);
                                var b = parseInt(splitArgs[2]);
                            }
                            if(r <= 0) r = 0;
                            if(g <= 0) g = 0;
                            if(b <= 0) b = 0;
                            if(r > 255) r = 255;
                            if(g > 255) g = 255;
                            if(b > 255) b = 255;
                            var red = r.toString(16);
                            var green = g.toString(16);
                            var blue = b.toString(16);
                            if(r < 16) red = '0'.concat(red);
                            if(g < 16) green = '0'.concat(green);
                            if(b < 16) blue = '0'.concat(blue);
                            var totalColor = ''.concat(red).concat(green).concat(blue);
                        }
                        else var totalColor = args[0].slice(-6);
            
                        if(collected.first().content.toLowerCase() != 'none' && (isNaN(r) || isNaN(g) || isNaN(b)))
                            return message.channel.send('Please try again with a valid color').then(msg => msg.delete(15000));
                        getRole().then(r => r.setColor(totalColor));
                        collected.first().delete();
                        message.channel.send('Success!').then(msg => msg.delete(5000))
                    })
                    .catch(collected => {
                        m.delete();
                        message.channel.send('No response detected').then(msg => msg.delete(15000));
                    });
            });
        }
        else {
            return message.channel.send('Please use either `!role color` or `!role name`').then(msg => msg.delete(60000));
        }
    }
}