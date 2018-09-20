process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'warn',
    execute(message, args, client, Users, Warnings) {
        if(!message.member.permissions.has('KICK_MEMBERS')) return;
        message.channel.send(message.content.substring(5)).then(msg => msg.delete(30000));
        message.delete();
    },
    help(message, client) {
        return message.channel.send('Warn someone\n\`!warn <@user> [reason]\`').then(msg => msg.delete(15000));
    }
}