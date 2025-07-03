const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
    name: "associa",
    description: "marco aggiunge un'associazione",
    options: [
        {
            name: "utente",
            description: "L'utente da associare",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "username",
            description: "Il nome da associare all'utente",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    async execute({client, interaction}) {
        try {
            const user = interaction.options.getUser("utente");
            const username = interaction.options.getString("username");

            if (!user) {
                return interaction.reply("marco non ha trovato l'utente");
            }

            const { addUsername } = require("../utilities/usernameService");
            await addUsername(user, username);

            interaction.reply(`marco ha associato ${user.username} a ${username}`);
        } catch (error) {
            console.error(error);
            interaction.reply("marco ha avuto un problema nell'aggiungere l'associazione");
        }
    }
}
