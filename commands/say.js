process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'say',
    execute(message, args, client, Users, Warnings) {
        message.channel.send(message.content.substring(5)).then(msg => msg.delete(30000));
        message.delete();
    },
    help(message, client) {
        return message.channel.send('Forces the bot to say something for you\n\`!say <message>\`').then(msg => msg.delete(15000));
    }
}