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
    // ── Đăng nhập → JWT + Refresh Token ─────────────────────────────────────
    public async Task<LoginResponse> LoginAsync(string email, string password)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Email == email && u.IsActive)
            ?? throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng");

        if (!BCrypt.Net.BCrypt.Verify(password, user.PasswordHash))
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không đúng");

        user.LastLoginAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        return new LoginResponse(
            AccessToken: GenerateJwt(user),
            RefreshToken: GenerateRefreshToken(),
            Role: user.Role,
            UserId: user.Id.ToString());
    }

    // ── Tạo JWT ──────────────────────────────────────────────────────────────
    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(config["Jwt:Secret"]!));

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email,          user.Email),
            new Claim(ClaimTypes.Role,           user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    // ── Tạo Refresh Token ngẫu nhiên ─────────────────────────────────────────
    private static string GenerateRefreshToken()
        => Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
