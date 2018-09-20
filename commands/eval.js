const {ownerId, botId} = require('../config.json');
process.on('unhandledRejection', error => console.error(`Uncaught Promise Rejection:\n${error}`));

const clean = text => {
    if (typeof(text) === "string") return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else return text;
}

module.exports = {
    name: 'eval',
    execute(message, args, client, Users, Warnings) {
        if(message.author.id != ownerId && !message.member.permissions.has('ADMINISTRATOR')) return;
        try {
            const code = args.join(' ');
            let evaled = eval(code);
            if(typeof evaled !== 'string') evaled = require('util').inspect(evaled);
            const evalMessage = clean(evaled);
            if(!evalMessage.contains('Promise { <pending> }') && evalMessage != 'undefined') message.channel.send(evalMessage, {code: 'x1'})
        }
        catch(error) {
            message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(error)}\n\`\`\``)
              .then(msg => msg.delete(10000));
        }
    },
    help(message, client) {
        return message.channel.send('!!! ADMINS ONLY !!!').then(msg => msg.delete(15000));
    }
};