const fs = require('fs');
const commandFiles = fs.readdirSync('./commands');
process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

module.exports = {
    name: 'reload',
    async execute(message, args, client, Users, Warnings) {
        message.delete();
        if(args.length) {
            const commandName = args[0].toLowerCase();
            const command = client.commands.get(commandName);
            if(!command) return;
            await delete require.cache[require.resolve(`./${commandName}.js`)];
            await client.commands.set(commandName, require(`./${commandName}.js`));
            message.channel.send(`${commandName} was successfully reloaded`)
            .then(msg => {
                msg.delete(15000);
            });
        }
        else {
            for(const file of commandFiles) {
                await delete require.cache[require.resolve(`./${file}`)];
                await client.commands.set(file.slice(0, -3), require(`./${file}`));
            }
            message.channel.send('All commands have successfully been reloaded')
            .then(msg => {
                msg.delete(15000);
            });
        }
    },
    help(message, client) {
        return message.channel.send('!!! ADMINS ONLY !!!').then(msg => msg.delete(15000));
    }
}