const Discord = require('discord.js');
const fs = require ('fs');
const Sequelize = require('sequelize');
const {prefix, guildId} = require('./config.json');
const client = new Discord.Client();
const token = process.env.TOKEN;
const commandFiles = fs.readdirSync('./commands');
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

const Stats = sequelize.define('stats', {
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
    }
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

client.on('ready', () => {
    console.log('Ready!');
    client.user.setStatus('online');
    client.user.setActivity('some borgar', {type: 'WATCHING'});
});

client.on('guildMemberAdd', member => {
    if(member.guild.id != guildId) return;
    const joinEmbed = new Discord.RichEmbed()
            .setTitle('has joined the server')
            .setAuthor(`${member.user.tag}`, `${member.user.displayAvatarURL}`)
            .setColor('0000ff')
            .setTimestamp()
    client.guilds.get(guildId).channels.find('name', 'borgar-log').send(joinEmbed);
});

client.on('guildMemberRemove', member => {
    if(member.guild.id != guildId) return;
    const leaveEmbed = new Discord.RichEmbed()
            .setTitle('has left the server')
            .setAuthor(`${member.user.tag}`, `${member.user.displayAvatarURL}`)
            .setColor('ff8000')
            .setTimestamp()
    client.guilds.get(guildId).channels.find('name', 'borgar-log').send(leaveEmbed);
});

client.on('guildBanAdd', (guild, user) => {
    if(guild.id != guildId) return;
    const banEmbed = new Discord.RichEmbed()
            .setTitle('has been banned')
            .setAuthor(`${user.tag}`, `${user.displayAvatarURL}`)
            .setColor('ffc0cb')
            .setTimestamp()
    guild.channels.find('name', 'borgar-log').send(banEmbed);
});

client.on('guildBanRemove', (guild, user) => {
    if(guild.id != guildId) return;
    const unbanEmbed = new Discord.RichEmbed()
            .setTitle('has been unbanned')
            .setAuthor(`${user.tag}`, `${user.displayAvatarURL}`)
            .setColor('ff0000')
            .setTimestamp()
    guild.channels.find('name', 'borgar-log').send(unbanEmbed);
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
    client.guilds.get(guildId).channels.find('name', 'borgar-log').send(deletedEmbed);
});

client.on('messageUpdate', (oldMsg, newMsg) => {
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
    client.guilds.get(guildId).channels.find('name', 'borgar-log').send(editedEmbed);
});

client.on('userUpdate', (oldUser, newUser) => {
    if(oldUser.avatar != newUser.avatar) {
    const avatarEmbed = new Discord.RichEmbed()
            .setTitle(`Changed their profile picture to`)
            .setAuthor(`${oldUser.tag}`, `${oldUser.displayAvatarURL}`)
            .setColor('6480ff')
            .setTimestamp()
            .setThumbnail(`${newUser.displayAvatarURL}`);
        return client.guilds.get(guildId).channels.find('name', 'borgar-log').send(avatarEmbed);
    }
    else if(oldUser.username != newUser.username) {
        const usernameEmbed = new Discord.RichEmbed()
            .setTitle(`Changed their username to`)
            .setAuthor(`${oldUser.tag}`, `${oldUser.displayAvatarURL}`)
            .setColor('8000ff')
            .setTimestamp()
            .setDescription(newUser.username)
        return client.guilds.get(guildId).channels.find('name', 'borgar-log').send(usernameEmbed);
    }
});

client.on('message', message => {

    if(message.content.toLowerCase().includes('burg') || message.content.toLowerCase().includes('borg')) {
        const burgEmoji = message.guild.emojis.find('name', 'burg');
        if(burgEmoji) message.react(burgEmoji);
    }
  
    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    
    if(!command) return;

    try {
        command.execute(message, args, client, Stats);
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