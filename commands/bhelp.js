process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'bhelp',
    execute(message, args, client, Users, Warnings) {
        message.delete();
        if(!args.length) return message.channel.send(`Here is a list of commands. You can type \`!bhelp <command>\` to find out more\n${client.commands.map(c => c.name).join(', ')}`).then(msg => msg.delete(15000));
        const commandName = args.shift().toLowerCase();
        const command = client.commands.get(commandName);
        if(!command) return message.channel.send('Please enter a valid command!').then(msg => msg.delete(15000));
        if(command.help) return command.help(message, client);
        return message.channel.send('That command does not have a help menu!').then(msg => msg.delete(15000));
    },
    help(message, client) {
        return message.channel.send('Why are you asking what help does...').then(msg => msg.delete(15000));
    }
}