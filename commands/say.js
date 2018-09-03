process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'say',
    execute(message, args, client, Stats) {
        message.channel.send(message.content.substring(5)).then(msg => msg.delete(30000));
        message.delete();
    }
}