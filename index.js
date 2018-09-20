const Discord = require('discord.js');
const fs = require ('fs');
const Sequelize = require('sequelize');
const Canvas = require('canvas');
const snekfetch = require('snekfetch');
const https = require('https');
const crypto = require('crypto');
const {prefix, ownerId, guildId} = require('./config.json');
const client = new Discord.Client();
const token = process.env.TOKEN;
const commandFiles = fs.readdirSync('./commands');
const invisTypingCooldowns = [];
client.commands = new Discord.Collection();

process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

for(const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.name, command);
}

const sequelize = new Sequelize('database', 'user', 'password', {
    host: 'localhost',
    dialect: 'sqlite',
    logging: false,
    storage: 'database.sqlite'
});

const Users = sequelize.define('users', {
    userId: {
      type: Sequelize.STRING,
      unique: true,
      primaryKey: true
    },
    borgarCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    burgerCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
    },
    roleId: {
        type: Sequelize.STRING,
        unique: true
    }
});

const Warnings = sequelize.define('warnings', {
    userId: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    reason: Sequelize.STRING
});
       
const to12Hr = (time => {
    var minutes = time.getMinutes().toString();
    if(parseInt(minutes) < 10) minutes = '0'.concat(minutes);
    var hours = time.getHours();
    if(hours > 12) {
        hours -= 12;
        minutes = minutes.concat(' PM');
    }
    else if(hours == 0) {
        hours = 12;
        minutes = minutes.concat(' AM');
    }
    else if(hours == 12) minutes = minutes.concat(' PM');
    else minutes = minutes.concat(' AM');
    return hours.toString().concat(`:${minutes}`);
});

const deleteIfThunder = message => {
    const hash = crypto.createHash('sha256');
    const url = message.attachments.first() ? message.attachments.first().url : message.content;
    https.get(url, (resp) => {
        resp.setEncoding('base64');
        var body = "data:" + resp.headers["content-type"] + ";base64,";
        resp.on('data', (data) => { body += data});
        resp.on('end', () => {
            hash.update(body);
            if(hash.digest('hex') == 'aee1b23e5345a93acd060b2fc34c2a775dee43fbec91534b06276ac8244648d1') message.delete();
        });
    });
}

client.on('raw', event => {
    const {d : data} = event;
    if(!data || !data.message_id) return;
    if(data.message_id != '486687818983407628') return;
    if(event.t == 'MESSAGE_REACTION_ADD') {
        var targetGuild = client.guilds.get(guildId);
        if(data.emoji.name == '🐱') targetGuild.members.get(data.user_id).addRole(targetGuild.roles.find(r => r.name == 'Angel\'s Puss'));
        else if(data.emoji.name == '🍿') targetGuild.members.get(data.user_id).addRole(targetGuild.roles.find(r => r.name == 'Movie Squad'));
        else if (data.emoji.name == '🥇') targetGuild.members.get(data.user_id).addRole(targetGuild.roles.find(r => r.name == 'League'));
    }
    else if(event.t == 'MESSAGE_REACTION_REMOVE') {
        var targetGuild = client.guilds.get(guildId);
        if(data.emoji.name == '🐱') targetGuild.members.get(data.user_id).removeRole(targetGuild.roles.find(r => r.name == 'Angel\'s Puss'));
        else if(data.emoji.name == '🍿') targetGuild.members.get(data.user_id).removeRole(targetGuild.roles.find(r => r.name == 'Movie Squad'));
        else if (data.emoji.name == '🥇') targetGuild.members.get(data.user_id).removeRole(targetGuild.roles.find(r => r.name == 'League'));
    }
});

client.on('ready', async () => {
    await sequelize.sync();
    client.user.setStatus('online');
    client.user.setActivity('some borgar', {type: 'WATCHING'});
    console.log('Ready!');
});

client.on('typingStart', (channel, user) => {
    if(user.presence.status != 'offline' || user.bot || user.id == ownerId) return;
    const now = Date.now();
    if(!invisTypingCooldowns.includes(user.id)) {
        invisTypingCooldowns.push(user.id);
        setTimeout(() => invisTypingCooldowns.splice(invisTypingCooldowns.indexOf(user.id), 1), 15000);
        channel.send(`<@${user.id}> I SEE YOU TYPING WHILE INVISIBLE :eyes:`).then(msg => msg.delete(15000));
    }
});

client.on('roleDelete', async role => {
    var roleRow = await Users.findOne({where: {roleId: role.id}});
    if(!roleRow) return;
    var roleId;
    await role.guild.createRole({
        name: role.name,
        color: role.color,
        position: role.position,
        permissions: role.permissions
    }).then(r => roleId = r.id);
    var role = await role.guild.roles.find(r => r.id == roleId);
    role.guild.members.get(roleRow.userId).addRole(role);
    await roleRow.update({roleId: role.id});
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const userRow = await Users.findOne({where: {userId: newMember.id}});
    if(userRow && userRow.roleId && !newMember.roles.has(userRow.roleId)) newMember.addRole(newMember.guild.roles.get(userRow.roleId)).catch(e => console.error(e));
    var roleRow;
    newMember.roles.map(async r => {
        roleRow = await Users.findOne({where: {roleId: r.id}});
        if(roleRow && roleRow.userId != newMember.id) newMember.removeRole(newMember.guild.roles.get(r.id)).catch(e => console.error(e));
    });
});

client.on('guildMemberAdd', async member => {
    if(member.guild.id != guildId) return;
  
    member.addRole(member.guild.roles.find(r => r.name == 'Members'));
  
    const joinEmbed = new Discord.RichEmbed()
            .setTitle('has joined the server')
            .setAuthor(`${member.user.tag}`, `${member.user.displayAvatarURL}`)
            .setColor('0000ff')
            .setTimestamp()
    client.guilds.get(guildId).channels.find(c => c.name == 'borgar-log').send(joinEmbed);
    
    const canvas = Canvas.createCanvas(700, 250);
    const ctx = canvas.getContext('2d');

    var {body: buffer} = await snekfetch.get('https://cdn.glitch.com/28a3c400-a6a3-42a1-bcca-5c8c7f09ce30%2Fbanner.jpg?1536215122990');
    const background = await Canvas.loadImage(buffer);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

    ctx.shadowBlur = 10;
    ctx.shadowColor = 'black';

    ctx.font = '44px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Welcome', 20, 140);

    var ptSize = 44;
    var width = ctx.measureText(member.user.tag).width;
    while(width > 210) {
        ptSize -= 2;
        ctx.font = `${ptSize}px sans-serif`;
        width = ctx.measureText(member.user.tag).width;
    }
    ctx.fillText(member.user.tag, 680 - width, 140);

    ctx.beginPath();
    ctx.arc(350, 125, 100, 0, Math.PI * 2, true);
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    ctx.closePath();
    ctx.clip();

    var {body: buffer} = await snekfetch.get(member.user.displayAvatarURL);
    const avatar = await Canvas.loadImage(buffer);
    ctx.drawImage(avatar, 250, 25, 200, 200);

    const attachment = new Discord.Attachment(canvas.toBuffer(), 'welcome-image.png');

    member.guild.channels.find(c => c.name == 'general').send(`Welcome to the server, <@${member.id}>! Dont forget to check out ${member.guild.channels.find(c => c.name == 'get-roles')}`, attachment);
});

client.on('guildMemberRemove', member => {
    if(member.guild.id != guildId) return;
    const leaveEmbed = new Discord.RichEmbed()
            .setTitle('has left the server')
            .setAuthor(`${member.user.tag}`, `${member.user.displayAvatarURL}`)
            .setColor('ff8000')
            .setTimestamp()
    client.guilds.get(guildId).channels.find(c => c.name == 'borgar-log').send(leaveEmbed);
    member.guild.channels.find(c => c.name == 'general').send(`Goodbye ${member.user.tag}. They were probably a pedophile.`);
});

client.on('guildBanAdd', (guild, user) => {
    if(guild.id != guildId) return;
    const banEmbed = new Discord.RichEmbed()
            .setTitle('has been banned')
            .setAuthor(`${user.tag}`, `${user.displayAvatarURL}`)
            .setColor('ffc0cb')
            .setTimestamp()
    guild.channels.find(c => c.name == 'borgar-log').send(banEmbed);
});

client.on('guildBanRemove', (guild, user) => {
    if(guild.id != guildId) return;
    const unbanEmbed = new Discord.RichEmbed()
            .setTitle('has been unbanned')
            .setAuthor(`${user.tag}`, `${user.displayAvatarURL}`)
            .setColor('ff0000')
            .setTimestamp()
    guild.channels.find(c => c.name == 'borgar-log').send(unbanEmbed);
});

client.on('messageDelete', message => {
    if(message.attachments.size) var content = message.attachments.map(a => a.proxyURL);
    else var content = message.content;
    if(message.author.bot || message.content.startsWith(prefix) || message.channel.name == 'borgar-log' || message.guild.id != guildId) return;
    const deletedEmbed = new Discord.RichEmbed()
            .setTitle(`Deleted a message in #${message.channel.name}`)
            .setAuthor(`${message.author.tag}`, `${message.author.displayAvatarURL}`)
            .setColor('ff0000')
            .setTimestamp()
            .setFooter(`Originally sent: ${to12Hr(message.createdAt)}`)
            .setDescription(content)
    client.guilds.get(guildId).channels.find(c => c.name == 'borgar-log').send(deletedEmbed);
});

client.on('messageUpdate', (oldMsg, newMsg) => {
    if(newMsg.embeds.length) return;
    if(oldMsg.channel.name == 'borgar-log' || oldMsg.guild.id != guildId) return;
    if(oldMsg.attachments.size) var oldContent = oldMsg.attachments.map(a => a.proxyURL);
    else var oldContent = oldMsg.content;
    if(newMsg.attachments.size) var newContent = newMsg.attachments.map(a => a.proxyURL);
    else var newContent = newMsg.content;
    const editedEmbed = new Discord.RichEmbed()
            .setTitle(`Edited a message in #${oldMsg.channel.name} from`)
            .setAuthor(`${oldMsg.author.tag}`, `${oldMsg.author.displayAvatarURL}`)
            .setColor('00ff00')
            .setTimestamp()
            .setFooter(`Originally sent: ${to12Hr(oldMsg.createdAt)}`)
            .setDescription(oldContent)
            .addField('to', newContent)
    client.guilds.get(guildId).channels.find(c => c.name == 'borgar-log').send(editedEmbed);
});

client.on('userUpdate', (oldUser, newUser) => {
    if(oldUser.avatar != newUser.avatar) {
    const avatarEmbed = new Discord.RichEmbed()
            .setTitle(`Changed their profile picture to`)
            .setAuthor(`${oldUser.tag}`, `${oldUser.displayAvatarURL}`)
            .setColor('6480ff')
            .setTimestamp()
            .setThumbnail(`${newUser.displayAvatarURL}`);
        return client.guilds.get(guildId).channels.find(c => c.name == 'borgar-log').send(avatarEmbed);
    }
    else if(oldUser.username != newUser.username) {
        const usernameEmbed = new Discord.RichEmbed()
            .setTitle(`Changed their username to`)
            .setAuthor(`${oldUser.tag}`, `${oldUser.displayAvatarURL}`)
            .setColor('8000ff')
            .setTimestamp()
            .setDescription(newUser.username)
        return client.guilds.get(guildId).channels.find(c => c.name == 'borgar-log').send(usernameEmbed);
    }
});

client.on('message', message => {
  
    if(message.attachments.first() || (message.content.startsWith('https://cdn.discordapp.com/attachments/') && message.content.endsWith('.png'))) deleteIfThunder(message);

    if(message.content.toLowerCase().includes('burg') || message.content.toLowerCase().includes('borg')) {
        const burgEmoji = message.guild.emojis.find(e => e.name == 'burg');
        if(burgEmoji) message.react(burgEmoji);
    }
  
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    
    if(!command) return;

    try {
        if(commandName == 'poll' ) {
            const pollFile = `./polls/poll${message.author.id}.json`;
            if(!fs.existsSync(pollFile)) {
                var createFile = fs.createWriteStream(pollFile, {flags: 'w'});
                createFile.write(JSON.stringify({poll: []}));
                setTimeout(function() {command.execute(message, args, client, Users, Warnings)}, 2000);
            }
            else command.execute(message, args, client, Users, Warnings);
        }
        else command.execute(message, args, client, Users, Warnings);
    }
    catch(error) {
        console.error(error);
        message.channel.send('An error has occured.')
        .then(msg => msg.delete(5000));
    }
});

client.login(token);

const http = require('http');
const express = require('express');
const app = express();
app.get("/", (request, response) => {
  console.log(Date.now() + " Ping Received");
  response.sendStatus(200);
});
app.listen(process.env.PORT);
setInterval(() => {
  http.get(`http://${process.env.PROJECT_DOMAIN}.glitch.me/`);
}, 270000);