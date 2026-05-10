using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using FatecWeekAPI.Models;
using Microsoft.IdentityModel.Tokens;

namespace FatecWeekAPI.Services;

public class JwtService(IConfiguration config)
{
    private readonly string _key    = config["Jwt:Key"]      ?? throw new InvalidOperationException("Jwt:Key não configurado.");
    private readonly string _issuer = config["Jwt:Issuer"]   ?? "FatecWeekAPI";
    private readonly string _aud    = config["Jwt:Audience"] ?? "FatecWeekFrontend";
    private readonly int    _hours  = int.Parse(config["Jwt:ExpiresInHours"] ?? "12");

    public string GerarToken(Usuario usuario)
    {
        var permissions = usuario.Role == "admin"
            ? new[] { "Events:Manage", "Exhibitors:Manage", "Lectures:Manage", "Booths:Manage" }
            : new[] { "CheckIn:Register" };

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub,   usuario.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, usuario.Email),
            new("role", usuario.Role),
        };

        foreach (var p in permissions)
            claims.Add(new Claim("permission", p));

        var chave = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));
        var creds = new SigningCredentials(chave, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer:             _issuer,
            audience:           _aud,
            claims:             claims,
            expires:            DateTime.UtcNow.AddHours(_hours),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
