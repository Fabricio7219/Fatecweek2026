using FatecWeekAPI.Data;
using FatecWeekAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FatecWeekAPI.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize]
public class UsuariosController(AppDbContext db) : ControllerBase
{
    public record CriarUsuarioRequest(
        string Nome, string Email, string UserName,
        string Password, string? Cpf, string Role = "mesario");

    // GET /api/usuarios?role=mesario
    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? role)
    {
        var query = db.Usuarios.AsQueryable();
        if (!string.IsNullOrEmpty(role))
            query = query.Where(u => u.Role == role);

        var lista = await query
            .Select(u => new { u.Id, u.Nome, u.Email, u.UserName, u.Cpf, u.Role, u.CreatedAt })
            .ToListAsync();

        return Ok(lista);
    }

    // POST /api/usuarios
    [HttpPost]
    public async Task<IActionResult> Criar([FromBody] CriarUsuarioRequest req)
    {
        if (await db.Usuarios.AnyAsync(u => u.Email == req.Email))
            return Conflict(new { message = "E-mail já cadastrado." });

        if (await db.Usuarios.AnyAsync(u => u.UserName == req.UserName))
            return Conflict(new { message = "Nome de usuário já cadastrado." });

        var usuario = new Usuario
        {
            Nome      = req.Nome,
            Email     = req.Email,
            UserName  = req.UserName,
            SenhaHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Cpf       = req.Cpf,
            Role      = req.Role == "admin" ? "admin" : "mesario",
        };

        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Listar), new { id = usuario.Id },
            new { usuario.Id, usuario.Nome, usuario.Email, usuario.UserName, usuario.Role });
    }

    // DELETE /api/usuarios/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Deletar(int id)
    {
        var usuario = await db.Usuarios.FindAsync(id);
        if (usuario is null) return NotFound();
        if (usuario.Role == "admin") return BadRequest(new { message = "Não é possível excluir o admin." });

        db.Usuarios.Remove(usuario);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
