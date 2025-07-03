const {Client, GatewayIntentBits, SlashCommandAssertions, SlashCommandBuilder, Interaction} = require('discord.js');
const {joinVoiceChannel, createAudioPlayer, createAudioResource} = require('@discordjs/voice');
const {createWriteStream} = require('fs');
const googleTTS = require('google-tts-api');
const prism = require('prism-media');
const {spawn} = require('child_process');
const axios = require('axios');
const {getUsername, addUsername} = require("../utilities/usernameService");
const {spacoCall} = require("../telegram/services/telegramService");
const path = require("node:path");

module.exports = {
    name: "insulta",
    description: "marco insulta uno di voi",
    async execute({client, interaction}) {
        try {
            // IMPORTANTE: Deferisci subito la risposta
            await interaction.deferReply();
            
            const voiceChannel = interaction.member.voice.channel;
            if (!voiceChannel) {
                return interaction.editReply("marco non sa in che cazzo di canale deve entrare coglione.");
            }

            const channelMembers = Array.from(voiceChannel.members.values())

            let targetUser;

            do {
                targetUser = channelMembers[Math.floor(Math.random() * channelMembers.length)].user;
            } while (targetUser.username === "marco" );

            let usernameToInsult = await getUsername(targetUser);

            const text = await spacoCall("Insulta " + usernameToInsult)

            const audioURL = googleTTS.getAudioUrl(text, {
                lang: "es",
                slow: false,
                host: "https://translate.google.com"
            });

            const audioPath = "./tempAudio/audio-original.mp3";
            const writer = createWriteStream(audioPath);
            const audioResponse = await axios({
                url: audioURL,
                method: "GET",
                responseType: "stream"
            });
            audioResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            let finalAudio = path.join(process.cwd(), "/tempAudio/audio-destroyed.mp3");

            let distortionChain = "volume=30.0,highpass=f=800,asoftclip=type=hard:output=2";

            await new Promise((resolve, reject) => {
                const ffmpeg = spawn('ffmpeg', [
                    '-i', audioPath,
                    '-af', distortionChain,
                    '-y',
                    finalAudio,
                ]);

                ffmpeg.on('close', (code) => {
                    if (code === 0) resolve();
                    else reject(new Error(`FFmpeg failed with code ${code}`));
                });
            });

            if (interaction.member.voice.channel) {
                const connection = joinVoiceChannel({
                    channelId: interaction.member.voice.channel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator
                });

                const player = createAudioPlayer();
                const resource = createAudioResource(finalAudio);
                player.play(resource);
                connection.subscribe(player);
                
                // Usa editReply invece di reply
                await interaction.editReply("con piacere");
            } else {
                await interaction.editReply("marco non sa in che cazzo di canale deve entrare coglione.");
            }
        } catch (error) {
            console.error(error);
            // Usa editReply anche per gli errori
            await interaction.editReply("Marco internal error");
        }
    }
}