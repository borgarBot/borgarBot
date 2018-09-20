process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'dab',
    execute(message, args, client, Users, Warnings) {
        message.channel.fetchMessages({limit: !args.length || isNaN(args[0]) ? 2 : parseInt(args[0]) + 1})
          .then(msg => msg.map(m => {m.react(message.guild.emojis.find(e => e.name == 'dab'));
          m.react(message.guild.emojis.find(e => e.name == 'dabb'));}));
        message.delete();
    },
    help(message, client) {
        return message.channel.send('Dabs on messages in this channel.\n\`!dab [amount]\`').then(msg => msg.delete(15000));
    }
}