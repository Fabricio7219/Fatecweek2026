using FatecWeekAPI.Data;
using FatecWeekAPI.Models;
using FatecWeekAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FatecWeekAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, JwtService jwt) : ControllerBase
{
    public record LoginRequest(string Email, string Password);
    public record LoginResponse(string AccessToken, string Role, string Nome);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var usuario = await db.Usuarios
            .FirstOrDefaultAsync(u => u.Email == req.Email);

        if (usuario is null || !BCrypt.Net.BCrypt.Verify(req.Password, usuario.SenhaHash))
            return Unauthorized(new { message = "Credenciais inválidas." });

        var token = jwt.GerarToken(usuario);
        return Ok(new LoginResponse(token, usuario.Role, usuario.Nome));
    }
}
