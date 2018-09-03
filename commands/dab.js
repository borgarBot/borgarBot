process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'dab',
    execute(message, args, client, Stats) {
        message.channel.fetchMessages({limit: isNaN(args[0]) ? 2 : parseInt(args[0]) + 1})
          .then(msg => msg.map(m => {m.react(message.guild.emojis.find('name', 'dab'));
          m.react(message.guild.emojis.find('name', 'dabb'));}));
        message.delete();
    }
}