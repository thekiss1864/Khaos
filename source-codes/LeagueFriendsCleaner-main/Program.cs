using PoniLCU;
using System.Text.Json;
using LOLFriendsCleaner;
using static PoniLCU.LeagueClient;

var leagueClient = new LeagueClient(credentials.cmd);

var data = await leagueClient.Request(requestMethod.GET, "/lol-chat/v1/friends");
var friends = JsonSerializer.Deserialize<List<Friend>>(data);

Console.WriteLine($$"""
                    Are you sure you want to delete all of your friends?
                    You have {{friends?.Count ?? 0}} friends in game!
                    Type 1 for yes, 2 for no
                    """);

var input = int.Parse(Console.ReadLine() ?? "0");
if ((input, friends) is (1, { }))
{
    var friendIndex = 0;
    foreach (var friend in friends)
    {
        friendIndex++;
        await leagueClient.Request(requestMethod.DELETE, $"/lol-chat/v1/friends/{friend.puuid}");
        Console.WriteLine($"Removed {friend.gameName}");
        if (friendIndex % 3 is 0)
        {
            // The client has a rate limit, which might trigger a warning to RiotGames (causing a ban). Avoid this with a delay.
            await Task.Delay(1000);
        }
    }
    Console.WriteLine($$"""
                        Removed All friends!
                        Please restart your game to make sure that It's not bugged!
                        """);
}
else
{
    Console.WriteLine("Exiting...");
    Thread.Sleep(1000);
}