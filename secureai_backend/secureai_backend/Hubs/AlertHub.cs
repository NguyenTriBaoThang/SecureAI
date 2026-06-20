using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace secureai_backend.Hubs;

/// <summary>
/// SignalR Hub — đẩy alert realtime về React frontend.
///
/// React kết nối:
///   import * as signalR from "@microsoft/signalr";
///   const conn = new signalR.HubConnectionBuilder()
///     .withUrl("/hubs/alerts", { accessTokenFactory: () => token })
///     .withAutomaticReconnect()
///     .build();
///   conn.on("NewAlert", (alert) => { ... });
///   await conn.start();
/// </summary>
[Authorize]
public class AlertHub : Hub
{
    // Tự động join group theo role khi kết nối
    public override async Task OnConnectedAsync()
    {
        var role = Context.User?
            .FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? "Viewer";

        await Groups.AddToGroupAsync(Context.ConnectionId, role);
        await base.OnConnectedAsync();
    }
}
