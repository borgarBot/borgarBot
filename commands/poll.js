const Discord = require('discord.js');
const fs = require('fs');
const {guildId} = require('../config.json');
const {emojiList} = require('../emojis.json');
const {namedColors} = require('../colors.json');

process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'poll',
    async execute(message, args, client, Stats) {
        const emojiFromName = (name => {
            let emojiString = client.guilds.get(guildId).emojis.find(e => e.name == name);
            emojiString = emojiString ? emojiString.toString() : `:${name}:`;
            return emojiString;
        });

        const pollFile = `./polls/poll${message.author.id}.json`;

        await delete require.cache[require.resolve(`../polls/poll${message.author.id}.json`)];
        var {poll} = require(`../polls/poll${message.author.id}.json`);

        message.delete();
        var option = args.length ? args.shift().toLowerCase() : '';
        if(option == 'create') {
            const filter = response => {
                return response.author.id == message.author.id;
            };

            message.channel.send('Please enter the poll\'s title in the next 60 seconds').then(m => {
                message.channel.awaitMessages(filter, {maxMatches: 1, time: 60000, errors: ['time']})
                    .then(async collected => {
                        m.delete();
                        var output = fs.createWriteStream(pollFile, {flags: 'w'});
                        await output.write(JSON.stringify({poll: [{title: collected.first().content}, {fields: []}, {emojis: []}]}));
                        collected.first().delete();
                        message.channel.send('Success!').then(msg => msg.delete(5000))
                    })
                    .catch(collected => {
                        m.delete();
                        message.channel.send('No response detected').then(msg => msg.delete(15000));
                    });
            });
        }
        else if(option == 'delete') {
            var output = fs.createWriteStream(pollFile, {flags: 'w'});
            await output.write(JSON.stringify({poll: [{fields: []}, {emojis: []}]}));
            message.channel.send('Success!').then(msg => msg.delete(5000))
        }
        else if(option == 'send') {
            if(!poll.find(o => Object.keys(o)[0] == 'title')) return message.channel.send('No poll exists').then(msg => msg.delete(15000));
            if(poll.find(o => Object.keys(o)[0] == 'id')) return message.channel.send('Poll has already been sent').then(msg => msg.delete(15000));
            const pollEmbed = new Discord.RichEmbed();
            pollEmbed.setTitle(`**${poll.find(o => Object.keys(o)[0] == 'title').title}**`);
            pollEmbed.setAuthor(message.member.displayName, message.author.displayAvatarURL);
            poll.find(o => Object.keys(o)[0] == 'color') ? pollEmbed.setColor(poll.find(o => Object.keys(o)[0] == 'color').color) : pollEmbed.setColor('1e90ff');
            pollEmbed.setDescription('Please react with the emoji of your answer');
            pollEmbed.setTimestamp();
            if(poll.find(o => Object.keys(o)[0] == 'footer')) pollEmbed.setFooter(poll.find(o => Object.keys(o)[0] == 'footer').footer);

            for(let i = 0; i < poll.find(o => Object.keys(o)[0] == 'fields').fields.length; i++) {
                const fieldSecondary = poll.find(o => Object.keys(o)[0] == 'fields').fields[i][1] != 'S5ZMluikj0' ? poll.find(o => Object.keys(o)[0] == 'fields').fields[i][1] : '⠀';
                pollEmbed.addField(`${emojiFromName(poll.find(o => Object.keys(o)[0] == 'emojis').emojis[i])} ${poll.find(o => Object.keys(o)[0] == 'fields').fields[i][0]}`, fieldSecondary);
            }

            message.channel.send(pollEmbed).then(async msg => {
                fs.readFile(pollFile, async function(err, data) {
                    if(err) return;
                    var json = JSON.parse(data);
                    json.poll.push({id: msg.id});
                    var output = fs.createWriteStream(pollFile, {flags: 'w'});
                    await output.write(JSON.stringify(json));
                });

                for(let i = 0; i < poll.find(o => Object.keys(o)[0] == 'emojis').emojis.length; i++) {
                    var emojiChar = await message.guild.emojis.find(e => e.name == poll.find(o => Object.keys(o)[0] == 'emojis').emojis[i]);
                    if(!emojiChar) {
                        const emojiNames = await emojiList.map(e => e.name);
                        emojiChar = await emojiList[emojiNames.indexOf(poll.find(o => Object.keys(o)[0] == 'emojis').emojis[i])].emoji;
                    }
                    await msg.react(emojiChar);
                }
            });
        }
        else if(option == 'close') {
            if(!poll.find(o => Object.keys(o)[0] == 'title')) return message.channel.send('No poll exists').then(msg => msg.delete(15000));
            if(!poll.find(o => Object.keys(o)[0] == 'id')) return message.channel.send('Poll hasn\'t been sent').then(msg => msg.delete(15000));
            const resultsEmbed = new Discord.RichEmbed();
            resultsEmbed.setTitle('**Results**');
            resultsEmbed.setAuthor(message.member.displayName, message.author.displayAvatarURL);
            await message.channel.fetchMessage(poll.find(o => Object.keys(o)[0] == 'id').id)
                .then(msg => `${msg.reactions.map(r => `${r.emoji}: ${r.count - 1}`).join('\n')}`)
                .then(description => resultsEmbed.setDescription(description));
            resultsEmbed.setTimestamp();
            resultsEmbed.setFooter(poll.find(o => Object.keys(o)[0] == 'title').title);
            poll.find(o => Object.keys(o)[0] == 'color') ? resultsEmbed.setColor(poll.find(o => Object.keys(o)[0] == 'color').color) : resultsEmbed.setColor('1e90ff');
            message.channel.send(resultsEmbed);
            var output = fs.createWriteStream(pollFile, {flags: 'w'});
            await output.write(JSON.stringify({poll: [{fields: []}, {emojis: []}]}));
        }
        else if(option == 'view') {
            if(message.mentions.users.first()) {
                await delete require.cache[require.resolve(`../polls/poll${message.author.id}.json`)];
                var {poll} = require(`../polls/poll${message.mentions.users.first().id}.json`);
            }
            if(!poll.find(o => Object.keys(o)[0] == 'title')) return message.channel.send('No poll exists').then(msg => msg.delete(15000));
            message.channel.send(`**Title:** ${poll.find(o => Object.keys(o)[0] == 'title').title}
**Fields:**\n\t${poll.find(o => Object.keys(o)[0] == 'fields').fields ? poll.find(o => Object.keys(o)[0] == 'fields').fields.map(f => `${f[0]}${f[1] != 'S5ZMluikj0' ? ` | ${f[1]}` : ''}`).join('\n\t') : 'None'}
**Emojis:**\n\t${poll.find(o => Object.keys(o)[0] == 'emojis').emojis ? poll.find(o => Object.keys(o)[0] == 'emojis').emojis.map(e => emojiFromName(e)).join('\n\t') : 'None'}
**Color:** ${poll.find(o => Object.keys(o)[0] == 'color') ? poll.find(o => Object.keys(o)[0] == 'color').color : '1e90ff'}
**Footer:** ${poll.find(o => Object.keys(o)[0] == 'footer') ? poll.find(o => Object.keys(o)[0] == 'footer').footer : 'None'}`);
        }
        else if(option == 'add') {
            if(!poll.find(o => Object.keys(o)[0] == 'title')) return message.channel.send('No poll exists').then(msg => msg.delete(15000));
            const filter = response => {
                return response.author.id == message.author.id;
            };

            message.channel.send('Please enter a field in the next 60 seconds. Separate bottom text with ///').then(m => {
                message.channel.awaitMessages(filter, {maxMatches: 1, time: 60000, errors: ['time']})
                    .then(collected => {
                        fs.readFile(pollFile, async function(err, data) {
                            m.delete();
                            if(err) return;
                            var json = JSON.parse(data);
                            var content = collected.first().content.split('///');
                            if (content.length == 1) content.push('⠀');
                            json.poll.find(o => Object.keys(o)[0] == 'fields').fields.push([content[0], content[1]]);
                            var output = fs.createWriteStream(pollFile, {flags: 'w'});
                            await output.write(JSON.stringify(json));
                        });
                        collected.first().delete();
                        message.channel.send('Success!').then(msg => msg.delete(5000));
                    })
                    .catch(collected => {
                        m.delete();
                        message.channel.send('No response detected').then(msg => msg.delete(15000));
                    });
            });
        }
        else if(option == 'emojis') {
            if(!poll.find(o => Object.keys(o)[0] == 'title')) return message.channel.send('No poll exists').then(msg => msg.delete(15000));
            const filter = response => {
                return response.author.id == message.author.id;
            };

            message.channel.send('Please enter the name of an emoji (no colons) in the next 60 seconds').then(m => {
                message.channel.awaitMessages(filter, {maxMatches: 1, time: 60000, errors: ['time']})
                    .then(collected => {
                        m.delete();
                        fs.readFile(pollFile, async function(err, data) {
                            if(err) return;
                            var json = JSON.parse(data);
                            json.poll.find(o => Object.keys(o)[0] == 'emojis').emojis.push(collected.first().content);
                            var output = fs.createWriteStream(pollFile, {flags: 'w'});
                            await output.write(JSON.stringify(json));
                        });
                        collected.first().delete();
                        message.channel.send('Success!').then(msg => msg.delete(5000));
                    })
                    .catch(collected => {
                        m.delete();
                        message.channel.send('No response detected').then(msg => msg.delete(15000));
                    });
            });
        }
        else if(option == 'color') {
            if(!poll.find(o => Object.keys(o)[0] == 'title')) return message.channel.send('No poll exists').then(msg => msg.delete(15000));
            if(poll.find(o => Object.keys(o)[0] == 'color')) return message.channel.send('Color already exists').then(msg => msg.delete(15000));
            const filter = response => {
                return response.author.id == message.author.id;
            };

            message.channel.send(`Please enter the poll\'s color (from the list below or an rgb/hex code) in the next 60 seconds
${namedColors.map(c => c.name).join(', ')}`).then(m => {
                message.channel.awaitMessages(filter, {maxMatches: 1, time: 60000, errors: ['time']})
                    .then(collected => {
                        m.delete();
                        fs.readFile(pollFile, async function(err, data) {
                            if(err) return;
                            var colorArgs  = collected.first().content.split(/ +/);
                            var nameStr = colorArgs.length == 2 ? colorArgs[0].concat(` ${colorArgs[1]}`) : colorArgs[0];
                            var isHex = (colorArgs[0].length == 6 || (colorArgs[0].length == 7 && colorArgs[0].startsWith('#'))) && !collected.first().content.includes(',');
                            const colorNames = namedColors.map(c => c.name);
                            var wasNamed = false;
                            if(colorNames.includes(nameStr)) {
                                const namedCode = namedColors[colorNames.indexOf(nameStr)].code.split(' ');
                                var firstArg = namedCode[0];
                                var secondArg = namedCode[1];
                                var thirdArg = namedCode[2];
                                wasNamed = true;
                                isHex = false;
                            }
                            if(!isHex) {
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
                
                            if(isNaN(r) || isNaN(g) || isNaN(b)) return message.channel.send('Please try again with a valid color').then(msg => msg.delete(15000));
                            var json = JSON.parse(data);
                            json.poll.push({color: totalColor});
                            var output = fs.createWriteStream(pollFile, {flags: 'w'});
                            await output.write(JSON.stringify(json));
                        });
                        collected.first().delete();
                        message.channel.send('Success!').then(msg => msg.delete(5000))
                    })
                    .catch(collected => {
                        m.delete();
                        message.channel.send('No response detected').then(msg => msg.delete(15000));
                    });
            });
        }
        else if(option == 'footer') {
            if(!poll.find(o => Object.keys(o)[0] == 'title')) return message.channel.send('No poll exists').then(msg => msg.delete(15000));
            if(poll.find(o => Object.keys(o)[0] == 'footer')) return message.channel.send('Footer already exists').then(msg => msg.delete(15000));
            const filter = response => {
                return response.author.id == message.author.id;
            };

            message.channel.send('Please enter the poll\'s footer in the next 60 seconds').then(m => {
                message.channel.awaitMessages(filter, {maxMatches: 1, time: 60000, errors: ['time']})
                    .then(collected => {
                        m.delete();
                        fs.readFile(pollFile, async function(err, data) {
                            if(err) return;
                            var json = JSON.parse(data);
                            json.poll.push({footer: collected.first().content});
                            var output = fs.createWriteStream(pollFile, {flags: 'w'});
                            await output.write(JSON.stringify(json)); 
                        });
                        collected.first().delete();
                        message.channel.send('Success!').then(msg => msg.delete(5000));
                    })
                    .catch(collected => {
                        m.delete();
                        message.channel.send('No response detected').then(msg => msg.delete(15000));
                    });
            });
        }
        else {
            return message.channel.send('Please type of of the following after the command:\ncreate, delete, send, close, view, add, emojis, color, footer').then(msg => msg.delete(60000));
        }
    }
}