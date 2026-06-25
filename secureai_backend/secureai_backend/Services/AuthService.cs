using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using secureai_backend.Data;
using secureai_backend.DTOs.Auth;
using secureai_backend.Models.Entities;

namespace secureai_backend.Services;

public class AuthService(AppDbContext db, IConfiguration config)
{
    public async Task<LoginResponse> LoginAsync(string email, string password)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive)
            ?? throw new UnauthorizedAccessException("Email hoac mat khau khong dung");

        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Email hoac mat khau khong dung");
        }

        var refreshToken = GenerateRefreshToken();

        user.LastLoginAt = DateTime.UtcNow;
        db.RefreshTokens.Add(CreateRefreshToken(user.Id, refreshToken));
        await db.SaveChangesAsync();

        return BuildLoginResponse(user, refreshToken);
    }

    public async Task<LoginResponse> RefreshAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UnauthorizedAccessException("Refresh token khong hop le");
        }

        var tokenHash = HashRefreshToken(refreshToken);
        var stored = await db.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == tokenHash);

        if (stored == null || stored.IsRevoked || stored.ExpiresAt <= DateTime.UtcNow || !stored.User.IsActive)
        {
            throw new UnauthorizedAccessException("Refresh token khong hop le hoac da het han");
        }

        var newRefreshToken = GenerateRefreshToken();
        stored.IsRevoked = true;
        db.RefreshTokens.Add(CreateRefreshToken(stored.UserId, newRefreshToken));
        await db.SaveChangesAsync();

        return BuildLoginResponse(stored.User, newRefreshToken);
    }

    public async Task LogoutAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            return;
        }

        var tokenHash = HashRefreshToken(refreshToken);
        var stored = await db.RefreshTokens.FirstOrDefaultAsync(r => r.Token == tokenHash);
        if (stored == null || stored.IsRevoked)
        {
            return;
        }

        stored.IsRevoked = true;
        await db.SaveChangesAsync();
    }

    private LoginResponse BuildLoginResponse(User user, string refreshToken) => new(
        AccessToken: GenerateJwt(user),
        RefreshToken: refreshToken,
        Role: user.Role,
        UserId: user.Id.ToString());

    private string GenerateJwt(User user)
    {
        var secret = config["Jwt:Secret"]
            ?? throw new InvalidOperationException("Missing Jwt:Secret");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(GetIntConfig("Jwt:AccessTokenMinutes", 480)),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private RefreshToken CreateRefreshToken(Guid userId, string rawToken) => new()
    {
        UserId = userId,
        Token = HashRefreshToken(rawToken),
        ExpiresAt = DateTime.UtcNow.AddDays(GetIntConfig("Jwt:RefreshTokenDays", 7))
    };

    private int GetIntConfig(string key, int fallback)
    {
        var raw = config[key];
        return int.TryParse(raw, out var value) && value > 0 ? value : fallback;
    }

    private static string GenerateRefreshToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

    private static string HashRefreshToken(string token)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));
}
